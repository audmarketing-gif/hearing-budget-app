import React, { useState, useMemo } from 'react';
import { Transaction, RecurringTransaction, Frequency, Category, TransactionType } from '../types';
import TransactionForm from '../components/TransactionForm';
import { Trash2, RefreshCw, Plus, CalendarClock, Search, Filter, Copy } from 'lucide-react';

interface TransactionsPageProps {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  categories: Category[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: string) => void;
  onAddRecurring: (rt: Omit<RecurringTransaction, 'id'>) => void;
  onDeleteRecurring: (id: string) => void;
  searchTerm?: string;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ 
  transactions, 
  recurringTransactions, 
  categories,
  onAdd, 
  onDelete,
  onAddRecurring,
  onDeleteRecurring,
  searchTerm = ''
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'recurring'>('history');

  // History Filters State
  const [filterCategory, setFilterCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'income' | 'expense'>('All');

  // Recurring List Filters State
  const [recFilterStart, setRecFilterStart] = useState('');
  const [recFilterEnd, setRecFilterEnd] = useState('');

  // Recurring Form State
  const [recDesc, setRecDesc] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recFreq, setRecFreq] = useState<Frequency>('monthly');
  const [recType, setRecType] = useState<TransactionType>('expense');
  // Initialize recCategory carefully
  const initialRecCats = categories.filter(c => c.type === 'expense');
  const [recCategory, setRecCategory] = useState(initialRecCats.length > 0 ? initialRecCats[0].name : '');
  const [recDate, setRecDate] = useState(new Date().toISOString().split('T')[0]);

  const handleRecTypeChange = (type: TransactionType) => {
    setRecType(type);
    const cats = categories.filter(c => c.type === type);
    if (cats.length > 0) {
      setRecCategory(cats[0].name);
    } else {
      setRecCategory('');
    }
  };

  const handleAddRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recDesc || !recAmount || !recCategory) return;

    onAddRecurring({
      description: recDesc,
      amount: parseFloat(recAmount),
      frequency: recFreq,
      type: recType,
      category: recCategory,
      nextDueDate: recDate
    });

    setRecDesc('');
    setRecAmount('');
  };

  const copyToRecurring = (t: Transaction) => {
    setRecDesc(t.description);
    setRecAmount(t.amount.toString());
    setRecType(t.type);
    setRecCategory(t.category);
    setRecDate(new Date().toISOString().split('T')[0]); // Default to today as next due
    setActiveTab('recurring');
  };

  const getCategoryColor = (name: string) => {
    const cat = categories.find(c => c.name === name);
    return cat ? cat.color : '#78716c'; // Default stone-500
  };

  // Filtering Logic: History
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesType = filterType === 'All' || t.type === filterType;
      const matchesDate = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
      return matchesSearch && matchesCategory && matchesType && matchesDate;
    });
  }, [transactions, searchTerm, filterCategory, filterType, startDate, endDate]);

  // Filtering Logic: Recurring
  const filteredRecurring = useMemo(() => {
    return recurringTransactions.filter(rt => {
      // Filter by Next Due Date
      const matchesDate = (!recFilterStart || rt.nextDueDate >= recFilterStart) && (!recFilterEnd || rt.nextDueDate <= recFilterEnd);
      return matchesDate;
    });
  }, [recurringTransactions, recFilterStart, recFilterEnd]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-800">Transactions</h1>
        
        {/* Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'history' 
                ? 'bg-white text-stone-800 shadow-sm' 
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${
              activeTab === 'recurring' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <RefreshCw size={16} className="mr-2" />
            Recurring Rules
          </button>
        </div>
      </div>
      
      {activeTab === 'history' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TransactionForm onAdd={onAdd} categories={categories} />
          </div>
          
          <div className="lg:col-span-2 space-y-4">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Note: Text search is now in Layout header, so we can remove it or keep it as local override. 
                  Given the prompt asked to make it global, we rely on the passed searchTerm prop and maybe display it here if needed, 
                  but the layout header is persistent. We'll just show category/date filters here. */}
              
              <div className="md:col-span-2 lg:col-span-3 pb-2 text-xs text-stone-400">
                {searchTerm && `Filtering by "${searchTerm}"`}
              </div>

              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="All">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <div className="flex gap-2 md:col-span-2 lg:col-span-1">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800"
                />
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800"
                />
              </div>
              <div className="flex items-center justify-end text-xs text-stone-400 md:col-span-2 lg:col-span-3">
                 Showing {filteredTransactions.length} result(s)
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b border-stone-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">Amount</th>
                      <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                          No transactions found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-stone-600 whitespace-nowrap">{t.date}</td>
                          <td className="px-6 py-4 text-sm font-medium text-stone-800">{t.description}</td>
                          <td className="px-6 py-4 text-sm text-stone-600">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
                              style={{ backgroundColor: getCategoryColor(t.category) }}
                            >
                              {t.category}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-stone-800'}`}>
                            {t.type === 'income' ? '+' : '-'}LKR {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => copyToRecurring(t)}
                                className="text-stone-400 hover:text-emerald-600 transition-colors"
                                title="Make Recurring"
                              >
                                <Copy size={18} />
                              </button>
                              <button
                                onClick={() => onDelete(t.id)}
                                className="text-stone-400 hover:text-rose-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-stone-100 h-fit">
            <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center">
              <CalendarClock className="w-5 h-5 mr-2 text-emerald-600" />
              Manage Recurring
            </h3>
            <form onSubmit={handleAddRecurring} className="space-y-4">
              {/* Type Selection */}
              <div className="flex space-x-4 mb-2">
                <button
                  type="button"
                  onClick={() => handleRecTypeChange('expense')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    recType === 'expense' 
                      ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' 
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  Spend
                </button>
                <button
                  type="button"
                  onClick={() => handleRecTypeChange('income')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    recType === 'income' 
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' 
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  Funding
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={recDesc}
                  onChange={(e) => setRecDesc(e.target.value)}
                  placeholder="e.g. Monthly Retainer"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 placeholder-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 placeholder-stone-400"
                  />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Frequency</label>
                   <select
                    value={recFreq}
                    onChange={(e) => setRecFreq(e.target.value as Frequency)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800"
                   >
                     <option value="daily">Daily</option>
                     <option value="weekly">Weekly</option>
                     <option value="monthly">Monthly</option>
                     <option value="yearly">Yearly</option>
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Category</label>
                    <select
                      value={recCategory}
                      onChange={(e) => setRecCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800"
                    >
                      {categories.filter(c => c.type === recType).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Next Due Date</label>
                    <input
                      type="date"
                      required
                      value={recDate}
                      onChange={(e) => setRecDate(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800"
                    />
                 </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all duration-200 active:scale-[0.98]"
              >
                Create Rule
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
             {/* Recurring List Filter */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col md:flex-row gap-3 items-end md:items-center">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Due Date From</label>
                  <input 
                    type="date" 
                    value={recFilterStart}
                    onChange={(e) => setRecFilterStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800"
                  />
                </div>
                <div className="flex-1 w-full">
                   <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Due Date To</label>
                   <input 
                    type="date" 
                    value={recFilterEnd}
                    onChange={(e) => setRecFilterEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800"
                   />
                </div>
                { (recFilterStart || recFilterEnd) && (
                  <button 
                    onClick={() => { setRecFilterStart(''); setRecFilterEnd(''); }}
                    className="text-xs text-rose-500 font-medium hover:text-rose-700 mb-2 md:mb-0"
                  >
                    Clear Filter
                  </button>
                )}
             </div>

             {filteredRecurring.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-100 text-center text-stone-500">
                   <CalendarClock size={48} className="mx-auto mb-4 text-stone-300" />
                   <p>No recurring rules match criteria.</p>
                   <p className="text-sm">Set up income or expense automation here.</p>
                </div>
             ) : (
                filteredRecurring.map(rt => (
                  <div key={rt.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between">
                     <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${rt.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-600'}`}>
                           <RefreshCw size={20} />
                        </div>
                        <div>
                           <h4 className="font-bold text-stone-800">{rt.description}</h4>
                           <div className="flex items-center text-xs text-stone-500 space-x-2">
                              <span className="capitalize">{rt.frequency}</span>
                              <span>•</span>
                              <span>Next: {rt.nextDueDate}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-700">{rt.category}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center space-x-4">
                        <span className={`font-bold ${rt.type === 'income' ? 'text-emerald-600' : 'text-stone-800'}`}>
                           {rt.type === 'income' ? '+' : '-'}LKR {rt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <button 
                           onClick={() => onDeleteRecurring(rt.id)}
                           className="text-stone-400 hover:text-rose-500 transition-colors"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
                ))
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;