import React, { useState, useEffect } from 'react';
import { Transaction, Budget } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { Sparkles, BarChart2, Pencil, Check, X, ToggleLeft, ToggleRight, RotateCcw, TrendingUp, CheckCircle, AlertTriangle, ShieldCheck, ShieldAlert, Layout } from 'lucide-react';
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

  // -- State for Channel Caps --
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

  // --- Calculations for Chart & Kanban ---
  const currentMonthSpend = transactions
    .filter(t => {
      const d = new Date(t.date);
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
      const isSpend = t.type === 'expense' || (t.type === 'allocation' && d < today);
      return isSpend && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const getEffectiveLimit = (budget: Budget) => {
    let limit = budget.limit;
    if (budget.rollover) {
      const prevSpend = prevMonthSpend[budget.category] || 0;
      limit += Math.max(0, budget.limit - prevSpend);
    }
    return limit;
  };

  // --- Kanban Logic ---
  const kanbanData = budgets.map(b => {
    const spend = currentMonthSpend[b.category] || 0;
    const limit = getEffectiveLimit(b);
    const ratio = limit > 0 ? spend / limit : 0;
    
    let status: 'optimal' | 'warning' | 'over' = 'optimal';
    if (ratio > 1) status = 'over';
    else if (ratio >= 0.75) status = 'warning';

    return { ...b, spend, limit, ratio, status };
  });

  const optimalItems = kanbanData.filter(i => i.status === 'optimal');
  const warningItems = kanbanData.filter(i => i.status === 'warning');
  const overItems = kanbanData.filter(i => i.status === 'over');

  // --- Editing Logic ---
  const startEditing = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setEditValue(currentLimit.toString());
  };

  const saveBudget = (category: string, currentRollover: boolean) => {
    const limit = parseFloat(editValue);
    if (!isNaN(limit) && limit >= 0) {
      onUpdateBudget(category, limit, currentRollover);
      setSaveSuccess(category);
      setTimeout(() => setSaveSuccess(null), 2000);
    }
    setEditingCategory(null);
  };

  const toggleRollover = (category: string, limit: number, currentRollover: boolean) => {
    onUpdateBudget(category, limit, !currentRollover);
    setSaveSuccess(category);
    setTimeout(() => setSaveSuccess(null), 2000);
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

  const KanbanColumn = ({ title, items, colorClass, icon: Icon }: any) => (
    <div className="bg-stone-50/50 rounded-xl p-4 border border-stone-200/60 min-h-[400px] flex flex-col">
      <div className={`flex items-center justify-between mb-4 pb-2 border-b border-stone-200`}>
        <div className="flex items-center gap-2">
          <Icon size={18} className={colorClass} />
          <h3 className="font-bold text-stone-700 text-sm uppercase tracking-wider">{title}</h3>
        </div>
        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-stone-400 border border-stone-100">
          {items.length}
        </span>
      </div>
      <div className="space-y-3 flex-1">
        {items.map((item: any) => (
          <div key={item.category} className="bg-white p-4 rounded-lg shadow-sm border border-stone-100 group hover:border-emerald-200 transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-bold text-stone-800 line-clamp-1">{item.category}</span>
              {item.ratio > 0.9 && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
            </div>
            <div className="flex justify-between text-[10px] text-stone-500 mb-1">
              <span>{Math.round(item.ratio * 100)}% Used</span>
              <span>LKR {(item.limit - item.spend).toLocaleString()} left</span>
            </div>
            <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${item.status === 'over' ? 'bg-rose-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(item.ratio * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-stone-300 italic text-xs">
            No categories
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Financial Insights</h1>
          <p className="text-stone-500 text-sm">Strategic analysis and budget performance board.</p>
        </div>
      </div>

      {/* Kanban Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
        <div className="flex items-center gap-2 mb-6">
          <Layout size={20} className="text-blue-900" />
          <h2 className="text-lg font-bold text-stone-800">Spending Health Board</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KanbanColumn 
            title="Optimal" 
            items={optimalItems} 
            colorClass="text-emerald-500" 
            icon={ShieldCheck} 
          />
          <KanbanColumn 
            title="At Risk" 
            items={warningItems} 
            colorClass="text-amber-500" 
            icon={AlertTriangle} 
          />
          <KanbanColumn 
            title="Overspent" 
            items={overItems} 
            colorClass="text-rose-500" 
            icon={ShieldAlert} 
          />
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-xl shadow-sm border border-emerald-100">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg mr-3">
            <Sparkles className="text-emerald-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-800">AI Financial Advisor</h2>
            <p className="text-sm text-stone-500">Intelligent context-aware budget analysis.</p>
          </div>
        </div>
        <div className="min-h-[100px] mb-4 text-stone-700 text-sm leading-relaxed">
          {loading ? (
            <div className="flex items-center justify-center h-40 space-x-2 animate-pulse">
              <span className="text-emerald-600 font-medium">Synthesizing data...</span>
            </div>
          ) : advice ? (
            <ReactMarkdown
              className="prose prose-stone prose-sm max-w-none"
              components={{
                h1: ({node, ...props}) => <h1 className="text-lg font-bold text-stone-900 mb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-base font-bold text-stone-900 mb-2 mt-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
              }}
            >
              {advice}
            </ReactMarkdown>
          ) : (
            "Ready to analyze your team's spending patterns and channel efficiency."
          )}
        </div>
        <button
          onClick={handleGetAdvice}
          disabled={loading}
          className="w-full py-3 bg-stone-800 hover:bg-stone-900 disabled:bg-stone-300 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Processing...' : <><Sparkles size={18} /> Generate Strategy Report</>}
        </button>
      </div>

      {/* Existing Controls & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
          <div className="flex items-center mb-6">
            <BarChart2 className="text-stone-400 mr-2" />
            <h2 className="text-lg font-bold text-stone-800">Spend vs Allocations</h2>
          </div>
          <div className="h-80 w-full relative">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kanbanData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="spend" name="Spent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="limit" name="Limit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-600" />
            Active Channel Control
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {budgets.slice(0, 4).map(budget => {
              const item = kanbanData.find(k => k.category === budget.category);
              if (!item) return null;
              const isEditing = editingCategory === budget.category;
              const isPacingOpen = expandedPacing === budget.category;

              return (
                <div key={budget.category} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-stone-700">{budget.category}</span>
                    <div className="flex items-center gap-2">
                       <button onClick={() => setExpandedPacing(isPacingOpen ? null : budget.category)} className="p-1 text-stone-400 hover:text-blue-600"><TrendingUp size={14}/></button>
                       <button onClick={() => startEditing(budget.category, budget.limit)} className="p-1 text-stone-400 hover:text-emerald-600"><Pencil size={14}/></button>
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="flex gap-2 items-center mb-2">
                      <input 
                        type="number" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 text-xs p-2 border rounded"
                      />
                      <button onClick={() => saveBudget(budget.category, budget.rollover)} className="bg-emerald-600 text-white p-2 rounded"><Check size={14}/></button>
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs text-stone-500 mb-2">
                      <span>Limit: LKR {budget.limit.toLocaleString()}</span>
                      <span className={item.status === 'over' ? 'text-rose-600 font-bold' : ''}>
                        {Math.round(item.ratio * 100)}%
                      </span>
                    </div>
                  )}
                  {isPacingOpen && (
                    <div className="h-32 w-full mt-2">
                      <ResponsiveContainer>
                        <LineChart data={getPacingData(budget.category, item.limit)}>
                          <Line type="monotone" dataKey="actual" stroke="#10b981" dot={false} strokeWidth={2} />
                          <Line type="monotone" dataKey="ideal" stroke="#e5e7eb" dot={false} strokeDasharray="3 3" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;