import React from 'react';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { Check, Globe } from 'lucide-react';

const Settings: React.FC = () => {
  const { language, setLanguage, labels } = useLanguage();

  const languages: { code: LanguageCode; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 border-b border-gray-200 dark:border-slate-700 pb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{labels.settings}</h1>
        <p className="text-slate-500 dark:text-slate-400">System preferences and localization</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{labels.language}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{labels.selectLanguage}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                language === lang.code
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10'
                  : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="flex w-full justify-between items-start">
                 <span className={`text-lg font-bold ${language === lang.code ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                  {lang.nativeName}
                 </span>
                 {language === lang.code && (
                    <div className="h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                 )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;