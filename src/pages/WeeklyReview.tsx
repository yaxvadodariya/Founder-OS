import React from 'react';
import { useStore } from '../store/useStore';
import { cn, formatCurrency } from '../lib/utils';
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

      <section className="page-block grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(stat => {
          const isIncome = stat.label === 'Income';
          const isExpenses = stat.label === 'Expenses';
          const isProfit = stat.label === 'Net Profit';
          
          let gradient = 'from-indigo-500/5 to-transparent border-indigo-500/10';
          if (isIncome || (isProfit && income - expenses >= 0)) {
            gradient = 'from-emerald-500/5 to-transparent border-emerald-500/10';
          } else if (isExpenses || (isProfit && income - expenses < 0)) {
            gradient = 'from-rose-500/5 to-transparent border-rose-500/10';
          } else if (stat.label === 'Habit Check-ins') {
            gradient = 'from-orange-500/5 to-transparent border-orange-500/10';
          }

          return (
            <div key={stat.label} className={cn("design-card p-5 relative overflow-hidden bg-gradient-to-br border flex flex-col justify-between", gradient)}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={cn("h-4 w-4 shrink-0", stat.color)} />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-ink)] mt-2">{stat.value}</p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 page-block">
        <section className="flex flex-col">
          <h2 className="section-label mb-3">Completed Tasks</h2>
          <div className="design-card p-5 flex-1 overflow-hidden">
            {store.tasks.filter(t => t.completed && t.completedAt && inWeek(t.completedAt)).length > 0 ? (
              <div className="divide-y divide-[var(--color-border-soft)] max-h-[300px] overflow-y-auto pr-1">
                {store.tasks.filter(t => t.completed && t.completedAt && inWeek(t.completedAt)).map(t => (
                  <div key={t.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-[var(--color-ink-secondary)] line-through opacity-85 leading-snug">{t.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <CheckSquare className="h-8 w-8 text-[var(--color-ink-muted)] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[var(--color-ink-muted)]">No tasks completed this week</p>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col">
          <h2 className="section-label mb-3">Active Projects Progress</h2>
          <div className="design-card p-5 flex-1 overflow-hidden">
            {store.projects.filter(p => p.status === 'active').length > 0 ? (
              <div className="divide-y divide-[var(--color-border-soft)] max-h-[300px] overflow-y-auto pr-1">
                {store.projects.filter(p => p.status === 'active').map(p => (
                  <div key={p.id} className="flex flex-col py-3.5 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-[var(--color-ink)] truncate max-w-[200px]">{p.name}</span>
                      <span className="text-xs text-[var(--color-ink-muted)] tabular-nums">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-muted)] rounded-full h-2">
                      <div className="h-2 rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <BarChart3 className="h-8 w-8 text-[var(--color-ink-muted)] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[var(--color-ink-muted)]">No active projects</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
