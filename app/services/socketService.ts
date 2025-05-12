import { Socket, io } from 'socket.io-client';
import { EventEmitter } from 'events';
import { Location, MessageType } from '../types';

type SocketEventCallback = (...args: any[]) => void;

class SocketService extends EventEmitter {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private currentRoomCode: string | null = null;
  private serverUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(serverUrl: string = 'http://localhost:3000') {
    super();
    this.serverUrl = serverUrl;
  }

  /**
   * Initialize socket connection for real-time updates
   */
  connect(userId: string, roomCode: string): void {
    if (this.socket) {
      this.disconnectSocket();
    }

    this.userId = userId;
    this.currentRoomCode = roomCode;

    this.socket = io(this.serverUrl, {
      query: { userId, roomCode },
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      this.emit('socket:connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('socket:disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('socket:error', error);
      
      // Handle reconnect logic
      this.reconnectAttempts++;
      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached');
        this.emit('socket:max_reconnect_attempts');
      }
    });

    // Room events
    this.socket.on('JOIN_SUCCESS', (data) => {
      console.log('Successfully joined room', data);
      this.emit('room:joined', data);
    });

    this.socket.on('USER_JOINED', (user) => {
      console.log('User joined room:', user);
      this.emit('room:user_joined', user);
    });

    this.socket.on('USER_LEFT', (userData) => {
      console.log('User left room:', userData);
      this.emit('room:user_left', userData);
    });

    this.socket.on('USER_DISCONNECTED', (userData) => {
      console.log('User disconnected from room:', userData);
      this.emit('room:user_disconnected', userData);
    });

    this.socket.on('USER_MEMBERS_UPDATED', (members) => {
      console.log('Room members updated:', members);
      this.emit('room:members_updated', members);
    });

    this.socket.on('ROOM_EXPIRED', (data) => {
      console.log('Room expired:', data);
      this.emit('room:expired', data);
    });

    // Chat events
    this.socket.on('NEW_MESSAGE', (message) => {
      console.log('New message received:', message);
      this.emit('chat:message_received', message);
    });

    this.socket.on('SEND_MESSAGE_SUCCESS', (message) => {
      console.log('Message sent successfully:', message);
      this.emit('chat:message_sent', message);
    });

    this.socket.on('FETCH_MESSAGES_SUCCESS', (data) => {
      console.log('Messages fetched:', data);
      this.emit('chat:messages_fetched', data);
    });

    // Error events
    this.socket.on('SEND_MESSAGE_FAILED', (error) => {
      console.error('Failed to send message:', error);
      this.emit('chat:message_error', error);
    });

    this.socket.on('LEAVE_ROOM_FAILED', (error) => {
      console.error('Failed to leave room:', error);
      this.emit('room:leave_error', error);
    });
  }

  /**
   * Disconnect from socket
   */
  disconnectSocket(): void {
    if (!this.socket) return;
    
    this.socket.disconnect();
    this.socket = null;
    this.currentRoomCode = null;
  }

  /**
   * Add event listener
   */
  addListener(event: string, callback: SocketEventCallback): this {
    super.addListener(event, callback);
    return this;
  }

  /**
   * Remove event listener
   */
  removeListener(event: string, callback: SocketEventCallback): this {
    super.removeListener(event, callback);
    return this;
  }

  /**
   * Send a message via socket
   */
  sendMessage(
    roomCode: string,
    senderName: string,
    content: string,
    messageType: MessageType = 'text',
    metadata?: any,
  ): void {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('SEND_MESSAGE', {
      roomCode,
      senderId: this.userId,
      senderName,
      messageType,
      content,
      metadata,
    });
  }

  /**
   * Fetch messages via socket
   */
  fetchMessages(roomCode: string, limit: number = 20): void {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('FETCH_MESSAGES', { roomCode, limit });
  }

  /**
   * Update location via socket
   */
  updateLocation(location: Location): void {
    if (!this.socket || !this.socket.connected || !this.userId || !this.currentRoomCode) {
      throw new Error('Socket not connected or missing user/room info');
    }

    this.socket.emit('LOCATION_UPDATE', {
      roomCode: this.currentRoomCode,
      userId: this.userId,
      location,
    });
  }

  /**
   * Leave room via socket
   */
  leaveRoom(): void {
    if (!this.socket || !this.socket.connected || !this.userId || !this.currentRoomCode) {
      throw new Error('Socket not connected or missing user/room info');
    }

    this.socket.emit('LEAVE_ROOM', {
      roomCode: this.currentRoomCode,
      userId: this.userId,
    });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return !!this.socket && this.socket.connected;
  }

  /**
   * Get current room code
   */
  getCurrentRoomCode(): string | null {
    return this.currentRoomCode;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.userId;
  }
}

// Create and export a singleton instance
export const socketService = new SocketService();