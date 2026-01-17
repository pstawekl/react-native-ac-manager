import { Client } from '../providers/ClientsProvider';

export type ClientsInstallationListItem = {
  id: number;
  owner: number;
  klient_id: number;
  created_date: string;
  name: string;
  ulica?: string | null;
  numer_domu?: string | null;
  mieszkanie?: string | null;
  kod_pocztowy?: string | null;
  miasto?: string | null;
};

export type ClientInstallationsListResponse = {
  installation_list: ClientsInstallationListItem[];
};

export type ClientInsallationData = {
  owner: number;
  klient: Client;
  name: string;
  created_date: string;
};
