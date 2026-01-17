import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './components/Auth';
import { Transaction, Budget, RecurringTransaction, Category, Notification, INITIAL_CATEGORIES, BudgetSource, AppSettings } from './types';
import { 
  db, 
  auth, 
  isConfigured, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  onAuthStateChanged,
  writeBatch,
  signOut
} from './services/firebase';
import { sendAllocationAlert } from './services/emailService';

// Pages
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import { Loader2, Database, ShieldAlert, RefreshCcw, ExternalLink, Clock } from 'lucide-react';

const INITIAL_TRANSACTIONS: any[] = [
  { date: '2025-03-15', description: 'CORLHNS Sri Lanka - March 2025', amount: 1200000.00, category: 'Business Promotion & Advertising', type: 'expense', company: 'CORLHNS Sri Lanka' },
  { date: '2025-05-15', description: 'Litmus Private Limited - May 2025', amount: 1090000.00, category: 'Business Promotion & Advertising', type: 'expense', company: 'Litmus Private Limited' },
  { date: '2025-04-15', description: 'MIDEATION INTEGRATED - April 2025', amount: 1994035.46, category: 'Business Promotion & Advertising', type: 'expense', company: 'MIDEATION INTEGRATED (PVT) LTD' },
  { date: '2025-02-15', description: 'Ogilvy Digital - Feb 2025', amount: 5830097.37, category: 'Business Promotion & Advertising', type: 'expense', company: 'Ogilvy Digital (Pvt) Ltd' },
  { date: '2025-06-15', description: 'Roar AD X - June 2025', amount: 523511.58, category: 'Business Promotion & Advertising', type: 'expense', company: 'Roar AD X (PVT) LTD' },
];

const INITIAL_BUDGET_LIMITS: Budget[] = [
  { category: 'Business Promotion & Advertising', limit: 6000000, rollover: true },
  { category: 'Other Marketing Expense', limit: 200000, rollover: true },
  { category: 'Software/SaaS', limit: 500000, rollover: false },
  { category: 'Events', limit: 1000000, rollover: true },
];

const App: React.FC = () => {
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-stone-200 max-w-2xl w-full">
           <div className="flex items-center mb-6 text-amber-600"><Database size={32} className="mr-3" /><h1 className="text-2xl font-bold text-stone-800">Database Setup Required</h1></div>
           <p className="mb-4 text-stone-600">Please configure your Firebase keys in <code>services/firebase.ts</code>.</p>
        </div>
      </div>
    );
  }

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSources, setBudgetSources] = useState<BudgetSource[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  // Use ref to track active unsubscribes to force stop them if permission error occurs
  const unsubsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser: any) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setPermissionError(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setBudgets([]);
      setBudgetSources([]);
      setAppSettings(null);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    const handleListenerError = (error: any, collectionName: string) => {
      console.error(`[Firebase] Critical Error in ${collectionName} listener:`, error);
      if (error.code === 'permission-denied') {
        setPermissionError(collectionName);
        // Force stop all other listeners to prevent console spam
        unsubsRef.current.forEach(unsub => unsub());
        unsubsRef.current = [];
      }
    };

    const unsubCats = onSnapshot(
      collection(db, 'categories'), 
      (snapshot: any) => {
        const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as Category[];
        setCategories(data);
      },
      (err) => handleListenerError(err, 'categories')
    );
    unsubsRef.current.push(unsubCats);

    const unsubTrans = onSnapshot(
      collection(db, 'transactions'), 
      (snapshot: any) => {
        const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as Transaction[];
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(data);
      },
      (err) => handleListenerError(err, 'transactions')
    );
    unsubsRef.current.push(unsubTrans);

    const unsubBudgets = onSnapshot(
      collection(db, 'budgets'), 
      (snapshot: any) => {
        const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), docId: doc.id })) as (Budget & { docId: string })[];
        setBudgets(data);
      },
      (err) => handleListenerError(err, 'budgets')
    );
    unsubsRef.current.push(unsubBudgets);

    const unsubSources = onSnapshot(
      collection(db, 'budget_sources'), 
      (snapshot: any) => {
        const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as BudgetSource[];
        setBudgetSources(data);
      },
      (err) => handleListenerError(err, 'budget_sources')
    );
    unsubsRef.current.push(unsubSources);

    const unsubRecurring = onSnapshot(
      collection(db, 'recurring'), 
      (snapshot: any) => {
        const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as RecurringTransaction[];
        setRecurringTransactions(data);
      },
      (err) => handleListenerError(err, 'recurring')
    );
    unsubsRef.current.push(unsubRecurring);

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'preferences'), 
      (doc: any) => {
        if (doc.exists()) {
          setAppSettings(doc.data() as AppSettings);
        }
      },
      (err) => handleListenerError(err, 'settings/preferences')
    );
    unsubsRef.current.push(unsubSettings);
    
    setDataLoading(false);

    return () => {
      unsubsRef.current.forEach(unsub => unsub());
      unsubsRef.current = [];
    };
  }, [user]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    try { await addDoc(collection(db, 'transactions'), t); } catch (e) { console.error(e); }
  };

  const deleteTransaction = async (id: string) => {
    try { await deleteDoc(doc(db, 'transactions', id)); } catch (e) { console.error(e); }
  };

  const updateBudget = async (category: string, limit: number, rollover: boolean) => {
    try {
      const budgetDoc = (budgets as any[]).find(b => b.category === category);
      if (budgetDoc && budgetDoc.docId) {
        await updateDoc(doc(db, 'budgets', budgetDoc.docId), { limit, rollover });
      } else {
        await addDoc(collection(db, 'budgets'), { category, limit, rollover });
      }
    } catch (e) { console.error(e); }
  };

  const updateBudgetSource = async (id: string | null, name: string, amount: number, description: string) => {
     try {
       if (id) {
         await updateDoc(doc(db, 'budget_sources', id), { amount, description });
       } else {
         await addDoc(collection(db, 'budget_sources'), { name, amount, description });
       }
     } catch (e) { console.error(e); }
  };

  const addRecurringTransaction = async (rt: Omit<RecurringTransaction, 'id'>) => {
    try { await addDoc(collection(db, 'recurring'), rt); } catch (e) { console.error(e); }
  };

  const deleteRecurringTransaction = async (id: string) => {
    try { await deleteDoc(doc(db, 'recurring', id)); } catch (e) { console.error(e); }
  };

  const addCategory = async (name: string, type: any, color?: string) => {
    try {
      if (!categories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type)) {
        await addDoc(collection(db, 'categories'), { name, type, color: color || '#64748b' });
        if (type === 'expense') {
          await addDoc(collection(db, 'budgets'), { category: name, limit: 0, rollover: false });
        }
      }
    } catch (e) { console.error(e); }
  };

  const deleteCategory = async (id: string) => {
    try { await deleteDoc(doc(db, 'categories', id)); } catch (e) { console.error(e); }
  };

  const editCategory = async (id: string, newName: string, newColor?: string) => {
    try { await updateDoc(doc(db, 'categories', id), { name: newName, color: newColor }); } catch (e) { console.error(e); }
  };

  const seedData = async () => {
    const batch = writeBatch(db);
    INITIAL_CATEGORIES.forEach(cat => {
      const ref = doc(collection(db, 'categories'));
      batch.set(ref, { name: cat.name, color: cat.color, type: cat.type });
    });
    INITIAL_BUDGET_LIMITS.forEach(bud => {
      const ref = doc(collection(db, 'budgets'));
      batch.set(ref, bud);
    });
    INITIAL_TRANSACTIONS.forEach(txn => {
      const ref = doc(collection(db, 'transactions'));
      batch.set(ref, txn);
    });
    const sources = ['Primary Budget', 'Principle Grants', 'Group Grants'];
    sources.forEach(s => {
      const ref = doc(collection(db, 'budget_sources'));
      batch.set(ref, { name: s, amount: 0, description: '' });
    });

    try {
      await batch.commit();
      window.location.reload();
    } catch(e) { 
      console.error(e);
      alert("Failed to seed data. This is likely due to Firestore Security Rules.");
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <Auth />;

  if (permissionError) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <div className="bg-white max-w-xl w-full p-8 rounded-2xl shadow-2xl border border-rose-100 animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-rose-50 rounded-full text-rose-500 mb-4">
              <ShieldAlert size={48} />
            </div>
            <h1 className="text-2xl font-black text-stone-800 mb-1">Database Rules Expired</h1>
            <p className="text-stone-500 mb-6 leading-relaxed text-sm">
              Your security rules expired on <strong>January 15th, 2026</strong>. 
              Today is <strong>{new Date().toLocaleDateString()}</strong>, so Firebase is blocking all data access.
            </p>
            
            <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 text-left w-full mb-6">
              <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center">
                <Clock size={16} className="mr-2 text-rose-500" /> How to fix:
              </h3>
              <ol className="text-xs text-stone-600 space-y-3 list-decimal pl-4">
                <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">Firebase Console</a>.</li>
                <li>Go to <strong>Build</strong> &gt; <strong>Firestore Database</strong> &gt; <strong>Rules</strong> tab.</li>
                <li><strong>DELETE</strong> the current date-check rule and <strong>REPLACE</strong> it with this:
                  <pre className="mt-2 p-3 bg-stone-900 text-emerald-400 rounded-md overflow-x-auto text-[10px] font-mono leading-normal">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                  </pre>
                </li>
                <li>Click <strong>Publish</strong>. The app will work instantly after you refresh.</li>
              </ol>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-stone-800 text-white font-bold py-3 rounded-lg hover:bg-stone-900 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCcw size={18} /> I updated the rules, Refresh App
              </button>
              <button 
                onClick={handleLogout}
                className="w-full bg-white border border-stone-200 text-stone-600 font-bold py-3 rounded-lg hover:bg-stone-50 transition-all"
              >
                Sign Out
              </button>
            </div>

            <a 
              href="https://console.firebase.google.com/" 
              target="_blank" 
              rel="noreferrer"
              className="mt-6 text-sm text-blue-600 hover:underline flex items-center gap-1 font-bold"
            >
              Go to Firebase Console <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout 
        notifications={notifications} 
        onClearNotifications={() => setNotifications([])}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        userEmail={user?.email}
      >
        {categories.length === 0 && !dataLoading && !permissionError && (
           <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex items-center justify-between">
             <div className="flex items-center"><Database className="text-blue-500 mr-3" /><div><h3 className="font-bold text-blue-900">Database Empty</h3><p className="text-sm">Load default Vision Care template?</p></div></div>
             <button onClick={seedData} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Load Template Data</button>
           </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard transactions={transactions} budgets={budgets} categories={categories} budgetSources={budgetSources} />} />
          <Route path="/budgets" element={<BudgetsPage budgetSources={budgetSources} budgets={budgets} categories={categories} onUpdateSource={updateBudgetSource} onUpdateBudget={updateBudget} />} />
          <Route path="/transactions" element={<TransactionsPage transactions={transactions} recurringTransactions={recurringTransactions} categories={categories} onAdd={addTransaction} onDelete={deleteTransaction} onAddRecurring={addRecurringTransaction} onDeleteRecurring={deleteRecurringTransaction} searchTerm={searchTerm} />} />
          <Route path="/insights" element={<InsightsPage transactions={transactions} budgets={budgets} onUpdateBudget={updateBudget} />} />
          <Route path="/settings" element={<SettingsPage categories={categories} transactions={transactions} budgets={budgets} appSettings={appSettings} onAddCategory={addCategory} onDeleteCategory={deleteCategory} onEditCategory={editCategory} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;