import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Goal } from '../types';
import { SidePanel } from './SidePanel';
import { format } from 'date-fns';

interface GoalModalProps { isOpen: boolean; onClose: () => void; goalToEdit?: Goal | null; }

export function GoalModal({ isOpen, onClose, goalToEdit = null }: GoalModalProps) {
  const store = useStore();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState<'savings' | 'income' | 'expense-limit'>('savings');

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title); setTargetAmount(String(goalToEdit.targetAmount));
      setDeadline(goalToEdit.deadline || format(new Date(), 'yyyy-MM-dd'));
      setCategory(goalToEdit.category);
    } else { setTitle(''); setTargetAmount(''); setDeadline(format(new Date(), 'yyyy-MM-dd')); setCategory('savings'); }
  }, [goalToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;
    if (goalToEdit) {
      store.updateGoal(goalToEdit.id, { title, targetAmount: Number(targetAmount), deadline, category });
    } else {
      store.addGoal({ id: Math.random().toString(36).substring(2, 11), title, targetAmount: Number(targetAmount), currentAmount: 0, deadline, category, createdAt: new Date().toISOString() });
    }
    onClose();
  };

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title={goalToEdit ? 'Edit Goal' : 'New Goal'}
      subtitle={goalToEdit ? 'Update goal details' : 'Set a financial target'}
      footer={
        <div className="flex justify-between items-center">
          {goalToEdit ? (<button type="button" onClick={() => { store.deleteGoal(goalToEdit.id); onClose(); }}
            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" form="goal-form" className="btn-primary">Save Goal</button>
          </div>
        </div>
      }>
      <form id="goal-form" onSubmit={handleSubmit} className="space-y-5">
        <div><label className="form-label">Title *</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Save ₹1L this quarter" /></div>
        <div><label className="form-label">Target Amount *</label>
          <input type="number" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="input-field" placeholder="100000" /></div>
        <div><label className="form-label">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="input-field">
            <option value="savings">Savings Goal</option><option value="income">Income Target</option><option value="expense-limit">Expense Limit</option>
          </select></div>
        <div><label className="form-label">Deadline</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input-field" /></div>
      </form>
    </SidePanel>
  );
}
