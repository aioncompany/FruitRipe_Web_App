import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [requestMessage, setRequestMessage] = useState('');

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return;
    const query = hash.slice(queryIndex + 1);
    const params = new URLSearchParams(query);
    const deepLinkToken = params.get('token');
    const deepLinkEmail = params.get('email');
    if (deepLinkToken) {
      setToken(deepLinkToken);
      setStep('reset');
    }
    if (deepLinkEmail) {
      setEmail(deepLinkEmail);
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestStatus('loading');
    setRequestMessage('');

    try {
      const response = await api.post('/auth/forgot', { email });
      setRequestStatus('success');
      setRequestMessage('If the email exists, a reset token was sent.');
      const returnedToken = response.data?.resetToken;
      if (returnedToken) {
        setToken(returnedToken);
      }
      setStep('reset');
    } catch (err) {
      setRequestStatus('error');
      setRequestMessage('Failed to request reset. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus('loading');
    setResetMessage('');

    if (!token || !newPassword) {
      setResetStatus('error');
      setResetMessage('Token and new password are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetStatus('error');
      setResetMessage('Passwords do not match.');
      return;
    }

    try {
      await api.post('/auth/reset', { token, newPassword });
      setResetStatus('success');
      setResetMessage('Password reset successful. You can now sign in.');
      setToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setResetStatus('error');
      setResetMessage('Reset failed. Token may be invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-200 p-4">
      <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {step === 'request' ? 'Enter your email to receive a reset token.' : 'Enter the token sent to your email and set a new password.'}
        </p>

        {step === 'request' && (
          <form className="mt-6 space-y-4" onSubmit={handleRequestReset}>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-medium"
                placeholder="name@company.com"
              />
            </div>
            <button
              type="submit"
              disabled={requestStatus === 'loading'}
              className="w-full py-3 px-4 rounded-xl text-white bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primary-dark text-sm font-bold disabled:opacity-70 transition-all"
            >
              {requestStatus === 'loading' ? 'Requesting...' : 'Send Reset Token'}
            </button>
          </form>
        )}

        {requestMessage && (
          <div
            className={`mt-4 text-xs font-medium rounded-xl p-3 border ${
              requestStatus === 'success'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-900'
                : 'text-red-600 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-900/20 dark:border-red-900'
            }`}
          >
            {requestMessage}
          </div>
        )}

        {step === 'reset' && (
          <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-medium"
                placeholder="Paste reset token"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-medium"
                placeholder="New password"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-medium"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={resetStatus === 'loading'}
              className="w-full py-3 px-4 rounded-xl text-white bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primary-dark text-sm font-bold disabled:opacity-70 transition-all"
            >
              {resetStatus === 'loading' ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {resetMessage && (
          <div
            className={`mt-4 text-xs font-medium rounded-xl p-3 border ${
              resetStatus === 'success'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-900'
                : 'text-red-600 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-900/20 dark:border-red-900'
            }`}
          >
            {resetMessage}
          </div>
        )}

        {step === 'reset' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setStep('request')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Use a different email
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => (window.location.hash = '#/login')}
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
