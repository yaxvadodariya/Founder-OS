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
  Moon,
  Sun,
  LogOut,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
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
      // CMD + Shift + H (Mac) or Ctrl + Shift + H (Windows)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        togglePrivacyMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePrivacyMode]);

  useEffect(() => {
    // Sync to server for WhatsApp cron job
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
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-50">
        <div className="flex h-16 items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold tracking-tight">Founder OS<span className="text-blue-600">.</span></span>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                             (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  isActive 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-500"
                )} />
                {item.name}
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2">
          <div className="flex items-center flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold overflow-hidden">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <div className="flex items-center mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800">PRO</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => logOut()}
            className="flex items-center justify-center h-[50px] w-[50px] rounded-lg bg-gray-50 border border-gray-100 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors shrink-0"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Box */}
      <main className="flex-1 lg:pl-64 flex flex-col h-screen overflow-hidden relative" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {user?.email === 'yaxvadodariya@gmail.com' && store.lastError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4 shadow text-sm relative z-50">
            <strong className="font-bold">Last Firestore Error:</strong>
            <pre className="mt-2 whitespace-pre-wrap">{store.lastError}</pre>
            <button
              onClick={() => store.setLastError(null)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto pb-0">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
        <div className="hidden lg:block fixed bottom-6 right-6 z-50">
          <DarkModeToggle />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(64px + env(safe-area-inset-bottom))' }}
      >
        {mobileNav.map((item) => {
           const isActive = location.pathname === item.href || 
           (item.href !== '/' && item.href !== '/more' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-[64px] space-y-1 transition-colors",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-0.5", isActive ? "fill-blue-50 text-blue-600" : "")} />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
