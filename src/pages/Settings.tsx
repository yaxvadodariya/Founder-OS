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
  Wallet
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
