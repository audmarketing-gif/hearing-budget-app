import React, { useState, useEffect } from 'react';
import { Transaction, Budget } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { Sparkles, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface InsightsPageProps {
  transactions: Transaction[];
  budgets: Budget[];
}

const InsightsPage: React.FC<InsightsPageProps> = ({ transactions, budgets }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGetAdvice = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(transactions, budgets);
    setAdvice(result);
    setLoading(false);
  };

  // Prepare Chart Data
  const categoryData = transactions.reduce((acc, t) => {
    const existing = acc.find(item => item.name === t.category);
    if (existing) {
      if (t.type === 'income') existing.income += t.amount;
      else existing.expense += t.amount;
    } else {
      acc.push({
        name: t.category,
        income: t.type === 'income' ? t.amount : 0,
        expense: t.type === 'expense' ? t.amount : 0
      });
    }
    return acc;
  }, [] as { name: string; income: number; expense: number }[]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Financial Insights</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Advisor Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-xl shadow-sm border border-emerald-100">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg mr-3">
              <Sparkles className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">AI Financial Advisor</h2>
              <p className="text-sm text-stone-500">Get personalized budget adjustments and tips.</p>
            </div>
          </div>

          <div className="min-h-[200px] mb-4 text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">
            {loading ? (
              <div className="flex items-center justify-center h-40 space-x-2 animate-pulse">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animation-delay-200"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animation-delay-400"></div>
                <span className="ml-2 text-emerald-600 font-medium">Analyzing your finances...</span>
              </div>
            ) : advice ? (
              <div className="prose prose-sm prose-stone max-w-none">
                {advice}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-stone-400 text-center">
                <p>Click the button below to generate an AI assessment of your income stability and spending habits.</p>
              </div>
            )}
          </div>

          <button
            onClick={handleGetAdvice}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center"
          >
            {loading ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>

        {/* Comparison Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col min-w-0">
          <div className="flex items-center mb-6">
            <BarChart2 className="text-stone-400 mr-2" />
            <h2 className="text-lg font-bold text-stone-800">Income vs Expenses by Category</h2>
          </div>
          
          <div className="h-96 w-full relative">
            <div className="absolute inset-0">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#78716c' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#78716c' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#fafaf9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;