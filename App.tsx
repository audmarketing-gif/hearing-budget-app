import React, { useState, useEffect } from 'react';
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
  writeBatch
} from './services/firebase';
import { sendAllocationAlert } from './services/emailService';

// Pages
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import { Loader2, Database } from 'lucide-react';

const INITIAL_TRANSACTIONS: any[] = [
  // Business Promotion & Advertising
  { date: '2025-03-15', description: 'CORLHNS Sri Lanka - March 2025', amount: 1200000.00, category: 'Business Promotion & Advertising', type: 'expense', company: 'CORLHNS Sri Lanka' },
  { date: '2025-05-15', description: 'Litmus Private Limited - May 2025', amount: 1090000.00, category: 'Business Promotion & Advertising', type: 'expense', company: 'Litmus Private Limited' },
  
  { date: '2025-03-15', description: 'MIDEATION INTEGRATED - March 2025', amount: 131200.00, category: 'Business Promotion & Advertising', type: 'expense', company: 'MIDEATION INTEGRATED (PVT) LTD' },
  { date: '2025-04-15', description: 'MIDEATION INTEGRATED - April 2025', amount: 1994035.46, category: 'Business Promotion & Advertising', type: 'expense', company: 'MIDEATION INTEGRATED (PVT) LTD' },
  { date: '2025-05-15', description: 'MIDEATION INTEGRATED - May 2025', amount: 2357500.00, category: 'Business Promotion & Advertising', type: 'expense', company: 'MIDEATION INTEGRATED (PVT) LTD' },

  { date: '2025-01-15', description: 'Ogilvy Digital - Jan 2025', amount: 230625.00, category: 'Business Promotion & Advertising', type: 'expense', company: 'Ogilvy Digital (Pvt) Ltd' },
  { date: '2025-02-15', description: 'Ogilvy Digital - Feb 2025', amount: 5830097.37, category: 'Business Promotion & Advertising', type: 'expense', company: 'Ogilvy Digital (Pvt) Ltd' },
  { date: '2025-03-15', description: 'Ogilvy Digital - March 2025', amount: 720575.00, category: 'Business Promotion & Advertising', type: 'expense', company: 'Ogilvy Digital (Pvt) Ltd' },
  { date: '2025-05-15', description: 'Ogilvy Digital - May 2025', amount: 1939868.58, category: 'Business Promotion & Advertising', type: 'expense', company: 'Ogilvy Digital (Pvt) Ltd' },

  { date: '2025-02-15', description: 'REDFLY - Feb 2025', amount: 38000.00, category: 'Business Promotion & Advertising', type: 'expense', company: 'REDFLY (PVT) LTD' },
  { date: '2025-03-15', description: 'REDFLY - March 2025', amount: 65000.00, category: 'Business Promotion & Advertising', type: 'expense', company: 'REDFLY (PVT) LTD' },

  { date: '2025-01-15', description: 'Roar AD X - Jan 2025', amount: 777383.48, category: 'Business Promotion & Advertising', type: 'expense', company: 'Roar AD X (PVT) LTD' },
  { date: '2025-02-15', description: 'Roar AD X - Feb 2025', amount: 76349.17, category: 'Business Promotion & Advertising', type: 'expense', company: 'Roar AD X (PVT) LTD' },
  { date: '2025-03-15', description: 'Roar AD X - March 2025', amount: 177829.07, category: 'Business Promotion & Advertising', type: 'expense', company: 'Roar AD X (PVT) LTD' },
  { date: '2025-04-15', description: 'Roar AD X - April 2025', amount: 603019.48, category: 'Business Promotion & Advertising', type: 'expense', company: 'Roar AD X (PVT) LTD' },
  { date: '2025-05-15', description: 'Roar AD X - May 2025', amount: 165717.33, category: 'Business Promotion & Advertising', type: 'expense', company: 'Roar AD X (PVT) LTD' },
  { date: '2025-06-15', description: 'Roar AD X - June 2025', amount: 523511.58, category: 'Business Promotion & Advertising', type: 'expense', company: 'Roar AD X (PVT) LTD' },

  // Other Marketing Expense
  { date: '2025-03-15', description: 'K.H.Chamila Madushanka - March 2025', amount: 16150.00, category: 'Other Marketing Expense', type: 'expense', company: 'K.H.Chamila Madushanka' },
  { date: '2025-05-15', description: 'Promowatch - May 2025', amount: 92621.56, category: 'Other Marketing Expense', type: 'expense', company: 'Promowatch (Pvt) Ltd' },
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
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]); // Category Limits
  const [budgetSources, setBudgetSources] = useState<BudgetSource[]>([]); // New Budget Sources
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: any) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setBudgets([]);
      setBudgetSources([]);
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
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(data);
    });

    const unsubBudgets = onSnapshot(collection(db, 'budgets'), (snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), docId: doc.id })) as (Budget & { docId: string })[];
      setBudgets(data);
    });

    // New collection for Budget Sources
    const unsubSources = onSnapshot(collection(db, 'budget_sources'), (snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as BudgetSource[];
      setBudgetSources(data);
    });

    const unsubRecurring = onSnapshot(collection(db, 'recurring'), (snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as RecurringTransaction[];
      setRecurringTransactions(data);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'preferences'), (doc: any) => {
       if (doc.exists()) {
          setAppSettings(doc.data() as AppSettings);
       }
    });
    
    setDataLoading(false);

    return () => {
      unsubCats();
      unsubTrans();
      unsubBudgets();
      unsubSources();
      unsubRecurring();
      unsubSettings();
    };
  }, [user]);

  // Notifications Logic
  useEffect(() => {
    if (!user) return;
    const newNotifications: Notification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const todayStr = today.toISOString().split('T')[0];

    // Helper to send email alerts safely
    const triggerEmailAlert = (id: string, description: string, date: string, amount: number) => {
      if (appSettings?.alertEmail) {
        const sentKey = `alert_sent_${id}`;
        // Only send if not already sent today/for this event
        if (!localStorage.getItem(sentKey)) {
          // Pass the config keys from appSettings
          const config = {
             serviceId: appSettings.emailServiceId,
             templateId: appSettings.emailTemplateId,
             publicKey: appSettings.emailPublicKey
          };

          sendAllocationAlert(appSettings.alertEmail, { description, date, amount }, config)
            .then((success) => {
              if (success) {
                localStorage.setItem(sentKey, 'true');
                // Push a UI notification about the email being sent
                newNotifications.push({
                  id: `email-sent-${id}`,
                  message: `📧 Email alert sent to ${appSettings.alertEmail} for ${description}`,
                  type: 'info',
                  date: todayStr,
                  read: false
                });
                // Force update notifications state to show the email sent toast
                setNotifications(prev => [...prev, {
                  id: `email-sent-${id}`,
                  message: `📧 Email alert sent to ${appSettings.alertEmail} for ${description}`,
                  type: 'info',
                  date: todayStr,
                  read: false
                }]);
              }
            });
        }
      }
    };

    // Check Recurring Transactions
    recurringTransactions.forEach(rt => {
       const [y, m, d] = rt.nextDueDate.split('-').map(Number);
       const dueDate = new Date(y, m - 1, d); // Local midnight
       
       const diffTime = dueDate.getTime() - today.getTime();
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
       
       if (diffDays >= 0 && diffDays <= 3) {
         const isAlloc = rt.type === 'allocation';
         newNotifications.push({
           id: `rec-${rt.id}-${rt.nextDueDate}`,
           message: `${isAlloc ? '💰 Allocation Incoming' : '📅 Upcoming Expense'}: ${rt.description} due ${rt.nextDueDate}`,
           type: 'info',
           date: todayStr,
           read: false
         });

         // Email Alert for Allocation
         if (isAlloc) {
           triggerEmailAlert(rt.id + rt.nextDueDate, rt.description, rt.nextDueDate, rt.amount);
         }
       }
    });

    // Check Manual Future Allocations
    transactions.forEach(t => {
      if (t.type === 'allocation') {
        const [y, m, d] = t.date.split('-').map(Number);
        const tDate = new Date(y, m - 1, d);
        
        const diffTime = tDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Only alert for future allocations within 3 days
        if (diffDays >= 0 && diffDays <= 3) {
           newNotifications.push({
             id: `alloc-${t.id}`,
             message: `💰 Scheduled Allocation: ${t.description} arriving on ${t.date}`,
             type: 'info',
             date: todayStr,
             read: false
           });

           // Email Alert for Allocation
           triggerEmailAlert(t.id, t.description, t.date, t.amount);
        }
      }
    });

    // Check Budgets (Caps)
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
           message: `Alert: ${b.category} is at ${Math.round((spent/b.limit)*100)}% of monthly cap.`,
           type: 'warning',
           date: todayStr,
           read: false
         });
      }
    });
    
    // Sort notifications by urgency/date if needed, but for now simple push
    // Avoid infinite loop by checking length
    if (newNotifications.length > 0) {
        setNotifications(prev => {
          // Simple JSON stringify comparison to avoid loop if identical
          if (JSON.stringify(prev) !== JSON.stringify(newNotifications)) {
            return newNotifications;
          }
          return prev;
        });
    }
  }, [transactions, budgets, recurringTransactions, user, appSettings]);

  // Recurring Logic (Simple check on load)
  useEffect(() => {
    if (!user || recurringTransactions.length === 0) return;
    const processRecurring = async () => {
      const today = new Date();
      // Reset time to ensure we catch anything due 'today' regardless of time of day execution
      today.setHours(0,0,0,0); 
      
      const batch = writeBatch(db);
      let hasUpdates = false;

      recurringTransactions.forEach(rt => {
        const [y, m, d] = rt.nextDueDate.split('-').map(Number);
        let dueDate = new Date(y, m - 1, d);
        let modified = false;
        let safetyCount = 0; 

        while (dueDate <= today && safetyCount < 12) {
          modified = true;
          safetyCount++;
          
          const newRef = doc(collection(db, 'transactions'));
          // Format Date YYYY-MM-DD
          const isoDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
          
          batch.set(newRef, {
            date: isoDate,
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
          const nextIso = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
          batch.update(rtRef, { nextDueDate: nextIso });
        }
      });

      if (hasUpdates) await batch.commit();
    };
    processRecurring();
  }, [recurringTransactions, user]);

  // Actions
  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    try { await addDoc(collection(db, 'transactions'), t); } catch (e) { console.error(e); }
  };

  const deleteTransaction = async (id: string) => {
    try { await deleteDoc(doc(db, 'transactions', id)); } catch (e) { console.error(e); }
  };

  // Updates Category Limits (Channel Caps)
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

  // Update Budget Sources (Primary, Grants)
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

    // Seed empty budget sources
    const sources = ['Primary Budget', 'Principle Grants', 'Group Grants'];
    sources.forEach(s => {
      const ref = doc(collection(db, 'budget_sources'));
      batch.set(ref, { name: s, amount: 0, description: '' });
    });

    try {
      await batch.commit();
      window.location.reload();
    } catch(e) { console.error(e); }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <Auth />;

  return (
    <HashRouter>
      <Layout 
        notifications={notifications} 
        onClearNotifications={() => setNotifications([])}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        userEmail={user?.email}
      >
        {categories.length === 0 && !dataLoading && (
           <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex items-center justify-between">
             <div className="flex items-center"><Database className="text-blue-500 mr-3" /><div><h3 className="font-bold text-blue-900">Database Empty</h3><p className="text-sm">Load default Vision Care template?</p></div></div>
             <button onClick={seedData} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Load Template Data</button>
           </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard transactions={transactions} budgets={budgets} categories={categories} budgetSources={budgetSources} />} />
          <Route path="/budgets" element={<BudgetsPage budgetSources={budgetSources} onUpdateSource={updateBudgetSource} />} />
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
            path="/insights" 
            element={<InsightsPage transactions={transactions} budgets={budgets} onUpdateBudget={updateBudget} />} 
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