import { BaseRepository } from './BaseRepository';
import { TABLES } from '../schema';

export type PhotoEntity = {
  _local_id: string;
  _server_id: number | null;
  _sync_status: 'pending' | 'synced' | 'error' | 'conflict';
  _last_synced_at: string | null;
  _created_at: string;
  _updated_at: string;
  id: number | null;
  owner_id: number;
  klient_id: number | null;
  instalacja_id: number | null;
  serwis_id: number | null;
  montaz_id: number | null;
  inspekcja_id: number | null;
  image_url: string | null;
  local_image_path: string | null;
};

export class PhotoRepository extends BaseRepository<PhotoEntity> {
  protected tableName = TABLES.PHOTOS;

  /**
   * Znajduje zdjęcia dla klienta
   */
  async findByKlientId(klientId: number): Promise<PhotoEntity[]> {
    return this.findWhere({ klient_id: klientId });
  }

  /**
   * Znajduje zdjęcia dla instalacji
   */
  async findByInstalacjaId(instalacjaId: number): Promise<PhotoEntity[]> {
    return this.findWhere({ instalacja_id: instalacjaId });
  }

  /**
   * Znajduje zdjęcia dla montażu
   */
  async findByMontazId(montazId: number): Promise<PhotoEntity[]> {
    return this.findWhere({ montaz_id: montazId });
  }

  /**
   * Znajduje zdjęcia dla inspekcji
   */
  async findByInspekcjaId(inspekcjaId: number): Promise<PhotoEntity[]> {
    return this.findWhere({ inspekcja_id: inspekcjaId });
  }
}

export const photoRepository = new PhotoRepository();


