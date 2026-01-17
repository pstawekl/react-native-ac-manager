import { Montage } from '../providers/MontageProvider';

export type MontageListItem = {
  id: number;
  owner: number;
  instalacja_id: number;
  created_date: string;
  name: string;
};

export type MontageListResponse = Montage[];

export type MontageData = {
  owner: number | null;
  instalacja_id: number | null;
  montaz_id: number | null;
  klient_id: number | null;
  name: string;
  created_date: string;
};
