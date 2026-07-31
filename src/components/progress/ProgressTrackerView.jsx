import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Target, TrendingUp, Award, Lock, CheckCircle, Crosshair, Flame, Calendar, Activity, Info, X } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { useAuth } from '../../context/AuthContext';
import { getGoal, saveGoal, getAchievements, awardBadge, BADGES } from '../../services/goalsService';
import { computeTradeScore } from '../../utils/tradeScoring';
import { formatCurrency } from '../../utils/currencyUtils';
import Spinner from '../shared/Spinner';

export default function ProgressTrackerView({ trades = [], loading = false }) {
  const { activeAccount, activeAccountId } = useAccount();
  const { currentUser } = useAuth();

  const [goalSettings, setGoalSettings] = useState({ targetProfit: '', targetWinRate: '' });
  const [loadedGoal, setLoadedGoal] = useState(null);
  const [achievements, setAchievements] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [toastBadge, setToastBadge] = useState(null);

  const isAllAccounts = activeAccountId === 'all';
  const isPropAccount = activeAccount?.accountType === 'prop' || 
                        activeAccount?.name?.toLowerCase().includes('prop') || 
                        (activeAccount?.targetProfit > 0 && activeAccount?.maxTotalDrawdown > 0);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }, []);

  // Reset state when account changes
  useEffect(() => {
    setLoadedGoal(null);
    setGoalSettings({ targetProfit: '', targetWinRate: '' });
    setAchievements({});
    if (isAllAccounts || !currentUser || !activeAccountId) {
      setIsLoadingData(false);
      return;
    }
    
    setIsLoadingData(true);
    
    const fetchData = async () => {
      try {
        const [goalData, achievementsData] = await Promise.all([
          getGoal(currentUser.uid, activeAccountId, currentMonthKey),
          getAchievements(currentUser.uid, activeAccountId)
        ]);
        
        if (goalData) {
          setLoadedGoal(goalData);
          setGoalSettings({
            targetProfit: goalData.targetProfit || '',
            targetWinRate: goalData.targetWinRate || ''
          });
        }
        
        if (achievementsData) {
          setAchievements(achievementsData);
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [activeAccountId, currentUser, currentMonthKey, isAllAccounts]);

  // Current month stats calculations
  const stats = useMemo(() => {
    if (!trades || trades.length === 0) return { pnl: 0, winRate: 0, count: 0, avgScore: 0, maxWinStreak: 0 };
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.tradeDate) - new Date(b.tradeDate));
    
    const monthTrades = sortedTrades.filter(t => t.tradeDate?.startsWith(currentMonthKey));
    
    let currentPnl = 0;
    let wins = 0;
    let totalScore = 0;
    let scoredTradesCount = 0;
    
    monthTrades.forEach(t => {
      const pnl = Number(t.profitLoss || 0);
      currentPnl += pnl;
      if (pnl > 0) wins++;
      
      const scoreData = computeTradeScore(t);
      if (scoreData && scoreData.score !== undefined) {
        totalScore += scoreData.score;
        scoredTradesCount++;
      }
    });

    const count = monthTrades.length;
    const winRate = count > 0 ? Math.round((wins / count) * 100) : 0;
    const avgScore = scoredTradesCount > 0 ? Math.round(totalScore / scoredTradesCount) : 0;

    // Calculate max win streak across ALL trades for the badge
    let maxWinStreak = 0;
    let currentStreak = 0;
    
    sortedTrades.forEach(t => {
      if (Number(t.profitLoss) > 0) {
        currentStreak++;
        if (currentStreak > maxWinStreak) maxWinStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    return {
      pnl: currentPnl,
      winRate,
      count,
      avgScore,
      maxWinStreak,
      monthTrades
    };
  }, [trades, currentMonthKey]);

  // Evaluate achievements
  useEffect(() => {
    if (isAllAccounts || !currentUser || !activeAccountId || isLoadingData || !trades.length) return;

    const checkBadges = async () => {
      const newAchievements = { ...achievements };
      let updated = false;

      // FIRST_WIN
      if (trades.some(t => Number(t.profitLoss) > 0) && !newAchievements.FIRST_WIN) {
        const awarded = await awardBadge(currentUser.uid, activeAccountId, 'FIRST_WIN', newAchievements);
        if (awarded) {
          newAchievements.FIRST_WIN = awarded;
          showToast('FIRST_WIN');
          updated = true;
        }
      }

      // WIN_STREAK_5
      if (stats.maxWinStreak >= 5 && !newAchievements.WIN_STREAK_5) {
        const awarded = await awardBadge(currentUser.uid, activeAccountId, 'WIN_STREAK_5', newAchievements);
        if (awarded) {
          newAchievements.WIN_STREAK_5 = awarded;
          showToast('WIN_STREAK_5');
          updated = true;
        }
      }

      // WIN_STREAK_10
      if (stats.maxWinStreak >= 10 && !newAchievements.WIN_STREAK_10) {
        const awarded = await awardBadge(currentUser.uid, activeAccountId, 'WIN_STREAK_10', newAchievements);
        if (awarded) {
          newAchievements.WIN_STREAK_10 = awarded;
          showToast('WIN_STREAK_10');
          updated = true;
        }
      }

      // MONTHLY_GOAL
      const targetPnl = isPropAccount ? activeAccount?.targetProfit : Number(loadedGoal?.targetProfit);
      if (targetPnl > 0 && stats.pnl >= targetPnl && !newAchievements.MONTHLY_GOAL) {
        const awarded = await awardBadge(currentUser.uid, activeAccountId, 'MONTHLY_GOAL', newAchievements);
        if (awarded) {
          newAchievements.MONTHLY_GOAL = awarded;
          showToast('MONTHLY_GOAL');
          updated = true;
        }
      }

      // PLAN_FOLLOWER
      const planFollowedCount = trades.filter(t => t.planFollowed === 'Yes').length;
      if (planFollowedCount >= 10 && !newAchievements.PLAN_FOLLOWER) {
        const awarded = await awardBadge(currentUser.uid, activeAccountId, 'PLAN_FOLLOWER', newAchievements);
        if (awarded) {
          newAchievements.PLAN_FOLLOWER = awarded;
          showToast('PLAN_FOLLOWER');
          updated = true;
        }
      }

      // SHARP_SHOOTER
      const highScoringCount = trades.filter(t => {
        const s = computeTradeScore(t);
        return s && s.score >= 80;
      }).length;
      
      if (highScoringCount >= 5 && !newAchievements.SHARP_SHOOTER) {
        const awarded = await awardBadge(currentUser.uid, activeAccountId, 'SHARP_SHOOTER', newAchievements);
        if (awarded) {
          newAchievements.SHARP_SHOOTER = awarded;
          showToast('SHARP_SHOOTER');
          updated = true;
        }
      }

      if (updated) {
        setAchievements(newAchievements);
      }
    };

    checkBadges();
  }, [trades, stats, achievements, activeAccountId, currentUser, isLoadingData, isPropAccount, activeAccount, loadedGoal, isAllAccounts]);

  const showToast = (badgeId) => {
    setToastBadge(BADGES[badgeId]);
    setTimeout(() => {
      setToastBadge(null);
    }, 2500);
  };

  const handleSaveGoal = async () => {
    if (!currentUser || !activeAccountId) return;
    setIsSaving(true);
    try {
      const goalToSave = {
        targetProfit: isPropAccount ? null : Number(goalSettings.targetProfit),
        targetWinRate: Number(goalSettings.targetWinRate)
      };
      await saveGoal(currentUser.uid, activeAccountId, currentMonthKey, goalToSave);
      setLoadedGoal(goalToSave);
      // Simulate toast for save?
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" className="text-indigo-500" />
      </div>
    );
  }

  if (isAllAccounts) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
        <Target className="w-16 h-16 text-slate-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Select an Account</h2>
        <p className="text-slate-400 max-w-md">
          Progress and goals are tracked on a per-account basis. Please select a specific account from the sidebar to view or set goals.
        </p>
      </div>
    );
  }

  const targetPnl = isPropAccount ? activeAccount?.targetProfit : Number(loadedGoal?.targetProfit);
  const targetWinRate = Number(loadedGoal?.targetWinRate) || 0;
  
  const pnlProgress = targetPnl > 0 ? Math.min(100, Math.max(0, (stats.pnl / targetPnl) * 100)) : 0;
  const winRateProgress = targetWinRate > 0 ? Math.min(100, (stats.winRate / targetWinRate) * 100) : 0;

  // Circular progress SVG setup
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  const CircularProgress = ({ progress, colorClass, icon: Icon, value, label }) => {
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return (
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90 absolute">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-700/50"
            />
            {/* Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ease-out ${colorClass}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <Icon className={`w-6 h-6 mb-1 ${colorClass}`} />
            <span className="text-sm font-semibold text-white">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-lg font-bold text-white">{value}</div>
          <div className="text-sm text-slate-400">{label}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Progress Tracker
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {currentMonthName} &bull; <span className="font-medium text-slate-300">{activeAccount?.name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Goals Progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" /> Current Month Goals
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
              <CircularProgress 
                progress={targetPnl > 0 ? pnlProgress : 0} 
                colorClass={pnlProgress >= 100 ? "text-emerald-500" : "text-indigo-500"} 
                icon={TrendingUp}
                value={`${formatCurrency(stats.pnl, activeAccount?.currency)} / ${targetPnl > 0 ? formatCurrency(targetPnl, activeAccount?.currency) : '---'}`}
                label="Profit Target"
              />
              
              <CircularProgress 
                progress={targetWinRate > 0 ? winRateProgress : 0} 
                colorClass={winRateProgress >= 100 ? "text-emerald-500" : "text-blue-500"} 
                icon={Crosshair}
                value={`${stats.winRate}% / ${targetWinRate > 0 ? targetWinRate + '%' : '---'}`}
                label="Win Rate Target"
              />
            </div>
            
            {isPropAccount && (
              <div className="mt-6 flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-indigo-200 text-sm">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Using prop firm target settings from account configuration. P&L goal is automatically synced.</p>
              </div>
            )}
          </div>

          {/* This Month Stats */}
          <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" /> This Month's Performance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 text-center">
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Trades</div>
                <div className="text-2xl font-bold text-white">{stats.count}</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 text-center">
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Net P&L</div>
                <div className={`text-2xl font-bold ${stats.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(stats.pnl, activeAccount?.currency)}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 text-center">
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Win Rate</div>
                <div className="text-2xl font-bold text-white">{stats.winRate}%</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 text-center">
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Avg Score</div>
                <div className="text-2xl font-bold text-white">{stats.avgScore || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Goal Settings */}
        <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-6 h-fit">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" /> Set Monthly Goals
          </h2>
          
          <div className="space-y-4">
            {!isPropAccount && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">P&L Target ({activeAccount?.currency || 'USD'})</label>
                <input
                  type="number"
                  value={goalSettings.targetProfit}
                  onChange={(e) => setGoalSettings(prev => ({ ...prev, targetProfit: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g. 5000"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Win Rate Target (%)</label>
              <input
                type="number"
                value={goalSettings.targetWinRate}
                onChange={(e) => setGoalSettings(prev => ({ ...prev, targetWinRate: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="e.g. 60"
                max="100"
                min="0"
              />
            </div>

            <button
              onClick={handleSaveGoal}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isSaving ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
              Save Goals
            </button>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" /> Achievements
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(BADGES || {}).map(([id, badge]) => {
            const earned = achievements[id];
            
            return (
              <div 
                key={id} 
                className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all ${
                  earned 
                    ? 'bg-slate-800/80 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'bg-slate-800/30 border-white/5 opacity-60 grayscale'
                }`}
              >
                {!earned && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                )}
                
                <div className="text-4xl mb-3 filter drop-shadow-lg">
                  {badge.icon}
                </div>
                <h3 className={`font-semibold text-sm mb-1 ${earned ? 'text-white' : 'text-slate-400'}`}>
                  {badge.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {badge.description}
                </p>
                
                {earned && (
                  <div className="mt-2 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                    Earned
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {toastBadge && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 rounded-xl p-4 pr-12 flex items-center gap-4 relative max-w-sm">
            <div className="text-3xl">{toastBadge.icon}</div>
            <div>
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-0.5">Achievement Unlocked!</p>
              <h4 className="text-white font-medium">{toastBadge.title}</h4>
            </div>
            <button 
              onClick={() => setToastBadge(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
