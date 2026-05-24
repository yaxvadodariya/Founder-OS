import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, formatCurrencyPDF, cn, CURRENCIES } from '../lib/utils';
import { format } from 'date-fns';
import { Plus, ArrowUpRight, ArrowDownRight, Search, FileText, Wallet } from 'lucide-react';
import { FinanceCategory } from '../types';
import { TransactionModal } from '../components/TransactionModal';
import { HiddenValue } from '../components/HiddenValue';
import { PageShell } from '../components/layout/PageShell';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

  const exportPLStatement = () => {
    try {
      const doc = new jsPDF();
      const currentYear = new Date().getFullYear();
      
      const allCategoryTx = store.transactions.filter(t => t.category === currentCategory);
      
      const incomeMap: Record<string, number> = {};
      const expenseMap: Record<string, number> = {};
      
      allCategoryTx.forEach(t => {
        const amt = t.amount;
        const cat = t.categoryDetail || 'General';
        if (t.type === 'income') {
          incomeMap[cat] = (incomeMap[cat] || 0) + amt;
        } else {
          expenseMap[cat] = (expenseMap[cat] || 0) + amt;
        }
      });
      
      const incomeRows = Object.entries(incomeMap).map(([cat, amt]) => [cat, formatCurrencyPDF(amt)]);
      const expenseRows = Object.entries(expenseMap).map(([cat, amt]) => [cat, formatCurrencyPDF(amt)]);
      
      const totalInc = Object.values(incomeMap).reduce((sum, a) => sum + a, 0);
      const totalExp = Object.values(expenseMap).reduce((sum, a) => sum + a, 0);
      const netProf = totalInc - totalExp;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(24, 24, 27);
      doc.text('Profit & Loss Statement', 14, 22);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(113, 113, 122);
      doc.text(`Type: ${currentCategory.toUpperCase()} | Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 14, 28);
      
      let currentY = 38;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text('1. Revenue / Income', 14, currentY);
      currentY += 4;
      
      (doc as any).autoTable({
        startY: currentY,
        head: [['Category', 'Amount']],
        body: [
          ...incomeRows,
          [{ content: 'Total Revenue', styles: { fontStyle: 'bold' } }, { content: formatCurrencyPDF(totalInc), styles: { fontStyle: 'bold' } }]
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 12;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(239, 68, 68);
      doc.text('2. Cost / Operating Expenses', 14, currentY);
      currentY += 4;
      
      (doc as any).autoTable({
        startY: currentY,
        head: [['Category', 'Amount']],
        body: [
          ...expenseRows,
          [{ content: 'Total Operating Expenses', styles: { fontStyle: 'bold' } }, { content: formatCurrencyPDF(totalExp), styles: { fontStyle: 'bold' } }]
        ],
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 12;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('3. Net Profit / Loss Summary', 14, currentY);
      currentY += 4;
      
      (doc as any).autoTable({
        startY: currentY,
        body: [
          ['Total Revenue', formatCurrencyPDF(totalInc)],
          ['Total Expenses', `(${formatCurrencyPDF(totalExp)})`],
          [{ content: 'Net Profit / Loss', styles: { fontStyle: 'bold', fillColor: netProf >= 0 ? [240, 253, 244] : [254, 242, 242] } }, { content: formatCurrencyPDF(netProf), styles: { fontStyle: 'bold', textColor: netProf >= 0 ? [21, 128, 61] : [185, 28, 28], fillColor: netProf >= 0 ? [240, 253, 244] : [254, 242, 242] } }]
        ],
        theme: 'plain',
        margin: { left: 14, right: 14 },
        styles: { fontSize: 11 }
      });
      
      doc.save(`PL_Statement_${currentCategory}_${currentYear}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
      alert('Failed to export P&L. Please try again.');
    }
  };

  return (
    <PageShell className="lg:pb-0">
      <header className="page-block flex flex-row justify-between items-center gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Finance</h1>
          <p className="page-subtitle hidden sm:block">Manage your {currentCategory} finances</p>
        </div>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <button
              type="button"
              onClick={exportPLStatement}
              className="btn-secondary"
            >
              <FileText className="h-4 w-4" />
              <span>Export P&L</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setTransactionToEdit(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>New Transaction</span>
          </button>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="design-card p-5 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20">
            <p className="metric-label font-medium text-indigo-600 dark:text-indigo-400">Net Balance</p>
            <p className="text-2xl font-bold text-[var(--color-ink)] mt-2">
              <HiddenValue isHidden={isHidden}>{formatCurrency(netBalance)}</HiddenValue>
            </p>
            <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="design-card p-5 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
            <p className="metric-label font-medium text-emerald-600 dark:text-emerald-400">Total Income</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-[var(--color-ink)]">
                <HiddenValue isHidden={isHidden}>{formatCurrency(totalIncome)}</HiddenValue>
              </p>
              <ArrowUpRight className="h-4 w-4 text-emerald-500 self-center" />
            </div>
            <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="design-card p-5 relative overflow-hidden bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent border border-rose-500/20">
            <p className="metric-label font-medium text-rose-600 dark:text-rose-400">Total Expenses</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-[var(--color-ink)]">
                <HiddenValue isHidden={isHidden}>{formatCurrency(totalExpense)}</HiddenValue>
              </p>
              <ArrowDownRight className="h-4 w-4 text-rose-500 self-center" />
            </div>
            <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </section>

      <section className="page-block">
        <h2 className="section-label mb-3">Tax Estimation</h2>
        <div className="design-card p-5 relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-transparent to-transparent border border-[var(--color-border-subtle)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-soft)]">
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider">Estimated Total Tax ({store.taxRate ?? 20}%)</p>
              <p className="text-3xl font-bold text-[var(--color-ink)] mt-2">
                {formatCurrency(totalIncome * ((store.taxRate ?? 20) / 100))}
              </p>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">Based on total income of {formatCurrency(totalIncome)}</p>
            </div>
            <div className="pt-4 md:pt-0 md:pl-6">
              <p className="text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider">Est. Quarterly Payment</p>
              <p className="text-3xl font-bold text-orange-500 mt-2">
                {formatCurrency((totalIncome * ((store.taxRate ?? 20) / 100)) / 4)}
              </p>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">4 equal payments per fiscal year</p>
            </div>
            <div className="pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
              <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                Tax estimates are calculated automatically. You can adjust your tax rate percentage in the <strong>Settings</strong> page to match your local tax bracket.
              </p>
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
                      'flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center',
                      t.type === 'income' 
                        ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive-text)]' 
                        : 'bg-[var(--color-negative-soft)] text-[var(--color-negative-text)]'
                    )}>
                      {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div className="list-row-body">
                      <p className="list-row-title font-semibold">{t.description}</p>
                      <p className="list-row-meta">
                        {format(new Date(t.date), 'MMM d, yyyy')} · {t.categoryDetail}
                      </p>
                    </div>
                    <span className={cn(
                      'list-row-aside font-semibold tabular-nums',
                      t.type === 'income' ? 'text-[var(--color-positive-text)]' : 'text-[var(--color-ink)]'
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
                        className="cursor-pointer"
                        onClick={() => openTransaction(t)}
                      >
                        <td className="whitespace-nowrap text-sm text-[var(--color-ink-muted)]">
                          {format(new Date(t.date), 'MMM dd, yyyy')}
                        </td>
                        <td>
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={cn(
                              'flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center',
                              t.type === 'income' 
                                ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive-text)]' 
                                : 'bg-[var(--color-negative-soft)] text-[var(--color-negative-text)]'
                            )}>
                              {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-[var(--color-ink)] truncate">{t.description}</div>
                              <div className="text-xs text-[var(--color-ink-muted)] mt-0.5">{t.paymentMethod}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="status-badge status-badge-neutral">{t.categoryDetail}</span>
                        </td>
                        <td className={cn(
                          'whitespace-nowrap text-right font-semibold tabular-nums text-sm',
                          t.type === 'income' ? 'text-[var(--color-positive-text)]' : 'text-[var(--color-ink)]'
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
