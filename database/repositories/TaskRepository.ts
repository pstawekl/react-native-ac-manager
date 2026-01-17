import { BaseRepository } from './BaseRepository';
import { TABLES } from '../schema';

export type TaskEntity = {
  _local_id: string;
  _server_id: number | null;
  _sync_status: 'pending' | 'synced' | 'error' | 'conflict';
  _last_synced_at: string | null;
  _created_at: string;
  _updated_at: string;
  id: number | null;
  rodzic_id: number | null;
  grupa: number | null;
  instalacja_id: number | null;
  status: string;
  nazwa: string | null;
  start_date: string;
  end_date: string;
  czy_oferta: number;
  czy_faktura: number;
  notatki: string | null;
  typ: string;
};

export class TaskRepository extends BaseRepository<TaskEntity> {
  protected tableName = TABLES.TASKS;

  /**
   * Znajduje zadania użytkownika
   */
  async findByRodzicId(rodzicId: number): Promise<TaskEntity[]> {
    return this.findWhere({ rodzic_id: rodzicId });
  }

  /**
   * Znajduje zadania w zakresie dat
   */
  async findByDateRange(
    startDate: string,
    endDate: string,
    rodzicId?: number,
  ): Promise<TaskEntity[]> {
    const db = getDatabase();
    let query = `SELECT * FROM ${this.tableName} 
                 WHERE start_date >= ? AND end_date <= ?`;
    const params: any[] = [startDate, endDate];

    if (rodzicId !== undefined) {
      query += ' AND rodzic_id = ?';
      params.push(rodzicId);
    }

    query += ' ORDER BY start_date ASC';

    const result = db.execute(query, params);
    const rows: TaskEntity[] = [];

    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        rows.push(this.parseRow(result.rows.item(i)));
      }
    }

    return rows;
  }

  /**
   * Znajduje zadania dla instalacji
   */
  async findByInstalacjaId(instalacjaId: number): Promise<TaskEntity[]> {
    return this.findWhere({ instalacja_id: instalacjaId });
  }

  /**
   * Znajduje zadania według statusu
   */
  async findByStatus(
    status: string,
    rodzicId?: number,
  ): Promise<TaskEntity[]> {
    if (rodzicId !== undefined) {
      return this.findWhere({ status, rodzic_id: rodzicId });
    }
    return this.findWhere({ status });
  }
}

export const taskRepository = new TaskRepository();


