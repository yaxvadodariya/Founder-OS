import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn, formatCurrency } from '../lib/utils';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Plus, PieChart, TrendingUp, AlertTriangle, CheckCircle2, Pencil } from 'lucide-react';
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

  const getSpent = (category: string) =>
    monthExpenses.filter(t => t.categoryDetail === category).reduce((acc, t) => acc + t.amount, 0);

  const budgets = store.budgets.filter(b => b.month === selectedMonth);

  const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + getSpent(b.category), 0);
  const totalRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);
  const overallPct = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

  const getStatusInfo = (pct: number) => {
    if (pct > 90) return { label: 'Over limit', color: 'text-red-500', bg: 'bg-red-500', badge: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertTriangle };
    if (pct > 70) return { label: 'Warning', color: 'text-orange-500', bg: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: TrendingUp };
    return { label: 'On track', color: 'text-emerald-500', bg: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 };
  };

  return (
    <PageShell className="lg:pb-0">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Monthly spending limits by category</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field text-sm"
          />
          <button type="button" onClick={() => { setBudgetToEdit(null); setIsModalOpen(true); }} className="btn-primary">
            <Plus className="h-4 w-4" /><span>New Budget</span>
          </button>
        </div>
      </header>

      {budgets.length > 0 ? (
        <>
          {/* Summary Section */}
          <section className="section-panel">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              {/* Overall progress - takes more space */}
              <div className="lg:col-span-2 design-card p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[var(--color-ink)]">Monthly Overview</h2>
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border',
                    overallPct > 90 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    overallPct > 70 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  )}>
                    {Math.round(overallPct)}% used
                  </span>
                </div>
                
                {/* Circular-style progress visualization */}
                <div className="flex items-center gap-5">
                  <div className="relative h-20 w-20 shrink-0">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-border-subtle)" strokeWidth="8" />
                      <circle
                        cx="40" cy="40" r="34" fill="none"
                        stroke={overallPct > 90 ? '#ef4444' : overallPct > 70 ? '#f97316' : '#6366f1'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min(100, overallPct) * 2.136} 213.6`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-[var(--color-ink)]">{Math.round(overallPct)}%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-ink-muted)]">Spent</span>
                      <span className="font-semibold text-[var(--color-ink)]">{formatCurrency(totalBudgetSpent)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-ink-muted)]">Remaining</span>
                      <span className="font-semibold text-emerald-500">{formatCurrency(totalRemaining)}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-[var(--color-border-soft)]">
                      <span className="text-[var(--color-ink-muted)]">Total Budget</span>
                      <span className="font-semibold text-[var(--color-ink)]">{formatCurrency(totalBudgetLimit)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div className="design-card p-5 flex flex-col justify-between bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/10">
                <p className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">Total Limit</p>
                <p className="text-2xl font-bold text-[var(--color-ink)] mt-2">{formatCurrency(totalBudgetLimit)}</p>
                <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">{budgets.length} {budgets.length === 1 ? 'category' : 'categories'} tracked</p>
              </div>
              <div className="design-card p-5 flex flex-col justify-between bg-gradient-to-br from-rose-500/5 to-transparent border border-rose-500/10">
                <p className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">Total Spent</p>
                <p className="text-2xl font-bold text-rose-500 mt-2">{formatCurrency(totalBudgetSpent)}</p>
                <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">{formatCurrency(totalRemaining)} remaining</p>
              </div>
            </div>
          </section>

          {/* Category Breakdown */}
          <section className="section-panel">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-label">Category Breakdown</h2>
              <span className="text-xs text-[var(--color-ink-muted)]">{budgets.length} {budgets.length === 1 ? 'budget' : 'budgets'}</span>
            </div>
            <div className="space-y-3">
              {budgets
                .map(budget => ({ budget, spent: getSpent(budget.category), pct: budget.monthlyLimit > 0 ? (getSpent(budget.category) / budget.monthlyLimit) * 100 : 0 }))
                .sort((a, b) => b.pct - a.pct)
                .map(({ budget, spent, pct }) => {
                  const status = getStatusInfo(pct);
                  const StatusIcon = status.icon;
                  const remaining = Math.max(0, budget.monthlyLimit - spent);

                  return (
                    <div
                      key={budget.id}
                      className="design-card p-4 sm:p-5 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                      onClick={() => { setBudgetToEdit(budget); setIsModalOpen(true); }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Category info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className={cn('h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 border', status.badge)}>
                              <StatusIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                                {budget.category}
                              </p>
                              <p className="text-[11px] text-[var(--color-ink-muted)]">
                                {pct > 90 ? 'Budget exceeded' : pct > 70 ? 'Approaching limit' : `${formatCurrency(remaining)} left to spend`}
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="w-full bg-[var(--color-surface-muted)] rounded-full h-2.5">
                              <div
                                className={cn('h-2.5 rounded-full transition-all duration-500', status.bg)}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount info */}
                        <div className="text-right shrink-0">
                          <p className={cn('text-base font-bold tabular-nums', status.color)}>
                            {formatCurrency(spent)}
                          </p>
                          <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                            of {formatCurrency(budget.monthlyLimit)}
                          </p>
                          <span className={cn(
                            'inline-flex items-center mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold border',
                            status.badge
                          )}>
                            {Math.round(pct)}%
                          </span>
                        </div>
                      </div>

                      {/* Edit hint on hover */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        </>
      ) : (
        /* Empty state */
        <section className="section-panel">
          <div className="design-card">
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] flex items-center justify-center mb-4">
                <PieChart className="h-7 w-7 text-[var(--color-ink-muted)] opacity-60" />
              </div>
              <p className="text-base font-semibold text-[var(--color-ink)]">No budgets for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1.5 max-w-xs">
                Set monthly spending limits per category to track where your money goes.
              </p>
              <button
                type="button"
                onClick={() => { setBudgetToEdit(null); setIsModalOpen(true); }}
                className="btn-primary mt-5"
              >
                <Plus className="h-4 w-4" /><span>Create First Budget</span>
              </button>
            </div>
          </div>
        </section>
      )}

      <BudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} budgetToEdit={budgetToEdit} defaultMonth={selectedMonth} />
      <button type="button" onClick={() => { setBudgetToEdit(null); setIsModalOpen(true); }}
        className="sm:hidden fixed bottom-[5.25rem] right-5 h-14 w-14 flex items-center justify-center fab-mobile z-40" aria-label="Add budget">
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
    </PageShell>
  );
}
