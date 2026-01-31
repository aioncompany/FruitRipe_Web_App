import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { SensorReading } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private simulationInterval: number | null = null;
  private readingListeners: ((data: SensorReading) => void)[] = [];
  private rooms: Set<string> = new Set();

  connect() {
    if (this.socket) return;

    const token = localStorage.getItem('token');
    
    // Initialize socket with relaxed transport options and error handling
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'], // Allow polling fallback to prevent immediate websocket errors
      autoConnect: true,
      reconnectionAttempts: 3,
      timeout: 5000
    });

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.stopSimulation();
      // Resubscribe listeners and rooms to the new socket instance events
      this.readingListeners.forEach(listener => {
        this.socket?.off('reading', listener);
        this.socket?.on('reading', listener);
      });
      this.rooms.forEach((room) => {
        this.socket?.emit('join_room', room);
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection unavailable (switching to simulation):', err.message);
      this.startSimulation();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopSimulation();
  }

  joinRoom(chamberId: string | number) {
    const room = `chamber_${chamberId}`;
    this.rooms.add(room);
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_room', room);
    }
  }

  leaveRoom(chamberId: string | number) {
    const room = `chamber_${chamberId}`;
    this.rooms.delete(room);
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_room', room);
    }
  }

  onReading(callback: (data: SensorReading) => void) {
    this.readingListeners.push(callback);
    if (this.socket) {
      this.socket.on('reading', callback);
    }
  }

  offReading(callback?: (data: SensorReading) => void) {
    if (!callback) {
      this.readingListeners = [];
      if (this.socket) {
        this.socket.off('reading');
      }
      return;
    }

    this.readingListeners = this.readingListeners.filter((listener) => listener !== callback);
    if (this.socket) {
      this.socket.off('reading', callback);
    }
  }

  // Simulation Logic for Demo/Offline State
  private startSimulation() {
    if (this.simulationInterval) return;

    console.log('Initializing sensor simulation sequence...');
    
    this.simulationInterval = window.setInterval(() => {
      const mockReading: SensorReading = {
        temperature: parseFloat((18 + Math.random() * 4).toFixed(1)),
        humidity: parseFloat((85 + Math.random() * 10).toFixed(1)),
        co2: Math.floor(750 + Math.random() * 200),
        ethylene: parseFloat((5 + Math.random() * 10).toFixed(2)),
        timestamp: new Date().toISOString()
      };

      // Broadcast to all active listeners
      this.readingListeners.forEach(listener => listener(mockReading));
    }, 3000);
  }

  private stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

export const socketService = new SocketService();