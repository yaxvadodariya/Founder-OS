import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Transaction, Project, Task, RecurringPayment, Note, User } from '../types';
// We'll keep sample data available but not loaded by default for authenticated users.

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, payload?: any) {
  const errInfo: FirestoreErrorInfo & { payload?: any } = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
    payload
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  useStore.getState().setLastError(JSON.stringify(errInfo, null, 2));
}

interface StoreState {
  user: User | null;
  transactions: Transaction[];
  projects: Project[];
  tasks: Task[];
  recurringPayments: RecurringPayment[];
  notes: Note[];
  isPrivacyMode: boolean;
  isPeeking: boolean;
  isDarkMode: boolean;
  
  // Actions
  setUser: (user: User) => void;
  togglePrivacyMode: () => void;
  setPrivacyMode: (enabled: boolean) => void;
  setPeeking: (peeking: boolean) => void;
  toggleDarkMode: () => void;
  
  addTransaction: (ts: Transaction, skipNotify?: boolean) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  addProject: (p: Project) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  addTask: (t: Task) => void;
  updateTask: (id: string, t: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  
  addRecurringPayment: (rp: RecurringPayment) => void;
  updateRecurringPayment: (id: string, rp: Partial<RecurringPayment>) => void;
  deleteRecurringPayment: (id: string) => void;
  
  addNote: (n: Note) => void;
  updateNote: (id: string, n: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  resetData: () => void;
  lastError: string | null;
  setLastError: (err: string | null) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null as User | null,
      transactions: [],
      projects: [],
      tasks: [],
      recurringPayments: [],
      notes: [],
      isPrivacyMode: true,
      isPeeking: false,
      isDarkMode: false,
      lastError: null,
      setLastError: (err) => set({ lastError: err }),

      setUser: (user) => set({ user }),
      togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),
      setPrivacyMode: (enabled) => set({ isPrivacyMode: enabled }),
      setPeeking: (peeking) => set({ isPeeking: peeking }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      addTransaction: async (ts, skipNotify) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await setDoc(doc(db, `users/${userId}/transactions`, ts.id), { ...ts, userId });
          
          if (!skipNotify) {
            // Trigger WhatsApp notification via server API
            fetch('/api/notify/transaction', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ts)
            }).then(async (res) => {
              if (!res.ok) {
                const data = await res.json();
                console.error('WhatsApp notify failed:', data.error);
                useStore.getState().setLastError('WhatsApp Note: ' + data.error);
              }
            }).catch(console.error);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userId}/transactions`, { ...ts, userId });
        }
      },
      updateTransaction: async (id, params) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        const current = useStore.getState().transactions.find(t => t.id === id);
        if (!current) return;
        try {
          await setDoc(doc(db, `users/${userId}/transactions`, id), { ...current, ...params, userId }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/transactions`);
        }
      },
      deleteTransaction: async (id) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await deleteDoc(doc(db, `users/${userId}/transactions`, id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${userId}/transactions`);
        }
      },
      
      addProject: async (p) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await setDoc(doc(db, `users/${userId}/projects`, p.id), { ...p, userId });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userId}/projects`);
        }
      },
      updateProject: async (id, params) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        const current = useStore.getState().projects.find(p => p.id === id);
        if (!current) return;
        try {
          await setDoc(doc(db, `users/${userId}/projects`, id), { ...current, ...params, userId }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/projects`);
        }
      },
      deleteProject: async (id) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await deleteDoc(doc(db, `users/${userId}/projects`, id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${userId}/projects`);
        }
      },
      
      addTask: async (t) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await setDoc(doc(db, `users/${userId}/tasks`, t.id), { ...t, userId });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userId}/tasks`);
        }
      },
      updateTask: async (id, params) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        const current = useStore.getState().tasks.find(t => t.id === id);
        if (!current) return;
        try {
          await setDoc(doc(db, `users/${userId}/tasks`, id), { ...current, ...params, userId }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/tasks`);
        }
      },
      deleteTask: async (id) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await deleteDoc(doc(db, `users/${userId}/tasks`, id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${userId}/tasks`);
        }
      },
      toggleTaskCompletion: async (id) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        const t = useStore.getState().tasks.find(t => t.id === id);
        if (!t) return;
        const now = new Date().toISOString();
        try {
          await setDoc(doc(db, `users/${userId}/tasks`, id), { 
            ...t, 
            completed: !t.completed, 
            completedAt: !t.completed ? now : undefined,
            userId
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/tasks`);
        }
      },
      
      addRecurringPayment: async (rp) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await setDoc(doc(db, `users/${userId}/recurringPayments`, rp.id), { ...rp, userId });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userId}/recurringPayments`);
        }
      },
      updateRecurringPayment: async (id, params) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        const current = useStore.getState().recurringPayments.find(rp => rp.id === id);
        if (!current) return;
        try {
          await setDoc(doc(db, `users/${userId}/recurringPayments`, id), { ...current, ...params, userId }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/recurringPayments`);
        }
      },
      deleteRecurringPayment: async (id) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await deleteDoc(doc(db, `users/${userId}/recurringPayments`, id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${userId}/recurringPayments`);
        }
      },
      
      addNote: async (n) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await setDoc(doc(db, `users/${userId}/notes`, n.id), { ...n, userId });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userId}/notes`);
        }
      },
      updateNote: async (id, params) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        const current = useStore.getState().notes.find(n => n.id === id);
        if (!current) return;
        try {
          await setDoc(doc(db, `users/${userId}/notes`, id), { ...current, ...params, updatedAt: new Date().toISOString(), userId }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/notes`);
        }
      },
      deleteNote: async (id) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await deleteDoc(doc(db, `users/${userId}/notes`, id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${userId}/notes`);
        }
      },
      
      resetData: () => set({
        user: null,
        transactions: [],
        projects: [],
        tasks: [],
        recurringPayments: [],
        notes: [],
      }),
    }),
    {
      name: 'founder-os-storage',
    }
  )
);
