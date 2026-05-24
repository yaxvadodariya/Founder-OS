import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  FolderKanban, 
  CheckSquare, 
  Menu,
  X
} from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { DarkModeToggle } from '../DarkModeToggle';
import { Sidebar } from './Sidebar';
import { CommandBar } from '../CommandBar';

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
      <Sidebar />
      <CommandBar />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:pl-[252px]">
        <div className="app-shell flex flex-col flex-1 min-h-0 min-w-0 lg:min-h-[calc(100vh-1.5rem)]">
          <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-x-hidden overflow-y-hidden relative" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {user?.email === 'yaxvadodariya@gmail.com' && store.lastError && (
              <div className="bg-[var(--color-negative-soft)] border border-red-200 dark:border-red-800 text-[var(--color-negative-text)] px-4 py-3 rounded-xl m-4 text-sm relative z-50 shrink-0">
                <strong className="font-semibold">Last Firestore Error:</strong>
                <pre className="mt-2 whitespace-pre-wrap">{store.lastError}</pre>
                <button
                  onClick={() => store.setLastError(null)}
                  className="absolute top-3 right-3 text-[var(--color-negative)] hover:opacity-80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
              <div className="mx-auto max-w-[1200px] w-full min-w-0 box-border px-5 sm:px-6 lg:px-8 py-5 lg:py-8">
                <Outlet />
              </div>
            </div>
            <div className="hidden lg:block fixed bottom-8 right-8 z-50">
              <DarkModeToggle />
            </div>
          </main>
        </div>
      </div>

      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-around items-center rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] py-2.5 shadow-[var(--shadow-card)]">
          {mobileNav.map((item) => {
            const isActive = location.pathname === item.href || 
            (item.href !== '/' && item.href !== '/more' && location.pathname.startsWith(item.href));
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-xl transition-colors",
                  isActive ? "text-[var(--color-ink)] font-medium" : "text-[var(--color-ink-muted)] font-normal"
                )}
              >
                <item.icon className={cn("h-5 w-5 mb-0.5 stroke-[1.5]", isActive ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]")} />
                <span className="text-[10px] leading-none">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
