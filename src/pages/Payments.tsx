import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn, formatCurrency } from '../lib/utils';
import { Plus, BellRing, Calendar as CalendarIcon, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { HiddenValue } from '../components/HiddenValue';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { PaymentModal } from '../components/PaymentModal';

export function Payments() {
  const store = useStore();
  const isPrivacyMode = store.isPrivacyMode;
  const isHidden = isPrivacyMode && !store.isPeeking;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<any>(null);

  const payments = store.recurringPayments.sort((a, b) => {
    if (!a.active && b.active) return 1;
    if (a.active && !b.active) return -1;
    return (a.dayOfMonth || 0) - (b.dayOfMonth || 0);
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payments & Bills</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">Track recurring subscriptions and scheduled payments</p>
            {store.isPrivacyMode && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                <EyeOff className="h-3 w-3 mr-1" />
                Private Mode
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
           <PrivacyToggle />
          <button 
            type="button"
            onClick={() => {
              setPaymentToEdit(null);
              setIsModalOpen(true);
            }}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Payment</span>
          </button>
        </div>
      </div>

      <div className="bg-[#272625]/[0.03] p-[17px] rounded-[19px] flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-[#8C8684] text-xs font-medium tracking-tight uppercase">Scheduled Payments</h2>
        </div>
        <div className="design-card flex-1 overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#F8F9FA]">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Details</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {payments.length > 0 ? (
                  payments.map(payment => (
                    <tr 
                      key={payment.id} 
                      className={cn("hover:bg-gray-50 transition-colors cursor-pointer", !payment.active && "opacity-60")}
                      onClick={() => {
                        setPaymentToEdit(payment);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                            <RefreshCw className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{payment.name}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                              <BellRing className="h-3 w-3 mr-1" />
                              Remind {payment.reminderDays[0]} days before
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {payment.frequency === 'monthly' && payment.dayOfMonth ? `${payment.dayOfMonth}th of month` : 'Custom'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">Started {format(new Date(payment.startDate), 'MMM yyyy')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {payment.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        <HiddenValue isHidden={isHidden} bulletCount={4}>
                          {formatCurrency(payment.amount)}
                        </HiddenValue>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          payment.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        )}>
                          {payment.active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                       <p className="text-gray-500 text-sm">No recurring payments configured.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <PaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        paymentToEdit={paymentToEdit}
      />
      
      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => {
          setPaymentToEdit(null);
          setIsModalOpen(true);
        }}
        className="sm:hidden fixed bottom-[88px] right-6 p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-40 transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
