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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map(goal => {
              const progress = getProgress(goal);
              const isOverBudget = goal.category === 'expense-limit' && progress > 100;
              return (
                <div key={goal.id}
                  className="design-card p-5 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => { setGoalToEdit(goal); setIsModalOpen(true); }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{goal.title}</p>
                      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 capitalize">{goal.category.replace('-', ' ')}</p>
                    </div>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      progress >= 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      isOverBudget ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    )}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-muted)] rounded-full h-2 mb-2">
                    <div className={cn('h-2 rounded-full transition-all',
                      progress >= 100 ? 'bg-emerald-500' : isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                    )} style={{ width: `${Math.min(100, progress)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-ink-muted)]">
                    <span>Target: {formatCurrency(goal.targetAmount)}</span>
                    {goal.deadline && <span>Due: {goal.deadline}</span>}
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
