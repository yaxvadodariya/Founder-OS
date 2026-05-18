import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { Bot } from 'lucide-react';
import React from 'react';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function WhatsAppPoller() {
  const store = useStore();

  useEffect(() => {
    // Listen to webhook_queue for transactions
    const q = query(
      collection(db, 'webhook_queue'),
      where('actionType', '==', 'transaction')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const transaction = change.doc.data();
          
          store.addTransaction({
            id: Math.random().toString(36).substring(2, 11), // real id
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            categoryDetail: transaction.categoryDetail || 'Other',
            paymentMethod: transaction.paymentMethod || 'Unspecified',
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

          // Mark as processed by deleting it from webhook queue
          deleteDoc(doc(db, 'webhook_queue', change.doc.id)).catch(console.error);
        }
      });
    });

    return () => unsubscribe();
  }, []); // Assuming store.addTransaction is stable

  return null;
}
