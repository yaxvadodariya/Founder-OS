import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Transaction, TransactionType, FinanceCategory } from '../types';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  transactionToEdit?: Transaction | null;
}

export function TransactionModal({ isOpen, onClose, defaultType = 'expense', transactionToEdit = null }: TransactionModalProps) {
  const store = useStore();
  
  const [type, setType] = useState<TransactionType>(defaultType);
  const [category, setCategory] = useState<FinanceCategory>('personal');
  const [amount, setAmount] = useState('');
  const [categoryDetail, setCategoryDetail] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category);
      setAmount(transactionToEdit.amount.toString());
      setCategoryDetail(transactionToEdit.categoryDetail);
      setDate(format(new Date(transactionToEdit.date), 'yyyy-MM-dd'));
      setDescription(transactionToEdit.description);
      setPaymentMethod(transactionToEdit.paymentMethod || '');
    } else {
      setType(defaultType);
      setCategory('personal');
      setAmount('');
      setCategoryDetail('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setDescription('');
      setPaymentMethod('');
    }
  }, [transactionToEdit, isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryDetail || !description) return;
    
    if (transactionToEdit) {
      store.updateTransaction(transactionToEdit.id, {
        type,
        category,
        amount: parseFloat(amount),
        categoryDetail,
        date: new Date(date).toISOString(),
        description,
        paymentMethod: paymentMethod || 'Unspecified'
      });
    } else {
      store.addTransaction({
        id: Math.random().toString(36).substring(2, 11),
        type,
        category,
        amount: parseFloat(amount),
        categoryDetail,
        date: new Date(date).toISOString(),
        description,
        paymentMethod: paymentMethod || 'Unspecified'
      });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="modal-panel w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="modal-header flex justify-between items-start gap-4">
          <div>
            <h2 className="modal-title">{transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <p className="modal-meta">{transactionToEdit ? `Last updated ${format(new Date(transactionToEdit.date), 'MMM d, yyyy')}` : 'Record income or expense'}</p>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary !p-2 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <form id="transaction-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="modal-body overflow-y-auto flex-1 space-y-4">
          <div className="segmented-control w-full">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 segmented-item ${type === 'expense' ? 'segmented-item-active' : ''}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 segmented-item ${type === 'income' ? 'segmented-item-active' : ''}`}
            >
              Income
            </button>
          </div>

          <div className="segmented-control w-full">
            <button
              type="button"
              onClick={() => setCategory('personal')}
              className={`flex-1 segmented-item ${category === 'personal' ? 'segmented-item-active' : ''}`}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => setCategory('business')}
              className={`flex-1 segmented-item ${category === 'business' ? 'segmented-item-active' : ''}`}
            >
              Business
            </button>
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
            <label className="form-label">Date *</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="form-label">Description *</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="What was this for?"
            />
          </div>

          <div>
             <label className="form-label">Category Detail *</label>
             <select 
               required
               value={categoryDetail}
               onChange={(e) => setCategoryDetail(e.target.value)}
               className="input-field"
             >
               <option value="" disabled>Select category...</option>
               {type === 'expense' ? (
                 <>
                   <option value="Food">Food</option>
                   <option value="Transport">Transport</option>
                   <option value="Rent">Rent</option>
                   <option value="Utilities">Utilities</option>
                   <option value="Entertainment">Entertainment</option>
                   <option value="Shopping">Shopping</option>
                   <option value="Health">Health</option>
                   <option value="Education">Education</option>
                   <option value="Software Tools">Software Tools</option>
                   <option value="Marketing">Marketing</option>
                   <option value="Office">Office</option>
                   <option value="Other">Other</option>
                 </>
               ) : (
                 <>
                   <option value="Salary">Salary</option>
                   <option value="Freelance">Freelance</option>
                   <option value="Client Payment">Client Payment</option>
                   <option value="Investment">Investment</option>
                   <option value="Other">Other</option>
                 </>
               )}
             </select>
          </div>

          <div>
            <label className="form-label">Payment Method</label>
            <input 
              type="text" 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-field"
              placeholder="e.g., Bank Transfer, UPI, Cash"
            />
          </div>

        </div>
        <div className="modal-footer justify-between">
          {transactionToEdit ? (
            <button
              type="button"
              onClick={() => {
                store.deleteTransaction(transactionToEdit.id);
                onClose();
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Transaction</button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}
