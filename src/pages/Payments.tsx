import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn, formatCurrency } from '../lib/utils';
import { Plus, BellRing, Calendar as CalendarIcon, RefreshCw, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { HiddenValue } from '../components/HiddenValue';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { PaymentModal } from '../components/PaymentModal';
import { PageShell } from '../components/layout/PageShell';

export function Payments() {
  const store = useStore();
  const isHidden = store.isPrivacyMode && !store.isPeeking;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<any>(null);

  const payments = store.recurringPayments.sort((a, b) => {
    if (!a.active && b.active) return 1;
    if (a.active && !b.active) return -1;
    return (a.dayOfMonth || 0) - (b.dayOfMonth || 0);
  });

  const openPayment = (payment: typeof payments[0]) => {
    setPaymentToEdit(payment);
    setIsModalOpen(true);
  };

  return (
    <PageShell className="lg:pb-0">
      <header className="page-block flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Payments & Bills</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="page-subtitle">Track recurring subscriptions and scheduled payments</p>
            {store.isPrivacyMode && (
              <span className="status-badge status-badge-neutral">
                <EyeOff className="h-3 w-3" />
                Private
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrivacyToggle />
          <button
            type="button"
            onClick={() => {
              setPaymentToEdit(null);
              setIsModalOpen(true);
            }}
            className="hidden sm:inline-flex btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>New Payment</span>
          </button>
        </div>
      </header>

      <section className="page-block flex-1">
        <h2 className="section-label mb-3">Scheduled Payments</h2>
        <div className="section-panel-flat w-full min-w-0">
          {payments.length > 0 ? (
            <>
              <div className="list-mobile">
                {payments.map(payment => (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() => openPayment(payment)}
                    className={cn('list-row w-full', !payment.active && 'opacity-50')}
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-[var(--color-surface-muted)] flex items-center justify-center border border-[var(--color-border-soft)]">
                      <RefreshCw className="h-4 w-4 text-[var(--color-ink-secondary)]" />
                    </div>
                    <div className="list-row-body">
                      <p className="list-row-title font-semibold">{payment.name}</p>
                      <p className="list-row-meta">
                        {payment.frequency === 'monthly' && payment.dayOfMonth
                          ? `${payment.dayOfMonth}th of month`
                          : 'Custom'}{' '}
                        · {payment.category}
                      </p>
                    </div>
                    <div className="list-row-aside flex flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums">
                        <HiddenValue isHidden={isHidden} bulletCount={4}>
                          {formatCurrency(payment.amount)}
                        </HiddenValue>
                      </span>
                      <span className={cn('status-badge', payment.active ? 'status-badge-success' : 'status-badge-neutral')}>
                        {payment.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="data-table-desktop overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th scope="col">Payment</th>
                      <th scope="col">Schedule</th>
                      <th scope="col">Category</th>
                      <th scope="col" className="!text-right">Amount</th>
                      <th scope="col" className="!text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr
                        key={payment.id}
                        className={cn('cursor-pointer', !payment.active && 'opacity-50')}
                        onClick={() => openPayment(payment)}
                      >
                        <td>
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-muted)] flex items-center justify-center shrink-0 border border-[var(--color-border-soft)]">
                              <RefreshCw className="h-4 w-4 text-[var(--color-ink-secondary)]" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-[var(--color-ink)] truncate">{payment.name}</div>
                              <div className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1 mt-0.5">
                                <BellRing className="h-3 w-3 shrink-0" />
                                Remind {payment.reminderDays[0]}d before
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-[var(--color-ink)]">
                            <CalendarIcon className="h-3.5 w-3.5 text-[var(--color-ink-muted)] shrink-0" />
                            {payment.frequency === 'monthly' && payment.dayOfMonth
                              ? `${payment.dayOfMonth}th of month`
                              : 'Custom'}
                          </div>
                          <div className="text-[11px] text-[var(--color-ink-muted)] mt-0.5 ml-5">
                            Since {format(new Date(payment.startDate), 'MMM yyyy')}
                          </div>
                        </td>
                        <td>
                          <span className="status-badge status-badge-neutral">{payment.category}</span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                            <HiddenValue isHidden={isHidden} bulletCount={4}>
                              {formatCurrency(payment.amount)}
                            </HiddenValue>
                          </span>
                        </td>
                        <td className="text-right">
                          <span className={cn('status-badge', payment.active ? 'status-badge-success' : 'status-badge-neutral')}>
                            {payment.active ? 'Active' : 'Paused'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="p-10 text-center text-sm text-[var(--color-ink-muted)]">No recurring payments configured.</p>
          )}
        </div>
      </section>
      
      <PaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        paymentToEdit={paymentToEdit}
      />
      
      <button
        type="button"
        onClick={() => {
          setPaymentToEdit(null);
          setIsModalOpen(true);
        }}
        className="sm:hidden fixed bottom-[5.25rem] right-5 h-14 w-14 flex items-center justify-center fab-mobile z-40"
        aria-label="Add payment"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
    </PageShell>
  );
}
