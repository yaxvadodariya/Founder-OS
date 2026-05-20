import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Briefcase, 
  FolderKanban, 
  CheckSquare, 
  BellRing, 
  BookOpen,
  Settings,
  Menu,
  LogOut,
  X
} from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { DarkModeToggle } from '../DarkModeToggle';
import { logOut } from '../../lib/firebase';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Personal Finance', href: '/finance/personal', icon: Wallet },
  { name: 'Business Finance', href: '/finance/business', icon: Briefcase },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Payments', href: '/payments', icon: BellRing },
  { name: 'Remember Book', href: '/notes', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const mobileNav = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Finance', href: '/finance/personal', icon: Wallet },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'More', href: '/more', icon: Menu },
];

export function AppLayout() {
  const store = useStore();
  const user = store.user;
  const togglePrivacyMode = store.togglePrivacyMode;
  const isDarkMode = store.isDarkMode;
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        togglePrivacyMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePrivacyMode]);

  useEffect(() => {
    const incompleteTasks = store.tasks.filter(t => !t.completed);
    const rememberNotes = store.notes.filter(n => n.category === 'remember');
    
    const syncReminders = async () => {
      try {
        await fetch('/api/sync-reminders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tasks: incompleteTasks,
            notes: rememberNotes
          })
        });
      } catch (err) {
        console.error('Failed to sync reminders:', err);
      }
    };

    if (incompleteTasks.length > 0 || rememberNotes.length > 0) {
      syncReminders();
    }
  }, [store.tasks, store.notes]);

  return (
    <div className="flex min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)] font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[260px] flex-col fixed inset-y-0 left-0 z-50 px-4 py-5">
        <div className="flex flex-col h-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          {/* Brand + user */}
          <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border-soft)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full avatar-accent flex items-center justify-center text-sm shrink-0">
                {user?.name?.charAt(0) || 'F'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{user?.name || 'Founder'}</p>
                <p className="text-xs text-[var(--color-ink-muted)] truncate">Founder OS</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                               (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-full text-[13px] font-medium transition-all duration-150",
                    isActive 
                      ? "bg-[var(--color-surface-muted)] text-[var(--color-ink)] font-semibold" 
                      : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                  )}
                >
                  <item.icon className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 stroke-[1.75]",
                    isActive ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"
                  )} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-[var(--color-border-soft)]">
            <button 
              onClick={() => logOut()}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-full text-[13px] font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-negative)] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-[18px] w-[18px] stroke-[1.75]" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-[260px] flex flex-col h-screen overflow-hidden relative" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {user?.email === 'yaxvadodariya@gmail.com' && store.lastError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl m-4 text-sm relative z-50">
            <strong className="font-semibold">Last Firestore Error:</strong>
            <pre className="mt-2 whitespace-pre-wrap">{store.lastError}</pre>
            <button
              onClick={() => store.setLastError(null)}
              className="absolute top-3 right-3 text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto pb-0">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <Outlet />
          </div>
        </div>
        <div className="hidden lg:block fixed bottom-8 right-8 z-50">
          <DarkModeToggle />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-around items-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/95 backdrop-blur-md shadow-[var(--shadow-elevated)] py-2">
          {mobileNav.map((item) => {
            const isActive = location.pathname === item.href || 
            (item.href !== '/' && item.href !== '/more' && location.pathname.startsWith(item.href));
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-full transition-colors",
                  isActive ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"
                )}
              >
                <item.icon className={cn("h-5 w-5 mb-0.5 stroke-[1.75]", isActive && "text-[var(--color-ink)]")} />
                <span className="text-[10px] font-medium leading-none">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
