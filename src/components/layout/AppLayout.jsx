import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import TimezoneBanner from './TimezoneBanner';

export default function AppLayout({
  children,
  currentView,
  onNavigate,
  onToggleTheme,
  isDark,
  user,
  onSignOut,
  onImportMt5,
  onImportJson,
  trades
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (view) => {
    setSidebarOpen(false);
    onNavigate?.(view);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 dark:bg-slate-950 light:bg-slate-50 transition-colors duration-200">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          onToggleTheme={onToggleTheme}
          isDark={isDark}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full min-w-0">
        <TimezoneBanner onNavigateToSettings={handleNavigate} />
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          user={user}
          onSignOut={onSignOut}
          onImportMt5={onImportMt5}
          onImportJson={onImportJson}
          trades={trades}
          onToggleTheme={onToggleTheme}
          isDark={isDark}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
