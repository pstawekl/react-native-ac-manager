import { getDatabase, initDatabase } from './db';
import { SCHEMAS, INDEXES } from './schema';

export type Migration = {
  version: number;
  up: (db: Awaited<ReturnType<typeof getDatabase>>) => Promise<void>;
  down?: (db: Awaited<ReturnType<typeof getDatabase>>) => Promise<void>;
};

/**
 * Migracja wersji 1 - utworzenie wszystkich tabel
 */
const migration1: Migration = {
  version: 1,
  async up(db) {
    // Utwórz wszystkie tabele
    for (const schema of Object.values(SCHEMAS)) {
      await db.execAsync(schema);
    }

    // Utwórz indeksy
    for (const index of INDEXES) {
      await db.execAsync(index);
    }

    // Wstaw początkową wartość last_synced_at
    await db.runAsync(
      `INSERT OR IGNORE INTO sync_metadata (key, value) 
       VALUES ('last_synced_at', datetime('1970-01-01'))`,
    );
  },
};

/**
 * Lista wszystkich migracji w kolejności
 */
export const migrations: Migration[] = [migration1];

/**
 * Pobiera aktualną wersję bazy danych
 */
export async function getCurrentVersion(db: Awaited<ReturnType<typeof getDatabase>>): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM sync_metadata WHERE key = 'db_version'",
    );
    if (result) {
      return parseInt(result.value, 10) || 0;
    }
  } catch (error) {
    // Tabela sync_metadata może nie istnieć jeszcze
    console.log('Brak tabeli sync_metadata, używam wersji 0');
  }
  return 0;
}

/**
 * Ustawia wersję bazy danych
 */
export async function setCurrentVersion(
  db: Awaited<ReturnType<typeof getDatabase>>,
  version: number,
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) 
     VALUES ('db_version', ?, datetime('now'))`,
    [version.toString()],
  );
}

/**
 * Wykonuje wszystkie oczekujące migracje
 */
export async function runMigrations(): Promise<void> {
  // Upewnij się, że baza jest zainicjalizowana
  await initDatabase();
  const db = getDatabase();
  const currentVersion = await getCurrentVersion(db);
  const pendingMigrations = migrations.filter(
    (m) => m.version > currentVersion,
  );

  if (pendingMigrations.length === 0) {
    console.log('Brak migracji do wykonania');
    return;
  }

  console.log(
    `Wykonywanie ${pendingMigrations.length} migracji (od wersji ${currentVersion})`,
  );

  for (const migration of pendingMigrations) {
    console.log(`Wykonywanie migracji wersji ${migration.version}...`);
    try {
      await db.execAsync('BEGIN TRANSACTION;');
      await migration.up(db);
      await setCurrentVersion(db, migration.version);
      await db.execAsync('COMMIT;');
      console.log(`Migracja wersji ${migration.version} zakończona pomyślnie`);
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      console.error(
        `Błąd podczas migracji wersji ${migration.version}:`,
        error,
      );
      throw error;
    }
  }

  console.log('Wszystkie migracje zakończone pomyślnie');
}

