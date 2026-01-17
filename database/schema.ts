/**
 * Definicje schematów tabel SQLite odpowiadających modelom Django
 * Każda tabela zawiera pola synchronizacji: _local_id, _server_id, _sync_status, _last_synced_at
 */

export const TABLES = {
  CLIENTS: 'clients',
  USER_DATA: 'user_data',
  INSTALLATIONS: 'installations',
  OFFERS: 'offers',
  TASKS: 'tasks',
  MONTaz: 'montaz',
  PHOTOS: 'photos',
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  NOTIFICATIONS: 'notifications',
  CATALOGS: 'catalogs',
  CENNIKS: 'cenniks',
  ULOTKAS: 'ulotkas',
  CERTIFICATES: 'certificates',
  SZKOLENIA: 'szkolenia',
  INSPEKCJE: 'inspekcje',
  SERWISY: 'serwisy',
  SYNC_QUEUE: 'sync_queue',
  SYNC_METADATA: 'sync_metadata',
} as const;

export type SyncStatus = 'pending' | 'synced' | 'error' | 'conflict';

/**
 * Podstawowe pola synchronizacji dla każdej tabeli
 */
export const SYNC_FIELDS = `
  _local_id TEXT PRIMARY KEY,
  _server_id INTEGER,
  _sync_status TEXT DEFAULT 'pending',
  _last_synced_at TEXT,
  _created_at TEXT DEFAULT (datetime('now')),
  _updated_at TEXT DEFAULT (datetime('now'))
`;

/**
 * Schematy tabel
 */
export const SCHEMAS = {
  [TABLES.CLIENTS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.CLIENTS} (
      ${SYNC_FIELDS},
      id INTEGER,
      first_name TEXT,
      last_name TEXT,
      email TEXT UNIQUE,
      url TEXT,
      user_type TEXT,
      hash_value TEXT,
      parent_id INTEGER,
      group_id INTEGER,
      map_list_id INTEGER,
      has_account INTEGER DEFAULT 0
    );
  `,

  [TABLES.USER_DATA]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.USER_DATA} (
      ${SYNC_FIELDS},
      id INTEGER,
      ac_user_id INTEGER UNIQUE,
      rodzaj_klienta TEXT,
      nazwa_firmy TEXT,
      nip TEXT,
      typ_klienta TEXT,
      ulica TEXT,
      mieszkanie TEXT,
      kod_pocztowy TEXT,
      numer_domu TEXT,
      miasto TEXT,
      numer_telefonu TEXT,
      longitude REAL,
      latitude REAL,
      client_status TEXT,
      lista_klientow INTEGER,
      FOREIGN KEY (ac_user_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.INSTALLATIONS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.INSTALLATIONS} (
      ${SYNC_FIELDS},
      id INTEGER,
      owner_id INTEGER,
      klient_id INTEGER,
      name TEXT,
      created_date TEXT,
      FOREIGN KEY (owner_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE,
      FOREIGN KEY (klient_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.OFFERS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.OFFERS} (
      ${SYNC_FIELDS},
      id INTEGER,
      instalacja_id INTEGER,
      creator_id INTEGER,
      is_accepted INTEGER DEFAULT 0,
      is_template INTEGER DEFAULT 0,
      offer_type TEXT,
      nazwa_oferty TEXT,
      wersja INTEGER DEFAULT 1,
      created_date TEXT,
      updated_date TEXT,
      selected_device_id INTEGER,
      proposed_montaz_date TEXT,
      proposed_montaz_time TEXT,
      montaz_status TEXT DEFAULT 'none',
      montaz_zadanie_id INTEGER,
      rejection_reason TEXT,
      FOREIGN KEY (instalacja_id) REFERENCES ${TABLES.INSTALLATIONS}(_server_id) ON DELETE SET NULL,
      FOREIGN KEY (creator_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.TASKS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.TASKS} (
      ${SYNC_FIELDS},
      id INTEGER,
      rodzic_id INTEGER,
      grupa INTEGER,
      instalacja_id INTEGER,
      status TEXT,
      nazwa TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      czy_oferta INTEGER DEFAULT 0,
      czy_faktura INTEGER DEFAULT 0,
      notatki TEXT,
      typ TEXT DEFAULT 'montaż',
      FOREIGN KEY (rodzic_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE,
      FOREIGN KEY (instalacja_id) REFERENCES ${TABLES.INSTALLATIONS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.MONTaz]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.MONTaz} (
      ${SYNC_FIELDS},
      id INTEGER,
      instalacja_id INTEGER NOT NULL,
      created_date TEXT,
      data_montazu TEXT,
      gwarancja INTEGER,
      liczba_przegladow INTEGER,
      split_multisplit INTEGER,
      nr_seryjny_jedn_zew TEXT,
      nr_seryjny_jedn_zew_photo TEXT,
      nr_seryjny_jedn_wew TEXT,
      nr_seryjny_jedn_wew_photo TEXT,
      miejsce_montazu_jedn_zew TEXT,
      miejsce_montazu_jedn_zew_photo INTEGER,
      miejsce_montazu_jedn_wew TEXT,
      miejsce_montazu_jedn_wew_photo INTEGER,
      sposob_skroplin TEXT,
      miejsce_skroplin TEXT,
      miejsce_i_sposob_montazu_jedn_zew TEXT,
      miejsce_i_sposob_montazu_jedn_zew_photo INTEGER,
      miejsce_podlaczenia_elektryki TEXT,
      gaz TEXT,
      gaz_ilosc_dodana REAL,
      gaz_ilos REAL,
      temp_zew_montazu REAL,
      temp_wew_montazu REAL,
      cisnienie REAL,
      przegrzanie REAL,
      temp_chlodzenia REAL,
      temp_grzania REAL,
      uwagi TEXT,
      kontrola_stanu_technicznego_jedn_wew TEXT,
      kontrola_stanu_technicznego_jedn_zew TEXT,
      kontrola_stanu_mocowania_agregatu TEXT,
      czyszczenie_filtrow_jedn_wew TEXT,
      czyszczenie_wymiennika_ciepla_jedn_wew TEXT,
      czyszczenie_obudowy_jedn_wew TEXT,
      czyszczenie_tacy_skroplin TEXT,
      kontrola_droznosci_odplywu_skroplin TEXT,
      czyszczenie_obudowy_jedn_zew TEXT,
      czyszczenie_wymiennika_ciepla_jedn_zew TEXT,
      kontrola_szczelnosci_instalacji TEXT,
      kontrola_poprawnosci_dzialania TEXT,
      kontrola_temperatury_nawiewu TEXT,
      diagnostyka_awarii_urzadzen TEXT,
      FOREIGN KEY (instalacja_id) REFERENCES ${TABLES.INSTALLATIONS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.PHOTOS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.PHOTOS} (
      ${SYNC_FIELDS},
      id INTEGER,
      owner_id INTEGER NOT NULL,
      klient_id INTEGER,
      instalacja_id INTEGER,
      serwis_id INTEGER,
      montaz_id INTEGER,
      inspekcja_id INTEGER,
      image_url TEXT,
      local_image_path TEXT,
      FOREIGN KEY (owner_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE,
      FOREIGN KEY (klient_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE SET NULL
    );
  `,

  [TABLES.CONVERSATIONS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.CONVERSATIONS} (
      ${SYNC_FIELDS},
      id INTEGER,
      participant_1_id INTEGER NOT NULL,
      participant_2_id INTEGER NOT NULL,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (participant_1_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE,
      FOREIGN KEY (participant_2_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE,
      UNIQUE(participant_1_id, participant_2_id)
    );
  `,

  [TABLES.MESSAGES]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.MESSAGES} (
      ${SYNC_FIELDS},
      id INTEGER,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT,
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      FOREIGN KEY (conversation_id) REFERENCES ${TABLES.CONVERSATIONS}(_server_id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.NOTIFICATIONS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.NOTIFICATIONS} (
      ${SYNC_FIELDS},
      id INTEGER,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_object_type TEXT,
      related_object_id INTEGER,
      data TEXT,
      is_read INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT,
      read_at TEXT,
      FOREIGN KEY (user_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.CATALOGS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.CATALOGS} (
      ${SYNC_FIELDS},
      id INTEGER,
      ac_user_id INTEGER NOT NULL,
      name TEXT,
      file_url TEXT,
      local_file_path TEXT,
      created_date TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (ac_user_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.CENNIKS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.CENNIKS} (
      ${SYNC_FIELDS},
      id INTEGER,
      ac_user_id INTEGER NOT NULL,
      name TEXT,
      file_url TEXT,
      local_file_path TEXT,
      created_date TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (ac_user_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.ULOTKAS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.ULOTKAS} (
      ${SYNC_FIELDS},
      id INTEGER,
      ac_user_id INTEGER NOT NULL,
      name TEXT,
      file_url TEXT,
      local_file_path TEXT,
      created_date TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (ac_user_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.CERTIFICATES]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.CERTIFICATES} (
      ${SYNC_FIELDS},
      id INTEGER,
      ac_user_id INTEGER NOT NULL,
      name TEXT,
      file_url TEXT,
      local_file_path TEXT,
      created_date TEXT,
      set_date TEXT,
      FOREIGN KEY (ac_user_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.SZKOLENIA]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.SZKOLENIA} (
      ${SYNC_FIELDS},
      id INTEGER,
      ac_user_id INTEGER NOT NULL,
      name TEXT,
      file_url TEXT,
      local_file_path TEXT,
      created_date TEXT,
      set_date TEXT,
      FOREIGN KEY (ac_user_id) REFERENCES ${TABLES.CLIENTS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.INSPEKCJE]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.INSPEKCJE} (
      ${SYNC_FIELDS},
      id INTEGER,
      instalacja_id INTEGER NOT NULL,
      created_date TEXT,
      miejsce_agregatu TEXT,
      podlaczenie_elektryki TEXT,
      miejsce_urzadzen_wew TEXT,
      sposob_montazu TEXT,
      uwagi_agregat TEXT,
      uwagi_instalacja TEXT,
      uwagi_elektryka TEXT,
      uwagi_ogolne TEXT,
      rooms INTEGER,
      rooms_m2 REAL,
      device_amount INTEGER,
      power_amount REAL,
      dlugosc_instalacji REAL,
      prowadzenie_instalacji TEXT,
      prowadzenie_skroplin TEXT,
      obnizenie REAL,
      uwagi TEXT,
      typ_urzadzenia_wewnetrznego TEXT,
      miejsce_montazu TEXT,
      FOREIGN KEY (instalacja_id) REFERENCES ${TABLES.INSTALLATIONS}(_server_id) ON DELETE CASCADE
    );
  `,

  [TABLES.SERWISY]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.SERWISY} (
      ${SYNC_FIELDS},
      id INTEGER,
      instalacja_id INTEGER NOT NULL,
      montaz_id INTEGER,
      created_date TEXT,
      typ TEXT DEFAULT 'przeglad',
      numer_przegladu INTEGER,
      termin_serwisu TEXT,
      data_montazu TEXT,
      dlugosc_gwarancji INTEGER,
      liczba_przegladow_rok INTEGER,
      data_przegladu TEXT,
      kontrola_stanu_jedn_wew INTEGER,
      kontrola_stanu_jedn_zew INTEGER,
      kontrola_stanu_mocowania_agregatu INTEGER,
      czyszczenie_filtrow_jedn_wew INTEGER,
      czyszczenie_wymiennika_ciepla_wew INTEGER,
      czyszczenie_obudowy_jedn_wew INTEGER,
      czyszczenie_tacy_skroplin INTEGER,
      kontrola_droznosci_skroplin INTEGER,
      czyszczenie_obudowy_jedn_zew INTEGER,
      czyszczenie_wymiennika_ciepla_zew INTEGER,
      kontrola_szczelnosci INTEGER,
      kontrola_poprawnosci_dzialania INTEGER,
      kontrola_temperatury_nawiewu_wew INTEGER,
      diagnostyka_awari INTEGER,
      uwagi TEXT,
      FOREIGN KEY (instalacja_id) REFERENCES ${TABLES.INSTALLATIONS}(_server_id) ON DELETE CASCADE,
      FOREIGN KEY (montaz_id) REFERENCES ${TABLES.MONTaz}(_server_id) ON DELETE SET NULL
    );
  `,

  [TABLES.SYNC_QUEUE]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.SYNC_QUEUE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      local_id TEXT NOT NULL,
      data TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `,

  [TABLES.SYNC_METADATA]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.SYNC_METADATA} (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `,
} as const;

/**
 * Indeksy dla wydajności
 */
export const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_clients_email ON ${TABLES.CLIENTS}(email);`,
  `CREATE INDEX IF NOT EXISTS idx_clients_server_id ON ${TABLES.CLIENTS}(_server_id);`,
  `CREATE INDEX IF NOT EXISTS idx_user_data_ac_user ON ${TABLES.USER_DATA}(ac_user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_installations_klient ON ${TABLES.INSTALLATIONS}(klient_id);`,
  `CREATE INDEX IF NOT EXISTS idx_installations_owner ON ${TABLES.INSTALLATIONS}(owner_id);`,
  `CREATE INDEX IF NOT EXISTS idx_offers_instalacja ON ${TABLES.OFFERS}(instalacja_id);`,
  `CREATE INDEX IF NOT EXISTS idx_offers_creator ON ${TABLES.OFFERS}(creator_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_rodzic ON ${TABLES.TASKS}(rodzic_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_instalacja ON ${TABLES.TASKS}(instalacja_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON ${TABLES.TASKS}(start_date);`,
  `CREATE INDEX IF NOT EXISTS idx_montaz_instalacja ON ${TABLES.MONTaz}(instalacja_id);`,
  `CREATE INDEX IF NOT EXISTS idx_photos_owner ON ${TABLES.PHOTOS}(owner_id);`,
  `CREATE INDEX IF NOT EXISTS idx_photos_klient ON ${TABLES.PHOTOS}(klient_id);`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation ON ${TABLES.MESSAGES}(conversation_id);`,
  `CREATE INDEX IF NOT EXISTS idx_messages_created_at ON ${TABLES.MESSAGES}(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON ${TABLES.NOTIFICATIONS}(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON ${TABLES.NOTIFICATIONS}(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON ${TABLES.SYNC_QUEUE}(table_name);`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON ${TABLES.SYNC_QUEUE}(retry_count);`,
];


