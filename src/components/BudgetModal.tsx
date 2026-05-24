import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Budget } from '../types';
import { SidePanel } from './SidePanel';
import { format } from 'date-fns';

interface BudgetModalProps { isOpen: boolean; onClose: () => void; budgetToEdit?: Budget | null; defaultMonth?: string; }

export function BudgetModal({ isOpen, onClose, budgetToEdit = null, defaultMonth }: BudgetModalProps) {
  const store = useStore();
  const [category, setCategory] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [month, setMonth] = useState(defaultMonth || format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    if (budgetToEdit) { setCategory(budgetToEdit.category); setMonthlyLimit(String(budgetToEdit.monthlyLimit)); setMonth(budgetToEdit.month); }
    else { setCategory(''); setMonthlyLimit(''); setMonth(defaultMonth || format(new Date(), 'yyyy-MM')); }
  }, [budgetToEdit, isOpen, defaultMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !monthlyLimit) return;
    if (budgetToEdit) {
      store.updateBudget(budgetToEdit.id, { category, monthlyLimit: Number(monthlyLimit), month });
    } else {
      store.addBudget({ id: Math.random().toString(36).substring(2, 11), category, monthlyLimit: Number(monthlyLimit), month, createdAt: new Date().toISOString() });
    }
    onClose();
  };

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title={budgetToEdit ? 'Edit Budget' : 'New Budget'} subtitle="Set a monthly spending limit"
      footer={<div className="flex justify-between items-center">
        {budgetToEdit ? (<button type="button" onClick={() => { store.deleteBudget(budgetToEdit.id); onClose(); }}
          className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>) : <div />}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="budget-form" className="btn-primary">Save</button>
        </div>
      </div>}>
      <form id="budget-form" onSubmit={handleSubmit} className="space-y-5">
        <div><label className="form-label">Category *</label>
          <input type="text" required value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" placeholder="e.g. Food, Rent, Subscriptions" /></div>
        <div><label className="form-label">Monthly Limit *</label>
          <input type="number" required value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} className="input-field" placeholder="5000" /></div>
        <div><label className="form-label">Month</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input-field" /></div>
      </form>
    </SidePanel>
  );
}
