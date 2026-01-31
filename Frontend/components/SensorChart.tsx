import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { SensorReading } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface SensorChartProps {
  data: SensorReading[];
  dataKey: keyof SensorReading;
  color: string;
  unit: string;
  label: string;
}

const SensorChart: React.FC<SensorChartProps> = ({ data, dataKey, color, unit, label }) => {
  const { theme } = useTheme();
  const { labels } = useLanguage();
  
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="h-[300px] w-full">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 ml-2">{label} {labels.trend}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            stroke={textColor}
            fontSize={12}
            tickFormatter={(time) => {
              const date = new Date(time);
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }}
            minTickGap={30}
          />
          <YAxis 
            stroke={textColor}
            fontSize={12}
            tickFormatter={(val) => `${val}${unit}`}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#1e293b' : '#fff',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#fff' : '#000',
              borderRadius: '8px'
            }}
            labelStyle={{ color: isDark ? '#94a3b8' : '#64748b' }}
            labelFormatter={(label) => new Date(label).toLocaleString()}
            formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, label]}
          />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6 }}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensorChart;