import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { RecurringPayment, PaymentFrequency } from '../types';
import { X } from 'lucide-react';
import { format } from 'date-fns';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="modal-panel w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{paymentToEdit ? 'Edit Payment' : 'Add Payment'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (INR) *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input 
              type="date" 
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
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
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="activeCheckbox" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between gap-3">
            {paymentToEdit ? (
              <button
                type="button"
                onClick={() => {
                  store.deleteRecurringPayment(paymentToEdit.id);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              >
                Delete
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="btn-secondary !text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary !text-sm"
              >
                Save Payment
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
