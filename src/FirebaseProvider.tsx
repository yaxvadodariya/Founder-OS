import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        useStore.getState().setUser({
          name: user.displayName || user.email || 'User',
          email: user.email || undefined,
          createdAt: user.metadata.creationTime || new Date().toISOString(),
        });
        
        // Setup Firestore listeners
        const userId = user.uid;
        
        const unsubs = [
          onSnapshot(collection(db, `users/${userId}/transactions`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ transactions: data });
          }),
          onSnapshot(collection(db, `users/${userId}/projects`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ projects: data });
          }),
          onSnapshot(collection(db, `users/${userId}/tasks`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ tasks: data });
          }),
          onSnapshot(collection(db, `users/${userId}/recurringPayments`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ recurringPayments: data });
          }),
          onSnapshot(collection(db, `users/${userId}/notes`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ notes: data });
          }),
        ];

        setLoading(false);
        return () => {
          unsubs.forEach(fn => fn());
        };
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

    return () => unsubAuth();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center font-['Inter']">Loading...</div>;
  }

  return <>{children}</>;
}
