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
        <section className="page-block space-y-4">
          {todayEntry.mood > 0 && (
            <div className="design-card p-4 flex items-center gap-3">
              {React.createElement(MOOD_ICONS[todayEntry.mood - 1], { className: cn('h-6 w-6', MOOD_COLORS[todayEntry.mood - 1]) })}
              <span className="text-sm font-medium text-[var(--color-ink)]">Mood: {MOOD_LABELS[todayEntry.mood - 1]}</span>
            </div>
          )}
          {todayEntry.morningPlan && (
            <div className="design-card p-5">
              <h3 className="section-label mb-2">☀️ Morning Plan</h3>
              <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{todayEntry.morningPlan}</p>
            </div>
          )}
          {todayEntry.eveningReflection && (
            <div className="design-card p-5">
              <h3 className="section-label mb-2">🌙 Evening Reflection</h3>
              <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{todayEntry.eveningReflection}</p>
            </div>
          )}
          {todayEntry.wins && todayEntry.wins.length > 0 && (
            <div className="design-card p-5">
              <h3 className="section-label mb-2">🏆 Wins</h3>
              <ul className="space-y-1">{todayEntry.wins.map((w, i) => <li key={i} className="text-sm text-[var(--color-ink)]">• {w}</li>)}</ul>
            </div>
          )}
          {todayEntry.challenges && todayEntry.challenges.length > 0 && (
            <div className="design-card p-5">
              <h3 className="section-label mb-2">💪 Challenges</h3>
              <ul className="space-y-1">{todayEntry.challenges.map((c, i) => <li key={i} className="text-sm text-[var(--color-ink)]">• {c}</li>)}</ul>
            </div>
          )}
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
