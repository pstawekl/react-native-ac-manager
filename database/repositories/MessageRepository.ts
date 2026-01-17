import { BaseRepository } from './BaseRepository';
import { TABLES } from '../schema';

export type MessageEntity = {
  _local_id: string;
  _server_id: number | null;
  _sync_status: 'pending' | 'synced' | 'error' | 'conflict';
  _last_synced_at: string | null;
  _created_at: string;
  _updated_at: string;
  id: number | null;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string | null;
  is_read: number;
  read_at: string | null;
};

export class MessageRepository extends BaseRepository<MessageEntity> {
  protected tableName = TABLES.MESSAGES;

  /**
   * Znajduje wiadomości dla konwersacji
   */
  async findByConversationId(
    conversationId: number,
    limit?: number,
  ): Promise<MessageEntity[]> {
    const db = getDatabase();
    let query = `SELECT * FROM ${this.tableName} 
                 WHERE conversation_id = ? 
                 ORDER BY created_at ASC`;
    const params: any[] = [conversationId];

    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const result = db.execute(query, params);
    const rows: MessageEntity[] = [];

    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        rows.push(this.parseRow(result.rows.item(i)));
      }
    }

    return rows;
  }

  /**
   * Znajduje nieprzeczytane wiadomości
   */
  async findUnread(conversationId?: number): Promise<MessageEntity[]> {
    if (conversationId !== undefined) {
      return this.findWhere({ is_read: 0, conversation_id: conversationId });
    }
    return this.findWhere({ is_read: 0 });
  }

  /**
   * Oznacza wiadomość jako przeczytaną
   */
  async markAsRead(localId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.update(localId, {
      is_read: 1,
      read_at: now,
    } as Partial<MessageEntity>);
  }
}

export const messageRepository = new MessageRepository();


