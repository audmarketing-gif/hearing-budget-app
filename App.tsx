import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './components/Auth';
import { Transaction, Budget, RecurringTransaction, SavingsGoal, Category, Notification, INITIAL_CATEGORIES, TransactionType } from './types';
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
  writeBatch
} from './services/firebase';

// Pages
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import InsightsPage from './pages/InsightsPage';
import SavingsPage from './pages/SavingsPage';
import SettingsPage from './pages/SettingsPage';
import { Loader2, Database, ShieldAlert } from 'lucide-react';

// Initial Mock Data (Moved inside for seeding)
const INITIAL_TRANSACTIONS: any[] = [
  { date: '2025-01-01', description: 'Q1 Marketing Allocation', amount: 15000000, category: 'Quarterly Budget', type: 'income' },
  { date: '2025-04-01', description: 'Q2 Marketing Allocation', amount: 20000000, category: 'Quarterly Budget', type: 'income' },
  { date: '2025-01-15', description: 'Ogilvy Digital (Pvt) Ltd - Jan', amount: 230625.00, category: 'Business Promotion & Advertising', type: 'expense' },
  { date: '2025-01-20', description: 'Roar AD X (PVT) LTD - Jan', amount: 777383.48, category: 'Business Promotion & Advertising', type: 'expense' },
  { date: '2025-02-10', description: 'CORLHNS Sri Lanka', amount: 1200000.00, category: 'Business Promotion & Advertising', type: 'expense' },
  { date: '2025-02-15', description: 'Ogilvy Digital (Pvt) Ltd - Feb', amount: 5830097.37, category: 'Business Promotion & Advertising', type: 'expense' },
];

const INITIAL_BUDGETS: Budget[] = [
  { category: 'Business Promotion & Advertising', limit: 6000000, rollover: true },
  { category: 'Other Marketing Expense', limit: 200000, rollover: true },
  { category: 'Software/SaaS', limit: 500000, rollover: false },
  { category: 'Events', limit: 1000000, rollover: true },
];

const App: React.FC = () => {
  // Setup State
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-stone-200 max-w-2xl w-full">
          <div className="flex items-center mb-6 text-amber-600">
            <Database size={32} className="mr-3" />
            <h1 className="text-2xl font-bold text-stone-800">Database Setup Required</h1>
          </div>
          <p className="mb-4 text-stone-600">To enable team sharing, you must connect this app to a Firebase database.</p>
          
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 font-mono text-xs text-stone-700 mb-6 overflow-x-auto">
            <p className="font-bold mb-2">// 1. Open services/firebase.ts</p>
            <p className="font-bold mb-2">// 2. Replace the 'firebaseConfig' object with your keys:</p>
            <p>{`const firebaseConfig = {`}</p>
            <p>{`  apiKey: "AIzaSy...",`}</p>
            <p>{`  authDomain: "your-project.firebaseapp.com",`}</p>
            <p>{`  projectId: "your-project",`}</p>
            <p>{`  ...`}</p>
            <p>{`};`}</p>
          </div>

          <h3 className="font-bold text-stone-800 mb-2">Quick Start Guide:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-stone-600">
            <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="text-blue-600 hover:underline">console.firebase.google.com</a></li>
            <li>Create a project.</li>
            <li>Enable <strong>Firestore Database</strong> (Start in Test Mode).</li>
            <li>Enable <strong>Authentication</strong> (Email/Password).</li>
            <li>Add a Web App to get your configuration keys.</li>
            <li>Update <code>services/firebase.ts</code>.</li>
          </ol>
        </div>
      </div>
    );
  }

  // App State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: any) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setBudgets([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as Category[];
      setCategories(data);
    });

    const unsubTrans = onSnapshot(collection(db, 'transactions'), (snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as Transaction[];
      // Sort by date descending locally
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(data);
    });

    const unsubBudgets = onSnapshot(collection(db, 'budgets'), (snapshot: any) => {
      // Budgets don't strictly need IDs in the Type, but we need them for updates. 
      // Mapping manually to fit Budget type which currently uses 'category' as key visually
      const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), docId: doc.id })) as (Budget & { docId: string })[];
      setBudgets(data);
    });

    const unsubRecurring = onSnapshot(collection(db, 'recurring'), (snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as RecurringTransaction[];
      setRecurringTransactions(data);
    });

    const unsubSavings = onSnapshot(collection(db, 'savings'), (snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as SavingsGoal[];
      setSavingsGoals(data);
    });
    
    setDataLoading(false);

    return () => {
      unsubCats();
      unsubTrans();
      unsubBudgets();
      unsubRecurring();
      unsubSavings();
    };
  }, [user]);

  // Notifications Logic (Local calculation based on fetched data)
  useEffect(() => {
    if (!user) return;
    const newNotifications: Notification[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    recurringTransactions.forEach(rt => {
       const dueDate = new Date(rt.nextDueDate);
       const diffTime = dueDate.getTime() - today.getTime();
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
       
       if (diffDays >= 0 && diffDays <= 3) {
         newNotifications.push({
           id: `rec-${rt.id}-${rt.nextDueDate}`,
           message: `Upcoming: ${rt.description} due on ${rt.nextDueDate}`,
           type: 'info',
           date: today.toISOString().split('T')[0],
           read: false
         });
       }
    });

    const spendingByCategory = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    budgets.forEach(b => {
      const spent = spendingByCategory[b.category] || 0;
      if (b.limit > 0 && spent / b.limit >= 0.9) {
         newNotifications.push({
           id: `budget-${b.category}-${currentMonth}`,
           message: `Budget Alert: ${b.category} is at ${Math.round((spent/b.limit)*100)}% of monthly cap.`,
           type: 'warning',
           date: today.toISOString().split('T')[0],
           read: false
         });
      }
    });
    
    if (newNotifications.length > 0) {
        setNotifications(prev => {
          // simple dedup based on length for demo
          if (prev.length !== newNotifications.length) return newNotifications;
          return prev;
        });
    }
  }, [transactions, budgets, recurringTransactions, user]);

  // Recurring Logic (Process and update DB)
  useEffect(() => {
    if (!user || recurringTransactions.length === 0) return;

    const processRecurring = async () => {
      const today = new Date();
      const batch = writeBatch(db);
      let hasUpdates = false;

      recurringTransactions.forEach(rt => {
        let dueDate = new Date(rt.nextDueDate);
        let modified = false;

        // Limit loop to prevent infinite creates if dates are messed up
        let safetyCount = 0; 

        while (dueDate <= today && safetyCount < 12) {
          modified = true;
          safetyCount++;
          
          const newRef = doc(collection(db, 'transactions'));
          batch.set(newRef, {
            date: dueDate.toISOString().split('T')[0],
            description: rt.description,
            amount: rt.amount,
            category: rt.category,
            type: rt.type
          });

          if (rt.frequency === 'daily') dueDate.setDate(dueDate.getDate() + 1);
          if (rt.frequency === 'weekly') dueDate.setDate(dueDate.getDate() + 7);
          if (rt.frequency === 'monthly') dueDate.setMonth(dueDate.getMonth() + 1);
          if (rt.frequency === 'yearly') dueDate.setFullYear(dueDate.getFullYear() + 1);
        }

        if (modified) {
          hasUpdates = true;
          const rtRef = doc(db, 'recurring', rt.id);
          batch.update(rtRef, { nextDueDate: dueDate.toISOString().split('T')[0] });
        }
      });

      if (hasUpdates) {
        try {
          await batch.commit();
          console.log("Processed recurring transactions.");
        } catch (e) {
          console.error("Error processing recurring", e);
        }
      }
    };

    processRecurring();
  }, [recurringTransactions, user]);


  // --- Actions (Async Firestore Calls) ---

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    try {
      await addDoc(collection(db, 'transactions'), t);
    } catch (e) { console.error("Add failed", e); }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (e) { console.error("Delete failed", e); }
  };

  const updateBudget = async (category: string, limit: number, rollover: boolean) => {
    try {
      // Find doc ID first
      const budgetDoc = (budgets as any[]).find(b => b.category === category);
      if (budgetDoc && budgetDoc.docId) {
        await updateDoc(doc(db, 'budgets', budgetDoc.docId), { limit, rollover });
      } else {
        await addDoc(collection(db, 'budgets'), { category, limit, rollover });
      }
    } catch (e) { console.error("Budget update failed", e); }
  };

  const addRecurringTransaction = async (rt: Omit<RecurringTransaction, 'id'>) => {
    try {
      await addDoc(collection(db, 'recurring'), rt);
    } catch (e) { console.error("Recurring add failed", e); }
  };

  const deleteRecurringTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recurring', id));
    } catch (e) { console.error("Recurring delete failed", e); }
  };

  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id'>) => {
    try {
      await addDoc(collection(db, 'savings'), goal);
    } catch (e) { console.error("Savings add failed", e); }
  };

  const updateSavingsAmount = async (id: string, amount: number) => {
    try {
      const goal = savingsGoals.find(g => g.id === id);
      if (goal) {
        await updateDoc(doc(db, 'savings', id), { currentAmount: goal.currentAmount + amount });
      }
    } catch (e) { console.error("Savings update failed", e); }
  };

  const deleteSavingsGoal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'savings', id));
    } catch (e) { console.error("Savings delete failed", e); }
  };

  const addCategory = async (name: string, type: TransactionType, color?: string) => {
    try {
      if (!categories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type)) {
        await addDoc(collection(db, 'categories'), { name, type, color: color || '#64748b' });
        // Init budget
        if (type === 'expense') {
          await addDoc(collection(db, 'budgets'), { category: name, limit: 0, rollover: false });
        }
      }
    } catch (e) { console.error("Category add failed", e); }
  };

  const deleteCategory = async (id: string) => {
    try {
      const cat = categories.find(c => c.id === id);
      if (cat) {
        await deleteDoc(doc(db, 'categories', id));
        // Note: We are not cascading delete budgets/transactions to keep history, 
        // but normally you might want to mark them archived.
      }
    } catch (e) { console.error("Category delete failed", e); }
  };

  const editCategory = async (id: string, newName: string, newColor?: string) => {
    try {
      await updateDoc(doc(db, 'categories', id), { name: newName, color: newColor });
      // Note: We should ideally update all transaction references to this name, 
      // but NoSQL denormalization makes this heavy. 
      // For this MVP, we update just the definition.
    } catch (e) { console.error("Category edit failed", e); }
  };

  const seedData = async () => {
    const batch = writeBatch(db);
    
    // Seed Categories
    INITIAL_CATEGORIES.forEach(cat => {
      const ref = doc(collection(db, 'categories'));
      batch.set(ref, { name: cat.name, color: cat.color, type: cat.type });
    });

    // Seed Budgets
    INITIAL_BUDGETS.forEach(bud => {
      const ref = doc(collection(db, 'budgets'));
      batch.set(ref, bud);
    });

    // Seed Transactions
    INITIAL_TRANSACTIONS.forEach(txn => {
      const ref = doc(collection(db, 'transactions'));
      batch.set(ref, txn);
    });

    try {
      await batch.commit();
      window.location.reload(); // Refresh to see data
    } catch(e) { console.error(e); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
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
        {/* Empty State / Seeder */}
        {categories.length === 0 && !dataLoading && (
           <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex items-center justify-between animate-in fade-in">
             <div className="flex items-center">
               <Database className="text-blue-500 mr-3" />
               <div>
                 <h3 className="font-bold text-blue-900">Database is empty</h3>
                 <p className="text-sm text-blue-700">Would you like to load the default Vision Care template data?</p>
               </div>
             </div>
             <button 
               onClick={seedData}
               className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
             >
               Load Template Data
             </button>
           </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard transactions={transactions} budgets={budgets} categories={categories} />} />
          <Route 
            path="/transactions" 
            element={
              <TransactionsPage 
                transactions={transactions} 
                recurringTransactions={recurringTransactions}
                categories={categories}
                onAdd={addTransaction} 
                onDelete={deleteTransaction} 
                onAddRecurring={addRecurringTransaction}
                onDeleteRecurring={deleteRecurringTransaction}
                searchTerm={searchTerm}
              />
            } 
          />
          <Route 
            path="/budgets" 
            element={
              <BudgetsPage 
                transactions={transactions} 
                budgets={budgets} 
                onUpdateBudget={updateBudget} 
              />
            } 
          />
          <Route
            path="/savings"
            element={
              <SavingsPage
                goals={savingsGoals}
                onAddGoal={addSavingsGoal}
                onUpdateAmount={updateSavingsAmount}
                onDeleteGoal={deleteSavingsGoal}
              />
            }
          />
          <Route 
            path="/insights" 
            element={<InsightsPage transactions={transactions} budgets={budgets} />} 
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                categories={categories}
                transactions={transactions}
                budgets={budgets}
                onAddCategory={addCategory}
                onDeleteCategory={deleteCategory}
                onEditCategory={editCategory}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;