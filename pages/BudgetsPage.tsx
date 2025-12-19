import React, { useState, useEffect } from 'react';
import { BudgetSource, Budget, Category } from '../types';
import { Save, DollarSign, TrendingUp, RotateCcw, ShieldCheck } from 'lucide-react';

interface BudgetsPageProps {
  budgetSources: BudgetSource[];
  budgets: Budget[];
  categories: Category[];
  onUpdateSource: (id: string | null, name: 'Primary Budget' | 'Principle Grants' | 'Group Grants', amount: number, description: string) => void;
  onUpdateBudget: (category: string, limit: number, rollover: boolean) => void;
}

const BudgetsPage: React.FC<BudgetsPageProps> = ({ budgetSources, budgets, categories, onUpdateSource, onUpdateBudget }) => {
  const getSource = (name: string) => budgetSources.find(s => s.name === name);

  const [formState, setFormState] = useState({
    primary: { amount: getSource('Primary Budget')?.amount || 0, desc: getSource('Primary Budget')?.description || '' },
    principle: { amount: getSource('Principle Grants')?.amount || 0, desc: getSource('Principle Grants')?.description || '' },
    group: { amount: getSource('Group Grants')?.amount || 0, desc: getSource('Group Grants')?.description || '' },
  });

  const [localBudgets, setLocalBudgets] = useState<Record<string, { limit: number, rollover: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync internal state when props change
  useEffect(() => {
    const initialState: Record<string, { limit: number, rollover: boolean }> = {};
    budgets.forEach(b => {
      initialState[b.category] = { limit: b.limit, rollover: b.rollover };
    });
    setLocalBudgets(initialState);
  }, [budgets]);

  const handleSave = async () => {
    setIsSaving(true);
    
    // 1. Update Budget Sources
    const primaryId = getSource('Primary Budget')?.id || null;
    const principleId = getSource('Principle Grants')?.id || null;
    const groupId = getSource('Group Grants')?.id || null;

    onUpdateSource(primaryId, 'Primary Budget', formState.primary.amount, formState.primary.desc);
    onUpdateSource(principleId, 'Principle Grants', formState.principle.amount, formState.principle.desc);
    onUpdateSource(groupId, 'Group Grants', formState.group.amount, formState.group.desc);

    // 2. Update Category Spending Caps
    // Explicitly cast settings to fix 'unknown' type error on line 48
    Object.entries(localBudgets).forEach(([category, settings]) => {
      const budgetSettings = settings as { limit: number; rollover: boolean };
      onUpdateBudget(category, budgetSettings.limit, budgetSettings.rollover);
    });

    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleLocalBudgetChange = (category: string, field: 'limit' | 'rollover', value: any) => {
    setLocalBudgets(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || { limit: 0, rollover: false }),
        [field]: value
      }
    }));
  };

  const totalFunding = formState.primary.amount + formState.principle.amount + formState.group.amount;
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Budget Management</h1>
          <p className="text-stone-500">Configure total funding and individual spending caps.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center px-6 py-3 bg-stone-900 text-white font-bold rounded-lg hover:bg-black transition-all shadow-sm active:scale-95"
        >
          <Save size={20} className="mr-2" />
          {isSaving ? 'Processing...' : 'Apply All Changes'}
        </button>
      </div>

      {/* Funding Sources Section */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
          <DollarSign size={16} /> Total Funding Sources
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-600">
             <h2 className="text-base font-bold text-stone-800 mb-4">Primary Budget</h2>
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Amount (LKR)</label>
                 <input 
                   type="number" 
                   value={formState.primary.amount}
                   onChange={(e) => setFormState(prev => ({...prev, primary: { ...prev.primary, amount: parseFloat(e.target.value) || 0 }}))}
                   className="w-full text-xl font-bold p-2 border-b-2 border-stone-100 focus:border-blue-500 outline-none text-stone-800 bg-transparent"
                 />
               </div>
               <textarea 
                 rows={2}
                 value={formState.primary.desc}
                 onChange={(e) => setFormState(prev => ({...prev, primary: { ...prev.primary, desc: e.target.value }}))}
                 className="w-full p-2 border border-stone-100 rounded-lg text-sm bg-stone-50 outline-none resize-none"
                 placeholder="Main allocation notes..."
               />
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-600">
             <h2 className="text-base font-bold text-stone-800 mb-4">Principle Grants</h2>
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Amount (LKR)</label>
                 <input 
                   type="number" 
                   value={formState.principle.amount}
                   onChange={(e) => setFormState(prev => ({...prev, principle: { ...prev.principle, amount: parseFloat(e.target.value) || 0 }}))}
                   className="w-full text-xl font-bold p-2 border-b-2 border-stone-100 focus:border-purple-500 outline-none text-stone-800 bg-transparent"
                 />
               </div>
               <textarea 
                 rows={2}
                 value={formState.principle.desc}
                 onChange={(e) => setFormState(prev => ({...prev, principle: { ...prev.principle, desc: e.target.value }}))}
                 className="w-full p-2 border border-stone-100 rounded-lg text-sm bg-stone-50 outline-none resize-none"
                 placeholder="Grants from partners..."
               />
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-amber-500">
             <h2 className="text-base font-bold text-stone-800 mb-4">Group Grants</h2>
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Amount (LKR)</label>
                 <input 
                   type="number" 
                   value={formState.group.amount}
                   onChange={(e) => setFormState(prev => ({...prev, group: { ...prev.group, amount: parseFloat(e.target.value) || 0 }}))}
                   className="w-full text-xl font-bold p-2 border-b-2 border-stone-100 focus:border-amber-500 outline-none text-stone-800 bg-transparent"
                 />
               </div>
               <textarea 
                 rows={2}
                 value={formState.group.desc}
                 onChange={(e) => setFormState(prev => ({...prev, group: { ...prev.group, desc: e.target.value }}))}
                 className="w-full p-2 border border-stone-100 rounded-lg text-sm bg-stone-50 outline-none resize-none"
                 placeholder="Internal group funds..."
               />
             </div>
          </div>
        </div>
        <div className="bg-stone-50 p-4 rounded-xl flex justify-between items-center border border-stone-100">
           <span className="text-stone-500 font-bold text-sm">Aggregated Funding Cap</span>
           <span className="text-2xl font-black text-stone-800 tracking-tight">LKR {totalFunding.toLocaleString()}</span>
        </div>
      </section>

      {/* Category Limits Section */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp size={16} /> Category Spending Caps
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase">Marketing Channel</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase">Monthly Cap (LKR)</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase text-center">Rollover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {expenseCategories.map(cat => {
                const settings = localBudgets[cat.name] || { limit: 0, rollover: false };
                return (
                  <tr key={cat.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-bold text-stone-700">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative group max-w-[200px]">
                        <input 
                          type="number"
                          value={settings.limit}
                          onChange={(e) => handleLocalBudgetChange(cat.name, 'limit', parseFloat(e.target.value) || 0)}
                          className="w-full py-1.5 px-3 bg-stone-50 border border-stone-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button 
                        onClick={() => handleLocalBudgetChange(cat.name, 'rollover', !settings.rollover)}
                        className={`p-2 rounded-full transition-all ${settings.rollover ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400 hover:text-stone-600'}`}
                        title={settings.rollover ? "Surplus rolls over to next month" : "No rollover"}
                       >
                         {settings.rollover ? <ShieldCheck size={20} /> : <RotateCcw size={20} />}
                       </button>
                    </td>
                  </tr>
                );
              })}
              {expenseCategories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-stone-400 italic text-sm">
                    No expense categories defined in settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="bg-emerald-600 text-white p-6 rounded-xl shadow-lg flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Save size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Consolidated Budget Policy</h3>
            <p className="text-emerald-100 text-sm">Updates here reflect across the dashboard and AI insights.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="bg-white text-emerald-800 px-6 py-2 rounded-lg font-black hover:bg-stone-50 transition-colors shadow-xl active:scale-95"
        >
          {isSaving ? 'Processing...' : 'SAVE ALL'}
        </button>
      </div>
    </div>
  );
};

export default BudgetsPage;