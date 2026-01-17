import { BaseRepository } from './BaseRepository';
import { TABLES } from '../schema';
import { getDatabase } from '../db';

export type ClientEntity = {
  _local_id: string;
  _server_id: number | null;
  _sync_status: 'pending' | 'synced' | 'error' | 'conflict';
  _last_synced_at: string | null;
  _created_at: string;
  _updated_at: string;
  id: number | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  url: string | null;
  user_type: string | null;
  hash_value: string | null;
  parent_id: number | null;
  group_id: number | null;
  map_list_id: number | null;
  has_account: number;
};

export class ClientRepository extends BaseRepository<ClientEntity> {
  protected tableName = TABLES.CLIENTS;

  /**
   * Znajduje klienta po emailu
   */
  async findByEmail(email: string): Promise<ClientEntity | null> {
    const db = getDatabase();
    const result = db.execute(
      `SELECT * FROM ${this.tableName} WHERE email = ?`,
      [email],
    );

    if (result.rows && result.rows.length > 0) {
      return this.parseRow(result.rows.item(0));
    }
    return null;
  }

  /**
   * Znajduje klientów użytkownika (dla montera/admina)
   */
  async findByParentId(parentId: number): Promise<ClientEntity[]> {
    return this.findWhere({ parent_id: parentId });
  }

  /**
   * Znajduje klientów z paginacją
   */
  async findWithPagination(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ clients: ClientEntity[]; total: number }> {
    const db = getDatabase();
    const offset = (page - 1) * pageSize;

    // Pobierz całkowitą liczbę
    const countResult = db.execute(`SELECT COUNT(*) as total FROM ${this.tableName}`);
    const total = countResult.rows?.item(0)?.total || 0;

    // Pobierz stronę danych
    const clients = await this.findAll(pageSize, offset);

    return { clients, total };
  }
}

export const clientRepository = new ClientRepository();

