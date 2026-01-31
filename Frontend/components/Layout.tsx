import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  Moon, 
  Sun, 
  Menu,
  Leaf,
  Cpu
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { labels } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isActive = (hash: string) => {
    if (hash === '#/' && (currentHash === '#/' || currentHash === '')) return true;
    return currentHash.startsWith(hash) && hash !== '#/';
  };

  const linkClass = (hash: string) => `
    flex items-center px-4 py-3 rounded-xl transition-all duration-200 border 
    ${isActive(hash) 
      ? 'bg-primary/10 text-primary-dark dark:text-primary hover:shadow-sm border-transparent hover:border-primary/20' 
      : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 border-transparent'}
  `;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex transition-colors duration-200">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 fixed h-full z-10 font-sans">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex flex-col gap-6">
          
          {/* Entity 1: AION (Tech Provider) */}
          <div className="flex items-center gap-4 group">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Cpu size={24} className="opacity-90" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">FruitRipe</h1>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">by AION</span>
            </div>
          </div>

          {/* Elegant Divider */}
          <div className="relative h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-600 to-transparent"></div>

          {/* Entity 2: Expert Agrochem (Client) */}
          <div className="flex items-center gap-4 group">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
              <Leaf size={24} fill="currentColor" className="opacity-90" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{labels.designedFor}</span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">Expert Agrochem Limited</h2>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-2">
          <a href="#/" className={linkClass('#/')}>
            <LayoutDashboard className="h-5 w-5 mr-3" />
            <span className="font-medium tracking-wide">{labels.dashboard}</span>
          </a>
          <a href="#/settings" className={linkClass('#/settings')}>
            <Settings className="h-5 w-5 mr-3" />
            <span className="font-medium tracking-wide">{labels.settings}</span>
          </a>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-4 px-2">
             <div className="text-sm">
                <p className="text-slate-900 dark:text-white font-bold">{user?.name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs truncate w-32 font-medium">{user?.email}</p>
             </div>
             <button onClick={toggleTheme} title={labels.toggleTheme} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
             </button>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm text-sm font-medium"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {labels.signOut}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-white/80 dark:bg-slate-900/90 backdrop-blur-md z-20 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md">
             <Cpu size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">FruitRipe</span>
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">by AION</span>
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 transition-opacity" onClick={() => setIsSidebarOpen(false)}>
          <div className="bg-white dark:bg-slate-800 w-80 h-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
             <div className="mb-8 flex flex-col gap-6">
                {/* AION Mobile */}
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">FruitRipe</h3>
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">by AION</p>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-slate-700"></div>

                {/* Agrochem Mobile */}
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                     <Leaf size={20} fill="currentColor" />
                   </div>
                   <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{labels.designedFor}</p>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Expert Agrochem Limited</h3>
                   </div>
                </div>
             </div>

             <nav className="space-y-3">
                <a href="#/" className="flex items-center px-4 py-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-slate-900 dark:text-white font-medium">
                  <LayoutDashboard size={18} className="mr-3 text-primary"/> {labels.dashboard}
                </a>
                <a href="#/settings" className="flex items-center px-4 py-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-slate-900 dark:text-white font-medium">
                  <Settings size={18} className="mr-3 text-primary"/> {labels.settings}
                </a>
                <button onClick={toggleTheme} className="w-full flex items-center px-4 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl">
                  {theme === 'light' ? <Moon size={18} className="mr-3"/> : <Sun size={18} className="mr-3"/>}
                  {labels.toggleTheme}
                </button>
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-700">
                  <button onClick={logout} className="w-full flex items-center px-4 py-3 text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl">
                    <LogOut size={18} className="mr-3"/> {labels.signOut}
                  </button>
                </div>
             </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;