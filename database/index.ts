/**
 * Główny plik eksportujący funkcjonalność bazy danych
 */
export { initDatabase, getDatabase, closeDatabase, executeTransaction } from './db';
export { SCHEMAS, TABLES, INDEXES, type SyncStatus } from './schema';
export { runMigrations, getCurrentVersion, type Migration } from './migrations';

/**
 * Inicjalizuje bazę danych i wykonuje migracje
 */
export async function setupDatabase(): Promise<void> {
  try {
    await initDatabase();
    const { runMigrations } = await import('./migrations');
    await runMigrations();
  } catch (error) {
    console.error('Błąd setupDatabase:', error);
    // Nie rzucaj błędu - pozwól aplikacji działać bez lokalnej bazy
    throw error;
  }
}

