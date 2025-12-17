import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Receipt, PieChart, Landmark, Menu, X, Settings, Bell, Search, UserCircle, Wallet, CalendarClock } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  notifications: Notification[];
  onClearNotifications: () => void;
  searchTerm?: string;
  onSearch?: (term: string) => void;
  userEmail?: string;
}

const BrandLogo = ({ compact = false }: { compact?: boolean }) => (
  <div className={`flex flex-col items-center select-none ${compact ? 'scale-75 origin-left' : ''}`}>
    {/* VISION CARE Text */}
    <h1 className="text-2xl font-black text-blue-900 tracking-tighter leading-none" style={{ fontFamily: 'Arial Black, sans-serif' }}>
      VISION CARE
    </h1>
    
    {/* Hearing Solutions Bar */}
    <div className="flex w-full mt-0.5 shadow-sm">
      <div className="bg-blue-900 text-white text-[9px] font-bold py-0.5 px-2 flex-grow text-center flex items-center justify-center tracking-wider">
        HEARING
      </div>
      <div className="bg-cyan-500 text-white text-[9px] font-bold py-0.5 px-2 flex-grow text-center tracking-wider">
        SOLUTIONS
      </div>
    </div>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children, notifications, onClearNotifications, searchTerm = '', onSearch, userEmail = '' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Toast State
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Filter for new critical alerts (Allocations within 3 days)
    const newAlerts = notifications.filter(n => {
      // Check if it's an allocation alert or budget warning
      const isImportant = n.message.includes('Allocation') || n.message.includes('💰') || n.type === 'warning';
      return isImportant && !processedRef.current.has(n.id);
    });

    if (newAlerts.length > 0) {
      // Mark as processed so they don't pop up again this session
      newAlerts.forEach(n => processedRef.current.add(n.id));
      // Add to active toasts
      setActiveToasts(prev => [...prev, ...newAlerts]);
    }
  }, [notifications]);

  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Budget', path: '/budgets', icon: <Landmark size={20} /> },
    { name: 'Transactions', path: '/transactions', icon: <Receipt size={20} /> },
    { name: 'Insights', path: '/insights', icon: <PieChart size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(e.target.value);
      if (location.pathname !== '/transactions') {
        navigate('/transactions');
      }
    }
  };

  const username = userEmail ? userEmail.split('@')[0] : '';

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Toast Container - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3 pointer-events-none">
        {activeToasts.map(toast => (
          <div 
            key={toast.id} 
            className="pointer-events-auto bg-white border-l-4 border-emerald-500 rounded-lg shadow-xl p-4 max-w-sm w-full flex items-start animate-[slideIn_0.3s_ease-out] transition-all"
            role="alert"
          >
            <div className={`p-2 rounded-full mr-3 shrink-0 ${toast.type === 'warning' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
               {toast.type === 'warning' ? <CalendarClock size={20} /> : <Wallet size={20} />}
            </div>
            <div className="flex-1 mr-2">
              <h4 className="text-sm font-bold text-stone-800">
                {toast.message.includes('Allocation') ? 'Incoming Allocation' : 'Alert'}
              </h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-stone-400 hover:text-stone-600 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-stone-200 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-center h-24 px-6 border-b border-stone-100 bg-white">
          <BrandLogo />
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center px-4 py-3 rounded-lg transition-colors duration-200
                ${isActive(item.path) 
                  ? 'bg-emerald-50 text-emerald-800 font-medium border-l-4 border-emerald-600' 
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}
              `}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-stone-100">
           <div className="flex items-center text-xs text-stone-400 justify-center">
              &copy; 2025 Vision Care
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-8 bg-white border-b border-stone-200 gap-4">
          <div className="flex items-center lg:hidden shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-md text-stone-500 hover:bg-stone-100"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="ml-2 overflow-hidden">
               <BrandLogo compact={true} />
            </div>
          </div>

          <div className="hidden lg:block shrink-0">
            <h2 className="text-lg font-bold text-stone-700">Budget Management Portal</h2>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 text-stone-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={handleGlobalSearch}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-800 placeholder-stone-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 shrink-0">
             {/* User Profile */}
             {username && (
               <div className="hidden md:flex items-center px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
                 <UserCircle size={18} className="text-blue-900 mr-2" />
                 <span className="text-sm font-bold text-stone-700">{username}</span>
               </div>
             )}

             {/* Notification Bell */}
             <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 rounded-full text-stone-500 hover:bg-stone-100 relative focus:outline-none"
                >
                   <Bell size={20} />
                   {unreadCount > 0 && (
                     <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                   )}
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-stone-100 z-20 overflow-hidden">
                      <div className="p-3 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                        <h3 className="font-bold text-stone-800 text-sm">Notifications</h3>
                        {notifications.length > 0 && (
                          <button onClick={onClearNotifications} className="text-xs text-stone-500 hover:text-emerald-600">
                            Clear all
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-sm text-stone-500">
                            No new notifications
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className={`p-3 border-b border-stone-50 last:border-0 hover:bg-stone-50 ${n.type === 'warning' ? 'bg-rose-50/50' : ''}`}>
                              <p className={`text-xs font-bold mb-1 ${n.type === 'warning' ? 'text-rose-600' : 'text-stone-800'}`}>
                                {n.type === 'warning' ? 'Alert' : 'Update'}
                              </p>
                              <p className="text-sm text-stone-600">{n.message}</p>
                              <p className="text-xs text-stone-400 mt-1">{n.date}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Layout;