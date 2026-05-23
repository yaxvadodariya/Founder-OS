import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, cn, CURRENCIES } from '../lib/utils';
import { format } from 'date-fns';
import { Plus, ArrowUpRight, ArrowDownRight, Search, FileText } from 'lucide-react';
import { FinanceCategory } from '../types';
import { TransactionModal } from '../components/TransactionModal';
import { HiddenValue } from '../components/HiddenValue';
import { PageShell } from '../components/layout/PageShell';

export function Finance() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const store = useStore();
  
  const currentCategory: FinanceCategory = type === 'business' ? 'business' : 'personal';
  const currencyCode = store.currency || 'USD';
  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  
  const isHidden = false;
  
  const transactions = store.transactions
    .filter(t => t.category === currentCategory)
    .filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.categoryDetail.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const openTransaction = (t: typeof transactions[0]) => {
    setTransactionToEdit(t);
    setIsModalOpen(true);
  };

  return (
    <PageShell className="lg:pb-0">
      <header className="page-block">
        <h1 className="page-title">Finance</h1>
        <p className="page-subtitle">Manage your {currentCategory} finances</p>
      </header>

      <div className="page-block segmented-control segmented-control-full">
        <button
          type="button"
          onClick={() => navigate('/finance/personal')}
          className={cn('segmented-item', currentCategory === 'personal' && 'segmented-item-active')}
        >
          Personal
        </button>
        <button
          type="button"
          onClick={() => navigate('/finance/business')}
          className={cn('segmented-item', currentCategory === 'business' && 'segmented-item-active')}
        >
          Business
        </button>
      </div>

      <section className="page-block">
        <h2 className="section-label mb-3">Summary</h2>
        <div className="stack-list">
          <div className="stack-list-item">
            <p className="metric-label">Net Balance</p>
            <p className="metric-value mt-1">
              <HiddenValue isHidden={isHidden}>{formatCurrency(netBalance)}</HiddenValue>
            </p>
          </div>
          <div className="stack-list-item">
            <p className="metric-label">Total Income</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="metric-value">
                <HiddenValue isHidden={isHidden}>{formatCurrency(totalIncome)}</HiddenValue>
              </p>
              <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
            </div>
          </div>
          <div className="stack-list-item">
            <p className="metric-label">Total Expenses</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="metric-value">
                <HiddenValue isHidden={isHidden}>{formatCurrency(totalExpense)}</HiddenValue>
              </p>
              <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />
            </div>
          </div>
        </div>
      </section>

      <section className="page-block flex-1 flex flex-col min-h-0">
        <h2 className="section-label mb-3">History</h2>
        <div className="section-panel-flat w-full min-w-0 flex flex-col flex-1">
          <div className="p-4 border-b border-[var(--color-border-soft)]">
            <h3 className="text-sm font-medium text-[var(--color-ink)] mb-3">Recent Transactions</h3>
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-muted)]" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field !pl-10 w-full max-w-full"
              />
            </div>
          </div>

          {transactions.length > 0 ? (
            <>
              <div className="list-mobile divide-y divide-[var(--color-border-soft)]">
                {transactions.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openTransaction(t)}
                    className="list-row w-full"
                  >
                    <div className={cn(
                      'flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center',
                      t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                    )}>
                      {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div className="list-row-body">
                      <p className="list-row-title">{t.description}</p>
                      <p className="list-row-meta">
                        {format(new Date(t.date), 'MMM d, yyyy')} · {t.categoryDetail}
                      </p>
                    </div>
                    <span className={cn(
                      'list-row-aside',
                      t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--color-ink)]'
                    )}>
                      <HiddenValue isHidden={isHidden} bulletCount={4} prefix={t.type === 'income' ? `+${currencySymbol}` : `-${currencySymbol}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </HiddenValue>
                    </span>
                  </button>
                ))}
              </div>

              <div className="data-table-desktop overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Description</th>
                      <th scope="col">Category</th>
                      <th scope="col" className="!text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr 
                        key={t.id} 
                        className="hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
                        onClick={() => openTransaction(t)}
                      >
                        <td className="whitespace-nowrap text-[var(--color-ink-muted)]">
                          {format(new Date(t.date), 'MMM dd, yyyy')}
                        </td>
                        <td>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
                              t.type === 'income' 
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' 
                                : 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                            )}>
                              {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-[var(--color-ink)] truncate">{t.description}</div>
                              <div className="text-xs text-[var(--color-ink-muted)]">{t.paymentMethod}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="status-badge status-badge-neutral">{t.categoryDetail}</span>
                        </td>
                        <td className={cn(
                          'whitespace-nowrap text-right font-medium',
                          t.type === 'income' ? 'text-emerald-600' : 'text-[var(--color-ink)]'
                        )}>
                          <HiddenValue isHidden={isHidden} bulletCount={4} prefix={t.type === 'income' ? `+ ${currencySymbol} ` : `- ${currencySymbol} `}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </HiddenValue>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-10 text-center">
              <FileText className="h-10 w-10 text-[var(--color-ink-muted)] mx-auto mb-2 opacity-50" />
              <p className="text-sm text-[var(--color-ink-muted)]">No transactions found.</p>
            </div>
          )}
        </div>
      </section>
      
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null);
        }}
        defaultType="expense"
        transactionToEdit={transactionToEdit}
      />
      
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="sm:hidden fixed bottom-[5.25rem] right-5 h-14 w-14 flex items-center justify-center fab-mobile z-40"
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
    </PageShell>
  );
}
