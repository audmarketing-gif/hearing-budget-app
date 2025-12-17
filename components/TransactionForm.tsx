import React, { useState } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import { Transaction, Category, TransactionType } from '../types';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  categories: Category[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, categories }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('expense');
  const [company, setCompany] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [poNo, setPoNo] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Initialize category based on available categories for the type
  const expenseCats = categories.filter(c => c.type === 'expense');
  const allocCats = categories.filter(c => c.type === 'allocation');
  
  const [category, setCategory] = useState(expenseCats.length > 0 ? expenseCats[0].name : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    onAdd({
      description,
      amount: parseFloat(amount),
      date,
      type,
      category,
      company,
      invoiceNo,
      poNo
    });

    setDescription('');
    setAmount('');
    setCompany('');
    setInvoiceNo('');
    setPoNo('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const availableCats = newType === 'expense' ? expenseCats : allocCats;
    if (availableCats.length > 0) {
      setCategory(availableCats[0].name);
    } else {
      setCategory('');
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 relative overflow-hidden">
       {/* Success Overlay */}
       {showSuccess && (
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-stone-800 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-emerald-600" />
          Record Transaction
        </h3>
        {showSuccess && (
          <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded-full animate-in fade-in slide-in-from-right-2">
            <CheckCircle size={12} className="mr-1" /> Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              type === 'expense' 
                ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' 
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            Spend
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('allocation')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              type === 'allocation' 
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' 
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            Allocation
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'expense' ? "e.g. Google Ads Invoice" : "e.g. Q4 Marketing Fund"}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 placeholder-stone-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Amount</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 placeholder-stone-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800"
            >
              {filteredCategories.length > 0 ? (
                filteredCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))
              ) : (
                <option value="">No categories</option>
              )}
            </select>
          </div>
          
          <div className="md:col-span-2 grid grid-cols-3 gap-4 border-t border-stone-100 pt-4 mt-2">
             <div className="col-span-1">
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Company Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Ogilvy"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 placeholder-stone-400 text-sm"
                />
             </div>
             <div className="col-span-1">
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Invoice No</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-2025-001"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 placeholder-stone-400 text-sm"
                />
             </div>
             <div className="col-span-1">
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">PO No</label>
                <input
                  type="text"
                  value={poNo}
                  onChange={(e) => setPoNo(e.target.value)}
                  placeholder="e.g. PO-8839"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 placeholder-stone-400 text-sm"
                />
             </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!category}
          className={`w-full mt-4 font-bold py-2 px-4 rounded-lg shadow-sm transition-all duration-200 active:scale-[0.98] text-white ${
            type === 'expense' ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300'
          }`}
        >
          {type === 'expense' ? 'Record Spend' : 'Add Allocation'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;