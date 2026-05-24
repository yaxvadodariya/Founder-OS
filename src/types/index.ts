export type TransactionType = 'income' | 'expense';
export type FinanceCategory = 'personal' | 'business';
export type ProjectStatus = 'lead' | 'active' | 'completed' | 'on-hold' | 'cancelled';
export type TaskPriority = 'high' | 'medium' | 'low';
export type PaymentFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type NoteCategory = 'idea' | 'important' | 'remember' | 'quote' | 'learning' | 'contact';
export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid';

export interface Invoice {
  id: string;
  projectId: string;
  milestoneId?: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  description?: string;
}

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
  isPublic?: boolean;
  hourlyRate?: number;
  timeSpent?: number;
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
  timeSpent?: number;
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  frequency: PaymentFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  category: string;
  categoryGroup?: 'business' | 'personal';
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

export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  completedDates: string[];
  createdAt: string;
  active: boolean;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'savings' | 'income' | 'expense-limit';
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  morningPlan: string;
  eveningReflection: string;
  mood: number;
  wins: string[];
  challenges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  tags: string[];
  createdAt: string;
}

export interface DashboardWidgets {
  balanceCard: boolean;
  chart: boolean;
  tasksSummary: boolean;
  upcomingPayments: boolean;
  spendingBreakdown: boolean;
  revenueForecast: boolean;
}
