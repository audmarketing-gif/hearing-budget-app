import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, PieChart } from 'lucide-react';

interface StatsCardsProps {
  totalBudget: number;
  totalSpend: number;
  totalAllocations: number;
  remainBudget: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ totalBudget, totalSpend, totalAllocations, remainBudget }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
           <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
             <Wallet size={24} />
           </div>
        </div>
        <div>
          <p className="text-sm font-medium text-stone-500">Total Budget</p>
          <h3 className="text-2xl font-bold text-stone-800 mt-1">LKR {totalBudget.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
           <div className="p-3 bg-rose-50 rounded-full text-rose-500">
             <ArrowDownRight size={24} />
           </div>
        </div>
        <div>
          <p className="text-sm font-medium text-stone-500">Total Spend</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">LKR {totalSpend.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
           <div className="p-3 bg-blue-50 rounded-full text-blue-600">
             <PieChart size={24} />
           </div>
        </div>
        <div>
          <p className="text-sm font-medium text-stone-500">Total Allocations</p>
          <h3 className="text-2xl font-bold text-blue-700 mt-1">LKR {totalAllocations.toLocaleString()}</h3>
          <p className="text-xs text-stone-400 mt-1">Pending future commitments</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
           <div className="p-3 bg-stone-100 rounded-full text-stone-600">
             <ArrowUpRight size={24} />
           </div>
        </div>
        <div>
          <p className="text-sm font-medium text-stone-500">Remain Budget</p>
          <h3 className={`text-2xl font-bold mt-1 ${remainBudget < 0 ? 'text-rose-500' : 'text-stone-800'}`}>
            LKR {remainBudget.toLocaleString()}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;