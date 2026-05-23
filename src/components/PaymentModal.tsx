import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { RecurringPayment, PaymentFrequency } from '../types';
import { format } from 'date-fns';
import { SidePanel } from './SidePanel';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentToEdit?: RecurringPayment | null;
}

export function PaymentModal({ isOpen, onClose, paymentToEdit = null }: PaymentModalProps) {
  const store = useStore();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (paymentToEdit) {
      setName(paymentToEdit.name);
      setAmount(paymentToEdit.amount.toString());
      setFrequency(paymentToEdit.frequency);
      setDayOfMonth(paymentToEdit.dayOfMonth?.toString() || '');
      setCategory(paymentToEdit.category);
      setStartDate(format(new Date(paymentToEdit.startDate), 'yyyy-MM-dd'));
      setActive(paymentToEdit.active);
    } else {
      setName('');
      setAmount('');
      setFrequency('monthly');
      setDayOfMonth('');
      setCategory('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setActive(true);
    }
  }, [paymentToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !category) return;
    
    if (paymentToEdit) {
      store.updateRecurringPayment(paymentToEdit.id, {
        name,
        amount: parseFloat(amount),
        frequency,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : undefined,
        category,
        startDate: new Date(startDate).toISOString(),
        active,
      });
    } else {
      store.addRecurringPayment({
        id: Math.random().toString(36).substring(2, 11),
        name,
        amount: parseFloat(amount),
        frequency,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : undefined,
        category,
        startDate: new Date(startDate).toISOString(),
        active,
        reminderDays: [1]
      });
    }
    
    onClose();
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={paymentToEdit ? 'Edit Payment' : 'New Payment'}
      subtitle={paymentToEdit ? 'Update recurring payment details' : 'Add a recurring bill or subscription'}
      footer={
        <div className="flex justify-between items-center">
          {paymentToEdit ? (
            <button
              type="button"
              onClick={() => {
                store.deleteRecurringPayment(paymentToEdit.id);
                onClose();
              }}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" form="payment-form" className="btn-primary">Save Payment</button>
          </div>
        </div>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="form-label">Name *</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="e.g. Netflix Subscription"
          />
        </div>

        <div>
          <label className="form-label">Amount (INR) *</label>
          <input 
            type="number" 
            required
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="form-label">Frequency *</label>
          <select 
            required
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as PaymentFrequency)}
            className="input-field"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        {frequency === 'monthly' && (
          <div>
            <label className="form-label">Day of Month</label>
            <input 
              type="number" 
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="input-field"
              placeholder="1-31"
            />
          </div>
        )}

        <div>
          <label className="form-label">Start Date *</label>
          <input 
            type="date" 
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="form-label">Category *</label>
          <input 
            type="text" 
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field"
            placeholder="e.g. Subscriptions, Utilities"
          />
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="activeCheckbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-[var(--color-border-subtle)] text-[var(--color-ink)] focus:ring-[var(--color-ink-muted)]"
          />
          <label htmlFor="activeCheckbox" className="form-label !mb-0">Active</label>
        </div>
      </form>
    </SidePanel>
  );
}
