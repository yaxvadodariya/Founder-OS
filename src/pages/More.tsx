import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { logOut } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { 
  Briefcase, 
  BellRing, 
  BookOpen, 
  LogOut, 
  ChevronRight,
  User,
  Wand2,
  Globe, 
  Moon,
  Sun,
  Shield,
  Wallet
} from 'lucide-react';
import { cn, CURRENCIES } from '../lib/utils';

export function More() {
  const store = useStore();
  const navigate = useNavigate();
  const user = store.user;

  const [testingMorning, setTestingMorning] = React.useState(false);
  const [testingNight, setTestingNight] = React.useState(false);

  const testReminder = async (time: 'Morning' | 'Night', setter: (val: boolean) => void) => {
    setter(true);
    try {
      const res = await fetch('/api/test-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeOfDay: time })
      });
      if (res.ok) {
        toast.success(`Success! Sent test ${time.toLowerCase()} reminder to WhatsApp.`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || `Failed to trigger ${time.toLowerCase()} reminder. Please make sure TWILIO environment variables are set up.`);
      }
    } catch (err) {
      toast.error('Network error triggering reminder.');
    } finally {
      setter(false);
    }
  };

  const menuItems = [
    { name: 'Business Finance', icon: Briefcase, path: '/finance/business', color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Payments', icon: BellRing, path: '/payments', color: 'text-purple-500', bg: 'bg-purple-50' },
    { name: 'Remember Book', icon: BookOpen, path: '/notes', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <PageShell className="lg:pb-0 max-w-2xl mx-auto w-full">
      <div className="flex flex-col justify-between items-start gap-4">
        <div>
          <h1 className="page-title">Menu</h1>
          <p className="page-subtitle">More settings and features</p>
        </div>
      </div>

      <div className="section-panel">
        <div className="design-card p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl overflow-hidden">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--color-ink)]">{user?.name}</p>
              <p className="text-sm tracking-tight text-[var(--color-ink-secondary)]">{user?.email}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">PRO</span>
        </div>

        <div className="flex justify-between items-center mb-2 px-1 mt-6">
          <h2 className="section-label">Features</h2>
        </div>
        
        <div className="design-card divide-y divide-[var(--color-border-soft)] overflow-hidden mb-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-[10px]", item.bg, item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-[var(--color-ink)]">{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-ink-muted)]" />
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-2 px-1 mt-6">
          <h2 className="section-label">Test Integrations</h2>
        </div>
        <div className="design-card divide-y divide-[var(--color-border-soft)] overflow-hidden mb-4">
           <button
             disabled={testingMorning}
             onClick={() => testReminder('Morning', setTestingMorning)}
             className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
           >
             <div className="flex flex-col items-start gap-0.5">
               <span className="text-sm font-medium text-[var(--color-ink)]">Trigger Morning Digest</span>
               <span className="text-xs text-[var(--color-ink-secondary)] text-left">Sends a personalized morning WhatsApp greet and list</span>
             </div>
             <div className="text-blue-600 text-xs font-medium min-w-[80px] text-right">
               {testingMorning ? 'Sending...' : 'Send Test'}
             </div>
           </button>
           <button
             disabled={testingNight}
             onClick={() => testReminder('Night', setTestingNight)}
             className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
           >
             <div className="flex flex-col items-start gap-0.5">
               <span className="text-sm font-medium text-[var(--color-ink)]">Trigger Evening Reflection</span>
               <span className="text-xs text-[var(--color-ink-secondary)] text-left">Sends a review and encourages completion of pending tasks</span>
             </div>
             <div className="text-blue-600 text-xs font-medium min-w-[80px] text-right">
               {testingNight ? 'Sending...' : 'Send Test'}
             </div>
           </button>
        </div>

        <div className="flex justify-between items-center mb-2 px-1 mt-6">
          <h2 className="section-label">Preferences</h2>
        </div>
        <div className="design-card divide-y divide-[var(--color-border-soft)] overflow-hidden mb-4">
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

        <div className="flex justify-between items-center mb-2 px-1 mt-6">
          <h2 className="section-label">Settings</h2>
        </div>
        <div className="design-card overflow-hidden">
           <button
             onClick={() => logOut()}
             className="w-full flex items-center gap-3 p-4 hover:bg-[var(--color-surface-hover)] transition-colors text-red-600"
           >
             <LogOut className="w-5 h-5" />
             <span className="text-sm font-medium">Log Out</span>
           </button>
        </div>
      </div>
    </PageShell>
  );
}
