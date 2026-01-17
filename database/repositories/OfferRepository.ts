import { BaseRepository } from './BaseRepository';
import { TABLES } from '../schema';

export type OfferEntity = {
  _local_id: string;
  _server_id: number | null;
  _sync_status: 'pending' | 'synced' | 'error' | 'conflict';
  _last_synced_at: string | null;
  _created_at: string;
  _updated_at: string;
  id: number | null;
  instalacja_id: number | null;
  creator_id: number | null;
  is_accepted: number;
  is_template: number;
  offer_type: string | null;
  nazwa_oferty: string | null;
  wersja: number;
  created_date: string | null;
  updated_date: string | null;
  selected_device_id: number | null;
  proposed_montaz_date: string | null;
  proposed_montaz_time: string | null;
  montaz_status: string;
  montaz_zadanie_id: number | null;
  rejection_reason: string | null;
};

export class OfferRepository extends BaseRepository<OfferEntity> {
  protected tableName = TABLES.OFFERS;

  /**
   * Znajduje oferty dla instalacji
   */
  async findByInstalacjaId(instalacjaId: number): Promise<OfferEntity[]> {
    return this.findWhere({ instalacja_id: instalacjaId });
  }

  /**
   * Znajduje oferty utworzone przez użytkownika
   */
  async findByCreatorId(creatorId: number): Promise<OfferEntity[]> {
    return this.findWhere({ creator_id: creatorId });
  }

  /**
   * Znajduje szablony ofert
   */
  async findTemplates(creatorId?: number): Promise<OfferEntity[]> {
    if (creatorId) {
      return this.findWhere({ is_template: 1, creator_id: creatorId });
    }
    return this.findWhere({ is_template: 1 });
  }

  /**
   * Znajduje zaakceptowane oferty
   */
  async findAccepted(instalacjaId?: number): Promise<OfferEntity[]> {
    if (instalacjaId) {
      return this.findWhere({ is_accepted: 1, instalacja_id: instalacjaId });
    }
    return this.findWhere({ is_accepted: 1 });
  }
}

export const offerRepository = new OfferRepository();


