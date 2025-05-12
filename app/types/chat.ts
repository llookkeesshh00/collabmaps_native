export type MessageType = 'text' | 'location' | 'system' | 'destination_change';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId?: string;
  senderName: string;
  messageType: MessageType;
  content: string;
  metadata?: any;
  createdAt: string;
}