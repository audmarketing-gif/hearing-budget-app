import React, { useState, useEffect } from 'react';
import { Category, Transaction, Budget, TransactionType, AppSettings } from '../types';
import { Download, Trash2, Plus, Edit2, Check, X, FolderCog, FileSpreadsheet, LogOut, UserCircle, Bell, Save, Key } from 'lucide-react';
import { signOut, auth, doc, db, onSnapshot, setDoc } from '../services/firebase';

interface SettingsPageProps {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  onAddCategory: (name: string, type: TransactionType, color?: string) => void;
  onDeleteCategory: (id: string) => void;
  onEditCategory: (id: string, name: string, color?: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  categories, 
  transactions, 
  budgets,
  onAddCategory,
  onDeleteCategory,
  onEditCategory
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('expense');
  const [newCatColor, setNewCatColor] = useState('#64748b');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Settings State
  const [alertEmail, setAlertEmail] = useState('');
  const [emailServiceId, setEmailServiceId] = useState('');
  const [emailTemplateId, setEmailTemplateId] = useState('');
  const [emailPublicKey, setEmailPublicKey] = useState('');
  
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    // Load existing settings
    const unsub = onSnapshot(doc(db, 'settings', 'preferences'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as AppSettings;
        if (data.alertEmail) setAlertEmail(data.alertEmail);
        if (data.emailServiceId) setEmailServiceId(data.emailServiceId);
        if (data.emailTemplateId) setEmailTemplateId(data.emailTemplateId);
        if (data.emailPublicKey) setEmailPublicKey(data.emailPublicKey);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      const settings: AppSettings = {
        alertEmail,
        emailServiceId,
        emailTemplateId,
        emailPublicKey
      };
      await setDoc(doc(db, 'settings', 'preferences'), settings, { merge: true });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (e) {
      console.error("Error saving settings:", e);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      onAddCategory(newCatName.trim(), newCatType, newCatColor);
      setNewCatName('');
      setNewCatColor('#64748b'); // reset to default
    }
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color || '#64748b');
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      onEditCategory(id, editName.trim(), editColor);
    }
    setEditingId(null);
  };

  const handleExport = () => {
    const headers = ["Date", "Description", "Category", "Amount", "Type"];
    const rows = transactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
      t.category,
      t.amount.toFixed(2),
      t.type
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `visioncare_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Extract username from email
  const userEmail = auth?.currentUser?.email || '';
  const userName = userEmail.split('@')[0];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-stone-800">Settings</h1>
        <button 
          onClick={handleSignOut}
          className="flex items-center px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors text-sm font-bold"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 h-full">
           <div className="flex items-center mb-4">
             <UserCircle className="text-blue-900 mr-2" />
             <h2 className="text-lg font-bold text-stone-800">Account</h2>
           </div>
           <p className="text-sm text-stone-500">You are currently logged in as:</p>
           <p className="font-bold text-stone-800 mt-1">{userName}</p>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 h-full">
           <div className="flex items-center mb-4">
             <Bell className="text-amber-500 mr-2" />
             <h2 className="text-lg font-bold text-stone-800">Notification Preferences</h2>
           </div>
           
           <div className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-stone-500 mb-1">Recipient Email</label>
                 <div className="flex items-center gap-2">
                   <input 
                     type="email" 
                     value={alertEmail}
                     onChange={(e) => setAlertEmail(e.target.value)}
                     placeholder="Enter email address"
                     className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-stone-50 text-stone-800"
                   />
                 </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <div className="flex items-center mb-2">
                   <Key className="text-emerald-500 mr-2" size={16} />
                   <h3 className="text-sm font-bold text-stone-700">Email Service Configuration</h3>
                </div>
                <p className="text-xs text-stone-500 mb-3">
                  Required to send real emails. Create a free account at <a href="https://www.emailjs.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">EmailJS</a>.
                </p>
                
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={emailServiceId}
                    onChange={(e) => setEmailServiceId(e.target.value)}
                    placeholder="Service ID (e.g. service_xyz)"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-stone-50 text-stone-800 font-mono"
                  />
                  <input 
                    type="text" 
                    value={emailTemplateId}
                    onChange={(e) => setEmailTemplateId(e.target.value)}
                    placeholder="Template ID (e.g. template_abc)"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-stone-50 text-stone-800 font-mono"
                  />
                  <input 
                    type="password" 
                    value={emailPublicKey}
                    onChange={(e) => setEmailPublicKey(e.target.value)}
                    placeholder="Public Key (e.g. user_12345)"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-stone-50 text-stone-800 font-mono"
                  />
                </div>
              </div>

              <button 
                 onClick={handleSaveSettings}
                 disabled={settingsLoading}
                 className="w-full flex items-center justify-center bg-stone-800 text-white p-2 rounded-lg hover:bg-stone-900 transition-colors disabled:opacity-50 mt-2"
               >
                 {settingsSaved ? (
                   <><Check size={16} className="mr-2 text-emerald-400" /> Saved</>
                 ) : (
                   <><Save size={16} className="mr-2" /> Save Configuration</>
                 )}
               </button>
           </div>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
        <div className="flex items-center mb-6">
          <FolderCog className="text-emerald-600 mr-2" />
          <h2 className="text-lg font-bold text-stone-800">Manage Categories</h2>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-stone-50 rounded-lg">
          <input 
            type="text" 
            placeholder="New Category Name" 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800 placeholder-stone-400"
          />
          <div className="flex items-center space-x-2">
            <input 
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="h-9 w-12 p-0 border-0 rounded overflow-hidden cursor-pointer"
              title="Pick Category Color"
            />
            <select
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value as TransactionType)}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="expense">Expense</option>
              <option value="allocation">Allocation</option>
            </select>
            <button 
              type="submit"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center min-w-[3rem]"
            >
              <Plus size={16} />
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Expenses */}
          <div>
            <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-3">Expenses</h3>
            <ul className="space-y-2">
              {categories.filter(c => c.type === 'expense').map(cat => (
                <li key={cat.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-100">
                  {editingId === cat.id ? (
                    <div className="flex flex-1 gap-2 items-center">
                       <input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded bg-white text-stone-800"
                        autoFocus
                       />
                       <input 
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="h-6 w-8 p-0 border-0 rounded cursor-pointer"
                       />
                       <button onClick={() => saveEdit(cat.id)} className="text-emerald-600"><Check size={16} /></button>
                       <button onClick={() => setEditingId(null)} className="text-stone-400"><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                        <span className="text-stone-800 text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditing(cat)} className="text-stone-400 hover:text-emerald-600"><Edit2 size={14} /></button>
                        <button onClick={() => onDeleteCategory(cat.id)} className="text-stone-400 hover:text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Allocations */}
          <div>
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">Allocations</h3>
            <ul className="space-y-2">
              {categories.filter(c => c.type === 'allocation').map(cat => (
                <li key={cat.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-100">
                  {editingId === cat.id ? (
                    <div className="flex flex-1 gap-2 items-center">
                       <input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded bg-white text-stone-800"
                        autoFocus
                       />
                        <input 
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="h-6 w-8 p-0 border-0 rounded cursor-pointer"
                       />
                       <button onClick={() => saveEdit(cat.id)} className="text-emerald-600"><Check size={16} /></button>
                       <button onClick={() => setEditingId(null)} className="text-stone-400"><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                        <span className="text-stone-800 text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => startEditing(cat)} className="text-stone-400 hover:text-emerald-600"><Edit2 size={14} /></button>
                        <button onClick={() => onDeleteCategory(cat.id)} className="text-stone-400 hover:text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
         <div className="flex items-center mb-4">
           <FileSpreadsheet className="text-emerald-600 mr-2" />
           <h2 className="text-lg font-bold text-stone-800">Data Export</h2>
         </div>
         <p className="text-sm text-stone-500 mb-4">Download all your transaction history as a CSV file for external analysis.</p>
         <button 
           onClick={handleExport}
           className="flex items-center px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors"
         >
           <Download size={18} className="mr-2" />
           Export CSV
         </button>
      </div>
    </div>
  );
};

export default SettingsPage;