import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, Project, Task, RecurringPayment, Note, User } from '../types';
import { sampleUser, sampleTransactions, sampleProjects, sampleTasks, samplePayments, sampleNotes } from '../data/sample';

interface StoreState {
  user: User | null;
  transactions: Transaction[];
  projects: Project[];
  tasks: Task[];
  recurringPayments: RecurringPayment[];
  notes: Note[];
  isPrivacyMode: boolean;
  
  // Actions
  setUser: (user: User) => void;
  togglePrivacyMode: () => void;
  setPrivacyMode: (enabled: boolean) => void;
  
  addTransaction: (ts: Transaction) => void;
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
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: sampleUser,
      transactions: sampleTransactions,
      projects: sampleProjects,
      tasks: sampleTasks,
      recurringPayments: samplePayments,
      notes: sampleNotes,
      isPrivacyMode: true,

      setUser: (user) => set({ user }),
      togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),
      setPrivacyMode: (enabled) => set({ isPrivacyMode: enabled }),
      
      addTransaction: (ts) => set((state) => ({ transactions: [ts, ...state.transactions] })),
      deleteTransaction: (id) => set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) })),
      
      addProject: (p) => set((state) => ({ projects: [p, ...state.projects] })),
      updateProject: (id, params) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...params } : p)
      })),
      deleteProject: (id) => set((state) => ({ projects: state.projects.filter(p => p.id !== id) })),
      
      addTask: (t) => set((state) => ({ tasks: [t, ...state.tasks] })),
      updateTask: (id, params) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...params } : t)
      })),
      deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) })),
      toggleTaskCompletion: (id) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id === id) {
             const now = new Date().toISOString();
             return { ...t, completed: !t.completed, completedAt: !t.completed ? now : undefined };
          }
          return t;
        })
      })),
      
      addRecurringPayment: (rp) => set((state) => ({ recurringPayments: [rp, ...state.recurringPayments] })),
      updateRecurringPayment: (id, params) => set((state) => ({
        recurringPayments: state.recurringPayments.map(rp => rp.id === id ? { ...rp, ...params } : rp)
      })),
      deleteRecurringPayment: (id) => set((state) => ({ recurringPayments: state.recurringPayments.filter(rp => rp.id !== id) })),
      
      addNote: (n) => set((state) => ({ notes: [n, ...state.notes] })),
      updateNote: (id, params) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, ...params, updatedAt: new Date().toISOString() } : n)
      })),
      deleteNote: (id) => set((state) => ({ notes: state.notes.filter(n => n.id !== id) })),
      
      resetData: () => set({
        user: sampleUser,
        transactions: sampleTransactions,
        projects: sampleProjects,
        tasks: sampleTasks,
        recurringPayments: samplePayments,
        notes: sampleNotes,
      }),
    }),
    {
      name: 'founder-os-storage',
    }
  )
);
