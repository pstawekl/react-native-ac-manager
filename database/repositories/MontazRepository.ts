import { BaseRepository } from './BaseRepository';
import { TABLES } from '../schema';

export type MontazEntity = {
  _local_id: string;
  _server_id: number | null;
  _sync_status: 'pending' | 'synced' | 'error' | 'conflict';
  _last_synced_at: string | null;
  _created_at: string;
  _updated_at: string;
  id: number | null;
  instalacja_id: number;
  created_date: string | null;
  data_montazu: string | null;
  gwarancja: number | null;
  liczba_przegladow: number | null;
  split_multisplit: number | null;
  nr_seryjny_jedn_zew: string | null;
  nr_seryjny_jedn_zew_photo: string | null;
  nr_seryjny_jedn_wew: string | null;
  nr_seryjny_jedn_wew_photo: string | null;
  miejsce_montazu_jedn_zew: string | null;
  miejsce_montazu_jedn_zew_photo: number | null;
  miejsce_montazu_jedn_wew: string | null;
  miejsce_montazu_jedn_wew_photo: number | null;
  sposob_skroplin: string | null;
  miejsce_skroplin: string | null;
  miejsce_i_sposob_montazu_jedn_zew: string | null;
  miejsce_i_sposob_montazu_jedn_zew_photo: number | null;
  miejsce_podlaczenia_elektryki: string | null;
  gaz: string | null;
  gaz_ilosc_dodana: number | null;
  gaz_ilos: number | null;
  temp_zew_montazu: number | null;
  temp_wew_montazu: number | null;
  cisnienie: number | null;
  przegrzanie: number | null;
  temp_chlodzenia: number | null;
  temp_grzania: number | null;
  uwagi: string | null;
  kontrola_stanu_technicznego_jedn_wew: string | null;
  kontrola_stanu_technicznego_jedn_zew: string | null;
  kontrola_stanu_mocowania_agregatu: string | null;
  czyszczenie_filtrow_jedn_wew: string | null;
  czyszczenie_wymiennika_ciepla_jedn_wew: string | null;
  czyszczenie_obudowy_jedn_wew: string | null;
  czyszczenie_tacy_skroplin: string | null;
  kontrola_droznosci_odplywu_skroplin: string | null;
  czyszczenie_obudowy_jedn_zew: string | null;
  czyszczenie_wymiennika_ciepla_jedn_zew: string | null;
  kontrola_szczelnosci_instalacji: string | null;
  kontrola_poprawnosci_dzialania: string | null;
  kontrola_temperatury_nawiewu: string | null;
  diagnostyka_awarii_urzadzen: string | null;
};

export class MontazRepository extends BaseRepository<MontazEntity> {
  protected tableName = TABLES.MONTaz;

  /**
   * Znajduje montaże dla instalacji
   */
  async findByInstalacjaId(instalacjaId: number): Promise<MontazEntity[]> {
    return this.findWhere({ instalacja_id: instalacjaId });
  }
}

export const montazRepository = new MontazRepository();


