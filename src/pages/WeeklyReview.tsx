import React from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { format, startOfWeek, endOfWeek, isWithinInterval, subWeeks, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, CheckSquare, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';

export function WeeklyReview() {
  const store = useStore();
  const [weekOffset, setWeekOffset] = React.useState(0);

  const baseDate = weekOffset === 0 ? new Date() : weekOffset > 0 ? addWeeks(new Date(), weekOffset) : subWeeks(new Date(), Math.abs(weekOffset));
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const inWeek = (dateStr: string) => { try { return isWithinInterval(new Date(dateStr), { start: weekStart, end: weekEnd }); } catch { return false; } };

  const tasksCompleted = store.tasks.filter(t => t.completed && t.completedAt && inWeek(t.completedAt)).length;
  const totalTasks = store.tasks.filter(t => t.dueDate && inWeek(t.dueDate)).length;
  const hoursTracked = store.tasks.filter(t => t.completedAt && inWeek(t.completedAt)).reduce((a, t) => a + (t.timeSpent || 0), 0) / 3600;
  const income = store.transactions.filter(t => t.type === 'income' && inWeek(t.date)).reduce((a, t) => a + t.amount, 0);
  const expenses = store.transactions.filter(t => t.type === 'expense' && inWeek(t.date)).reduce((a, t) => a + t.amount, 0);
  const habitsCompleted = store.habits.reduce((acc, h) => {
    const count = (h.completedDates || []).filter(d => inWeek(d)).length;
    return acc + count;
  }, 0);
  const projectsActive = store.projects.filter(p => p.status === 'active').length;

  const stats = [
    { label: 'Tasks Completed', value: `${tasksCompleted}/${totalTasks || tasksCompleted}`, icon: CheckSquare, color: 'text-emerald-500' },
    { label: 'Hours Tracked', value: `${hoursTracked.toFixed(1)}h`, icon: Clock, color: 'text-blue-500' },
    { label: 'Income', value: formatCurrency(income), icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Expenses', value: formatCurrency(expenses), icon: TrendingDown, color: 'text-red-500' },
    { label: 'Net Profit', value: formatCurrency(income - expenses), icon: DollarSign, color: income - expenses >= 0 ? 'text-emerald-600' : 'text-red-500' },
    { label: 'Habit Check-ins', value: String(habitsCompleted), icon: BarChart3, color: 'text-orange-500' },
  ];

  return (
    <PageShell className="lg:pb-0">
      <header className="page-block">
        <h1 className="page-title">Weekly Review</h1>
        <p className="page-subtitle">Auto-generated summary of your week</p>
      </header>

      <div className="page-block flex items-center justify-center gap-3">
        <button type="button" onClick={() => setWeekOffset(o => o - 1)} className="p-2 rounded-xl hover:bg-[var(--color-surface-muted)] transition-colors">
          <ChevronLeft className="h-5 w-5 text-[var(--color-ink-muted)]" />
        </button>
        <span className="text-sm font-medium text-[var(--color-ink)] min-w-[200px] text-center">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </span>
        <button type="button" onClick={() => setWeekOffset(o => o + 1)} className="p-2 rounded-xl hover:bg-[var(--color-surface-muted)] transition-colors">
          <ChevronRight className="h-5 w-5 text-[var(--color-ink-muted)]" />
        </button>
      </div>

      <section className="page-block grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="design-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-[var(--color-ink-muted)]">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-[var(--color-ink)]">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="page-block">
        <h2 className="section-label mb-3">Completed Tasks</h2>
        <div className="section-panel-flat">
          {store.tasks.filter(t => t.completed && t.completedAt && inWeek(t.completedAt)).length > 0 ? (
            <div className="divide-y divide-[var(--color-border-soft)]">
              {store.tasks.filter(t => t.completed && t.completedAt && inWeek(t.completedAt)).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3">
                  <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-[var(--color-ink)] line-through opacity-70">{t.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--color-ink-muted)] py-6">No tasks completed this week</p>
          )}
        </div>
      </section>

      <section className="page-block">
        <h2 className="section-label mb-3">Active Projects</h2>
        <div className="section-panel-flat">
          {store.projects.filter(p => p.status === 'active').length > 0 ? (
            <div className="divide-y divide-[var(--color-border-soft)]">
              {store.projects.filter(p => p.status === 'active').map(p => (
                <div key={p.id} className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium text-[var(--color-ink)]">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-[var(--color-surface-muted)] rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-xs text-[var(--color-ink-muted)]">{p.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--color-ink-muted)] py-6">No active projects</p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
