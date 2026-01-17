// Lazy loading - importujemy tylko gdy potrzebne
// import { getDatabase } from '../database/db';
// import { TABLES } from '../database/schema';

export type SyncOperation = 'create' | 'update' | 'delete';

export type SyncQueueItem = {
  id: number;
  table_name: string;
  operation: SyncOperation;
  local_id: string;
  data: string; // JSON string
  retry_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Kolejka synchronizacji - zarządza operacjami offline do wysłania na serwer
 */
class SyncQueue {
  /**
   * Dodaje operację do kolejki
   */
  async enqueue(
    tableName: string,
    operation: SyncOperation,
    localId: string,
    data: any,
  ): Promise<void> {
    try {
      const { getDatabase } = await import('../database/db');
      const { TABLES } = await import('../database/schema');
      const db = getDatabase();
      const now = new Date().toISOString();
      const dataJson = JSON.stringify(data);

      await db.runAsync(
        `INSERT INTO ${TABLES.SYNC_QUEUE} 
         (table_name, operation, local_id, data, retry_count, error_message, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, NULL, ?, ?)`,
        [tableName, operation, localId, dataJson, now, now],
      );
    } catch (error) {
      console.error('Błąd dodawania do kolejki sync:', error);
      // Nie rzucaj błędu - aplikacja może działać bez kolejki
    }
  }

  /**
   * Pobiera wszystkie oczekujące operacje
   */
  async getPending(): Promise<SyncQueueItem[]> {
    try {
      const { getDatabase } = await import('../database/db');
      const { TABLES } = await import('../database/schema');
      const db = getDatabase();
      const result = await db.getAllAsync<SyncQueueItem>(
        `SELECT * FROM ${TABLES.SYNC_QUEUE} 
         WHERE retry_count < 5 
         ORDER BY created_at ASC`,
      );

      return result;
    } catch (error) {
      console.error('Błąd getPending:', error);
      return [];
    }
  }

  /**
   * Pobiera operacje dla konkretnej tabeli
   */
  async getPendingForTable(tableName: string): Promise<SyncQueueItem[]> {
    try {
      const { getDatabase } = await import('../database/db');
      const { TABLES } = await import('../database/schema');
      const db = getDatabase();
      const result = await db.getAllAsync<SyncQueueItem>(
        `SELECT * FROM ${TABLES.SYNC_QUEUE} 
         WHERE table_name = ? AND retry_count < 5 
         ORDER BY created_at ASC`,
        [tableName],
      );

      return result;
    } catch (error) {
      console.error('Błąd getPendingForTable:', error);
      return [];
    }
  }

  /**
   * Oznacza operację jako zakończoną pomyślnie
   */
  async markAsCompleted(itemId: number): Promise<void> {
    try {
      const { getDatabase } = await import('../database/db');
      const { TABLES } = await import('../database/schema');
      const db = getDatabase();
      db.execute(`DELETE FROM ${TABLES.SYNC_QUEUE} WHERE id = ?`, [itemId]);
    } catch (error) {
      console.error('Błąd markAsCompleted:', error);
    }
  }

  /**
   * Oznacza operację jako nieudaną i zwiększa licznik prób
   */
  async markAsFailed(itemId: number, errorMessage: string): Promise<void> {
    try {
      const { getDatabase } = await import('../database/db');
      const { TABLES } = await import('../database/schema');
      const db = getDatabase();
      const now = new Date().toISOString();

      // Pobierz aktualny retry_count
      const result = await db.getFirstAsync<{ retry_count: number }>(
        `SELECT retry_count FROM ${TABLES.SYNC_QUEUE} WHERE id = ?`,
        [itemId],
      );

      let retryCount = 0;
      if (result) {
        retryCount = result.retry_count || 0;
      }

      db.execute(
        `UPDATE ${TABLES.SYNC_QUEUE} 
         SET retry_count = ?, error_message = ?, updated_at = ? 
         WHERE id = ?`,
        [retryCount + 1, errorMessage, now, itemId],
      );
    } catch (error) {
      console.error('Błąd markAsFailed:', error);
    }
  }

  /**
   * Usuwa wszystkie zakończone operacje (opcjonalne - do czyszczenia)
   */
  async clearCompleted(): Promise<void> {
    try {
      const { getDatabase } = await import('../database/db');
      const { TABLES } = await import('../database/schema');
      const db = getDatabase();
      await db.runAsync(`DELETE FROM ${TABLES.SYNC_QUEUE} WHERE retry_count >= 5`);
    } catch (error) {
      console.error('Błąd clearCompleted:', error);
    }
  }

  /**
   * Pobiera statystyki kolejki
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    failed: number;
  }> {
    try {
      const { getDatabase } = await import('../database/db');
      const { TABLES } = await import('../database/schema');
      const db = getDatabase();

      const totalResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${TABLES.SYNC_QUEUE}`,
      );
      const pendingResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${TABLES.SYNC_QUEUE} WHERE retry_count < 5`,
      );
      const failedResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${TABLES.SYNC_QUEUE} WHERE retry_count >= 5`,
      );

      return {
        total: totalResult?.count || 0,
        pending: pendingResult?.count || 0,
        failed: failedResult?.count || 0,
      };
    } catch (error) {
      console.error('Błąd getStats:', error);
      return { total: 0, pending: 0, failed: 0 };
    }
  }
}

export const syncQueue = new SyncQueue();

