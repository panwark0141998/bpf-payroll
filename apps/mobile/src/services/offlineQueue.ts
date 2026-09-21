import { api } from './api';

export interface QueuedPunch {
  clientEventId: string;
  employeeId: string;
  punchType: 'IN' | 'OUT';
  eventTimestamp: string;
  latitude: number;
  longitude: number;
  gpsAccuracy: number;
  deviceId: string;
  faceEmbedding?: number[];
  faceSimilarityScore?: number;
}

const STORAGE_KEY = 'bpf_offline_punch_queue';

export class OfflineQueueService {
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[Offline Queue] Network reconnected. Triggering auto-sync...');
        this.drainQueue();
      });

      // Periodically attempt drain every 30 seconds if queue not empty
      setInterval(() => {
        if (navigator.onLine && this.getQueue().length > 0) {
          this.drainQueue();
        }
      }, 30000);
    }
  }

  getQueue(): QueuedPunch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  enqueue(punch: Omit<QueuedPunch, 'clientEventId'>): QueuedPunch {
    const queue = this.getQueue();
    const queuedPunch: QueuedPunch = {
      ...punch,
      clientEventId: 'EVT-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now()
    };

    queue.push(queuedPunch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    console.log(`[Offline Queue] Enqueued offline punch ${queuedPunch.punchType} (${queuedPunch.clientEventId})`);
    return queuedPunch;
  }

  async drainQueue(): Promise<{ synced: number; remaining: number }> {
    if (this.isSyncing) return { synced: 0, remaining: this.getQueue().length };

    const queue = this.getQueue();
    if (queue.length === 0) return { synced: 0, remaining: 0 };

    this.isSyncing = true;
    try {
      console.log(`[Offline Queue] Sending ${queue.length} pending punches to /attendance/sync...`);
      const res = await api.post('/attendance/sync', {
        punches: queue
      });

      console.log('[Offline Queue] Sync successful:', res.data.message);
      // Clear queue on successful sync
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('attendance_synced', { detail: res.data.data }));
      return { synced: queue.length, remaining: 0 };
    } catch (err: any) {
      console.error('[Offline Queue] Sync failed, keeping queue for retry:', err.message);
      return { synced: 0, remaining: queue.length };
    } finally {
      this.isSyncing = false;
    }
  }
}

export const offlineQueueService = new OfflineQueueService();
