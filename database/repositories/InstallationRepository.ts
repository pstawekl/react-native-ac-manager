import { BaseRepository } from './BaseRepository';
import { TABLES } from '../schema';

export type InstallationEntity = {
  _local_id: string;
  _server_id: number | null;
  _sync_status: 'pending' | 'synced' | 'error' | 'conflict';
  _last_synced_at: string | null;
  _created_at: string;
  _updated_at: string;
  id: number | null;
  owner_id: number | null;
  klient_id: number | null;
  name: string | null;
  created_date: string | null;
};

export class InstallationRepository extends BaseRepository<InstallationEntity> {
  protected tableName = TABLES.INSTALLATIONS;

  /**
   * Znajduje instalacje dla klienta
   */
  async findByKlientId(klientId: number): Promise<InstallationEntity[]> {
    return this.findWhere({ klient_id: klientId });
  }

  /**
   * Znajduje instalacje właściciela
   */
  async findByOwnerId(ownerId: number): Promise<InstallationEntity[]> {
    return this.findWhere({ owner_id: ownerId });
  }
}

export const installationRepository = new InstallationRepository();


