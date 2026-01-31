import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | undefined;
  unit: string;
  icon: React.ReactNode;
  status?: 'normal' | 'warning' | 'alert';
  trend?: 'up' | 'down' | 'flat';
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  unit, 
  icon, 
  status = 'normal',
  loading = false 
}) => {
  
  const getStatusColor = () => {
    switch (status) {
      case 'alert': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400';
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400';
      default: return 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100';
    }
  };

  const getValueColor = () => {
    switch (status) {
      case 'alert': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-slate-900 dark:text-white';
    }
  };

  return (
    <div className={`p-5 rounded-xl border shadow-sm transition-all duration-300 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
          {icon}
        </div>
        {status !== 'normal' && <AlertTriangle className="h-5 w-5 animate-pulse" />}
      </div>
      
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="mt-1 flex items-baseline">
          {loading ? (
             <div className="h-8 w-24 bg-gray-200 dark:bg-slate-700 animate-pulse rounded"></div>
          ) : (
            <>
              <span className={`text-3xl font-bold font-mono ${getValueColor()}`}>
                {value?.toFixed(1) ?? '--'}
              </span>
              <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;