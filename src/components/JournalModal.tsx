import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { JournalEntry } from '../types';
import { SidePanel } from './SidePanel';
import { cn } from '../lib/utils';

interface JournalModalProps { isOpen: boolean; onClose: () => void; date: string; entryToEdit?: JournalEntry | null; }

export function JournalModal({ isOpen, onClose, date, entryToEdit = null }: JournalModalProps) {
  const store = useStore();
  const [morningPlan, setMorningPlan] = useState('');
  const [eveningReflection, setEveningReflection] = useState('');
  const [mood, setMood] = useState(3);
  const [winsText, setWinsText] = useState('');
  const [challengesText, setChallengesText] = useState('');

  useEffect(() => {
    if (entryToEdit) {
      setMorningPlan(entryToEdit.morningPlan || '');
      setEveningReflection(entryToEdit.eveningReflection || '');
      setMood(entryToEdit.mood || 3);
      setWinsText((entryToEdit.wins || []).join('\n'));
      setChallengesText((entryToEdit.challenges || []).join('\n'));
    } else { setMorningPlan(''); setEveningReflection(''); setMood(3); setWinsText(''); setChallengesText(''); }
  }, [entryToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wins = winsText.split('\n').map(w => w.trim()).filter(Boolean);
    const challenges = challengesText.split('\n').map(c => c.trim()).filter(Boolean);
    const now = new Date().toISOString();
    if (entryToEdit) {
      store.updateJournalEntry(entryToEdit.id, { morningPlan, eveningReflection, mood, wins, challenges });
    } else {
      store.addJournalEntry({ id: Math.random().toString(36).substring(2, 11), date, morningPlan, eveningReflection, mood, wins, challenges, createdAt: now, updatedAt: now });
    }
    onClose();
  };

  const MOODS = ['😞', '😕', '😐', '🙂', '😄'];

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title={entryToEdit ? 'Edit Entry' : 'New Journal Entry'} subtitle={date}
      footer={<div className="flex justify-between items-center">
        {entryToEdit ? (<button type="button" onClick={() => { store.deleteJournalEntry(entryToEdit.id); onClose(); }}
          className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>) : <div />}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="journal-form" className="btn-primary">Save</button>
        </div>
      </div>}>
      <form id="journal-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="form-label">How are you feeling?</label>
          <div className="flex gap-2">
            {MOODS.map((emoji, i) => (
              <button key={i} type="button" onClick={() => setMood(i + 1)}
                className={cn('h-10 w-10 rounded-xl text-xl flex items-center justify-center transition-all',
                  mood === i + 1 ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-110' : 'bg-[var(--color-surface-muted)]')}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div><label className="form-label">☀️ Morning Plan</label>
          <textarea value={morningPlan} onChange={(e) => setMorningPlan(e.target.value)} className="input-field resize-vertical" placeholder="What will you focus on today?" rows={3} /></div>
        <div><label className="form-label">🌙 Evening Reflection</label>
          <textarea value={eveningReflection} onChange={(e) => setEveningReflection(e.target.value)} className="input-field resize-vertical" placeholder="How did today go?" rows={3} /></div>
        <div><label className="form-label">🏆 Wins (one per line)</label>
          <textarea value={winsText} onChange={(e) => setWinsText(e.target.value)} className="input-field resize-vertical" placeholder="What went well?" rows={2} /></div>
        <div><label className="form-label">💪 Challenges (one per line)</label>
          <textarea value={challengesText} onChange={(e) => setChallengesText(e.target.value)} className="input-field resize-vertical" placeholder="What was tough?" rows={2} /></div>
      </form>
    </SidePanel>
  );
}
