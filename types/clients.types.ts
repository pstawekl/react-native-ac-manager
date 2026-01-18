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

export type Agreement = {
  id: number;
  owner: number;
  instalacja: number;
  klient: number;
  pdf_file: string; // URL do pliku
  pdf_file_url?: string;
  client_type: 'firma' | 'klient_prywatny';
  nip?: string | null;
  nazwa_firmy?: string | null;
  ulica?: string | null;
  numer_budynku?: string | null;
  numer_lokalu?: string | null;
  kod_pocztowy?: string | null;
  miasto?: string | null;
  imie?: string | null;
  nazwisko?: string | null;
  email?: string | null;
  stanowisko_klienta?: string | null;
  created_date: string;
  updated_date: string;
};

export type AgreementListResponse = {
  umowy: Agreement[];
};
