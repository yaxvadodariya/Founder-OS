import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { TransactionType, FinanceCategory } from '../types';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export function TransactionModal({ isOpen, onClose, defaultType = 'expense' }: TransactionModalProps) {
  const store = useStore();
  
  const [type, setType] = useState<TransactionType>(defaultType);
  const [category, setCategory] = useState<FinanceCategory>('personal');
  const [amount, setAmount] = useState('');
  const [categoryDetail, setCategoryDetail] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryDetail || !description) return;
    
    store.addTransaction({
      id: Math.random().toString(),
      type,
      category,
      amount: parseFloat(amount),
      categoryDetail,
      date: new Date(date).toISOString(),
      description,
      paymentMethod: paymentMethod || 'Unspecified'
    });
    
    // Reset and close
    setAmount('');
    setCategoryDetail('');
    setDescription('');
    setPaymentMethod('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'expense' ? 'bg-white text-gray-900' : 'text-gray-500'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'income' ? 'bg-white text-gray-900' : 'text-gray-500'}`}
            >
              Income
            </button>
          </div>

          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setCategory('personal')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${category === 'personal' ? 'bg-white text-gray-900' : 'text-gray-500'}`}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => setCategory('business')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${category === 'business' ? 'bg-white text-gray-900' : 'text-gray-500'}`}
            >
              Business
            </button>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What was this for?"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Category Detail *</label>
             <select 
               required
               value={categoryDetail}
               onChange={(e) => setCategoryDetail(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <input 
              type="text" 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Bank Transfer, UPI, Cash"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
