import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { Bot } from 'lucide-react';
import React from 'react';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const processedIds = new Set<string>();

export function WhatsAppPoller() {
  const store = useStore();

  useEffect(() => {
    // Listen to all from whatsapp or fallback to actionType
    const q = query(
      collection(db, 'webhook_queue')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          if (processedIds.has(docId)) return;
          
          const rawData = change.doc.data();
          
          // Check if it belongs to WhatsApp Polly logic
          if (rawData.actionType === 'transaction') {
            processedIds.add(docId);
            store.addTransaction({
              id: change.doc.id,
              type: rawData.type,
              amount: rawData.amount,
              category: rawData.category,
              categoryDetail: rawData.categoryDetail || 'Other',
              paymentMethod: rawData.paymentMethod || 'Unspecified',
              date: new Date().toISOString(),
              description: rawData.description || 'Added via WhatsApp'
            }, true);

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
                          {rawData.type === 'income' ? 'Income' : 'Expense'} via WhatsApp
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {rawData.description}: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rawData.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ),
              { duration: 5000 }
            );

            deleteDoc(doc(db, 'webhook_queue', change.doc.id)).catch(console.error);
          } else if (rawData.actionType === 'task' && rawData.source === 'whatsapp') {
            processedIds.add(docId);
            store.addTask({
              id: change.doc.id,
              title: rawData.title,
              description: rawData.description,
              priority: rawData.priority || 'medium',
              completed: false,
              tags: ['whatsapp'],
              subtasks: [],
              createdAt: new Date().toISOString()
            });

            toast.success(`Task via WhatsApp: ${rawData.title}`);
            deleteDoc(doc(db, 'webhook_queue', change.doc.id)).catch(console.error);
          } else if (rawData.actionType === 'note') {
            processedIds.add(docId);
            store.addNote({
              id: change.doc.id,
              title: rawData.title,
              content: rawData.content,
              category: 'remember',
              tags: ['whatsapp'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            toast.success(`Note via WhatsApp saved to Remember Book`);
            deleteDoc(doc(db, 'webhook_queue', change.doc.id)).catch(console.error);
          }
        }
      });
    });

    return () => unsubscribe();
  }, []); // Assuming store actions are stable

  return null;
}
