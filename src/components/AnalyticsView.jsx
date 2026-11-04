import React, { useState, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Star,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';
import {
  LIQUIDITY_WINDOWS,
  FEELING_OPTIONS,
  SELF_GRADING_QUESTIONS,
} from '../constants/viperConstants';

export default function WorkspaceTabView({
  activeTab,
  trades,
  onOpenLogModal,
  onSwitchToTradeLog,
}) {
  const {
    rules,
    strategies,
    addStrategy,
    deleteStrategy,
    addRule,
    deleteRule,
  } = useViper();

  const [newStratName, setNewStratName] = useState('');
  const [newStratWindow, setNewStratWindow] = useState(
    '2:00–5:00 AM EST (London)'
  );
  const [newStratDesc, setNewStratDesc] = useState('');
  const [newRuleText, setNewRuleText] = useState('');

  const stats = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => Number(t.netPnl) > 0);
    const losses = trades.filter((t) => Number(t.netPnl) < 0);
    const netResult = trades.reduce((s, t) => s + (Number(t.netPnl) || 0), 0);
    const grossWin = wins.reduce((s, t) => s + (Number(t.netPnl) || 0), 0);
    const grossLoss = Math.abs(
      losses.reduce((s, t) => s + (Number(t.netPnl) || 0), 0)
    );
    const profitFactor =
      grossLoss > 0
        ? (grossWin / grossLoss).toFixed(2)
        : grossWin > 0
        ? '∞'
        : '0.00';
    const winRate =
      total > 0 ? ((wins.length / total) * 100).toFixed(1) : '0.0';
    const revengeTrades = trades.filter((t) => t.isRevengeTrade);
    const avgStars =
      total > 0
        ? (
            trades.reduce((s, t) => s + (Number(t.executionGrade) || 0), 0) /
            total
          ).toFixed(1)
        : '0.0';

    const byWindow = [
      {
        id: LIQUIDITY_WINDOWS.ASIAN_LONDON,
        label: '2:00–5:00 AM EST (London Window)',
        ct: '1:00–4:00 AM CT',
      },
      {
        id: LIQUIDITY_WINDOWS.NY_OPEN,
        label: '9:00 AM–12:00 PM EST (NY Window)',
        ct: '8:00–11:00 AM CT',
      },
      {
        id: LIQUIDITY_WINDOWS.OUTSIDE,
        label: 'Outside Window',
        ct: 'Off-Session Hours',
      },
    ].map((w) => {
      const list = trades.filter((t) => t.sessionWindow === w.id);
      const wWins = list.filter((t) => Number(t.netPnl) > 0).length;
      const wNet = list.reduce((s, t) => s + (Number(t.netPnl) || 0), 0);
      return {
        ...w,
        count: list.length,
        winRate:
          list.length > 0 ? Math.round((wWins / list.length) * 100) : 0,
        netPnl: wNet,
      };
    });

    const byDate = {};
    trades.forEach((t) => {
      const d = t.date || '2026-11-04';
      if (!byDate[d]) {
        byDate[d] = { date: d, count: 0, netPnl: 0, revengeCount: 0 };
      }
      byDate[d].count += 1;
      byDate[d].netPnl += Number(t.netPnl) || 0;
      if (t.isRevengeTrade) byDate[d].revengeCount += 1;
    });

    return {
      total,
      winsCount: wins.length,
      lossesCount: losses.length,
      netResult,
      profitFactor,
      winRate,
      revengeCount: revengeTrades.length,
      revengeNetPnl: revengeTrades.reduce(
        (s, t) => s + (Number(t.netPnl) || 0),
        0
      ),
      cleanNetPnl: trades
        .filter((t) => !t.isRevengeTrade)
        .reduce((s, t) => s + (Number(t.netPnl) || 0), 0),
      avgStars,
      byWindow,
      dailyList: Object.values(byDate).sort((a, b) =>
        b.date.localeCompare(a.date)
      ),
    };
  }, [trades]);

  /* 1. OVERVIEW TAB */
  if (activeTab === 'overview') {
    return (
      <section className="viper-card">
        <div className="eyebrow-green">WORKSPACE OVERVIEW</div>
        <h2
          className="card-title"
          style={{ marginTop: '6px', marginBottom: 0 }}
        >
          Performance &amp; Liquidity Window Summary
        </h2>
        <p
          style={{
            marginTop: '4px',
            marginBottom: 0,
            fontSize: '15px',
            color: 'var(--text-muted)',
          }}
        >
          High-level view of your execution consistency across EST liquidity
          windows.
        </p>

        <div className="viper-metric-grid">
          <div className="viper-metric-cell">
            <div className="eyebrow-label">NET P&amp;L</div>
            <div
              className="metric-value"
              style={{
                marginTop: '8px',
                color: stats.netResult >= 0 ? 'var(--green)' : 'var(--red)',
              }}
            >
              {formatUSD(stats.netResult)}
            </div>
            <div
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              {stats.total} total trades
            </div>
          </div>

          <div className="viper-metric-cell">
            <div className="eyebrow-label">WIN RATE</div>
            <div
              className="metric-value"
              style={{ marginTop: '8px', color: 'var(--text)' }}
            >
              {stats.winRate}%
            </div>
            <div
              className="tabular-nums"
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              {stats.winsCount}W / {stats.lossesCount}L • PF {stats.profitFactor}
            </div>
          </div>

          <div className="viper-metric-cell">
            <div className="eyebrow-label">REVENGE GUARD (&lt;15M)</div>
            <div
              className="metric-value"
              style={{
                marginTop: '8px',
                color:
                  stats.revengeCount > 0 ? 'var(--red)' : 'var(--green)',
              }}
            >
              {stats.revengeCount === 0
                ? '0 Flagged'
                : `${stats.revengeCount} Flagged`}
            </div>
            <div
              className="tabular-nums"
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              Impact: {formatUSD(stats.revengeNetPnl)}
            </div>
          </div>

          <div className="viper-metric-cell">
            <div className="eyebrow-label">AVG EXECUTION GRADE</div>
            <div
              className="metric-value"
              style={{
                marginTop: '8px',
                color: 'var(--green)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{stats.avgStars}</span>
              <Star
                size={22}
                style={{ fill: 'var(--green)', color: 'var(--green)' }}
              />
            </div>
            <div
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              Out of 5.0★ self-rating
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ marginTop: '24px' }}
        >
          {stats.byWindow.map((w) => (
            <div
              key={w.id}
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}
                  >
                    {w.label}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {w.count} trades
                  </span>
                </div>
                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {w.ct}
                </div>
              </div>
              <div
                style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: w.netPnl >= 0 ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  {formatUSD(w.netPnl)}
                </span>
                <span
                  className="tabular-nums"
                  style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                >
                  Win Rate:{' '}
                  <strong style={{ color: 'var(--text)' }}>{w.winRate}%</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* 2. CALENDAR TAB */
  if (activeTab === 'calendar') {
    return (
      <section className="viper-card">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div className="eyebrow-green">SESSION CALENDAR</div>
            <h2
              className="card-title"
              style={{ marginTop: '6px', marginBottom: 0 }}
            >
              Daily Execution Breakdown
            </h2>
            <p
              style={{
                marginTop: '4px',
                marginBottom: 0,
                fontSize: '15px',
                color: 'var(--text-muted)',
              }}
            >
              Review daily P&amp;L, trade count, and 15-minute cooldown
              adherence by session date.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLogModal}
            style={{
              height: '40px',
              padding: '0 18px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--green)',
              color: '#0A0D12',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            <span>Log trade</span>
          </button>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          style={{ marginTop: '24px' }}
        >
          {stats.dailyList.map((day) => (
            <div
              key={day.date}
              onClick={onSwitchToTradeLog}
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  className="tabular-nums"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}
                >
                  <CalendarIcon size={15} style={{ color: 'var(--green)' }} />
                  <span>{day.date}</span>
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '12px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {day.count} {day.count === 1 ? 'trade' : 'trades'}
                </span>
              </div>
              <div
                className="metric-value"
                style={{
                  marginTop: '16px',
                  color: day.netPnl >= 0 ? 'var(--green)' : 'var(--red)',
                }}
              >
                {formatUSD(day.netPnl)}
              </div>
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                }}
              >
                {day.revengeCount > 0 ? (
                  <span style={{ color: 'var(--red)', fontWeight: 600 }}>
                    🚨 {day.revengeCount} Revenge (&lt;15m gap)
                  </span>
                ) : (
                  <span style={{ color: 'var(--green)', fontWeight: 500 }}>
                    ✓ 15m Cooldown Respected
                  </span>
                )}
                <span style={{ color: 'var(--text-muted)' }}>
                  View trades →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* 3. STRATEGIES TAB */
  if (activeTab === 'strategies') {
    const handleCreateStrategy = (e) => {
      e.preventDefault();
      if (!newStratName.trim()) return;
      addStrategy({
        name: newStratName.trim(),
        window: newStratWindow,
        description:
          newStratDesc.trim() ||
          'Core execution setup aligned with liquidity windows.',
        targetR: '2.0R',
      });
      setNewStratName('');
      setNewStratDesc('');
    };

    return (
      <section
        className="viper-card"
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        <div>
          <div className="eyebrow-green">PLAYBOOK &amp; SETUPS</div>
          <h2
            className="card-title"
            style={{ marginTop: '6px', marginBottom: 0 }}
          >
            Trading Strategies
          </h2>
          <p
            style={{
              marginTop: '4px',
              marginBottom: 0,
              fontSize: '15px',
              color: 'var(--text-muted)',
            }}
          >
            Define your repeatable setups for the 2–5 AM EST London and 9–12 PM
            EST New York windows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strat) => (
            <div
              key={strat.id}
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}
                  >
                    {strat.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => deleteStrategy(strat.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <span
                  style={{
                    marginTop: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--green)',
                    border: '1px solid rgba(16, 185, 129, 0.38)',
                  }}
                >
                  <Clock size={12} />
                  <span>{strat.window}</span>
                </span>
                <p
                  style={{
                    marginTop: '12px',
                    marginBottom: 0,
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {strat.description}
                </p>
              </div>
              <div
                style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Target Profile</span>
                <strong
                  className="tabular-nums"
                  style={{ color: 'var(--text)' }}
                >
                  {strat.targetR || '2.0R'}
                </strong>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleCreateStrategy}
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div className="eyebrow-label">ADD NEW PLAYBOOK STRATEGY</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Strategy name (e.g. NY Open Liquidity Sweep)"
              value={newStratName}
              onChange={(e) => setNewStratName(e.target.value)}
              className="viper-input"
            />
            <select
              value={newStratWindow}
              onChange={(e) => setNewStratWindow(e.target.value)}
              className="viper-input"
            >
              <option value="2:00–5:00 AM EST (London)">
                2:00–5:00 AM EST (London)
              </option>
              <option value="9:00 AM–12:00 PM EST (NY)">
                9:00 AM–12:00 PM EST (NY)
              </option>
              <option value="All Sessions">All Sessions</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Entry confirmation & risk rules..."
              value={newStratDesc}
              onChange={(e) => setNewStratDesc(e.target.value)}
              className="viper-input"
            />
            <button
              type="submit"
              style={{
                height: '48px',
                padding: '0 24px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--green)',
                color: '#0A0D12',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Save Strategy
            </button>
          </div>
        </form>
      </section>
    );
  }

  /* 4. INSIGHTS TAB */
  if (activeTab === 'insights') {
    return (
      <section
        className="viper-card"
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        <div>
          <div className="eyebrow-green">BEHAVIORAL INSIGHTS</div>
          <h2
            className="card-title"
            style={{ marginTop: '6px', marginBottom: 0 }}
          >
            Psychology, Emotions &amp; 15-Minute Revenge Audit
          </h2>
          <p
            style={{
              marginTop: '4px',
              marginBottom: 0,
              fontSize: '15px',
              color: 'var(--text-muted)',
            }}
          >
            Compare how your emotional state and trade spacing directly impact
            your bottom line.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--green)',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Clean Trades (&ge; 15m Cooldown Respected)</span>
            </div>
            <div
              className="metric-value"
              style={{
                marginTop: '12px',
                color: stats.cleanNetPnl >= 0 ? 'var(--green)' : 'var(--red)',
              }}
            >
              {formatUSD(stats.cleanNetPnl)}
            </div>
            <div
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              {stats.total - stats.revengeCount} disciplined executions
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--red)',
              }}
            >
              <AlertTriangle size={16} />
              <span>Revenge Trades (&lt; 15m Gap Flagged)</span>
            </div>
            <div
              className="metric-value"
              style={{
                marginTop: '12px',
                color: stats.revengeNetPnl >= 0 ? 'var(--green)' : 'var(--red)',
              }}
            >
              {formatUSD(stats.revengeNetPnl)}
            </div>
            <div
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              {stats.revengeCount} rapid re-entries within 15 minutes of prior
              close
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="eyebrow-label" style={{ marginBottom: '12px' }}>
            PERFORMANCE BY EMOTIONAL TAG
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEELING_OPTIONS.map((feel) => {
              const matching = trades.filter((t) =>
                (t.feelings || []).includes(feel.id)
              );
              const sum = matching.reduce(
                (s, t) => s + (Number(t.netPnl) || 0),
                0
              );
              return (
                <div
                  key={feel.id}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    {feel.label}
                  </div>
                  <div
                    className="tabular-nums"
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color:
                          matching.length === 0
                            ? 'var(--text-muted)'
                            : sum >= 0
                            ? 'var(--green)'
                            : 'var(--red)',
                      }}
                    >
                      {matching.length > 0 ? formatUSD(sum) : '—'}
                    </span>
                    <span
                      style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                    >
                      {matching.length}x
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  /* 5. RULES TAB */
  if (activeTab === 'rules') {
    const handleCreateRule = (e) => {
      e.preventDefault();
      if (!newRuleText.trim()) return;
      addRule(newRuleText.trim());
      setNewRuleText('');
    };

    return (
      <section
        className="viper-card"
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        <div>
          <div className="eyebrow-green">TRADING CONSTITUTION</div>
          <h2
            className="card-title"
            style={{ marginTop: '6px', marginBottom: 0 }}
          >
            Core Execution &amp; Risk Rules
          </h2>
          <p
            style={{
              marginTop: '4px',
              marginBottom: 0,
              fontSize: '15px',
              color: 'var(--text-muted)',
            }}
          >
            Non-negotiable guardrails for liquidity window timing, risk
            management, and emotional discipline.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span
                  className="tabular-nums"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.38)',
                    color: 'var(--green)',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {rule.number}
                </span>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}
                >
                  {rule.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteRule(rule.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleCreateRule} className="flex gap-3">
          <input
            type="text"
            placeholder="Add a new personal trading rule..."
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
            className="viper-input"
          />
          <button
            type="submit"
            style={{
              height: '48px',
              padding: '0 24px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--green)',
              color: '#0A0D12',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            + Add Rule
          </button>
        </form>
      </section>
    );
  }

  /* 6. REPORT TAB */
  return (
    <section
      className="viper-card"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <div>
        <div className="eyebrow-green">POST-TRADE SELF-GRADING REPORT</div>
        <h2
          className="card-title"
          style={{ marginTop: '6px', marginBottom: 0 }}
        >
          Execution Quality &amp; Self-Evaluation Scorecard
        </h2>
        <p
          style={{
            marginTop: '4px',
            marginBottom: 0,
            fontSize: '15px',
            color: 'var(--text-muted)',
          }}
        >
          Aggregated scores across your 5 post-trade self-grading dimensions and
          pre-trade checklist.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SELF_GRADING_QUESTIONS.map((q) => {
          const ratedTrades = trades.filter(
            (t) => t.selfGrading && Number(t.selfGrading[q.id]) > 0
          );
          const avgScore =
            ratedTrades.length > 0
              ? (
                  ratedTrades.reduce(
                    (s, t) => s + Number(t.selfGrading[q.id]),
                    0
                  ) / ratedTrades.length
                ).toFixed(1)
              : '0.0';
          const pct = Math.min(100, Math.round((Number(avgScore) / 5) * 100));

          return (
            <div
              key={q.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}
                >
                  {q.question}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--green)',
                  }}
                >
                  {avgScore} / 5.0
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--surface)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: '999px',
                    backgroundColor: 'var(--green)',
                    transition: 'width 250ms ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
