import React, { useState, useMemo } from 'react';
import { Transaction, RecurringTransaction, Frequency, Category, TransactionType } from '../types';
import TransactionForm from '../components/TransactionForm';
import { Trash2, RefreshCw, Copy, FileText } from 'lucide-react';

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
  const [filterType, setFilterType] = useState<'All' | 'allocation' | 'expense'>('All');

  // Recurring Form State
  const [recDesc, setRecDesc] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recFreq, setRecFreq] = useState<Frequency>('monthly');
  const [recType, setRecType] = useState<TransactionType>('expense');
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
    setRecDate(new Date().toISOString().split('T')[0]);
    setActiveTab('recurring');
  };

  const getCategoryColor = (name: string) => {
    const cat = categories.find(c => c.name === name);
    return cat ? cat.color : '#78716c';
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.poNo?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesType = filterType === 'All' || t.type === filterType;
      const matchesDate = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
      return matchesSearch && matchesCategory && matchesType && matchesDate;
    });
  }, [transactions, searchTerm, filterCategory, filterType, startDate, endDate]);

  const filteredRecurring = recurringTransactions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-800">Transactions</h1>
        <div className="flex bg-stone-100 p-1 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'history' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${
              activeTab === 'recurring' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'
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
            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="md:col-span-2 lg:col-span-3 pb-2 text-xs text-stone-400">
                {searchTerm && `Searching for "${searchTerm}" in description, company, invoice, PO...`}
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
                <option value="allocation">Allocation</option>
                <option value="expense">Expense</option>
              </select>
              <div className="flex gap-2 md:col-span-2 lg:col-span-1">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white text-stone-800" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white text-stone-800" />
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
                      <th className="px-4 py-4 text-xs font-semibold text-stone-500 uppercase">Date</th>
                      <th className="px-4 py-4 text-xs font-semibold text-stone-500 uppercase">Details</th>
                      <th className="px-4 py-4 text-xs font-semibold text-stone-500 uppercase">Category</th>
                      <th className="px-4 py-4 text-xs font-semibold text-stone-500 uppercase">Ref</th>
                      <th className="px-4 py-4 text-xs font-semibold text-stone-500 uppercase text-right">Amount</th>
                      <th className="px-4 py-4 text-xs font-semibold text-stone-500 uppercase text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredTransactions.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-stone-500">No transactions found.</td></tr>
                    ) : (
                      filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-4 py-4 text-sm text-stone-600 whitespace-nowrap">{t.date}</td>
                          <td className="px-4 py-4">
                             <div className="text-sm font-medium text-stone-800">{t.description}</div>
                             {t.company && <div className="text-xs text-stone-500">{t.company}</div>}
                          </td>
                          <td className="px-4 py-4 text-sm text-stone-600">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-stone-500 whitespace-nowrap">
                             {t.invoiceNo && <div title="Invoice">INV: {t.invoiceNo}</div>}
                             {t.poNo && <div title="PO">PO: {t.poNo}</div>}
                          </td>
                          <td className={`px-4 py-4 text-sm font-bold text-right whitespace-nowrap ${t.type === 'allocation' ? 'text-blue-600' : 'text-stone-800'}`}>
                            {t.type === 'allocation' ? '' : '-'}LKR {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-2">
                              <button onClick={() => copyToRecurring(t)} className="text-stone-400 hover:text-emerald-600 transition-colors" title="Make Recurring"><Copy size={16} /></button>
                              <button onClick={() => onDelete(t.id)} className="text-stone-400 hover:text-rose-500 transition-colors" title="Delete"><Trash2 size={16} /></button>
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
              <RefreshCw className="w-5 h-5 mr-2 text-emerald-600" />
              Manage Recurring
            </h3>
            <form onSubmit={handleAddRecurring} className="space-y-4">
              <div className="flex space-x-4 mb-2">
                <button type="button" onClick={() => handleRecTypeChange('expense')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${recType === 'expense' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}>Spend</button>
                <button type="button" onClick={() => handleRecTypeChange('allocation')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${recType === 'allocation' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}>Allocation</button>
              </div>
              <input type="text" required value={recDesc} onChange={(e) => setRecDesc(e.target.value)} placeholder="Description" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-4">
                 <input type="number" required value={recAmount} onChange={(e) => setRecAmount(e.target.value)} placeholder="Amount" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm" />
                 <select value={recFreq} onChange={(e) => setRecFreq(e.target.value as Frequency)} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm">
                   <option value="daily">Daily</option>
                   <option value="weekly">Weekly</option>
                   <option value="monthly">Monthly</option>
                   <option value="yearly">Yearly</option>
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <select value={recCategory} onChange={(e) => setRecCategory(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm">
                    {categories.filter(c => c.type === recType).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                 </select>
                 <input type="date" required value={recDate} onChange={(e) => setRecDate(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm" />
              </div>
              <button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm">Create Rule</button>
            </form>
          </div>
          <div className="lg:col-span-2 space-y-4">
             {filteredRecurring.map(rt => (
               <div key={rt.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                     <div className={`p-3 rounded-full ${rt.type === 'allocation' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-600'}`}><RefreshCw size={20} /></div>
                     <div><h4 className="font-bold text-stone-800">{rt.description}</h4><p className="text-xs text-stone-500">{rt.frequency} • {rt.nextDueDate} • {rt.category}</p></div>
                  </div>
                  <div className="flex items-center space-x-4">
                     <span className={`font-bold ${rt.type === 'allocation' ? 'text-blue-600' : 'text-stone-800'}`}>LKR {rt.amount.toLocaleString()}</span>
                     <button onClick={() => onDeleteRecurring(rt.id)} className="text-stone-400 hover:text-rose-500"><Trash2 size={18} /></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;