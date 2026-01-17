// Lazy loading
// import { networkService } from './NetworkService';
// Lazy loading
// import { syncQueue, type SyncQueueItem } from './SyncQueue';
// import { getDatabase } from '../database/db';
// import { TABLES } from '../database/schema';
import Constants from 'expo-constants';

const API_URL: string =
  Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';
const API_PORT: string = Constants?.expoConfig?.extra?.apiPort ?? '';
const BASE_URL: string =
  API_URL.length > 0 && API_PORT.length > 0
    ? `${API_URL}:${API_PORT}/api/`
    : `${API_URL}/api/`;

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export type SyncResult = {
  success: boolean;
  pulled: number;
  pushed: number;
  errors: string[];
};

/**
 * Główny serwis synchronizacji danych
 */
class SyncService {
  private isSyncing: boolean = false;
  private lastSyncTime: Date | null = null;
  private syncListeners: Array<(status: SyncStatus) => void> = [];

  /**
   * Pobiera ostatnią datę synchronizacji
   */
  private async getLastSyncedAt(): Promise<string> {
    try {
      const { getDatabase } = await import('../database/db');
      const { TABLES } = await import('../database/schema');
      const db = getDatabase();
      const result = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM ${TABLES.SYNC_METADATA} WHERE key = 'last_synced_at'`,
      );

      if (result) {
        return result.value || '1970-01-01T00:00:00Z';
      }
    } catch (error) {
      console.error('Błąd pobierania last_synced_at:', error);
    }

    return '1970-01-01T00:00:00Z';
  }

  /**
   * Ustawia datę ostatniej synchronizacji
   */
  private async setLastSyncedAt(date: string): Promise<void> {
    try {
      const { getDatabase } = await import('../database/db');
      const { TABLES } = await import('../database/schema');
      const db = getDatabase();
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT OR REPLACE INTO ${TABLES.SYNC_METADATA} (key, value, updated_at) 
         VALUES ('last_synced_at', ?, ?)`,
        [date, now],
      );
    } catch (error) {
      console.error('Błąd ustawiania last_synced_at:', error);
    }
  }

  /**
   * Pobiera zmiany z serwera (pull)
   */
  private async pullChanges(token: string): Promise<number> {
    const lastSyncedAt = await this.getLastSyncedAt();

    // Wywołaj endpoint sync/pull
    const response = await fetch(`${BASE_URL}sync/pull/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        token,
        last_synced_at: lastSyncedAt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pull failed: ${response.statusText}`);
    }

    const data = await response.json();
    const changes = data.changes || {};

    let totalPulled = 0;

    // Zastosuj zmiany dla każdej tabeli (server wins strategy)
    for (const [tableName, records] of Object.entries(changes)) {
      if (!Array.isArray(records)) continue;

      for (const record of records) {
        await this.applyServerChange(tableName, record);
        totalPulled++;
      }
    }

    return totalPulled;
  }

  /**
   * Zastosowuje zmianę z serwera (server wins)
   */
  private async applyServerChange(
    tableName: string,
    record: any,
  ): Promise<void> {
    try {
      const repository = await this.getRepositoryForTable(tableName);
      if (!repository) {
        console.warn(`No repository found for table: ${tableName}`);
        return;
      }

      // Sprawdź czy rekord już istnieje (po server_id)
      const existing = await repository.findByServerId(record.id);

      if (existing) {
        // Aktualizuj istniejący rekord
        await repository.update(existing._local_id, {
          ...record,
          _server_id: record.id,
          _sync_status: 'synced',
          _last_synced_at: new Date().toISOString(),
        } as any);
      } else {
        // Utwórz nowy rekord
        await repository.create(
          {
            ...record,
            _server_id: record.id,
            _sync_status: 'synced',
            _last_synced_at: new Date().toISOString(),
          } as any,
          record.id,
        );
      }
    } catch (error) {
      console.error(`Błąd applyServerChange dla ${tableName}:`, error);
    }
  }

  /**
   * Wysyła lokalne zmiany na serwer (push)
   */
  private async pushChanges(token: string): Promise<number> {
    const { syncQueue } = await import('./SyncQueue');
    const pendingItems = await syncQueue.getPending();
    if (pendingItems.length === 0) {
      return 0;
    }

    // Grupuj operacje według tabeli
    const groupedByTable: Record<string, SyncQueueItem[]> = {};
    for (const item of pendingItems) {
      if (!groupedByTable[item.table_name]) {
        groupedByTable[item.table_name] = [];
      }
      groupedByTable[item.table_name].push(item);
    }

    let totalPushed = 0;
    const errors: string[] = [];

    // Wyślij zmiany dla każdej tabeli
    for (const [tableName, items] of Object.entries(groupedByTable)) {
      try {
        const changes = items.map((item) => ({
          operation: item.operation,
          local_id: item.local_id,
          data: JSON.parse(item.data),
        }));

        const response = await fetch(`${BASE_URL}sync/push/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            token,
            table: tableName,
            changes,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Push failed: ${response.statusText}`);
        }

        const result = await response.json();
        const processed = result.processed || [];

        // Oznacz przetworzone operacje jako zakończone
        for (const processedItem of processed) {
          const queueItem = items.find(
            (item) => item.local_id === processedItem.local_id,
          );
          if (queueItem) {
            const { syncQueue: sq } = await import('./SyncQueue');
            await sq.markAsCompleted(queueItem.id);

            // Zaktualizuj lokalny rekord z server_id
            if (processedItem.server_id) {
              const repository = await this.getRepositoryForTable(tableName);
              if (repository) {
                const localRecord = await repository.findById(
                  processedItem.local_id,
                );
                if (localRecord) {
                  await repository.updateSyncStatus(
                    processedItem.local_id,
                    'synced',
                    processedItem.server_id,
                  );
                }
              }
            }

            totalPushed++;
          }
        }

        // Oznacz nieprzetworzone jako nieudane
        for (const item of items) {
          if (!processed.find((p: any) => p.local_id === item.local_id)) {
            const { syncQueue } = await import('./SyncQueue');
            await syncQueue.markAsFailed(
              item.id,
              'Not processed by server',
            );
            errors.push(
              `Failed to sync ${item.table_name}/${item.local_id}: Not processed`,
            );
          }
        }
      } catch (error: any) {
        // Oznacz wszystkie jako nieudane
        const { syncQueue } = await import('./SyncQueue');
        for (const item of items) {
          await syncQueue.markAsFailed(item.id, error.message || 'Unknown error');
          errors.push(
            `Failed to sync ${item.table_name}/${item.local_id}: ${error.message}`,
          );
        }
      }
    }

    if (errors.length > 0) {
      console.warn('Sync errors:', errors);
    }

    return totalPushed;
  }

  /**
   * Pobiera repozytorium dla tabeli (lazy loading)
   */
  private async getRepositoryForTable(tableName: string): Promise<any> {
    try {
      const repos = await import('../database/repositories');
      const { TABLES } = await import('../database/schema');
      const repositoryMap: Record<string, string> = {
        [TABLES.CLIENTS]: 'clientRepository',
        [TABLES.OFFERS]: 'offerRepository',
        [TABLES.TASKS]: 'taskRepository',
        [TABLES.INSTALLATIONS]: 'installationRepository',
        [TABLES.MONTaz]: 'montazRepository',
        [TABLES.PHOTOS]: 'photoRepository',
        [TABLES.MESSAGES]: 'messageRepository',
      };

      const repoName = repositoryMap[tableName];
      return repoName ? (repos as any)[repoName] : null;
    } catch (error) {
      console.error('Błąd ładowania repozytorium:', error);
      return null;
    }
  }

  /**
   * Wykonuje pełną synchronizację (pull + push)
   */
  async sync(token: string): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Synchronizacja już trwa');
    }

    const { getNetworkService } = await import('./NetworkService');
    const networkService = getNetworkService();
    
    if (!networkService.getIsConnected()) {
      throw new Error('Brak połączenia z internetem');
    }

    this.isSyncing = true;
    this.notifyListeners('syncing');

    try {
      // 1. Pull - pobierz zmiany z serwera
      const pulled = await this.pullChanges(token);

      // 2. Push - wyślij lokalne zmiany
      const pushed = await this.pushChanges(token);

      // 3. Zaktualizuj datę ostatniej synchronizacji
      await this.setLastSyncedAt(new Date().toISOString());
      this.lastSyncTime = new Date();

      this.notifyListeners('success');

      return {
        success: true,
        pulled,
        pushed,
        errors: [],
      };
    } catch (error: any) {
      this.notifyListeners('error');
      return {
        success: false,
        pulled: 0,
        pushed: 0,
        errors: [error.message || 'Unknown error'],
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Subskrybuje zmiany statusu synchronizacji
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Powiadamia słuchaczy o zmianie statusu
   */
  private notifyListeners(status: SyncStatus): void {
    this.syncListeners.forEach((callback) => callback(status));
  }

  /**
   * Zwraca status synchronizacji
   */
  getStatus(): SyncStatus {
    if (this.isSyncing) return 'syncing';
    return 'idle';
  }

  /**
   * Zwraca czas ostatniej synchronizacji
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Sprawdza czy synchronizacja jest w toku
   */
  isSyncingNow(): boolean {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();

