import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AuthResponse } from '../types';
import { Lock, Mail, Loader2, Leaf, Cpu } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      login(response.data.token, response.data.user, response.data.refreshToken);
      window.location.hash = '#/'; 
      
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-200 p-4">
      <div className="max-w-[420px] w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        
        {/* Elegant Branding Header */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 pb-10 border-b border-gray-100 dark:border-slate-700">
          <div className="flex flex-col gap-8">
            
            {/* AION Section */}
            <div className="flex flex-col items-center">
               <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-4 transform hover:scale-105 transition-transform duration-500">
                  <Cpu size={28} />
               </div>
               <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                 FruitRipe
               </h1>
               <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mt-1">
                 Powered by AION
               </span>
            </div>

            {/* Connecting Line */}
            <div className="flex items-center justify-center w-full gap-4">
               <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent"></div>
               <span className="text-[16px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest shrink-0 bg-slate-50 dark:bg-slate-800 px-2">
                 X
               </span>
               <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent"></div>
            </div>

            {/* Expert Agrochem Section */}
            <div className="flex items-center justify-center gap-3 opacity-90">
               <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Leaf size={20} fill="currentColor" />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Designed for</p>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Expert Agrochem Limited</h2>
               </div>
            </div>

          </div>
        </div>

        <div className="p-8 pt-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900 flex items-center animate-shake">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none block w-full pl-11 pr-3 py-3.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none block w-full pl-11 pr-3 py-3.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In to Dashboard'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <button
               type="button"
               onClick={() => (window.location.hash = '#/reset')}
               className="text-xs font-semibold text-primary hover:underline"
             >
               Forgot password?
             </button>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => (window.location.hash = '#/register')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Create an account
              </button>
            </div>
             <p className="text-[10px] text-gray-400 font-medium mt-3">
               System v1.2.0 • Server Status: <span className="text-emerald-500">Operational</span>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;