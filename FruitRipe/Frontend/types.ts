export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface SensorReading {
  chamber_id?: number;
  temperature: number;
  humidity: number;
  co2: number;
  ethylene: number;
  timestamp: string;
}

export enum ChamberStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WARNING = 'warning',
  ALERT = 'alert'
}

export interface Chamber {
  id: number;
  name: string;
  serial_number: string;
  location: string;
  firmware_version: string;
  last_seen: string;
  status: ChamberStatus;
  current_reading?: SensorReading; // Optional as it might be fetched separately or included
}

export enum AlertParameter {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  CO2 = 'co2',
  ETHYLENE = 'ethylene'
}

export interface AlertRule {
  id: number;
  chamber_id: number;
  parameter: AlertParameter;
  min_value?: number;
  max_value?: number;
  enabled: boolean;
}

export enum DeviceEventType {
  POWER = 'POWER',
  WIFI = 'WIFI'
}

export interface DeviceEvent {
  id: number;
  chamber_id: number;
  event_type: DeviceEventType;
  event_value: string;
  event_timestamp: string;
}

export type TimeRange = '1h' | '24h' | '7d';