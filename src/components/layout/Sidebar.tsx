import { useState, useEffect } from 'react';
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
  LogOut,
  Layers,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { logOut } from '../../lib/firebase';
import { isToday, isPast, isSameDay } from 'date-fns';

function NavItem({
  to,
  label,
  isActive,
  badge,
}: {
  to: string;
  label: string;
  isActive: boolean;
  badge?: { value: number; tone: 'orange' | 'green' };
}) {
  return (
    <NavLink
      to={to}
      className={cn('sidebar-nav-item', isActive && 'sidebar-nav-item-active')}
    >
      <span className="truncate">{label}</span>
      {badge && badge.value > 0 && (
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

export function Sidebar() {
  const location = useLocation();
  const store = useStore();
  const user = store.user;

  const isFinanceRoute = location.pathname.startsWith('/finance');
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

  const isActive = (href: string) =>
    location.pathname === href ||
    (href !== '/' && location.pathname.startsWith(href));

  return (
    <aside className="sidebar hidden lg:flex">
      <div className="px-5 pt-6 pb-5">
        <div className="sidebar-logo" aria-hidden>
          <div className="sidebar-logo-mark" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        <NavLink
          to="/"
          className={cn('sidebar-nav-item', location.pathname === '/' && 'sidebar-nav-item-active')}
        >
          <LayoutDashboard className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
          <span>Dashboard</span>
        </NavLink>

        <div>
          <button
            type="button"
            onClick={() => setFinanceOpen((o) => !o)}
            className={cn(
              'sidebar-group-trigger',
              (financeOpen || isFinanceRoute) && 'sidebar-group-trigger-open'
            )}
          >
            <Wallet className="h-[18px] w-[18px] shrink-0 stroke-[1.5] text-[var(--color-ink-muted)]" />
            <span className="flex-1 text-left">Finance</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-[var(--color-ink-muted)] transition-transform duration-200',
                financeOpen && 'rotate-180'
              )}
            />
          </button>

          {financeOpen && (
            <div className="sidebar-tree">
              <div className="sidebar-tree-item">
                <NavItem
                  to="/finance/personal"
                  label="Personal Finance"
                  isActive={isActive('/finance/personal')}
                />
              </div>
              <div className="sidebar-tree-item">
                <NavItem
                  to="/finance/business"
                  label="Business Finance"
                  isActive={isActive('/finance/business')}
                />
              </div>
            </div>
          )}
        </div>

        <NavLink
          to="/projects"
          className={cn('sidebar-nav-item', isActive('/projects') && 'sidebar-nav-item-active')}
        >
          <FolderKanban className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
          <span>Projects</span>
        </NavLink>

        <NavLink
          to="/tasks"
          className={cn('sidebar-nav-item', isActive('/tasks') && 'sidebar-nav-item-active')}
        >
          <CheckSquare className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
          <span className="flex-1">Tasks</span>
          {pendingTasks > 0 && (
            <span className="nav-count-badge nav-count-badge-orange">{pendingTasks}</span>
          )}
        </NavLink>

        <NavLink
          to="/payments"
          className={cn('sidebar-nav-item', isActive('/payments') && 'sidebar-nav-item-active')}
        >
          <BellRing className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
          <span className="flex-1">Payments</span>
          {upcomingPayments > 0 && (
            <span className="nav-count-badge nav-count-badge-green">{upcomingPayments}</span>
          )}
        </NavLink>

        <NavLink
          to="/notes"
          className={cn('sidebar-nav-item', isActive('/notes') && 'sidebar-nav-item-active')}
        >
          <BookOpen className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
          <span>Remember Book</span>
        </NavLink>
      </nav>

      <div className="px-3 pb-5 pt-2 space-y-0.5 border-t border-[var(--color-border-subtle)]/80 mx-3">
        <NavLink
          to="/settings"
          className={cn('sidebar-nav-item', isActive('/settings') && 'sidebar-nav-item-active')}
        >
          <Settings className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
          <span>Settings</span>
        </NavLink>
        <button
          type="button"
          onClick={() => logOut()}
          className="sidebar-nav-item text-[var(--color-ink-muted)] hover:text-[var(--color-negative)]"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
          <span>Sign out</span>
        </button>
      </div>

      {user && (
        <div className="px-5 pb-6 pt-2">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-8 w-8 rounded-full avatar-accent flex items-center justify-center text-xs shrink-0">
              {user.name?.charAt(0) || 'F'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--color-ink)] truncate">{user.name}</p>
              <p className="text-[10px] text-[var(--color-ink-muted)] truncate flex items-center gap-1">
                <Layers className="h-2.5 w-2.5" />
                Founder OS
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
