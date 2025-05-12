import axios, { AxiosInstance } from 'axios';
import { User, Location, Room, RoomMembership, ChatMessage, MessageType, CommonPoint, RoomMode } from '../types';

class ApiService {
  private axiosInstance: AxiosInstance;
  private userId: string | null = null;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  // Set user ID for API calls
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  // AUTH API

  /**
   * Create a new user
   */
  async createUser(displayName: string, currentLocation?: Location): Promise<User> {
    const response = await this.axiosInstance.post('/api/auth/create-user', {
      displayName,
      currentLocation,
    });
    this.userId = response.data.id;
    return response.data;
  }

  /**
   * Get a user by ID
   */
  async getUser(userId: string): Promise<User> {
    const response = await this.axiosInstance.get(`/api/auth/users/${userId}`);
    return response.data;
  }

  /**
   * Update a user's location
   */
  async updateUserLocation(userId: string, location: Location): Promise<User> {
    const response = await this.axiosInstance.put(`/api/auth/users/${userId}/location`, {
      currentLocation: location,
    });
    return response.data;
  }

  /**
   * Get a user's current location
   */
  async getUserLocation(userId: string): Promise<Location | null> {
    const response = await this.axiosInstance.get(`/api/auth/users/${userId}/location`);
    return response.data;
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<User> {
    const response = await this.axiosInstance.delete(`/api/auth/users/${userId}`);
    if (userId === this.userId) {
      this.userId = null;
    }
    return response.data;
  }

  /**
   * Get a user's membership
   */
  async getUserMembership(userId: string): Promise<RoomMembership[]> {
    const response = await this.axiosInstance.get(`/api/auth/users/${userId}/membership`);
    return response.data;
  }

  // ROOM API

  /**
   * Create a new room and join it
   */
  async createRoom(
    name: string,
    mode: RoomMode,
    commonPoint: CommonPoint,
    creatorId: string,
    polyline: string,
    deviceType?: string,
  ): Promise<{ room: Room; membership: RoomMembership }> {
    const response = await this.axiosInstance.post('/api/room/create', {
      name,
      mode,
      commonPoint,
      creatorId,
      polyline,
      deviceType,
    });
    return response.data;
  }

  /**
   * Join an existing room
   */
  async joinRoom(
    roomCode: string,
    userId: string,
    polyline?: string,
    deviceType?: string,
  ): Promise<{ room: Room; membership: RoomMembership }> {
    const response = await this.axiosInstance.post('/api/room/join', {
      roomCode,
      userId,
      polyline,
      deviceType,
    });
    return response.data;
  }

  /**
   * Get room details by room code
   */
  async getRoomByCode(code: string): Promise<Room> {
    const response = await this.axiosInstance.get(`/api/room/code/${code}`);
    return response.data;
  }

  // CHAT API

  /**
   * Get messages from a room
   */
  async getMessages(roomId: string, limit: number = 20): Promise<ChatMessage[]> {
    const response = await this.axiosInstance.get('/api/chat/messages', {
      params: { roomId, limit },
    });
    return response.data.messages;
  }

  /**
   * Send a message via HTTP (fallback if socket fails)
   */
  async sendMessageHttp(
    roomId: string,
    senderId: string,
    senderName: string,
    content: string,
    messageType: MessageType = 'text',
    metadata?: any,
  ): Promise<ChatMessage> {
    const response = await this.axiosInstance.post('/api/chat/send', {
      roomId,
      senderId,
      senderName,
      messageType,
      content,
      metadata,
    });
    return response.data.message;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();