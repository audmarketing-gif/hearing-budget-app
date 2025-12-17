import React, { useState, useEffect } from 'react';
import { Transaction, Budget } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { Sparkles, BarChart2, Pencil, Check, X, ToggleLeft, ToggleRight, RotateCcw, TrendingUp, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import ReactMarkdown from 'react-markdown';

interface InsightsPageProps {
  transactions: Transaction[];
  budgets: Budget[];
  onUpdateBudget: (category: string, limit: number, rollover: boolean) => void;
}

const InsightsPage: React.FC<InsightsPageProps> = ({ transactions, budgets, onUpdateBudget }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // -- State for Channel Caps (Moved from Old Budgets Page) --
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [expandedPacing, setExpandedPacing] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGetAdvice = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(transactions, budgets);
    setAdvice(result);
    setLoading(false);
  };

  // --- Chart Data Prep ---
  const categoryData = transactions.reduce((acc, t) => {
    const existing = acc.find(item => item.name === t.category);
    // Treat expired allocations as 'expense' for charts too, or strictly type check? 
    // Insights usually track Spending patterns, so let's stick to Type 'expense'.
    if (t.type === 'expense') {
      if (existing) {
         existing.expense += t.amount;
      } else {
        acc.push({ name: t.category, expense: t.amount, allocation: 0 });
      }
    } else if (t.type === 'allocation') {
       if (existing) {
         existing.allocation += t.amount;
       } else {
         acc.push({ name: t.category, expense: 0, allocation: t.amount });
       }
    }
    return acc;
  }, [] as { name: string; expense: number; allocation: number }[]);

  // --- Channel Caps Logic ---
  const currentMonthSpend = transactions
    .filter(t => {
      const d = new Date(t.date);
      // Spend includes Expenses + Expired Allocations
      const isSpend = t.type === 'expense' || (t.type === 'allocation' && d <= today);
      return isSpend && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const prevDate = new Date();
  prevDate.setMonth(currentMonth - 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const prevMonthSpend = transactions
    .filter(t => {
      const d = new Date(t.date);
      const isSpend = t.type === 'expense' || (t.type === 'allocation' && d < today); // roughly
      return isSpend && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const startEditing = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setEditValue(currentLimit.toString());
  };

  const saveBudget = (category: string, currentRollover: boolean) => {
    const limit = parseFloat(editValue);
    if (!isNaN(limit) && limit >= 0) {
      onUpdateBudget(category, limit, currentRollover);
      triggerSuccess(category);
    }
    setEditingCategory(null);
  };

  const toggleRollover = (category: string, limit: number, currentRollover: boolean) => {
    onUpdateBudget(category, limit, !currentRollover);
    triggerSuccess(category);
  };

  const triggerSuccess = (category: string) => {
    setSaveSuccess(category);
    setTimeout(() => setSaveSuccess(null), 2000);
  };

  const togglePacing = (category: string) => {
    setExpandedPacing(expandedPacing === category ? null : category);
  };

  const getPacingData = (category: string, limit: number) => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const data = [];
    let cumulativeSpend = 0;
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      const isSpend = t.type === 'expense' || (t.type === 'allocation' && d <= today);
      return t.category === category && isSpend && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const currentDay = today.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
       const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
       const dailySpend = monthTransactions
          .filter(t => t.date === dateStr)
          .reduce((sum, t) => sum + t.amount, 0);
       
       cumulativeSpend += dailySpend;
       const idealPacing = (limit / daysInMonth) * day;

       if (day <= currentDay) {
          data.push({ day, actual: cumulativeSpend, ideal: idealPacing });
       } else {
          data.push({ day, ideal: idealPacing });
       }
    }
    return data;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-stone-800">Financial Insights & Controls</h1>

      {/* AI Section */}
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
        <div className="min-h-[150px] mb-4 text-stone-700 text-sm leading-relaxed">
          {loading ? (
            <div className="flex items-center justify-center h-40 space-x-2 animate-pulse">
              <span className="ml-2 text-emerald-600 font-medium">Analyzing your finances...</span>
            </div>
          ) : advice ? (
            <ReactMarkdown
              components={{
                h1: ({...props}) => <h1 className="text-lg font-bold text-stone-900 mb-2" {...props} />,
                h2: ({...props}) => <h2 className="text-base font-bold text-stone-900 mb-2 mt-4" {...props} />,
                h3: ({...props}) => <h3 className="text-sm font-bold text-stone-900 mb-1 mt-2" {...props} />,
                p: ({...props}) => <p className="mb-3 last:mb-0" {...props} />,
                ul: ({...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                ol: ({...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                li: ({...props}) => <li className="pl-1" {...props} />,
                strong: ({...props}) => <strong className="font-bold text-stone-900" {...props} />,
              }}
            >
              {advice}
            </ReactMarkdown>
          ) : (
            "Click the button below to generate an AI assessment of your income stability and spending habits."
          )}
        </div>
        <button
          onClick={handleGetAdvice}
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-lg shadow-sm transition-colors"
        >
          {loading ? 'Analyzing...' : 'Generate Insights'}
        </button>
      </div>

      {/* Category Budget Limits Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
           <div>
              <h2 className="text-xl font-bold text-stone-800 flex items-center">
                Category Spending Limits
                <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Monthly Caps</span>
              </h2>
              <p className="text-sm text-stone-500 mt-1">Set the maximum spending limit for each category. Use the pencil icon to edit.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map(budget => {
            const spend = currentMonthSpend[budget.category] || 0;
            let effectiveLimit = budget.limit;
            let rolloverAmount = 0;
            if (budget.rollover) {
              const prevSpend = prevMonthSpend[budget.category] || 0;
              rolloverAmount = Math.max(0, budget.limit - prevSpend);
              effectiveLimit += rolloverAmount;
            }
            const percentage = effectiveLimit > 0 ? Math.min((spend / effectiveLimit) * 100, 100) : 0;
            const isOverBudget = spend > effectiveLimit && effectiveLimit > 0;
            const isEditing = editingCategory === budget.category;
            const isPacingOpen = expandedPacing === budget.category;
            const justSaved = saveSuccess === budget.category;
            const pacingData = isPacingOpen ? getPacingData(budget.category, effectiveLimit) : [];

            return (
              <div key={budget.category} className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 relative overflow-hidden transition-all hover:shadow-md">
                 {justSaved && <CheckCircle size={16} className="absolute top-2 right-2 text-emerald-500 animate-bounce" />}
                 
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center">
                     <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-400 mr-3">
                       {budget.category.charAt(0)}
                     </div>
                     <div>
                       <h3 className="font-bold text-stone-800">{budget.category}</h3>
                       <div className="flex items-center text-xs text-stone-500">
                         <span>Limit: LKR {budget.limit.toLocaleString()}</span>
                         {budget.rollover && rolloverAmount > 0 && (
                           <span className="ml-2 text-emerald-600 flex items-center" title="Budget rolled over from previous month">
                              <RotateCcw size={10} className="mr-1" /> +LKR {rolloverAmount.toLocaleString()}
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                   
                   {isEditing ? (
                      <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-right-4">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 px-2 py-1 text-sm border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="Limit"
                          autoFocus
                        />
                        <button onClick={() => saveBudget(budget.category, budget.rollover)} className="text-white bg-emerald-600 p-1 rounded hover:bg-emerald-700 transition-colors"><Check size={16}/></button>
                        <button onClick={() => setEditingCategory(null)} className="text-stone-400 p-1 hover:text-stone-600"><X size={16}/></button>
                      </div>
                   ) : (
                     <div className="flex items-center space-x-2">
                       <button onClick={() => togglePacing(budget.category)} className={`p-1.5 rounded transition-colors ${isPacingOpen ? 'bg-emerald-50 text-emerald-600' : 'text-stone-300 hover:text-stone-600 hover:bg-stone-50'}`} title="View Pacing Chart">
                         <TrendingUp size={16} />
                       </button>
                       <button onClick={() => startEditing(budget.category, budget.limit)} className="p-1.5 rounded text-stone-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Edit Monthly Limit">
                         <Pencil size={16} />
                       </button>
                       <button onClick={() => toggleRollover(budget.category, budget.limit, budget.rollover)} className={`p-1.5 rounded transition-colors ${budget.rollover ? 'text-emerald-600 bg-emerald-50' : 'text-stone-300 hover:text-stone-600'}`} title={budget.rollover ? "Rollover Enabled" : "Rollover Disabled"}>
                         {budget.rollover ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                       </button>
                     </div>
                   )}
                 </div>
                 
                 <div className="relative pt-1">
                   <div className="flex mb-2 items-center justify-between">
                     <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${isOverBudget ? 'text-rose-600 bg-rose-100' : 'text-emerald-600 bg-emerald-100'}`}>
                       {isOverBudget ? 'Over Cap' : 'On Track'}
                     </span>
                     <span className="text-xs font-semibold text-stone-600">
                       LKR {spend.toLocaleString()} / LKR {effectiveLimit.toLocaleString()}
                     </span>
                   </div>
                   <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-stone-100">
                     <div style={{ width: `${percentage}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                   </div>
                 </div>

                 {isPacingOpen && (
                    <div className="mt-4 pt-4 border-t border-stone-100 h-40 animate-in fade-in slide-in-from-top-2">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-stone-500">Daily Pacing (Ideal vs Actual)</span>
                       </div>
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={pacingData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                            <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Line type="monotone" dataKey="ideal" stroke="#d6d3d1" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                            <Line type="monotone" dataKey="actual" stroke={isOverBudget ? '#f43f5e' : '#10b981'} dot={false} strokeWidth={2} />
                          </LineChart>
                       </ResponsiveContainer>
                    </div>
                 )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Spend vs Allocation Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100" role="region" aria-label="Income vs Expense Chart">
        <div className="flex items-center mb-6">
          <BarChart2 className="text-stone-400 mr-2" />
          <h2 className="text-lg font-bold text-stone-800">Spend vs Allocations by Category</h2>
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
                  <Bar dataKey="allocation" name="Allocated" fill="#3b82f6" radius={[4, 4, 0, 0]} aria-label="Allocated Amount" />
                  <Bar dataKey="expense" name="Spent" fill="#f43f5e" radius={[4, 4, 0, 0]} aria-label="Spent Amount" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;