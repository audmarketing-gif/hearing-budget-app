export type TransactionType = 'expense' | 'allocation';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  company?: string;
  invoiceNo?: string;
  poNo?: string;
}

export interface Budget {
  category: string;
  limit: number;
  rollover: boolean;
  docId?: string;
}

export interface BudgetSource {
  id: string;
  name: 'Primary Budget' | 'Principle Grants' | 'Group Grants';
  amount: number;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
}

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  frequency: Frequency;
  nextDueDate: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'info';
  date: string;
  read: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  color: string;
}

export interface AppSettings {
  alertEmail: string;
  emailServiceId?: string;
  emailTemplateId?: string;
  emailPublicKey?: string;
}

export const INITIAL_CATEGORIES: Category[] = [
  // Expenses
  { id: '1', name: 'Business Promotion & Advertising', color: '#ef4444', type: 'expense' },
  { id: '2', name: 'Other Marketing Expense', color: '#f59e0b', type: 'expense' },
  { id: '3', name: 'Software/SaaS', color: '#3b82f6', type: 'expense' },
  { id: '4', name: 'Events', color: '#8b5cf6', type: 'expense' },
  
  // Allocations (formerly Income)
  { id: '7', name: 'Quarterly Budget', color: '#059669', type: 'allocation' },
  { id: '8', name: 'Extra Grant', color: '#0ea5e9', type: 'allocation' },
  { id: '9', name: 'ROI Reinvestment', color: '#14b8a6', type: 'allocation' },
];