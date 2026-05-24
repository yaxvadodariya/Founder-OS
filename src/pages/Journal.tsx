import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { format, subDays, addDays } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Smile, Frown, Meh, BookOpen } from 'lucide-react';
import { JournalEntry } from '../types';
import { JournalModal } from '../components/JournalModal';
import { PageShell } from '../components/layout/PageShell';

const MOOD_ICONS = [Frown, Frown, Meh, Smile, Smile];
const MOOD_LABELS = ['Awful', 'Bad', 'Okay', 'Good', 'Great'];
const MOOD_COLORS = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-emerald-500', 'text-emerald-600'];

export function Journal() {
  const store = useStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayEntry = store.journalEntries.find(j => j.date === selectedDate);
  const recentEntries = store.journalEntries.slice(0, 7);

  return (
    <PageShell className="lg:pb-0">
      <header className="page-block flex flex-row justify-between items-center gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Journal</h1>
          <p className="page-subtitle hidden sm:block">Daily reflections and planning</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" /><span>{todayEntry ? 'Edit Today' : 'Write Today'}</span>
        </button>
      </header>

      <div className="page-block flex items-center justify-center gap-3">
        <button type="button" onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
          className="p-2 rounded-xl hover:bg-[var(--color-surface-muted)] transition-colors">
          <ChevronLeft className="h-5 w-5 text-[var(--color-ink-muted)]" />
        </button>
        <span className="text-sm font-medium text-[var(--color-ink)] min-w-[140px] text-center">
          {format(new Date(selectedDate), 'EEEE, MMM d')}
        </span>
        <button type="button" onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
          className="p-2 rounded-xl hover:bg-[var(--color-surface-muted)] transition-colors">
          <ChevronRight className="h-5 w-5 text-[var(--color-ink-muted)]" />
        </button>
      </div>

      {todayEntry ? (
        <section className="page-block space-y-6">
          {todayEntry.mood > 0 && (
            <div className="design-card p-5 flex items-center gap-4 bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
                {React.createElement(MOOD_ICONS[todayEntry.mood - 1], { className: cn('h-5 w-5', MOOD_COLORS[todayEntry.mood - 1]) })}
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider font-semibold">Mood Status</p>
                <p className="text-sm font-semibold text-[var(--color-ink)] mt-0.5">{MOOD_LABELS[todayEntry.mood - 1]}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {todayEntry.morningPlan && (
              <div className="design-card p-5 relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10 flex flex-col">
                <h3 className="text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1">
                  <span>☀️</span> Morning Plan
                </h3>
                <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed flex-1">{todayEntry.morningPlan}</p>
              </div>
            )}
            
            {todayEntry.eveningReflection && (
              <div className="design-card p-5 relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/10 flex flex-col">
                <h3 className="text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1">
                  <span>🌙</span> Evening Reflection
                </h3>
                <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed flex-1">{todayEntry.eveningReflection}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {todayEntry.wins && todayEntry.wins.length > 0 && (
              <div className="design-card p-5">
                <h3 className="text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1 border-b border-[var(--color-border-soft)] pb-2">
                  <span>🏆</span> Wins & Achievements
                </h3>
                <ul className="space-y-2">
                  {todayEntry.wins.map((w, i) => (
                    <li key={i} className="text-sm text-[var(--color-ink)] flex items-start gap-2">
                      <span className="text-emerald-500 font-bold select-none mt-0.5">✓</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {todayEntry.challenges && todayEntry.challenges.length > 0 && (
              <div className="design-card p-5">
                <h3 className="text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1 border-b border-[var(--color-border-soft)] pb-2">
                  <span>💪</span> Challenges & Learnings
                </h3>
                <ul className="space-y-2">
                  {todayEntry.challenges.map((c, i) => (
                    <li key={i} className="text-sm text-[var(--color-ink)] flex items-start gap-2">
                      <span className="text-orange-500 font-bold select-none mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="page-block">
          <div className="section-panel-flat">
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <BookOpen className="h-10 w-10 text-[var(--color-ink-muted)] mb-2 opacity-40" />
              <p className="text-sm font-medium text-[var(--color-ink)]">No entry for this day</p>
              <p className="page-subtitle mt-1">Start writing your daily reflection.</p>
            </div>
          </div>
        </section>
      )}

      <JournalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} date={selectedDate} entryToEdit={todayEntry || null} />
    </PageShell>
  );
}
