import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clear previous listeners
      unsubs.forEach(fn => fn());
      unsubs = [];

      if (user) {
        useStore.getState().setUser({
          name: user.displayName || user.email || 'User',
          email: user.email || undefined,
          createdAt: user.metadata.creationTime || new Date().toISOString(),
        });
        
        // Setup Firestore listeners
        const userId = user.uid;
        
        unsubs = [
          onSnapshot(collection(db, `users/${userId}/transactions`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            // Sort by date descending
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            useStore.setState({ transactions: data });
          }, (err) => console.error("Transactions snapshot error:", err)),
          onSnapshot(collection(db, `users/${userId}/projects`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ projects: data });
          }, (err) => console.error("Projects snapshot error:", err)),
          onSnapshot(collection(db, `users/${userId}/tasks`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ tasks: data });
          }, (err) => console.error("Tasks snapshot error:", err)),
          onSnapshot(collection(db, `users/${userId}/recurringPayments`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ recurringPayments: data });
          }, (err) => console.error("Recurring payments snapshot error:", err)),
          onSnapshot(collection(db, `users/${userId}/notes`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ notes: data });
          }, (err) => console.error("Notes snapshot error:", err)),
        ];

        setLoading(false);
      } else {
        useStore.getState().setUser(null as any);
        useStore.setState({
          transactions: [],
          projects: [],
          tasks: [],
          recurringPayments: [],
          notes: []
        });
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubs.forEach(fn => fn());
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center font-['Inter']">Loading...</div>;
  }

  return <>{children}</>;
}
