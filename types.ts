export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
}

export interface Budget {
  category: string;
  limit: number;
  rollover: boolean;
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

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  color: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'info';
  date: string;
  read: boolean;
}

export const INITIAL_CATEGORIES: Category[] = [
  // Expenses (Spend) - From PDF
  { id: '1', name: 'Business Promotion & Advertising', color: '#ef4444', type: 'expense' }, // red-500
  { id: '2', name: 'Other Marketing Expense', color: '#f59e0b', type: 'expense' }, // amber-500
  { id: '3', name: 'Software/SaaS', color: '#3b82f6', type: 'expense' }, // blue-500
  { id: '4', name: 'Events', color: '#8b5cf6', type: 'expense' }, // violet-500
  
  // Income (Funding)
  { id: '7', name: 'Quarterly Budget', color: '#059669', type: 'income' }, // emerald-600
  { id: '8', name: 'Extra Grant', color: '#0ea5e9', type: 'income' }, // sky-500
  { id: '9', name: 'ROI Reinvestment', color: '#14b8a6', type: 'income' }, // teal-500
];