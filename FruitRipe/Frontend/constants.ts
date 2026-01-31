import { AlertParameter } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const ALERT_LABELS: Record<AlertParameter, string> = {
  [AlertParameter.TEMPERATURE]: 'Temperature (°C)',
  [AlertParameter.HUMIDITY]: 'Humidity (%)',
  [AlertParameter.CO2]: 'CO₂ (ppm)',
  [AlertParameter.ETHYLENE]: 'Ethylene (ppm)'
};

export const DEFAULT_THRESHOLDS = {
  temp_min: 15,
  temp_max: 25,
  humidity_min: 85,
  humidity_max: 95,
  co2_max: 2000,
  ethylene_max: 100
};