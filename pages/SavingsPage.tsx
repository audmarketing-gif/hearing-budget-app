import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { Plus, Target, Trash2, Wallet, Archive } from 'lucide-react';

interface SavingsPageProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateAmount: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
}

const SavingsPage: React.FC<SavingsPageProps> = ({ goals, onAddGoal, onUpdateAmount, onDeleteGoal }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');

  // Contribution State
  const [contributionId, setContributionId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !targetDate) return;

    onAddGoal({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate,
      color: '#10b981' // Defaulting to emerald
    });

    setIsAdding(false);
    setName('');
    setTargetAmount('');
    setTargetDate('');
    setCurrentAmount('0');
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (contributionId && contributionAmount) {
      onUpdateAmount(contributionId, parseFloat(contributionAmount));
      setContributionId(null);
      setContributionAmount('');
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-stone-800">Reserved Funds</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          New Reservation
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-stone-800 mb-4">Create Fund Reservation</h3>
          <p className="text-sm text-stone-500 mb-4">Allocate budget for future big-ticket items like events or rebrands.</p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Fund Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q4 Blitz"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 placeholder-stone-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Target Amount</label>
              <input
                type="number"
                required
                min="1"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 placeholder-stone-400"
              />
            </div>
             <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Current Seed</label>
              <input
                type="number"
                min="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 placeholder-stone-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Need By Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex justify-end space-x-3 mt-2">
               <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
               >
                 Cancel
               </button>
               <button 
                type="submit"
                className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
               >
                 Create Fund
               </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
          const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
          const isCompleted = goal.currentAmount >= goal.targetAmount;

          return (
            <div key={goal.id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mr-3">
                      <Archive size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 text-lg">{goal.name}</h3>
                      <p className="text-xs text-stone-500">Target: {goal.targetDate}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-stone-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-stone-500">Funded</span>
                    <span className="font-bold text-stone-800">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-400' : 'bg-emerald-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="font-medium text-emerald-700">LKR {goal.currentAmount.toLocaleString()}</span>
                    <span className="text-stone-400">of LKR {goal.targetAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {contributionId === goal.id ? (
                <form onSubmit={handleContribute} className="mt-4 pt-4 border-t border-stone-100">
                  <label className="block text-xs font-semibold text-stone-500 mb-2">Allocate Funds</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      autoFocus
                      required
                      min="1"
                      placeholder="Amount"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800 placeholder-stone-400"
                    />
                    <button 
                      type="submit"
                      className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      <Plus size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setContributionId(null)}
                      className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200"
                    >
                      <Trash2 size={16} className="rotate-45" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setContributionId(goal.id)}
                  disabled={isCompleted}
                  className={`w-full mt-4 py-2 flex items-center justify-center rounded-lg font-medium transition-colors ${
                    isCompleted 
                      ? 'bg-emerald-50 text-emerald-600 cursor-default' 
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {isCompleted ? (
                    'Fully Funded'
                  ) : (
                    <>
                      <Wallet size={16} className="mr-2" />
                      Allocate
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}

        {goals.length === 0 && !isAdding && (
           <div className="col-span-full py-12 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
              <Archive size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No reserved funds</p>
              <p className="text-sm">Start setting aside budget for major upcoming campaigns.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default SavingsPage;