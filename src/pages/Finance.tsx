import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, cn, CURRENCIES } from '../lib/utils';
import { format } from 'date-fns';
import { Plus, ArrowUpRight, ArrowDownRight, Search, FileText, Eye, EyeOff } from 'lucide-react';
import { TransactionType, FinanceCategory } from '../types';
import { TransactionModal } from '../components/TransactionModal';
import { HiddenValue } from '../components/HiddenValue';

export function Finance() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const store = useStore();
  
  const currentCategory: FinanceCategory = type === 'business' ? 'business' : 'personal';
  const currencyCode = store.currency || 'USD';
  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';
  
  // As requested, always show numbers on the Finance page tab, even if privacy mode is on globally
  const isPrivacyMode = false;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
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

  return (
    <div className="space-y-6 pb-20 lg:pb-0 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Finance</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">Manage your {currentCategory} finances</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg w-full sm:w-fit">
        <button
          onClick={() => navigate('/finance/personal')}
          className={cn(
            "flex-1 sm:px-6 py-2 text-sm font-medium rounded-md transition-all",
            currentCategory === 'personal' ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Personal
        </button>
        <button
          onClick={() => navigate('/finance/business')}
          className={cn(
            "flex-1 sm:px-6 py-2 text-sm font-medium rounded-md transition-all",
            currentCategory === 'business' ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Business
        </button>
      </div>

      {/* Summary Cards */}
      <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px]">
        <div className="flex items-center mb-4 px-1">
          <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[4px]">
          <div className="design-card p-5">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-gray-500">Net Balance</p>
              <p className="text-[20px] font-medium leading-none tracking-[-0.011em] text-black">
                <HiddenValue isHidden={isHidden}>{formatCurrency(netBalance)}</HiddenValue>
              </p>
            </div>
          </div>
          <div className="design-card p-5">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <div className="flex items-center gap-2">
                <p className="text-[20px] font-medium leading-none tracking-[-0.011em] text-black">
                  <HiddenValue isHidden={isHidden}>{formatCurrency(totalIncome)}</HiddenValue>
                </p>
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </div>
          <div className="design-card p-5">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <div className="flex items-center gap-2">
                <p className="text-[20px] font-medium leading-none tracking-[-0.011em] text-black">
                  <HiddenValue isHidden={isHidden}>{formatCurrency(totalExpense)}</HiddenValue>
                </p>
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px] flex-1 min-h-[400px] flex flex-col">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">History</h2>
        </div>
        <div className="design-card flex flex-col flex-1">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1 rounded-b-[24px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#F8F9FA]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr 
                      key={t.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setTransactionToEdit(t);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(t.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={cn(
                            "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3",
                            t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                          )}>
                            {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{t.description}</div>
                            <div className="text-xs text-gray-500">{t.paymentMethod}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {t.categoryDetail}
                        </span>
                      </td>
                      <td className={cn(
                        "px-6 py-4 whitespace-nowrap text-right text-sm font-semibold",
                        t.type === 'income' ? "text-emerald-600" : "text-gray-900"
                      )}>
                        <HiddenValue isHidden={isHidden} bulletCount={4} prefix={t.type === 'income' ? `+ ${currencySymbol} ` : `- ${currencySymbol} `}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </HiddenValue>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No transactions found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null);
        }}
        defaultType="expense"
        transactionToEdit={transactionToEdit}
      />
      
      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="sm:hidden fixed bottom-[88px] right-6 p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-40 transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
