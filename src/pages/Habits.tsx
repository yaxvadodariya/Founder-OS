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

      <div className="page-block grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="design-card p-5 relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/10 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">Total Habits</p>
            <p className="text-3xl font-bold text-[var(--color-ink)] mt-2">{habits.length}</p>
          </div>
          <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div className="design-card p-5 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">Done Today</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{completedToday}</p>
          </div>
          <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Check className="h-4 w-4" />
          </div>
        </div>
        <div className="design-card p-5 relative overflow-hidden bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/10 flex flex-col justify-between hidden sm:flex">
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">Best Streak</p>
            <p className="text-3xl font-bold text-orange-500 mt-2">
              {habits.length > 0 ? Math.max(...habits.map(h => getStreak(h.completedDates || []))) : 0}
            </p>
          </div>
          <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Flame className="h-4 w-4" />
          </div>
        </div>
      </div>

      <section className="page-block">
        <h2 className="section-label mb-3">Your Habits</h2>
        {habits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {habits.map(habit => {
              const isCompletedToday = (habit.completedDates || []).includes(today);
              const streak = getStreak(habit.completedDates || []);
              
              return (
                <div
                  key={habit.id}
                  className="design-card p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  onClick={() => { setHabitToEdit(habit); setIsModalOpen(true); }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); store.toggleHabitDate(habit.id, today); }}
                        className={cn(
                          'h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-all text-base border',
                          isCompletedToday
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                            : 'bg-[var(--color-surface-muted)] border-[var(--color-border-subtle)] hover:border-emerald-400 text-lg'
                        )}
                      >
                        {isCompletedToday ? <Check className="h-4 w-4" /> : <span>{habit.icon || '✨'}</span>}
                      </button>
                      <div>
                        <p className={cn('text-sm font-semibold transition-colors', isCompletedToday ? 'text-[var(--color-ink-muted)] line-through' : 'text-[var(--color-ink)] group-hover:text-[var(--color-accent)]')}>
                          {habit.name}
                        </p>
                        {streak > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-semibold mt-0.5">
                            <Flame className="h-3.5 w-3.5" /> {streak}d streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border-soft)]">
                    <p className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider font-semibold mb-2">Last 7 Days Consistency</p>
                    <div className="flex justify-between items-center gap-1 bg-[var(--color-surface-muted)] p-2 rounded-xl border border-[var(--color-border-subtle)]">
                      {last7Days.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const done = (habit.completedDates || []).includes(dayStr);
                        const isDayToday = isSameDay(day, new Date());
                        
                        return (
                          <div
                            key={dayStr}
                            className="flex flex-col items-center gap-1 flex-1"
                            title={format(day, 'EEEE, MMM d')}
                          >
                            <span className={cn('text-[9px] font-medium uppercase', isDayToday ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-ink-muted)]')}>
                              {format(day, 'eee').charAt(0)}
                            </span>
                            <div
                              className={cn(
                                'h-5 w-5 rounded-full flex items-center justify-center transition-all',
                                done 
                                  ? 'bg-emerald-500 text-white shadow-sm' 
                                  : 'bg-[var(--color-surface)] border border-[var(--color-border-subtle)]'
                              )}
                            >
                              {done && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="design-card">
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <Zap className="h-10 w-10 text-[var(--color-ink-muted)] mb-2 opacity-40" />
              <p className="text-sm font-medium text-[var(--color-ink)]">No habits yet</p>
              <p className="page-subtitle mt-1">Start building daily routines.</p>
            </div>
          </div>
        )}
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
