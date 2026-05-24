import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn, formatCurrency } from '../lib/utils';
import { Plus, Target, TrendingUp } from 'lucide-react';
import { Goal } from '../types';
import { GoalModal } from '../components/GoalModal';
import { PageShell } from '../components/layout/PageShell';

export function Goals() {
  const store = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const goals = store.goals;

  const getProgress = (goal: Goal) => {
    if (goal.category === 'savings') {
      const income = store.transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
      const expense = store.transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
      const saved = income - expense;
      return Math.min(100, Math.max(0, (saved / goal.targetAmount) * 100));
    }
    if (goal.category === 'income') {
      const income = store.transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
      return Math.min(100, Math.max(0, (income / goal.targetAmount) * 100));
    }
    if (goal.category === 'expense-limit') {
      const expense = store.transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
      return Math.min(100, Math.max(0, (expense / goal.targetAmount) * 100));
    }
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  return (
    <PageShell className="lg:pb-0">
      <header className="page-block flex flex-row justify-between items-center gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle hidden sm:block">Track your financial targets</p>
        </div>
        <button type="button" onClick={() => { setGoalToEdit(null); setIsModalOpen(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /><span>New Goal</span>
        </button>
      </header>

      <section className="page-block">
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {goals.map(goal => {
              const progress = getProgress(goal);
              const isOverBudget = goal.category === 'expense-limit' && progress > 100;
              const isSavings = goal.category === 'savings';
              const isIncome = goal.category === 'income';
              const isExpenseLimit = goal.category === 'expense-limit';
              
              const cardBg = isIncome 
                ? 'from-emerald-500/5 via-transparent to-transparent border-emerald-500/10' 
                : isExpenseLimit
                  ? 'from-rose-500/5 via-transparent to-transparent border-rose-500/10'
                  : 'from-blue-500/5 via-transparent to-transparent border-blue-500/10';
              
              const barColor = progress >= 100 
                ? 'bg-emerald-500' 
                : isOverBudget 
                  ? 'bg-red-500' 
                  : isIncome 
                    ? 'bg-emerald-500' 
                    : isExpenseLimit 
                      ? 'bg-orange-500' 
                      : 'bg-indigo-500';

              const badgeColor = progress >= 100 
                ? 'status-badge-success' 
                : isOverBudget 
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400' 
                  : isIncome 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                    : isExpenseLimit 
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';

              return (
                <div key={goal.id}
                  className={cn(
                    "design-card p-5 cursor-pointer hover:shadow-md transition-all relative overflow-hidden bg-gradient-to-br border flex flex-col justify-between group",
                    cardBg
                  )}
                  onClick={() => { setGoalToEdit(goal); setIsModalOpen(true); }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-base font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">{goal.title}</p>
                        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 capitalize">{goal.category.replace('-', ' ')} Goal</p>
                      </div>
                      <span className={cn('status-badge text-[10px] font-semibold uppercase px-2 py-0.5', badgeColor)}>
                        {Math.round(progress)}%
                      </span>
                    </div>

                    <div className="w-full bg-[var(--color-surface-muted)] rounded-full h-2 mb-4">
                      <div className={cn('h-2 rounded-full transition-all duration-300', barColor)} style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--color-border-soft)] flex justify-between items-center mt-auto text-xs text-[var(--color-ink-muted)]">
                    <span className="font-medium">Target: <strong className="text-[var(--color-ink)]">{formatCurrency(goal.targetAmount)}</strong></span>
                    {goal.deadline && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 shrink-0" />
                        Due {goal.deadline}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="section-panel-flat">
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <Target className="h-10 w-10 text-[var(--color-ink-muted)] mb-2 opacity-40" />
              <p className="text-sm font-medium text-[var(--color-ink)]">No goals yet</p>
              <p className="page-subtitle mt-1">Set financial targets to track.</p>
            </div>
          </div>
        )}
      </section>

      <GoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} goalToEdit={goalToEdit} />
      <button type="button" onClick={() => { setGoalToEdit(null); setIsModalOpen(true); }}
        className="sm:hidden fixed bottom-[5.25rem] right-5 h-14 w-14 flex items-center justify-center fab-mobile z-40" aria-label="Add goal">
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
    </PageShell>
  );
}
