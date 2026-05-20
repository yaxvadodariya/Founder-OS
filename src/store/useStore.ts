import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, deleteDoc, collection, onSnapshot, deleteField } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Transaction, Project, Task, RecurringPayment, Note, User } from '../types';
// We'll keep sample data available but not loaded by default for authenticated users.

const sanitizeDoc = (obj: any, isUpdate = false) => {
  if (!obj) return obj;
  const clean = { ...obj };
  Object.keys(clean).forEach(key => {
    if (clean[key] === undefined) {
      if (isUpdate) {
        clean[key] = deleteField();
      } else {
        delete clean[key];
      }
    }
  });
  return clean;
};

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
  currency: string;
  
  // Actions
  setUser: (user: User) => void;
  togglePrivacyMode: () => void;
  setPrivacyMode: (enabled: boolean) => void;
  setPeeking: (peeking: boolean) => void;
  toggleDarkMode: () => void;
  setCurrency: (currency: string) => void;
  
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

const getBrowserCurrency = (): string => {
  try {
    if (typeof navigator !== 'undefined') {
      const locale = navigator.language;
      if (locale.includes('IN')) return 'INR';
      if (locale.includes('GB')) return 'GBP';
      if (locale.includes('DE') || locale.includes('FR') || locale.includes('IT') || locale.includes('ES') || locale.includes('NL')) return 'EUR';
      if (locale.includes('AU')) return 'AUD';
      if (locale.includes('CA')) return 'CAD';
      if (locale.includes('SG')) return 'SGD';
      if (locale.includes('AE')) return 'AED';
    }
  } catch(e) {}
  return 'USD';
};

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
      currency: getBrowserCurrency(),
      lastError: null,
      setLastError: (err) => set({ lastError: err }),

      setUser: (user) => set({ user }),
      togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),
      setPrivacyMode: (enabled) => set({ isPrivacyMode: enabled }),
      setPeeking: (peeking) => set({ isPeeking: peeking }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setCurrency: (currency) => set({ currency }),
      
      addTransaction: async (ts, skipNotify) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await setDoc(doc(db, `users/${userId}/transactions`, ts.id), sanitizeDoc({ ...ts, userId }));
          
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
          await setDoc(doc(db, `users/${userId}/transactions`, id), sanitizeDoc({ ...current, ...params, userId }, true), { merge: true });
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
          await setDoc(doc(db, `users/${userId}/projects`, p.id), sanitizeDoc({ ...p, userId }));
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
          await setDoc(doc(db, `users/${userId}/projects`, id), sanitizeDoc({ ...current, ...params, userId }, true), { merge: true });
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
          await setDoc(doc(db, `users/${userId}/tasks`, t.id), sanitizeDoc({ ...t, userId }));
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
          await setDoc(doc(db, `users/${userId}/tasks`, id), sanitizeDoc({ ...current, ...params, userId }, true), { merge: true });
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
          await setDoc(doc(db, `users/${userId}/tasks`, id), sanitizeDoc({ 
            ...t, 
            completed: !t.completed, 
            completedAt: !t.completed ? now : undefined,
            userId
          }, true), { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/tasks`);
        }
      },
      
      addRecurringPayment: async (rp) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await setDoc(doc(db, `users/${userId}/recurringPayments`, rp.id), sanitizeDoc({ ...rp, userId }));
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
          await setDoc(doc(db, `users/${userId}/recurringPayments`, id), sanitizeDoc({ ...current, ...params, userId }, true), { merge: true });
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
          const noteObj = {
            id: n.id,
            title: n.title || '',
            content: n.content || '',
            category: n.category || 'idea',
            tags: n.tags || [],
            pinned: n.pinned !== undefined ? n.pinned : false,
            createdAt: n.createdAt || new Date().toISOString(),
            updatedAt: n.updatedAt || new Date().toISOString(),
            userId
          };
          if (n.reminderDate !== undefined) {
            // @ts-ignore
            noteObj.reminderDate = n.reminderDate;
          }
          await setDoc(doc(db, `users/${userId}/notes`, n.id), sanitizeDoc(noteObj));
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
          await setDoc(doc(db, `users/${userId}/notes`, id), sanitizeDoc({ ...current, ...params, updatedAt: new Date().toISOString(), userId }, true), { merge: true });
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
