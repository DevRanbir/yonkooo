import { SosSession, FleetUnit } from './mushi';

type NetworkEventCallback = (event: { type: string; payload: any }) => void;

class NetworkSyncEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<NetworkEventCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('grand_line_sos_network');
      this.channel.onmessage = (event) => {
        this.notifyListeners(event.data);
      };
    }

    // Fallback sync via localStorage storage event for older browsers/cross-tab
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'grand_line_network_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch (err) {}
        }
      });
    }
  }

  public subscribe(cb: NetworkEventCallback) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners(data: { type: string; payload: any }) {
    this.listeners.forEach((cb) => cb(data));
  }

  public broadcast(type: string, payload: any) {
    const event = { type, payload, timestamp: Date.now() };
    if (this.channel) {
      this.channel.postMessage(event);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('grand_line_network_event', JSON.stringify(event));
    }
  }

  // Session Helper State Persistence
  public getActiveSessions(): SosSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('grand_line_sessions');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  public saveActiveSessions(sessions: SosSession[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('grand_line_sessions', JSON.stringify(sessions));
  }

  public getFleetUnits(): FleetUnit[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('grand_line_fleet');
      if (data) return JSON.parse(data);
    } catch (e) {}

    // Default Chopper's Armada Fleet Units
    const defaults: FleetUnit[] = [
      { id: 'FLEET-01', name: '🚢 Rescue Ship 01 (Thousand Sunny Aux)', type: 'rescue_ship', status: 'AVAILABLE', speedKnots: 34, distanceKm: 3.2, etaMinutes: 6, currentCoords: "34°12'N, 142°05'E" },
      { id: 'FLEET-02', name: '🚑 Chopper Medical Corvette 02', type: 'medical_unit', status: 'AVAILABLE', speedKnots: 28, distanceKm: 4.8, etaMinutes: 10, currentCoords: "12°45'S, 89°12'W" },
      { id: 'FLEET-03', name: '🚢 Galley-La Heavy Repair Vessel 03', type: 'rescue_ship', status: 'RETURNING', speedKnots: 22, distanceKm: 12.5, etaMinutes: 24, currentCoords: "04°18'N, 62°50'E" },
      { id: 'FLEET-04', name: '🚁 Heart Pirates Polar Submarine Scout 01', type: 'scout_unit', status: 'AVAILABLE', speedKnots: 40, distanceKm: 7.1, etaMinutes: 11, currentCoords: "41°02'S, 178°40'E" }
    ];
    this.saveFleetUnits(defaults);
    return defaults;
  }

  public saveFleetUnits(units: FleetUnit[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('grand_line_fleet', JSON.stringify(units));
  }
}

export const networkSync = new NetworkSyncEngine();
