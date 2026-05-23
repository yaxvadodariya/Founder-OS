import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, deleteDoc, collection, onSnapshot, deleteField } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Transaction, Project, Task, RecurringPayment, Note, User, Invoice, InvoiceStatus } from '../types';
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
  
  invoices: Invoice[];
  activeTimer: { id: string; type: 'project' | 'task'; startTime: string } | null;
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  startTimer: (id: string, type: 'project' | 'task') => void;
  stopTimer: () => Promise<void>;
  resetTimer: () => void;
  convertTimeToInvoice: (projectId: string, hourlyRate: number) => Promise<void>;

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
      invoices: [] as Invoice[],
      activeTimer: null as { id: string; type: 'project' | 'task'; startTime: string } | null,
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

      addInvoice: async (invoice) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await setDoc(doc(db, `users/${userId}/invoices`, invoice.id), sanitizeDoc(invoice));
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userId}/invoices`);
        }
      },
      updateInvoiceStatus: async (id, status) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        const current = useStore.getState().invoices.find(inv => inv.id === id);
        if (!current) return;
        const now = new Date().toISOString();
        const updates: Partial<Invoice> = { status };
        if (status === 'paid') {
          updates.paidAt = now;
        } else if (status === 'sent') {
          updates.sentAt = now;
        }
        try {
          await setDoc(doc(db, `users/${userId}/invoices`, id), sanitizeDoc({ ...current, ...updates }, true), { merge: true });
          
          if (status === 'paid') {
            const project = useStore.getState().projects.find(p => p.id === current.projectId);
            const projectName = project ? project.name : 'Unknown Project';
            
            const transactionId = Math.random().toString(36).substring(2, 11);
            const newTransaction: Transaction = {
              id: transactionId,
              type: 'income',
              category: 'business',
              amount: current.amount,
              categoryDetail: 'Invoice Payment',
              date: now.split('T')[0],
              description: `Payment for Invoice ${current.invoiceNumber} (${projectName})`,
              paymentMethod: 'Bank Transfer'
            };
            await useStore.getState().addTransaction(newTransaction);
            
            if (project) {
              const parsedReceived = (project.amountReceived || 0) + current.amount;
              const amountPending = Math.max(0, project.value - parsedReceived);
              await useStore.getState().updateProject(project.id, {
                amountReceived: parsedReceived,
                amountPending
              });
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/invoices`);
        }
      },
      deleteInvoice: async (id) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        try {
          await deleteDoc(doc(db, `users/${userId}/invoices`, id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${userId}/invoices`);
        }
      },

      startTimer: (id, type) => {
        set({
          activeTimer: {
            id,
            type,
            startTime: new Date().toISOString()
          }
        });
      },
      stopTimer: async () => {
        const { activeTimer, projects, tasks } = useStore.getState();
        if (!activeTimer) return;
        
        const elapsedSeconds = Math.round((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);
        if (elapsedSeconds > 0) {
          if (activeTimer.type === 'project') {
            const project = projects.find(p => p.id === activeTimer.id);
            if (project) {
              const currentSeconds = project.timeSpent || 0;
              await useStore.getState().updateProject(activeTimer.id, {
                timeSpent: currentSeconds + elapsedSeconds
              });
            }
          } else if (activeTimer.type === 'task') {
            const task = tasks.find(t => t.id === activeTimer.id);
            if (task) {
              const currentSeconds = task.timeSpent || 0;
              await useStore.getState().updateTask(activeTimer.id, {
                timeSpent: currentSeconds + elapsedSeconds
              });
              
              if (task.projectId) {
                const project = projects.find(p => p.id === task.projectId);
                if (project) {
                  const currentProjSeconds = project.timeSpent || 0;
                  await useStore.getState().updateProject(task.projectId, {
                    timeSpent: currentProjSeconds + elapsedSeconds
                  });
                }
              }
            }
          }
        }
        set({ activeTimer: null });
      },
      resetTimer: () => {
        set({ activeTimer: null });
      },

      convertTimeToInvoice: async (projectId, hourlyRate) => {
        const { projects, tasks } = useStore.getState();
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const projTasks = tasks.filter(t => t.projectId === projectId);
        const tasksTime = projTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
        const directTime = project.timeSpent || 0;
        const totalSeconds = directTime + tasksTime;

        if (totalSeconds <= 0) return;

        const totalHours = totalSeconds / 3600;
        const amount = Math.round(totalHours * hourlyRate);

        const invoiceId = Math.random().toString(36).substring(2, 11);
        const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

        const newInvoice: Invoice = {
          id: invoiceId,
          projectId: projectId,
          invoiceNumber: invoiceNumber,
          amount: amount,
          status: 'draft',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          description: `Time billing: ${totalHours.toFixed(2)} hours logged at ₹${hourlyRate}/hr.`
        };

        await useStore.getState().addInvoice(newInvoice);
        
        await useStore.getState().updateProject(projectId, {
          timeSpent: 0
        });

        for (const t of projTasks) {
          if (t.timeSpent && t.timeSpent > 0) {
            await useStore.getState().updateTask(t.id, {
              timeSpent: 0
            });
          }
        }
      },
      
      resetData: () => set({
        user: null,
        transactions: [],
        projects: [],
        tasks: [],
        recurringPayments: [],
        notes: [],
        invoices: [],
        activeTimer: null,
      }),
    }),
    {
      name: 'founder-os-storage',
    }
  )
);
