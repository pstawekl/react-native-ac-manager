let db: any = null;
let dbInitialized = false;

/**
 * Inicjalizuje połączenie z bazą danych
 */
export async function initDatabase(): Promise<any> {
  if (db && dbInitialized) {
    return db;
  }

  try {
    // Dynamiczny import expo-sqlite
    const SQLite = await import('expo-sqlite');
    
    const DB_NAME = 'acmanager';
    
    db = await SQLite.openDatabaseAsync(DB_NAME);

    // Włącz foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    dbInitialized = true;

    return db;
  } catch (error) {
    console.error('Błąd inicjalizacji bazy danych:', error);
    // Nie rzucaj błędu - pozwól aplikacji działać bez lokalnej bazy
    dbInitialized = false;
    throw error;
  }
}

/**
 * Pobiera instancję bazy danych (singleton)
 */
export function getDatabase(): any {
  if (!db || !dbInitialized) {
    throw new Error(
      'Baza danych nie została zainicjalizowana. Wywołaj initDatabase() najpierw.',
    );
  }
  return db;
}

/**
 * Zamyka połączenie z bazą danych
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      await db.closeAsync();
    } catch (error) {
      console.error('Błąd zamykania bazy danych:', error);
    }
    db = null;
    dbInitialized = false;
  }
}

/**
 * Wykonuje transakcję
 */
export async function executeTransaction<T>(
  callback: (db: any) => Promise<T> | T,
): Promise<T> {
  const database = getDatabase();
  await database.execAsync('BEGIN TRANSACTION;');
  try {
    const result = await callback(database);
    await database.execAsync('COMMIT;');
    return result;
  } catch (error) {
    try {
      await database.execAsync('ROLLBACK;');
    } catch (rollbackError) {
      console.error('Błąd rollback:', rollbackError);
    }
    throw error;
  }
}

