import { getDatabase } from '../db';
import { TABLES, type SyncStatus } from '../schema';

/**
 * Generuje lokalne ID (UUID)
 */
function generateLocalId(): string {
  // Użyj prostego generatora UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Bazowa klasa repozytorium z wspólną funkcjonalnością
 */
export abstract class BaseRepository<T> {
  protected abstract tableName: string;

  /**
   * Generuje lokalne ID
   */
  protected generateLocalId(): string {
    return generateLocalId();
  }

  /**
   * Konwertuje obiekt na format SQLite (null handling)
   */
  protected prepareData(data: Partial<T>): Record<string, any> {
    const prepared: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        prepared[key] = null;
      } else if (typeof value === 'boolean') {
        prepared[key] = value ? 1 : 0;
      } else if (value instanceof Date) {
        prepared[key] = value.toISOString();
      } else {
        prepared[key] = value;
      }
    }
    return prepared;
  }

  /**
   * Konwertuje dane z SQLite na obiekt (boolean handling)
   */
  protected parseRow(row: any): T {
    const parsed: any = { ...row };
    // Konwertuj liczby 0/1 na boolean dla pól sync_status
    if (parsed._sync_status) {
      // _sync_status to string, nie boolean
    }
    // Konwertuj liczby 0/1 na boolean dla innych pól
    for (const key in parsed) {
      if (key.includes('is_') || key.includes('has_') || key === 'is_read' || key === 'is_deleted' || key === 'is_active') {
        parsed[key] = parsed[key] === 1 || parsed[key] === '1';
      }
    }
    return parsed as T;
  }

  /**
   * Tworzy nowy rekord
   */
  async create(data: Partial<T>, serverId?: number): Promise<T> {
    const db = getDatabase();
    const localId = this.generateLocalId();
    const now = new Date().toISOString();

    const insertData = {
      _local_id: localId,
      _server_id: serverId || null,
      _sync_status: 'pending' as SyncStatus,
      _last_synced_at: null,
      _created_at: now,
      _updated_at: now,
      ...this.prepareData(data),
    };

    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);

    await db.runAsync(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
      values,
    );

    return this.findById(localId) as Promise<T>;
  }

  /**
   * Znajduje rekord po lokalnym ID
   */
  async findById(localId: string): Promise<T | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<Record<string, any>>(
      `SELECT * FROM ${this.tableName} WHERE _local_id = ?`,
      [localId],
    );

    if (result) {
      return this.parseRow(result);
    }
    return null;
  }

  /**
   * Znajduje rekord po serwerowym ID
   */
  async findByServerId(serverId: number): Promise<T | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<Record<string, any>>(
      `SELECT * FROM ${this.tableName} WHERE _server_id = ?`,
      [serverId],
    );

    if (result) {
      return this.parseRow(result);
    }
    return null;
  }

  /**
   * Aktualizuje rekord
   */
  async update(localId: string, data: Partial<T>): Promise<T | null> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const updateData = {
      ...this.prepareData(data),
      _updated_at: now,
    };

    const setClause = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updateData), localId];

    await db.runAsync(
      `UPDATE ${this.tableName} SET ${setClause} WHERE _local_id = ?`,
      values,
    );

    return this.findById(localId);
  }

  /**
   * Usuwa rekord
   */
  async delete(localId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(`DELETE FROM ${this.tableName} WHERE _local_id = ?`, [localId]);
  }

  /**
   * Znajduje wszystkie rekordy
   */
  async findAll(limit?: number, offset?: number): Promise<T[]> {
    const db = getDatabase();
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const result = await db.getAllAsync<Record<string, any>>(query, params);
    return result.map((row) => this.parseRow(row));
  }

  /**
   * Znajduje rekordy spełniające warunek
   */
  async findWhere(
    conditions: Record<string, any>,
    limit?: number,
    offset?: number,
  ): Promise<T[]> {
    const db = getDatabase();
    const whereClause = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(' AND ');
    const values = Object.values(conditions);

    let query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
    if (limit !== undefined) {
      query += ' LIMIT ?';
      values.push(limit);
      if (offset !== undefined) {
        query += ' OFFSET ?';
        values.push(offset);
      }
    }

    const result = await db.getAllAsync<Record<string, any>>(query, values);
    return result.map((row) => this.parseRow(row));
  }

  /**
   * Aktualizuje status synchronizacji
   */
  async updateSyncStatus(
    localId: string,
    status: SyncStatus,
    serverId?: number,
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    if (serverId !== undefined) {
      await db.runAsync(
        `UPDATE ${this.tableName} 
         SET _sync_status = ?, _server_id = ?, _last_synced_at = ?, _updated_at = ? 
         WHERE _local_id = ?`,
        [status, serverId, now, now, localId],
      );
    } else {
      await db.runAsync(
        `UPDATE ${this.tableName} 
         SET _sync_status = ?, _last_synced_at = ?, _updated_at = ? 
         WHERE _local_id = ?`,
        [status, now, now, localId],
      );
    }
  }

  /**
   * Znajduje rekordy oczekujące na synchronizację
   */
  async findPendingSync(): Promise<T[]> {
    return this.findWhere({ _sync_status: 'pending' });
  }
}

