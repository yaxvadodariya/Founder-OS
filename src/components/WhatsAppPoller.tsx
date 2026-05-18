import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { Bot } from 'lucide-react';
import React from 'react';

export function WhatsAppPoller() {
  const store = useStore();

  useEffect(() => {
    let timeoutId: number;

    const pollTransactions = async () => {
      try {
        const res = await fetch('/api/transactions/pending');
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.transactions && data.transactions.length > 0) {
          for (const transaction of data.transactions) {
            // Add to firestore via store
            store.addTransaction({
              id: Math.random().toString(36).substring(2, 11), // real id
              type: transaction.type,
              amount: transaction.amount,
              category: transaction.category,
              date: new Date().toISOString(),
              description: transaction.description || 'Added via WhatsApp'
            });

            toast.custom(
              (t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Bot className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.type === 'income' ? 'Income' : 'Expense'} via WhatsApp
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {transaction.description}: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ),
              { duration: 5000 }
            );

            // Mark as processed
            await fetch('/api/transactions/processed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: transaction.id })
            });
          }
        }
      } catch (err) {
        // silently fail polling
      } finally {
        timeoutId = window.setTimeout(pollTransactions, 5000); // 5 sec
      }
    };

    pollTransactions();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
