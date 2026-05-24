import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { Plus, Flame, Check, Zap } from 'lucide-react';
import { Habit } from '../types';
import { HabitModal } from '../components/HabitModal';
import { PageShell } from '../components/layout/PageShell';

function getStreak(dates: string[]): number {
  if (!dates || dates.length === 0) return 0;
  const sorted = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 365; i++) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (sorted.includes(dateStr)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else if (i === 0) {
      checkDate = subDays(checkDate, 1);
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function Habits() {
  const store = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const today = format(new Date(), 'yyyy-MM-dd');
  const habits = store.habits.filter(h => filter === 'all' ? true : h.active);
  const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });

  const completedToday = habits.filter(h => (h.completedDates || []).includes(today)).length;

  return (
    <PageShell className="lg:pb-0">
      <header className="page-block flex flex-row justify-between items-center gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Habits</h1>
          <p className="page-subtitle hidden sm:block">Build consistency, one day at a time</p>
        </div>
        <button
          type="button"
          onClick={() => { setHabitToEdit(null); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          <span>New Habit</span>
        </button>
      </header>

      <div className="page-block grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="design-card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-ink)]">{habits.length}</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">Total Habits</p>
        </div>
        <div className="design-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{completedToday}</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">Done Today</p>
        </div>
        <div className="design-card p-4 text-center hidden sm:block">
          <p className="text-2xl font-bold text-orange-500">
            {habits.length > 0 ? Math.max(...habits.map(h => getStreak(h.completedDates || []))) : 0}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">Best Streak</p>
        </div>
      </div>

      <section className="page-block">
        <h2 className="section-label mb-3">Your Habits</h2>
        <div className="section-panel-flat">
          {habits.length > 0 ? (
            <div className="divide-y divide-[var(--color-border-soft)]">
              {habits.map(habit => {
                const isCompletedToday = (habit.completedDates || []).includes(today);
                const streak = getStreak(habit.completedDates || []);
                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 p-4 hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
                    onClick={() => { setHabitToEdit(habit); setIsModalOpen(true); }}
                  >
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); store.toggleHabitDate(habit.id, today); }}
                      className={cn(
                        'h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all text-lg',
                        isCompletedToday
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'border-2 border-[var(--color-border-subtle)] hover:border-emerald-400'
                      )}
                    >
                      {isCompletedToday ? <Check className="h-4 w-4" /> : <span>{habit.icon || '✨'}</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', isCompletedToday ? 'text-[var(--color-ink-muted)] line-through' : 'text-[var(--color-ink)]')}>
                        {habit.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {streak > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-medium">
                            <Flame className="h-3 w-3" /> {streak}d streak
                          </span>
                        )}
                        <div className="flex items-center gap-0.5">
                          {last7Days.map(day => {
                            const dayStr = format(day, 'yyyy-MM-dd');
                            const done = (habit.completedDates || []).includes(dayStr);
                            return (
                              <div
                                key={dayStr}
                                className={cn(
                                  'h-2.5 w-2.5 rounded-full',
                                  done ? 'bg-emerald-500' : 'bg-[var(--color-surface-muted)]'
                                )}
                                title={format(day, 'MMM d')}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <Zap className="h-10 w-10 text-[var(--color-ink-muted)] mb-2 opacity-40" />
              <p className="text-sm font-medium text-[var(--color-ink)]">No habits yet</p>
              <p className="page-subtitle mt-1">Start building daily routines.</p>
            </div>
          )}
        </div>
      </section>

      <HabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} habitToEdit={habitToEdit} />

      <button
        type="button"
        onClick={() => { setHabitToEdit(null); setIsModalOpen(true); }}
        className="sm:hidden fixed bottom-[5.25rem] right-5 h-14 w-14 flex items-center justify-center fab-mobile z-40"
        aria-label="Add habit"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
    </PageShell>
  );
}
