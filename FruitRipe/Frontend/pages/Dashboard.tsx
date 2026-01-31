import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Chamber, ChamberStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  Wifi, 
  WifiOff, 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  Search,
  Filter
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const { labels } = useLanguage();

  const normalizeReading = (reading: Chamber['current_reading']) => {
    if (!reading) return undefined;
    return {
      ...reading,
      temperature: Number(reading.temperature),
      humidity: Number(reading.humidity),
      co2: Number(reading.co2),
      ethylene: Number(reading.ethylene),
    };
  };
  
  useEffect(() => {
    const fetchChambers = async () => {
      try {
        setError('');
        const response = await api.get<Chamber[]>('/chambers');
        const normalized = response.data.map((chamber) => ({
          ...chamber,
          current_reading: normalizeReading(chamber.current_reading),
        }));
        setChambers(normalized);
      } catch (error) {
        console.error("Failed to fetch chambers", error);
        setError('Failed to load chambers.');
      } finally {
        setLoading(false);
      }
    };
    fetchChambers();
  }, []);

  const filteredChambers = chambers.filter(c => 
    c.name.toLowerCase().includes(filter.toLowerCase()) || 
    c.location.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusColor = (status: ChamberStatus) => {
    switch (status) {
      case ChamberStatus.ONLINE: return 'bg-emerald-500';
      case ChamberStatus.WARNING: return 'bg-amber-500';
      case ChamberStatus.ALERT: return 'bg-red-500';
      case ChamberStatus.OFFLINE: return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  const getStatusLabel = (status: ChamberStatus) => {
    switch (status) {
        case ChamberStatus.ONLINE: return labels.online;
        case ChamberStatus.WARNING: return labels.warning;
        case ChamberStatus.ALERT: return labels.alert;
        case ChamberStatus.OFFLINE: return labels.offline;
        default: return status;
    }
  };

  const navigateToDetail = (id: number) => {
    window.location.hash = `#/chamber/${id}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{labels.dashboardTitle}</h1>
           <p className="text-slate-500 dark:text-slate-400">{labels.dashboardSubtitle}</p>
        </div>
        
        <div className="flex items-center space-x-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
             <input 
               type="text" 
               placeholder={labels.searchPlaceholder}
               className="pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
             />
           </div>
           <button className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
             <Filter className="h-4 w-4" />
           </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3].map(i => (
             <div key={i} className="h-64 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 animate-pulse"></div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChambers.map((chamber) => (
            <div 
              key={chamber.id}
              onClick={() => navigateToDetail(chamber.id)}
              className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors">{chamber.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{chamber.location}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider ${getStatusColor(chamber.status)}`}>
                    {getStatusLabel(chamber.status)}
                  </div>
                </div>

                {chamber.status !== ChamberStatus.OFFLINE && chamber.current_reading ? (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <span className="text-2xl font-mono font-medium text-slate-800 dark:text-slate-200">{chamber.current_reading.temperature.toFixed(1)}°</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-2xl font-mono font-medium text-slate-800 dark:text-slate-200">{chamber.current_reading.humidity.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wind className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-400">CO₂: {chamber.current_reading.co2}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-400">C₂H₄: {chamber.current_reading.ethylene}</span>
                    </div>
                  </div>
                ) : (
                   <div className="h-24 flex items-center justify-center text-slate-400 bg-gray-50 dark:bg-slate-900/50 rounded-lg mt-4">
                     <WifiOff className="h-6 w-6 mr-2" /> {labels.deviceOffline}
                   </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400">
                   <span>{labels.lastSeen}: {new Date(chamber.last_seen).toLocaleString()}</span>
                   {chamber.status === ChamberStatus.ONLINE && <Wifi className="h-3 w-3 text-emerald-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && error && (
        <div className="text-center py-20">
          <p className="text-slate-500">{error}</p>
        </div>
      )}

      {!loading && !error && filteredChambers.length === 0 && (
         <div className="text-center py-20">
            <p className="text-slate-500">{labels.noChambers}</p>
         </div>
      )}
    </div>
  );
};

export default Dashboard;