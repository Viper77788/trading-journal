import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useTrades } from './hooks/useTrades';
import { useTheme } from './hooks/useTheme';
import AuthPage from './components/auth/AuthPage';
import AppLayout from './components/layout/AppLayout';
import DashboardView from './components/dashboard/DashboardView';
import JournalView from './components/journal/JournalView';
import CalendarView from './components/calendar/CalendarView';
import AddTradeModal from './components/journal/AddTradeModal';
import AnalyticsView from './components/analytics/AnalyticsView';
import SettingsView from './components/settings/SettingsView';
import Spinner from './components/shared/Spinner';

export default function App() {
  const { user, loading: authLoading, signIn, signUp, resetPassword, logout } = useAuth();
  const { trades, loading: tradesLoading, fetchTrades, addTrade, editTrade, removeTrade, getTrade, importMt5, importJson } = useTrades();
  const { theme, toggleTheme, isDark } = useTheme();

  const [currentView, setCurrentView] = useState('dashboard');
  const [editingTrade, setEditingTrade] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [tradeFormLoading, setTradeFormLoading] = useState(false);

  // Auth loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="spinner-ring mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth screen
  if (!user) {
    return <AuthPage onSignIn={signIn} onSignUp={signUp} onResetPassword={resetPassword} />;
  }

    const handleNavigate = async (view) => {
    if (view === 'trade-new') {
      setEditingTrade(null);
      setIsViewOnly(false);
      setCurrentView('trade');
      return;
    }
    setCurrentView(view);
    if (view === 'dashboard' || view === 'journal' || view === 'calendar' || view === 'analytics') {
      await fetchTrades();
    }
  };

  const handleViewTrade = async (id) => {
    const trade = await getTrade(id);
    if (trade) {
      setEditingTrade(trade);
      setIsViewOnly(true);
      setCurrentView('trade');
    }
  };

  const handleEditTrade = async (id) => {
    const trade = await getTrade(id);
    if (trade) {
      setEditingTrade(trade);
      setIsViewOnly(false);
      setCurrentView('trade');
    }
  };

  const handleDeleteTrade = async (id) => {
    if (!window.confirm("Delete this trade? This can't be undone.")) return;
    await removeTrade(id);
  };

  const handleChartTrade = (trade) => {
    if (trade.tradingViewLink) {
      window.open(trade.tradingViewLink, '_blank', 'noopener,noreferrer');
    } else {
      alert('No TradingView link saved for this trade. Add one by editing the trade.');
    }
  };

  const handleSaveTrade = async (payload) => {
    setTradeFormLoading(true);
    try {
      if (editingTrade) {
        await editTrade(editingTrade.id, payload);
      } else {
        await addTrade(payload);
      }
      setCurrentView('journal');
      await fetchTrades();
    } catch (err) {
      alert("Couldn't save this trade: " + (err?.message || 'unknown error'));
    } finally {
      setTradeFormLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentView('dashboard');
  };

  const handleImportMt5 = async (file) => {
    try {
      const result = await importMt5(file);
      let message = `Imported ${result.imported} trade${result.imported === 1 ? '' : 's'} from MT5.`;
      if (result.skipped) message += ` Skipped ${result.skipped} already-imported trade${result.skipped === 1 ? '' : 's'}.`;
      alert(message);
    } catch (err) {
      alert("Couldn't import that file: " + (err?.message || 'unknown error'));
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView trades={trades} loading={tradesLoading} onImportMt5={handleImportMt5} />;
      case 'journal':
        return (
          <JournalView
            trades={trades}
            loading={tradesLoading}
            onView={handleViewTrade}
            onEdit={handleEditTrade}
            onDelete={handleDeleteTrade}
            onChart={handleChartTrade}
            onNavigateToTrade={() => handleNavigate('trade-new')}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            trades={trades}
            loading={tradesLoading}
            onView={handleViewTrade}
            onEdit={handleEditTrade}
            onDelete={handleDeleteTrade}
            onChart={handleChartTrade}
          />
        );
      case 'trade':
        return (
          <AddTradeModal
            trade={editingTrade}
            isViewOnly={isViewOnly}
            onSave={handleSaveTrade}
            onCancel={() => setCurrentView('journal')}
            loading={tradeFormLoading}
          />
        );
      case 'analytics':
        return <AnalyticsView trades={trades} loading={tradesLoading} />;
      case 'settings':
        return <SettingsView trades={trades} user={user} onSignOut={handleSignOut} onImportMt5={handleImportMt5} onImportJson={handleImportJson} />;
      default:
        return <DashboardView trades={trades} loading={tradesLoading} />;
    }
  };

  return (
    <AppLayout
      currentView={currentView}
      onNavigate={handleNavigate}
      onToggleTheme={toggleTheme}
      isDark={isDark}
      user={user}
      onSignOut={handleSignOut}
      onImportMt5={handleImportMt5}
      onImportJson={handleImportJson}
      trades={trades}
    >
      {renderView()}
    </AppLayout>
  );
}
