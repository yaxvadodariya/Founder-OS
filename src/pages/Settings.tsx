import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import { useStore } from '../store/useStore';
import { logOut } from '../lib/firebase';
import { 
  LogOut, 
  Moon,
  Sun,
  Shield,
  User,
  Bell,
  Globe,
  Wallet,
  Download,
  LayoutGrid
} from 'lucide-react';
import { cn, CURRENCIES } from '../lib/utils';

export function Settings() {
  const store = useStore();
  const user = store.user;

  return (
    <PageShell className="lg:pb-0 max-w-2xl mx-auto w-full">
      <div className="flex flex-col justify-between items-start gap-4 mb-4">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="section-panel">
        {/* Profile Section */}
        <div className="design-card p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-ink-secondary)] flex items-center justify-center font-bold text-2xl overflow-hidden">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--color-ink)]">{user?.name}</p>
              <p className="text-sm tracking-tight text-[var(--color-ink-secondary)]">{user?.email}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">PRO</span>
        </div>

        {/* Preferences */}
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="section-label">Preferences</h2>
        </div>
        <div className="design-card divide-y divide-[var(--color-border-soft)] overflow-hidden mb-6">
           <div className="w-full flex items-center justify-between p-4 transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-[10px] bg-[var(--color-surface-muted)] text-[var(--color-ink)]">
                 <Globe className="w-5 h-5" />
               </div>
               <span className="text-sm font-medium text-[var(--color-ink)]">Currency</span>
             </div>
             <select
               value={store.currency}
               onChange={(e) => store.setCurrency(e.target.value)}
               className="text-sm font-medium text-[var(--color-ink)] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] rounded-[10px] pl-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-muted)] cursor-pointer"
             >
               {CURRENCIES.map(c => (
                 <option key={c.code} value={c.code}>
                   {c.flag} {c.code} - {c.name}
                 </option>
               ))}
             </select>
           </div>
           
           <div className="w-full flex items-center justify-between p-4 transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-[10px] bg-[var(--color-surface-muted)] text-[var(--color-ink)]">
                 <Wallet className="w-5 h-5" />
               </div>
               <span className="text-sm font-medium text-[var(--color-ink)]">Dashboard Balance</span>
             </div>
             <select
               value={store.balanceDisplayMode || 'net-worth'}
               onChange={(e) => store.setBalanceDisplayMode(e.target.value as 'net-worth' | 'liquid-cash')}
               className="text-sm font-medium text-[var(--color-ink)] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] rounded-[10px] pl-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-muted)] cursor-pointer"
             >
               <option value="net-worth">Net Worth (Full)</option>
               <option value="liquid-cash">Liquid Cash Only</option>
             </select>
           </div>
           <button
             onClick={() => store.toggleDarkMode()}
             className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-colors"
           >
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-[10px] bg-[var(--color-surface-muted)] text-[var(--color-ink)]">
                 {store.isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
               </div>
               <span className="text-sm font-medium text-[var(--color-ink)]">Dark Mode</span>
             </div>
             <div className="text-[var(--color-ink-secondary)] font-medium text-sm">
               {store.isDarkMode ? "On" : "Off"}
             </div>
           </button>
           <button
             onClick={() => store.togglePrivacyMode()}
             className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-colors"
           >
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-[10px] bg-[var(--color-surface-muted)] text-[var(--color-ink)]">
                 <Shield className="w-5 h-5" />
               </div>
               <span className="text-sm font-medium text-[var(--color-ink)]">Privacy Mode</span>
             </div>
             <div className="text-[var(--color-ink-secondary)] font-medium text-sm">
               {store.isPrivacyMode ? "On" : "Off"}
             </div>
           </button>
        </div>

        {/* Dashboard Widgets */}
        <div className="flex justify-between items-center mb-2 px-1 mt-6">
          <h2 className="section-label">Dashboard Widgets</h2>
        </div>
        <div className="design-card divide-y divide-[var(--color-border-soft)] overflow-hidden mb-4">
          {[
            { key: 'balanceCard', label: 'Balance Card' },
            { key: 'chart', label: 'Finance Chart' },
            { key: 'tasksSummary', label: 'Tasks Summary' },
            { key: 'upcomingPayments', label: 'Upcoming Payments' },
            { key: 'spendingBreakdown', label: 'Spending Breakdown' },
            { key: 'revenueForecast', label: 'Revenue Forecast' },
          ].map(widget => (
            <div key={widget.key} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[10px] bg-[var(--color-surface-muted)] text-[var(--color-ink)]">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-[var(--color-ink)]">{widget.label}</span>
              </div>
              <button
                type="button"
                onClick={() => store.setDashboardWidgets({ [widget.key]: !(store.dashboardWidgets as any)[widget.key] })}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  (store.dashboardWidgets as any)[widget.key] ? 'bg-emerald-500' : 'bg-[var(--color-surface-muted)]'
                )}
              >
                <span className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                  (store.dashboardWidgets as any)[widget.key] ? 'translate-x-6' : 'translate-x-1'
                )} />
              </button>
            </div>
          ))}
        </div>

        {/* Data Export */}
        <div className="flex justify-between items-center mb-2 px-1 mt-6">
          <h2 className="section-label">Data Export</h2>
        </div>
        <div className="design-card divide-y divide-[var(--color-border-soft)] overflow-hidden mb-4">
          {[
            { label: 'Export Transactions (CSV)', action: () => {
              const csv = ['Date,Type,Amount,Category,Description', ...store.transactions.map(t => `${t.date},${t.type},${t.amount},${t.categoryDetail},"${t.description || ''}"`)].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'transactions.csv'; a.click();
            }},
            { label: 'Export Tasks (CSV)', action: () => {
              const csv = ['Title,Priority,Completed,Due Date', ...store.tasks.map(t => `"${t.title}",${t.priority},${t.completed},${t.dueDate || ''}`)].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tasks.csv'; a.click();
            }},
            { label: 'Export All Data (JSON)', action: () => {
              const data = { transactions: store.transactions, tasks: store.tasks, projects: store.projects, habits: store.habits, goals: store.goals, budgets: store.budgets, clients: store.clients, journalEntries: store.journalEntries, notes: store.notes };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'founder-os-backup.json'; a.click();
            }},
          ].map((item, i) => (
            <button key={i} type="button" onClick={item.action}
              className="w-full flex items-center gap-3 p-4 hover:bg-[var(--color-surface-hover)] transition-colors">
              <div className="p-2 rounded-[10px] bg-[var(--color-surface-muted)] text-[var(--color-ink)]">
                <Download className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-[var(--color-ink)]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Account Actions */}
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="section-label">Account actions</h2>
        </div>
        <div className="design-card overflow-hidden">
           <button
             onClick={() => logOut()}
             className="w-full flex items-center gap-3 p-4 hover:bg-[var(--color-surface-hover)] transition-colors text-red-600"
           >
             <LogOut className="w-5 h-5" />
             <span className="text-sm font-medium">Sign Out</span>
           </button>
        </div>
      </div>
    </PageShell>
  );
}
