export interface Message {
  id: number;
  conversation: number;
  sender: number;
  sender_name: string;
  sender_email: string;
  sender_avatar: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at?: string;
}

export interface Conversation {
  id: number;
  participant_1: number;
  participant_2: number;
  participant_1_name: string;
  participant_2_name: string;
  participant_1_email: string;
  participant_2_email: string;
  participant_1_avatar: string;
  participant_2_avatar: string;
  participant_1_type: 'admin' | 'monter' | 'klient';
  participant_2_type: 'admin' | 'monter' | 'klient';
  created_at: string;
  updated_at: string;
  last_message?: {
    id: number;
    content: string;
    created_at: string;
    sender_id: number;
    is_read: boolean;
  };
  unread_count: number;
}

export interface ChatWebSocketMessage {
  type: 'connection_established' | 'chat_message' | 'messages_read' | 'error';
  message?: any;
  user_id?: number;
}

