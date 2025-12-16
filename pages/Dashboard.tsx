import React from 'react';
import { Transaction, Budget, Category } from '../types';
import StatsCards from '../components/StatsCards';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  categories?: Category[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, budgets, categories = [] }) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Prepare Pie Chart Data
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value: Number(value) }));
  
  // Default colors fallback
  const DEFAULT_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#64748b', '#ec4899', '#14b8a6'];

  const getCategoryColor = (catName: string, index: number) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.color : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Team Dashboard</h1>
          <p className="text-stone-500 mt-1">Marketing budget overview and spend tracking.</p>
        </div>
      </div>

      <StatsCards income={totalIncome} expenses={totalExpenses} balance={balance} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-stone-100">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Recent Transactions</h2>
          <div className="space-y-4">
            {recentTransactions.map(t => {
               const cat = categories.find(c => c.name === t.category);
               const catColor = cat ? cat.color : '#a8a29e'; // stone-400 default

               return (
                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold`}
                      style={{ backgroundColor: t.type === 'income' ? '#10b981' : catColor }}
                    >
                      {t.category.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-bold text-stone-800">{t.description}</p>
                      <p className="text-xs text-stone-500">{t.date} • {t.category}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-stone-800'}`}>
                    {t.type === 'income' ? '+' : '-'}LKR {t.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
            {recentTransactions.length === 0 && (
              <p className="text-stone-500 text-center py-4">No recent activity found.</p>
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 min-w-0">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Spend by Channel</h2>
          <div className="h-64 w-full relative">
             {pieData.length > 0 ? (
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`LKR ${Number(value).toFixed(2)}`, 'Spend']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             ) : (
                <div className="flex h-full items-center justify-center text-stone-400 text-sm">
                  No expense data to display
                </div>
             )}
          </div>
          <div className="mt-4 space-y-2">
             {pieData.map((entry, index) => (
               <div key={entry.name} className="flex items-center justify-between text-sm">
                 <div className="flex items-center">
                   <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getCategoryColor(entry.name, index) }}></div>
                   <span className="text-stone-600">{entry.name}</span>
                 </div>
                 <span className="font-medium text-stone-800">LKR {entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;