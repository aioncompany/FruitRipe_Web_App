import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { socketService } from '../services/socketService';
import { SensorReading, TimeRange, DeviceEvent, DeviceEventType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import MetricCard from '../components/MetricCard';
import SensorChart from '../components/SensorChart';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  Download, 
  Wifi,
  Power,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const ChamberDetail: React.FC = () => {
  const { labels } = useLanguage();
  
  // Mock ID retrieval
  const getHashId = () => {
     const parts = window.location.hash.split('/');
     const rawId = parts[parts.length - 1] || '';
     const parsed = Number(rawId);
     return Number.isFinite(parsed) ? parsed : 0;
  };
  const id = getHashId();

  const [liveData, setLiveData] = useState<SensorReading | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [range, setRange] = useState<TimeRange>('1h');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'settings'>('overview');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const normalizeReading = (reading: SensorReading): SensorReading => ({
    ...reading,
    temperature: Number(reading.temperature),
    humidity: Number(reading.humidity),
    co2: Number(reading.co2),
    ethylene: Number(reading.ethylene),
  });

  // Alert Configuration State
  const [alertConfig, setAlertConfig] = useState({
    temperature: { min: 15, max: 25, enabled: true },
    humidity: { min: 85, max: 95, enabled: true },
    co2: { max: 2000, enabled: true },
    ethylene: { max: 100, enabled: true }
  });

  // Real-time Socket Connection
  useEffect(() => {
    socketService.connect();
    socketService.joinRoom(id);

    const handleReading = (data: SensorReading) => {
      const normalized = normalizeReading(data);
      setLiveData(normalized);
      // Optimistically append to history for chart fluidity
      setHistory(prev => {
        const newHistory = [...prev, normalized];
        if (newHistory.length > 200) return newHistory.slice(newHistory.length - 200);
        return newHistory;
      });
    };

    socketService.onReading(handleReading);

    return () => {
      socketService.leaveRoom(id);
      socketService.offReading(handleReading);
    };
  }, [id]);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [readingsRes, eventsRes] = await Promise.all([
          api.get<SensorReading[]>(`/chambers/${id}/readings`, { params: { range } }),
          api.get<DeviceEvent[]>(`/chambers/${id}/events`),
        ]);

        const normalizedHistory = readingsRes.data.map(normalizeReading);
        setHistory(normalizedHistory);
        setLiveData(normalizedHistory[normalizedHistory.length - 1] || null);
        setEvents(eventsRes.data);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, range]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Temperature', 'Humidity', 'CO2', 'Ethylene'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...history.map(r => `${r.timestamp},${r.temperature},${r.humidity},${r.co2},${r.ethylene}`)].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chamber_${id}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSaveSuccess(true);
    // Hide success message after 3s
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getStatus = (val: number | undefined, min?: number, max?: number) => {
    if (val === undefined || val === null) return 'normal';
    if ((min && val < min) || (max && val > max)) return 'alert';
    return 'normal';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-6">
        <div>
           <div className="flex items-center space-x-3">
             <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{labels.chamber} {id}</h1>
             <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">{labels.online}</span>
           </div>
           <p className="text-sm text-slate-500 mt-1">{labels.serial}: ESP32-{String(id).padStart(3, '0')} • Warehouse 1</p>
        </div>
        
        <div className="flex space-x-2">
           <div className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-1 flex">
              {(['1h', '24h', '7d'] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${range === r ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
           </div>
           <button onClick={exportCSV} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
             <Download className="h-4 w-4 mr-2" /> {labels.export}
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {labels.tabOverview}
        </button>
        <button 
          onClick={() => setActiveTab('events')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'events' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {labels.tabEvents}
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {labels.tabSettings}
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Live Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              label={labels.temp}
              value={liveData?.temperature}
              unit="°C"
              icon={<Thermometer className="h-6 w-6 text-red-500" />}
              status={getStatus(liveData?.temperature || 0, alertConfig.temperature.min, alertConfig.temperature.max)}
              loading={loading}
            />
            <MetricCard 
              label={labels.humidity}
              value={liveData?.humidity}
              unit="%"
              icon={<Droplets className="h-6 w-6 text-blue-500" />}
              status={getStatus(liveData?.humidity || 0, alertConfig.humidity.min, alertConfig.humidity.max)}
              loading={loading}
            />
            <MetricCard 
              label={labels.co2}
              value={liveData?.co2}
              unit="ppm"
              icon={<Wind className="h-6 w-6 text-gray-500" />}
              status={getStatus(liveData?.co2 || 0, undefined, alertConfig.co2.max)}
              loading={loading}
            />
            <MetricCard 
              label={labels.ethylene}
              value={liveData?.ethylene}
              unit="ppm"
              icon={<Activity className="h-6 w-6 text-purple-500" />}
              status={getStatus(liveData?.ethylene || 0, undefined, alertConfig.ethylene.max)}
              loading={loading}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <SensorChart data={history} dataKey="temperature" color="#ef4444" unit="°C" label={labels.temp} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <SensorChart data={history} dataKey="humidity" color="#3b82f6" unit="%" label={labels.humidity} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <SensorChart data={history} dataKey="co2" color="#64748b" unit="ppm" label={labels.co2} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <SensorChart data={history} dataKey="ethylene" color="#a855f7" unit="ppm" label={labels.ethylene} />
            </div>
          </div>
        </>
      )}

      {activeTab === 'events' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">{labels.activityLog}</h3>
          </div>
          <div className="relative">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-500">{labels.noEvents}</div>
            ) : (
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 dark:bg-slate-700"></div>
            )}
            
            <ul className="py-6 space-y-8">
              {events.map((event) => (
                <li key={event.id} className="relative pl-16 pr-6">
                  <div className={`absolute left-5 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-white dark:border-slate-800 ${event.event_type === 'POWER' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center">
                        {event.event_type === 'POWER' ? <Power className="h-4 w-4 mr-2" /> : <Wifi className="h-4 w-4 mr-2" />}
                        {event.event_type} {event.event_value === 'CONNECTED' ? labels.wifiConnected : (event.event_value === 'ON' ? labels.powerOn : event.event_value)}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{labels.systemLog}</p>
                    </div>
                    <div className="flex items-center text-xs text-slate-400 mt-2 sm:mt-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(event.event_timestamp).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
         <div className="max-w-4xl mx-auto space-y-6">
           <div className="flex items-center justify-between mb-2">
             <h2 className="text-xl font-bold text-slate-900 dark:text-white">{labels.alertConfig}</h2>
             <div className="flex items-center gap-3">
               {saveSuccess && (
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-fade-in">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> {labels.saved}
                  </span>
               )}
               <button 
                 onClick={handleSaveSettings} 
                 disabled={saving}
                 className="flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium disabled:opacity-70 transition-colors shadow-sm"
               >
                 {saving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
                 {labels.saveChanges}
               </button>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temperature Settings */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mr-3">
                      <Thermometer className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{labels.temp}</h3>
                      <p className="text-xs text-slate-500">{labels.range}: -10°C to 50°C</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={alertConfig.temperature.enabled} 
                      onChange={(e) => setAlertConfig({...alertConfig, temperature: {...alertConfig.temperature, enabled: e.target.checked}})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className={`space-y-4 transition-opacity ${!alertConfig.temperature.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{labels.minThreshold} (°C)</label>
                       <div className="relative">
                          <input 
                            type="number" 
                            value={alertConfig.temperature.min}
                            onChange={(e) => setAlertConfig({...alertConfig, temperature: {...alertConfig.temperature, min: parseFloat(e.target.value)}})}
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                          />
                       </div>
                       <p className="text-[10px] text-slate-400 mt-1">{labels.triggerBelow}</p>
                     </div>
                     <div>
                       <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{labels.maxThreshold} (°C)</label>
                       <div className="relative">
                          <input 
                            type="number" 
                            value={alertConfig.temperature.max}
                            onChange={(e) => setAlertConfig({...alertConfig, temperature: {...alertConfig.temperature, max: parseFloat(e.target.value)}})}
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                          />
                       </div>
                       <p className="text-[10px] text-slate-400 mt-1">{labels.triggerAbove}</p>
                     </div>
                   </div>
                </div>
              </div>

              {/* Humidity Settings */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mr-3">
                      <Droplets className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{labels.humidity}</h3>
                      <p className="text-xs text-slate-500">{labels.range}: 0% to 100%</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={alertConfig.humidity.enabled} 
                      onChange={(e) => setAlertConfig({...alertConfig, humidity: {...alertConfig.humidity, enabled: e.target.checked}})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className={`space-y-4 transition-opacity ${!alertConfig.humidity.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{labels.minThreshold} (%)</label>
                       <input 
                         type="number" 
                         value={alertConfig.humidity.min}
                         onChange={(e) => setAlertConfig({...alertConfig, humidity: {...alertConfig.humidity, min: parseFloat(e.target.value)}})}
                         className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                       />
                       <p className="text-[10px] text-slate-400 mt-1">{labels.lowHumWarn}</p>
                     </div>
                     <div>
                       <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{labels.maxThreshold} (%)</label>
                       <input 
                         type="number" 
                         value={alertConfig.humidity.max}
                         onChange={(e) => setAlertConfig({...alertConfig, humidity: {...alertConfig.humidity, max: parseFloat(e.target.value)}})}
                         className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                       />
                       <p className="text-[10px] text-slate-400 mt-1">{labels.highHumWarn}</p>
                     </div>
                   </div>
                </div>
              </div>

              {/* CO2 Settings */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg mr-3">
                      <Wind className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{labels.co2}</h3>
                      <p className="text-xs text-slate-500">{labels.co2Desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={alertConfig.co2.enabled} 
                      onChange={(e) => setAlertConfig({...alertConfig, co2: {...alertConfig.co2, enabled: e.target.checked}})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className={`space-y-4 transition-opacity ${!alertConfig.co2.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                   <div>
                     <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{labels.maxThreshold} (ppm)</label>
                     <div className="relative">
                        <input 
                          type="number" 
                          value={alertConfig.co2.max}
                          onChange={(e) => setAlertConfig({...alertConfig, co2: {...alertConfig.co2, max: parseFloat(e.target.value)}})}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          {alertConfig.co2.max > 2000 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        </div>
                     </div>
                     <p className="text-[10px] text-slate-400 mt-1">{labels.alertCo2Limit}</p>
                   </div>
                </div>
              </div>

              {/* Ethylene Settings */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg mr-3">
                      <Activity className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{labels.ethylene}</h3>
                      <p className="text-xs text-slate-500">{labels.ethyleneDesc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={alertConfig.ethylene.enabled} 
                      onChange={(e) => setAlertConfig({...alertConfig, ethylene: {...alertConfig.ethylene, enabled: e.target.checked}})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className={`space-y-4 transition-opacity ${!alertConfig.ethylene.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                   <div>
                     <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{labels.maxThreshold} (ppm)</label>
                     <input 
                       type="number" 
                       value={alertConfig.ethylene.max}
                       onChange={(e) => setAlertConfig({...alertConfig, ethylene: {...alertConfig.ethylene, max: parseFloat(e.target.value)}})}
                       className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                     />
                     <p className="text-[10px] text-slate-400 mt-1">{labels.alertEthLimit}</p>
                   </div>
                </div>
              </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default ChamberDetail;