import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const handleSnapshotError = (source: string, err: any) => {
      console.error(`${source} snapshot error:`, err);
      fetch('/api/client-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
          operationType: 'list',
          path: source,
          authInfo: { userId: auth.currentUser?.uid }
        })
      }).catch(() => {});
    };

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
          }, (err) => handleSnapshotError("transactions", err)),
          onSnapshot(collection(db, `users/${userId}/projects`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ projects: data });
          }, (err) => handleSnapshotError("projects", err)),
          onSnapshot(collection(db, `users/${userId}/tasks`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ tasks: data });
          }, (err) => handleSnapshotError("tasks", err)),
          onSnapshot(collection(db, `users/${userId}/recurringPayments`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ recurringPayments: data });
          }, (err) => handleSnapshotError("recurringPayments", err)),
          onSnapshot(collection(db, `users/${userId}/notes`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ notes: data });
          }, (err) => handleSnapshotError("notes", err)),
          onSnapshot(collection(db, `users/${userId}/invoices`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ invoices: data });
          }, (err) => handleSnapshotError("invoices", err)),
          onSnapshot(collection(db, `users/${userId}/habits`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ habits: data });
          }, (err) => handleSnapshotError("habits", err)),
          onSnapshot(collection(db, `users/${userId}/goals`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ goals: data });
          }, (err) => handleSnapshotError("goals", err)),
          onSnapshot(collection(db, `users/${userId}/journal`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            useStore.setState({ journalEntries: data });
          }, (err) => handleSnapshotError("journal", err)),
          onSnapshot(collection(db, `users/${userId}/budgets`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ budgets: data });
          }, (err) => handleSnapshotError("budgets", err)),
          onSnapshot(collection(db, `users/${userId}/clients`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            useStore.setState({ clients: data });
          }, (err) => handleSnapshotError("clients", err)),
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
    return <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center font-sans text-[var(--color-ink-muted)]">Loading...</div>;
  }

  return <>{children}</>;
}
