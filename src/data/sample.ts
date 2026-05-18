import { Transaction, Project, Task, RecurringPayment, Note, User } from '../types';

export const sampleUser: User = {
  name: 'Yax Buzz',
  email: 'yax@example.com',
  createdAt: new Date().toISOString(),
};

export const sampleTransactions: Transaction[] = [
  {
    id: 'tx1',
    type: 'income',
    category: 'business',
    amount: 150000,
    categoryDetail: 'Client Payment',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    description: 'Website Redesign Advance',
    paymentMethod: 'Bank Transfer',
  },
  {
    id: 'tx2',
    type: 'expense',
    category: 'personal',
    amount: 35000,
    categoryDetail: 'Rent',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    description: 'Apartment Rent',
    paymentMethod: 'UPI',
  },
  {
    id: 'tx3',
    type: 'expense',
    category: 'business',
    amount: 4500,
    categoryDetail: 'Software Tools',
    date: new Date(Date.now() - 10 * 86400000).toISOString(),
    description: 'Figma & Notion Subscriptions',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'tx4',
    type: 'income',
    category: 'business',
    amount: 80000,
    categoryDetail: 'Client Payment',
    date: new Date(Date.now() - 15 * 86400000).toISOString(),
    description: 'App Development Milestone',
    paymentMethod: 'Bank Transfer',
  },
  {
    id: 'tx5',
    type: 'expense',
    category: 'personal',
    amount: 2500,
    categoryDetail: 'Food',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    description: 'Groceries',
    paymentMethod: 'UPI',
  },
];

export const sampleProjects: Project[] = [
  {
    id: 'p1',
    name: 'Fintech Dashboard UI',
    clientName: 'Nexus Tech',
    clientEmail: 'contact@nexustech.com',
    status: 'active',
    value: 300000,
    amountReceived: 100000,
    amountPending: 200000,
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
    progress: 45,
    description: 'Complete UI/UX design for new fintech dashboard platform.',
    deliverables: ['Wireframes', 'High-fidelity mockups', 'Design system'],
    notes: 'Client prefers dark mode, but we will start with light mode.',
    milestones: [
      { id: 'm1', name: 'Wireframes Approval', amount: 100000, dueDate: new Date(Date.now() - 10 * 86400000).toISOString(), completed: true },
      { id: 'm2', name: 'Initial Design Review', amount: 100000, dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), completed: false },
      { id: 'm3', name: 'Final Handover', amount: 100000, dueDate: new Date(Date.now() + 15 * 86400000).toISOString(), completed: false },
    ],
  },
  {
    id: 'p2',
    name: 'E-commerce Mobile App',
    clientName: 'FreshMart',
    clientEmail: 'hello@freshmart.com',
    status: 'active',
    value: 500000,
    amountReceived: 250000,
    amountPending: 250000,
    startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    progress: 70,
    description: 'React Native app for grocery delivery.',
    deliverables: ['iOS App', 'Android App', 'Admin Panel UI'],
    notes: 'Integration with Stripe required.',
    milestones: [
      { id: 'm4', name: 'UI Finalized', amount: 150000, dueDate: new Date(Date.now() - 40 * 86400000).toISOString(), completed: true },
      { id: 'm5', name: 'Beta Release', amount: 100000, dueDate: new Date(Date.now() - 10 * 86400000).toISOString(), completed: true },
      { id: 'm6', name: 'App Store Launch', amount: 250000, dueDate: new Date(Date.now() + 30 * 86400000).toISOString(), completed: false },
    ],
  }
];

export const sampleTasks: Task[] = [
  {
    id: 't1',
    title: 'Review Fintech wireframes',
    description: 'Go over the latest feedback from Nexus tech on the home screen.',
    priority: 'high',
    dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
    completed: false,
    projectId: 'p1',
    tags: ['design', 'review'],
    subtasks: [
      { id: 'st1', title: 'Check mobile responsiveness', completed: false },
      { id: 'st2', title: 'Update color palette based on feedback', completed: true }
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 't2',
    title: 'Send invoice to FreshMart',
    priority: 'medium',
    dueDate: new Date().toISOString(),
    completed: false,
    projectId: 'p2',
    tags: ['finance', 'invoice'],
    subtasks: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't3',
    title: 'Research new AI design tools',
    priority: 'low',
    completed: false,
    tags: ['learning', 'research'],
    subtasks: [],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  }
];

export const samplePayments: RecurringPayment[] = [
  {
    id: 'rp1',
    name: 'Office Rent',
    amount: 15000,
    frequency: 'monthly',
    dayOfMonth: 5,
    category: 'Rent',
    startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
    active: true,
    reminderDays: [3, 1],
  },
  {
    id: 'rp2',
    name: 'Adobe Creative Cloud',
    amount: 4500,
    frequency: 'monthly',
    dayOfMonth: 12,
    category: 'Software Tools',
    startDate: new Date(Date.now() - 150 * 86400000).toISOString(),
    active: true,
    reminderDays: [1],
  }
];

export const sampleNotes: Note[] = [
  {
    id: 'n1',
    title: 'Marketing Idea for 2024',
    content: 'Start a weekly newsletter for solo founders sharing design tips and business systems. We could call it "Founder OS Weekly". Focus on actionable advice, not just theory.',
    category: 'idea',
    tags: ['marketing', 'newsletter'],
    pinned: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'n2',
    title: 'Tax deadlines',
    content: '- Advance tax installment 1: June 15\n- Advance tax installment 2: Sept 15\n- Advance tax installment 3: Dec 15\n- Advance tax installment 4: Mar 15',
    category: 'important',
    tags: ['finance', 'tax'],
    pinned: false,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  }
];
