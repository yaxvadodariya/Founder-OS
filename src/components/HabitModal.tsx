import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Habit } from '../types';
import { SidePanel } from './SidePanel';

const EMOJI_OPTIONS = ['💪', '📚', '🏃', '🧘', '💤', '💧', '🍎', '✍️', '🎯', '🧠', '☀️', '🎶'];

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit | null;
}

export function HabitModal({ isOpen, onClose, habitToEdit = null }: HabitModalProps) {
  const store = useStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💪');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setIcon(habitToEdit.icon || '💪');
      setFrequency(habitToEdit.frequency || 'daily');
    } else {
      setName('');
      setIcon('💪');
      setFrequency('daily');
    }
  }, [habitToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (habitToEdit) {
      store.updateHabit(habitToEdit.id, { name, icon, frequency });
    } else {
      store.addHabit({
        id: Math.random().toString(36).substring(2, 11),
        name,
        icon,
        color: '#10B981',
        frequency,
        completedDates: [],
        createdAt: new Date().toISOString(),
        active: true,
      });
    }
    onClose();
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={habitToEdit ? 'Edit Habit' : 'New Habit'}
      subtitle={habitToEdit ? 'Update your habit' : 'Build a new daily routine'}
      footer={
        <div className="flex justify-between items-center">
          {habitToEdit ? (
            <button type="button" onClick={() => { store.deleteHabit(habitToEdit.id); onClose(); }}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" form="habit-form" className="btn-primary">Save Habit</button>
          </div>
        </div>
      }
    >
      <form id="habit-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="form-label">Habit Name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="input-field" placeholder="e.g. Read for 30 minutes" />
        </div>
        <div>
          <label className="form-label">Icon</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(emoji => (
              <button key={emoji} type="button" onClick={() => setIcon(emoji)}
                className={`h-10 w-10 rounded-xl text-lg flex items-center justify-center transition-all ${icon === emoji ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500' : 'bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-hover)]'}`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="input-field">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </form>
    </SidePanel>
  );
}
