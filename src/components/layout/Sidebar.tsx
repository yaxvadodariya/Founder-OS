import { useState, useEffect, type ElementType } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  FolderKanban,
  CheckSquare,
  BellRing,
  BookOpen,
  Settings,
  ChevronDown,
  ChevronsUpDown,
  LogOut,
  Flame,
  Target,
  PenTool,
  Users,
  BarChart3,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { logOut } from '../../lib/firebase';
import { isToday, isPast, isSameDay, format } from 'date-fns';

function NavItem({
  to,
  label,
  isActive,
  icon: Icon,
  badge,
}: {
  to: string;
  label: string;
  isActive: boolean;
  icon?: ElementType;
  badge?: { value: number | string; tone: 'orange' | 'green' };
}) {
  return (
    <NavLink
      to={to}
      className={cn('sidebar-nav-item', isActive && 'sidebar-nav-item-active')}
    >
      {Icon && <Icon className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />}
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span
          className={cn(
            'nav-count-badge',
            badge.tone === 'orange' ? 'nav-count-badge-orange' : 'nav-count-badge-green'
          )}
        >
          {badge.value}
        </span>
      )}
    </NavLink>
  );
}

function openCommandBar() {
  // Trigger the existing CommandBar (which listens for ⌘K / Ctrl+K on window)
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true })
  );
}

export function Sidebar() {
  const location = useLocation();
  const store = useStore();
  const user = store.user;
  const isDarkMode = store.isDarkMode;

  const isFinanceRoute =
    location.pathname.startsWith('/finance') || location.pathname.startsWith('/budgets');
  const [financeOpen, setFinanceOpen] = useState(isFinanceRoute);

  useEffect(() => {
    if (isFinanceRoute) setFinanceOpen(true);
  }, [isFinanceRoute]);

  const pendingTasks = store.tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    return isSameDay(due, new Date()) || (isPast(due) && !isToday(due));
  }).length;

  const upcomingPayments = store.recurringPayments.filter((p) => p.active).length;

  const today = format(new Date(), 'yyyy-MM-dd');
  const habitsToday = store.habits.filter(
    (h) => h.active && (h.completedDates || []).includes(today)
  ).length;
  const totalActiveHabits = store.habits.filter((h) => h.active).length;

  const isActive = (href: string) =>
    location.pathname === href ||
    (href !== '/' && location.pathname.startsWith(href));

  const initial = (user?.name || 'F').charAt(0).toUpperCase();

  return (
    <aside className="sidebar hidden lg:flex">
      {/* Workspace Switcher */}
      <div className="px-4 pt-5 pb-3">
        <button type="button" className="workspace-switcher focus-ring" aria-label="Workspace">
          <span className="workspace-switcher-mark" aria-hidden />
          <span className="flex-1 min-w-0">
            <span className="block workspace-switcher-name truncate">Founder OS</span>
            <span className="block workspace-switcher-plan truncate">Personal workspace</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 workspace-switcher-chev" strokeWidth={2} />
        </button>
      </div>

      {/* Search Trigger */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={openCommandBar}
          className="sidebar-search focus-ring"
          aria-label="Open command bar"
        >
          <Search className="h-4 w-4" strokeWidth={1.75} />
          <span className="sidebar-search-label">Search…</span>
          <span className="flex items-center gap-0.5">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="sidebar-section-label">Workspace</p>

        <NavItem
          to="/"
          label="Dashboard"
          icon={LayoutDashboard}
          isActive={location.pathname === '/'}
        />

        <div>
          <button
            type="button"
            onClick={() => setFinanceOpen((o) => !o)}
            className={cn(
              'sidebar-group-trigger focus-ring',
              (financeOpen || isFinanceRoute) && 'sidebar-group-trigger-open'
            )}
          >
            <Wallet className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
            <span className="flex-1 text-left">Finance</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-200',
                financeOpen && 'rotate-180'
              )}
            />
          </button>

          {financeOpen && (
            <div className="sidebar-tree">
              <div className="sidebar-tree-item">
                <NavItem
                  to="/finance/personal"
                  label="Personal"
                  isActive={isActive('/finance/personal')}
                />
              </div>
              <div className="sidebar-tree-item">
                <NavItem
                  to="/finance/business"
                  label="Business"
                  isActive={isActive('/finance/business')}
                />
              </div>
              <div className="sidebar-tree-item">
                <NavItem to="/budgets" label="Budgets" isActive={isActive('/budgets')} />
              </div>
            </div>
          )}
        </div>

        <p className="sidebar-section-label">Operations</p>

        <NavItem
          to="/projects"
          label="Projects"
          icon={FolderKanban}
          isActive={isActive('/projects')}
        />
        <NavItem
          to="/tasks"
          label="Tasks"
          icon={CheckSquare}
          isActive={isActive('/tasks')}
          badge={pendingTasks > 0 ? { value: pendingTasks, tone: 'orange' } : undefined}
        />
        <NavItem
          to="/habits"
          label="Habits"
          icon={Flame}
          isActive={isActive('/habits')}
          badge={
            totalActiveHabits > 0
              ? {
                  value: `${habitsToday}/${totalActiveHabits}`,
                  tone: habitsToday === totalActiveHabits ? 'green' : 'orange',
                }
              : undefined
          }
        />
        <NavItem to="/goals" label="Goals" icon={Target} isActive={isActive('/goals')} />

        <p className="sidebar-section-label">Records</p>

        <NavItem to="/journal" label="Journal" icon={PenTool} isActive={isActive('/journal')} />
        <NavItem
          to="/payments"
          label="Payments"
          icon={BellRing}
          isActive={isActive('/payments')}
          badge={upcomingPayments > 0 ? { value: upcomingPayments, tone: 'green' } : undefined}
        />
        <NavItem to="/clients" label="Clients" icon={Users} isActive={isActive('/clients')} />
        <NavItem
          to="/notes"
          label="Remember Book"
          icon={BookOpen}
          isActive={isActive('/notes')}
        />

        <p className="sidebar-section-label">Insights</p>

        <NavItem
          to="/weekly-review"
          label="Weekly Review"
          icon={BarChart3}
          isActive={isActive('/weekly-review')}
        />
        <NavItem
          to="/settings"
          label="Settings"
          icon={Settings}
          isActive={isActive('/settings')}
        />
      </nav>

      {/* Profile Card */}
      <div className="px-4 pb-5 pt-2">
        <div className="sidebar-profile-card">
          <div className="sidebar-profile-avatar" aria-hidden>
            {initial}
          </div>
          <div className="sidebar-profile-meta">
            <p className="sidebar-profile-name truncate">{user?.name || 'Founder'}</p>
            <p className="sidebar-profile-email truncate">{user?.email || 'Personal workspace'}</p>
          </div>
          <button
            type="button"
            onClick={() => store.toggleDarkMode()}
            className="sidebar-profile-action focus-ring"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => logOut()}
            className="sidebar-profile-action focus-ring"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
