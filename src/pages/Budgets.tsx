import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn, formatCurrency } from '../lib/utils';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Plus, PieChart } from 'lucide-react';
import { Budget } from '../types';
import { BudgetModal } from '../components/BudgetModal';
import { PageShell } from '../components/layout/PageShell';

export function Budgets() {
  const store = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
  const monthEnd = endOfMonth(new Date(selectedMonth + '-01'));

  const monthExpenses = store.transactions.filter(t =>
    t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
  );

  const budgets = store.budgets.filter(b => b.month === selectedMonth);

  const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + getSpent(b.category), 0);
  const totalRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);
  const overallPct = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

  return (
    <PageShell className="lg:pb-0">
      <header className="page-block flex flex-row justify-between items-center gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle hidden sm:block">Monthly spending limits by category</p>
        </div>
        <button type="button" onClick={() => { setBudgetToEdit(null); setIsModalOpen(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /><span>New Budget</span>
        </button>
      </header>

      <div className="page-block flex flex-wrap items-center justify-between gap-4">
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
          className="input-field max-w-[200px]" />
        
        {budgets.length > 0 && (
          <div className="flex-1 min-w-[250px] max-w-md bg-[var(--color-surface-muted)] px-4 py-2.5 rounded-xl border border-[var(--color-border-subtle)]">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-[var(--color-ink-secondary)]">Overall Month Progress</span>
              <span className="text-[var(--color-ink)]">{Math.round(overallPct)}% Spent</span>
            </div>
            <div className="w-full bg-[var(--color-border-subtle)] rounded-full h-2">
              <div 
                className={cn('h-2 rounded-full transition-all duration-300', overallPct > 90 ? 'bg-red-500' : overallPct > 70 ? 'bg-orange-500' : 'bg-indigo-500')} 
                style={{ width: `${Math.min(100, overallPct)}%` }} 
              />
            </div>
          </div>
        )}
      </div>

      {budgets.length > 0 && (
        <section className="page-block grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="design-card p-4 relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/10">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">Total Limit</p>
            <p className="text-xl font-bold text-[var(--color-ink)] mt-1.5">{formatCurrency(totalBudgetLimit)}</p>
          </div>
          <div className="design-card p-4 relative overflow-hidden bg-gradient-to-br from-rose-500/5 to-transparent border border-rose-500/10">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">Total Spent</p>
            <p className="text-xl font-bold text-rose-600 mt-1.5">{formatCurrency(totalBudgetSpent)}</p>
          </div>
          <div className="design-card p-4 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">Remaining</p>
            <p className="text-xl font-bold text-emerald-600 mt-1.5">{formatCurrency(totalRemaining)}</p>
          </div>
        </section>
      )}

      <section className="page-block">
        <h2 className="section-label mb-3">Category Breakdown</h2>
        {budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map(budget => {
               const spent = getSpent(budget.category);
               const pct = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
               const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-500' : 'bg-emerald-500';
               const textClass = pct > 90 ? 'text-red-500 font-semibold' : pct > 70 ? 'text-orange-500 font-medium' : 'text-[var(--color-ink-secondary)]';
               
               return (
                 <div key={budget.id} className="design-card p-5 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
                   onClick={() => { setBudgetToEdit(budget); setIsModalOpen(true); }}>
                   <div className="flex justify-between items-start mb-3">
                     <div>
                       <p className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">{budget.category}</p>
                       <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{Math.round(pct)}% of limit consumed</p>
                     </div>
                     <span className={cn('text-xs tabular-nums', textClass)}>
                       {formatCurrency(spent)} / {formatCurrency(budget.monthlyLimit)}
                     </span>
                   </div>
                   <div className="w-full bg-[var(--color-surface-muted)] rounded-full h-2">
                     <div className={cn('h-2 rounded-full transition-all duration-300', barColor)} style={{ width: `${Math.min(100, pct)}%` }} />
                   </div>
                 </div>
               );
            })}
          </div>
        ) : (
          <div className="design-card">
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <PieChart className="h-10 w-10 text-[var(--color-ink-muted)] mb-2 opacity-40" />
              <p className="text-sm font-medium text-[var(--color-ink)]">No budgets for this month</p>
              <p className="page-subtitle mt-1">Set spending limits per category.</p>
            </div>
          </div>
        )}
      </section>

      <BudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} budgetToEdit={budgetToEdit} defaultMonth={selectedMonth} />
      <button type="button" onClick={() => { setBudgetToEdit(null); setIsModalOpen(true); }}
        className="sm:hidden fixed bottom-[5.25rem] right-5 h-14 w-14 flex items-center justify-center fab-mobile z-40" aria-label="Add budget">
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
    </PageShell>
  );
}
