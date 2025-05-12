import { create } from 'zustand';
import { ChatMessage, MessageType } from '../types';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socketService';
import { useUserStore } from './userStore';
import { useRoomStore } from './roomStore';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Chat actions
  sendMessage: (content: string, messageType?: MessageType, metadata?: any) => Promise<void>;
  loadMessages: (limit?: number) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  
  sendMessage: async (content, messageType = 'text', metadata) => {
    try {
      const user = useUserStore.getState().user;
      const roomId = useRoomStore.getState().currentRoom?.id;
      const roomCode = useRoomStore.getState().currentRoom?.roomCode;
      
      if (!user || !roomId || !roomCode) {
        set({ error: 'Cannot send message: User or room not available' });
        return;
      }
      
      // Try to send via socket first
      try {
        socketService.sendMessage(
          roomCode,
          user.displayName,
          content,
          messageType,
          metadata
        );
      } catch (socketError) {
        // Fall back to HTTP if socket fails
        console.log('Socket send failed, using HTTP fallback');
        const message = await apiService.sendMessageHttp(
          roomId,
          user.id,
          user.displayName,
          content,
          messageType,
          metadata
        );
        
        // Add the message to the store manually since socket failed
        set(state => ({
          messages: [...state.messages, message]
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ error: 'Failed to send message' });
    }
  },
  
  loadMessages: async (limit = 20) => {
    set({ isLoading: true });
    
    try {
      const roomId = useRoomStore.getState().currentRoom?.id;
      if (!roomId) {
        set({ error: 'Cannot load messages: Room not available', isLoading: false });
        return;
      }
      
      // Try to fetch via socket first
      try {
        const roomCode = useRoomStore.getState().currentRoom?.roomCode;
        if (roomCode) {
          socketService.fetchMessages(roomCode, limit);
        }
      } catch (socketError) {
        // Fall back to HTTP if socket fails
        console.log('Socket fetch failed, using HTTP fallback');
        const messages = await apiService.getMessages(roomId, limit);
        set({ messages, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ error: 'Failed to load messages', isLoading: false });
    }
  },
  
  addMessage: (message: ChatMessage) => {
    set(state => ({
      messages: [...state.messages, message].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }));
  },
  
  clearMessages: () => {
    set({ messages: [], error: null });
  }
}));