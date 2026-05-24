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

  const getSpent = (category: string) =>
    monthExpenses.filter(t => t.categoryDetail.toLowerCase() === category.toLowerCase()).reduce((a, t) => a + t.amount, 0);

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

      <div className="page-block">
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
          className="input-field max-w-[200px]" />
      </div>

      <section className="page-block">
        {budgets.length > 0 ? (
          <div className="space-y-3">
            {budgets.map(budget => {
              const spent = getSpent(budget.category);
              const pct = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
              const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-500' : 'bg-emerald-500';
              return (
                <div key={budget.id} className="design-card p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => { setBudgetToEdit(budget); setIsModalOpen(true); }}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{budget.category}</p>
                    <span className={cn('text-xs font-medium', pct > 90 ? 'text-red-500' : pct > 70 ? 'text-orange-500' : 'text-emerald-600')}>
                      {formatCurrency(spent)} / {formatCurrency(budget.monthlyLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-muted)] rounded-full h-2">
                    <div className={cn('h-2 rounded-full transition-all', barColor)} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="section-panel-flat">
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
