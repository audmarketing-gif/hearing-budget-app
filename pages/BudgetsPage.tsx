import React, { useState } from 'react';
import { BudgetSource } from '../types';
import { Save, DollarSign } from 'lucide-react';

interface BudgetsPageProps {
  budgetSources: BudgetSource[];
  onUpdateSource: (id: string | null, name: 'Primary Budget' | 'Principle Grants' | 'Group Grants', amount: number, description: string) => void;
}

const BudgetsPage: React.FC<BudgetsPageProps> = ({ budgetSources, onUpdateSource }) => {
  const getSource = (name: string) => budgetSources.find(s => s.name === name);

  const [formState, setFormState] = useState({
    primary: { amount: getSource('Primary Budget')?.amount || 0, desc: getSource('Primary Budget')?.description || '' },
    principle: { amount: getSource('Principle Grants')?.amount || 0, desc: getSource('Principle Grants')?.description || '' },
    group: { amount: getSource('Group Grants')?.amount || 0, desc: getSource('Group Grants')?.description || '' },
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Determine IDs if they exist
    const primaryId = getSource('Primary Budget')?.id || null;
    const principleId = getSource('Principle Grants')?.id || null;
    const groupId = getSource('Group Grants')?.id || null;

    onUpdateSource(primaryId, 'Primary Budget', formState.primary.amount, formState.primary.desc);
    onUpdateSource(principleId, 'Principle Grants', formState.principle.amount, formState.principle.desc);
    onUpdateSource(groupId, 'Group Grants', formState.group.amount, formState.group.desc);

    setTimeout(() => setIsSaving(false), 1000);
  };

  const totalBudget = formState.primary.amount + formState.principle.amount + formState.group.amount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Budget Sources</h1>
          <p className="text-stone-500">Define the main funding sources for the fiscal period.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
        >
          <Save size={20} className="mr-2" />
          {isSaving ? 'Saving...' : 'Update Budget'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Budget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-600">
           <div className="flex items-center mb-4 text-blue-900">
             <DollarSign className="mr-2" />
             <h2 className="text-lg font-bold">Primary Budget</h2>
           </div>
           <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Total Amount (LKR)</label>
               <input 
                 type="number" 
                 value={formState.primary.amount}
                 onChange={(e) => setFormState(prev => ({...prev, primary: { ...prev.primary, amount: parseFloat(e.target.value) || 0 }}))}
                 className="w-full text-2xl font-bold p-2 border-b-2 border-blue-100 focus:border-blue-500 outline-none text-stone-800 bg-transparent transition-colors"
                 placeholder="0.00"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Description / Notes</label>
               <textarea 
                 rows={3}
                 value={formState.primary.desc}
                 onChange={(e) => setFormState(prev => ({...prev, primary: { ...prev.primary, desc: e.target.value }}))}
                 className="w-full p-3 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                 placeholder="Annual marketing allocation..."
               />
             </div>
           </div>
        </div>

        {/* Principle Grants */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-600">
           <div className="flex items-center mb-4 text-purple-900">
             <DollarSign className="mr-2" />
             <h2 className="text-lg font-bold">Principle Grants</h2>
           </div>
           <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Total Amount (LKR)</label>
               <input 
                 type="number" 
                 value={formState.principle.amount}
                 onChange={(e) => setFormState(prev => ({...prev, principle: { ...prev.principle, amount: parseFloat(e.target.value) || 0 }}))}
                 className="w-full text-2xl font-bold p-2 border-b-2 border-purple-100 focus:border-purple-500 outline-none text-stone-800 bg-transparent transition-colors"
                 placeholder="0.00"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Description / Notes</label>
               <textarea 
                 rows={3}
                 value={formState.principle.desc}
                 onChange={(e) => setFormState(prev => ({...prev, principle: { ...prev.principle, desc: e.target.value }}))}
                 className="w-full p-3 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
                 placeholder="Special grants from principals..."
               />
             </div>
           </div>
        </div>

        {/* Group Grants */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-amber-500">
           <div className="flex items-center mb-4 text-amber-900">
             <DollarSign className="mr-2" />
             <h2 className="text-lg font-bold">Group Grants</h2>
           </div>
           <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Total Amount (LKR)</label>
               <input 
                 type="number" 
                 value={formState.group.amount}
                 onChange={(e) => setFormState(prev => ({...prev, group: { ...prev.group, amount: parseFloat(e.target.value) || 0 }}))}
                 className="w-full text-2xl font-bold p-2 border-b-2 border-amber-100 focus:border-amber-500 outline-none text-stone-800 bg-transparent transition-colors"
                 placeholder="0.00"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Description / Notes</label>
               <textarea 
                 rows={3}
                 value={formState.group.desc}
                 onChange={(e) => setFormState(prev => ({...prev, group: { ...prev.group, desc: e.target.value }}))}
                 className="w-full p-3 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                 placeholder="Inter-group funding..."
               />
             </div>
           </div>
        </div>
      </div>

      <div className="bg-stone-800 text-white p-6 rounded-xl shadow-lg flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Total Budget Calculated</h3>
          <p className="text-stone-400 text-sm">Sum of all sources. This updates the dashboard total.</p>
        </div>
        <div className="text-3xl font-black tracking-tight">
          LKR {totalBudget.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default BudgetsPage;