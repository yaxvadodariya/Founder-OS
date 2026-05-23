export type TransactionType = 'income' | 'expense';
export type FinanceCategory = 'personal' | 'business';
export type ProjectStatus = 'lead' | 'active' | 'completed' | 'on-hold' | 'cancelled';
export type TaskPriority = 'high' | 'medium' | 'low';
export type PaymentFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type NoteCategory = 'idea' | 'important' | 'remember' | 'quote' | 'learning' | 'contact';

export interface User {
  name: string;
  email?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: FinanceCategory;
  amount: number;
  categoryDetail: string;
  date: string;
  description: string;
  paymentMethod: string;
  receiptImage?: string;
}

export interface Milestone {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  status: ProjectStatus;
  value: number;
  amountReceived: number;
  amountPending: number;
  startDate: string;
  deadline: string;
  completedDate?: string;
  progress: number;
  description: string;
  deliverables: string[];
  notes: string;
  milestones: Milestone[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  completed: boolean;
  projectId?: string;
  tags: string[];
  subtasks: SubTask[];
  createdAt: string;
  completedAt?: string;
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  frequency: PaymentFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  category: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  reminderDays: number[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  pinned: boolean;
  reminderDate?: string;
  createdAt: string;
  updatedAt: string;
}
