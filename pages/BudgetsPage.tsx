import React, { useState } from 'react';
import { Transaction, Budget } from '../types';
import { Pencil, Check, X, ToggleLeft, ToggleRight, RotateCcw, TrendingUp, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface BudgetsPageProps {
  transactions: Transaction[];
  budgets: Budget[];
  onUpdateBudget: (category: string, limit: number, rollover: boolean) => void;
}

const BudgetsPage: React.FC<BudgetsPageProps> = ({ transactions, budgets, onUpdateBudget }) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [expandedPacing, setExpandedPacing] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Get current date context
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Calculate spending per category for Current Month
  const currentMonthSpend = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Calculate Previous Month Savings for Rollover
  const prevDate = new Date();
  prevDate.setMonth(currentMonth - 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const prevMonthSpend = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
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
    if (!isNaN(limit) && limit > 0) {
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

  // Helper to generate chart data for pacing
  const getPacingData = (category: string, limit: number) => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const data = [];
    let cumulativeSpend = 0;

    // Filter transactions for this category this month
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return t.category === category && t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generate data points for each day up to today
    const currentDay = today.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
       // Add spend for this day
       const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
       const dailySpend = monthTransactions
          .filter(t => t.date === dateStr)
          .reduce((sum, t) => sum + t.amount, 0);
       
       cumulativeSpend += dailySpend;
       
       const idealPacing = (limit / daysInMonth) * day;

       // We only plot actual spend up to today
       if (day <= currentDay) {
          data.push({
             day: day,
             actual: cumulativeSpend,
             ideal: idealPacing
          });
       } else {
         // Future days only get ideal line
          data.push({
             day: day,
             ideal: idealPacing
          });
       }
    }
    return data;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-stone-800">Channel Caps & Limits</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map(budget => {
          const spend = currentMonthSpend[budget.category] || 0;
          
          // Calculate Rollover
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
            <div key={budget.category} className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 transition-all relative overflow-hidden">
               {justSaved && (
                 <div className="absolute top-0 right-0 p-2">
                   <CheckCircle size={16} className="text-emerald-500 animate-bounce" />
                 </div>
               )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-xl mr-3 font-bold text-stone-400">
                    {budget.category.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800">{budget.category}</h3>
                    <div className="flex items-center text-xs text-stone-500">
                      <span>Monthly Base: LKR {budget.limit.toLocaleString()}</span>
                      {budget.rollover && rolloverAmount > 0 && (
                        <span className="ml-2 text-emerald-600 flex items-center">
                           <RotateCcw size={10} className="mr-1" />
                           +LKR {rolloverAmount.toLocaleString()} Rolled Over
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {isEditing ? (
                   <div className="flex items-center space-x-2">
                     <input
                       type="number"
                       value={editValue}
                       onChange={(e) => setEditValue(e.target.value)}
                       className="w-24 px-2 py-1 text-sm border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-stone-800"
                       autoFocus
                     />
                     <button onClick={() => saveBudget(budget.category, budget.rollover)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={18} /></button>
                     <button onClick={() => setEditingCategory(null)} className="p-1 text-stone-400 hover:bg-stone-50 rounded"><X size={18} /></button>
                   </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-stone-800 mr-2">LKR {effectiveLimit.toLocaleString()}</span>
                    
                    <button 
                      onClick={() => togglePacing(budget.category)}
                      className={`transition-colors ${isPacingOpen ? 'text-emerald-600' : 'text-stone-300 hover:text-emerald-600'}`}
                      title="View Pacing Graph"
                    >
                      <TrendingUp size={16} />
                    </button>
                    
                    <button 
                      onClick={() => startEditing(budget.category, budget.limit)}
                      className="text-stone-300 hover:text-emerald-600 transition-colors"
                      title="Edit Budget"
                    >
                      <Pencil size={16} />
                    </button>
                    
                    <button
                      onClick={() => toggleRollover(budget.category, budget.limit, budget.rollover)}
                      className={`transition-colors ${budget.rollover ? 'text-emerald-600' : 'text-stone-300 hover:text-emerald-600'}`}
                      title="Toggle Monthly Rollover"
                    >
                      {budget.rollover ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </div>
                )}
              </div>

              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${isOverBudget ? 'text-rose-600 bg-rose-100' : 'text-emerald-600 bg-emerald-100'}`}>
                      {isOverBudget ? 'Over Cap' : 'On Track'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-stone-600">
                      LKR {spend.toLocaleString()} / LKR {effectiveLimit.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-stone-100">
                  <div 
                    style={{ width: `${percentage}%` }} 
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  ></div>
                </div>
              </div>
              
              {/* Pacing Chart */}
              {isPacingOpen && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                   <h4 className="text-xs font-bold text-stone-500 mb-2 uppercase">Spend vs Pacing (Current Month)</h4>
                   <div className="h-48 w-full relative">
                     <div className="absolute inset-0">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={pacingData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} width={30} />
                            <Tooltip 
                               contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                               itemStyle={{ fontSize: '12px' }}
                            />
                            <Line type="monotone" dataKey="ideal" stroke="#d6d3d1" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Ideal Pace" />
                            <Line type="monotone" dataKey="actual" stroke={isOverBudget ? '#f43f5e' : '#10b981'} strokeWidth={2} dot={false} name="Actual Spend" />
                          </LineChart>
                       </ResponsiveContainer>
                     </div>
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetsPage;