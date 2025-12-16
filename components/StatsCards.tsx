import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

interface StatsCardsProps {
  income: number;
  expenses: number;
  balance: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ income, expenses, balance }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500">Remaining Budget</p>
          <h3 className="text-2xl font-bold text-stone-800 mt-1">LKR {balance.toLocaleString()}</h3>
        </div>
        <div className="p-3 bg-stone-100 rounded-full text-stone-600">
          <Wallet size={24} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500">Total Funding (YTD)</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1 flex items-center">
            LKR {income.toLocaleString()}
          </h3>
        </div>
        <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
          <ArrowUpRight size={24} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500">Total Spend (YTD)</p>
          <h3 className="text-2xl font-bold text-rose-500 mt-1 flex items-center">
            LKR {expenses.toLocaleString()}
          </h3>
        </div>
        <div className="p-3 bg-rose-50 rounded-full text-rose-500">
          <ArrowDownRight size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatsCards;