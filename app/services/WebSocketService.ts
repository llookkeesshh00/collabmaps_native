import * as Location from 'expo-location';
import Constants from 'expo-constants';

export type User = {
  socketId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  joinedAt?: string;
  lastUpdated?: string;
  route?: {
    points: any[];
    duration: string;
    distance: string;
    mode: string;
  };
};

export type Room = {
  createdBy: string;
  users: Record<string, User>;
  destination: {
    latitude: number;
    longitude: number;
  };
  roomId?: string;
  createdAt?: string;
};

// Get WebSocket URL from app config or use default
const getWebSocketUrl = () => {
  const configuredUrl = Constants.expoConfig?.extra?.websocketUrl;
  return configuredUrl || 'ws://192.168.31.7:3001';
};

class WebSocketService {
  private static instance: WebSocketService | null = null;
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private userId: string | null = null;
  private roomId: string | null = null;
  private locationInterval: NodeJS.Timeout | null = null;
  private serverUrl: string = getWebSocketUrl();
  
  // Store room details locally
  private roomDetails: Room | null = null;

  private lastJoinParams: {
    roomId: string;
    username: string;
    location: { latitude: number; longitude: number };
  } | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  setServerUrl(url: string): void {
    this.serverUrl = url;
    console.log(`WebSocket server URL set to: ${url}`);
  }

  getServerUrl(): string {
    return this.serverUrl;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  connect(customUrl?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = customUrl || this.serverUrl;
      this.serverUrl = url;
      console.log(`Connecting to WebSocket server at: ${url}`);

      this.socket = new WebSocket(url);

      const timeoutId = setTimeout(() => {
        if (this.socket?.readyState !== WebSocket.OPEN) {
          console.error(`WebSocket connection timeout to ${url}`);
          this.socket?.close();
          reject(new Error(`Connection timeout to ${url}`));
        }
      }, 10000);

      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        clearTimeout(timeoutId);
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Update local room details if present in the payload
          if (data.payload && (data.payload.users || data.payload.destination)) {
            this.updateLocalRoomDetails(data.payload);
          }
          
          // Call the appropriate message handler
          const handler = this.messageHandlers.get(data.type);
          handler?.(data.payload);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(timeoutId);
      };

      this.socket.onclose = () => {
        console.warn('WebSocket connection closed');
        this.stopLocationUpdates();
        this.socket = null;
      };
    });
  }

  disconnect() {
    if (this.socket) {
      this.stopLocationUpdates();
      this.socket.close();
      this.socket = null;
      this.userId = null;
      this.roomId = null;
      this.roomDetails = null;
    }
  }

  onMessage(type: string, callback: (data: any) => void) {
    this.messageHandlers.set(type, callback);
    return () => {
      this.messageHandlers.delete(type);
    };
  }

  send(type: string, payload: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  createRoom(
    username: string,
    location: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    placeId: string
  ) {
    this.send('CREATE_ROOM', {
      name: username,
      location,
      destination,
      placeId,
    });
  }

  joinRoom(
    roomId: string,
    username: string,
    location: { latitude: number; longitude: number }
  ) {
    this.lastJoinParams = { roomId, username, location };
    this.send('JOIN_ROOM', {
      roomId,
      name: username,
      location,
    });
  }

  private updateLocalRoomDetails(payload: any) {
    // Initialize room details if not already set
    if (!this.roomDetails) {
      this.roomDetails = {
        users: {},
        destination: { latitude: 0, longitude: 0 },
        createdBy: '',
        roomId: this.roomId || undefined
      };
    }
    
    // Set these fields only once when room details are first created or update them if provided
    if (payload.destination) {
      this.roomDetails.destination = payload.destination;
    }
    
    if (payload.createdBy) {
      this.roomDetails.createdBy = payload.createdBy;
    }
    
    if (payload.createdAt) {
      this.roomDetails.createdAt = payload.createdAt;
    }
    
    // Update roomId from payload if available, or use the class instance roomId
    if (payload.roomId) {
      this.roomDetails.roomId = payload.roomId;
    } else if (this.roomId) {
      this.roomDetails.roomId = this.roomId;
    }
    
    // Always update users as they can change (join/leave/update location/update route)
    if (payload.users) {
      this.roomDetails.users = payload.users;
    }
    
    console.log('Updated local room details:', this.roomDetails);
  }

  updateLocation(location: { latitude: number; longitude: number }) {
    if (this.userId && this.roomId) {
      this.send('UPDATE_LOCATION', {
        userId: this.userId,
        location,
      });
    }
  }

  updateRoute(userId: string, route: { points: any[]; duration: string; distance: string; mode: string }) {
    if (this.userId && this.roomId) {
      this.send('UPDATE_ROUTE', {
        userId: userId,
        roomId: this.roomId,
        route,
      });
    }
  }

  leaveRoom() {
    if (this.userId && this.roomId) {
      this.send('LEAVE_ROOM', {
        userId: this.userId,
        roomId: this.roomId,
      });
    }
    this.stopLocationUpdates();
    this.userId = null;
    this.roomId = null;
    this.lastJoinParams = null;
    this.roomDetails = null;
  }

  terminateRoom() {
    if (this.userId && this.roomId) {
      this.send('TERMINATE_ROOM', {
        userId: this.userId,
        roomId: this.roomId,
      });
      this.stopLocationUpdates();
      this.userId = null;
      this.roomId = null;
      this.roomDetails = null;
    }
  }

  setRoomAndUserIds(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
    
    // Update roomId in roomDetails if it exists
    if (this.roomDetails) {
      this.roomDetails.roomId = roomId;
    }
  }

  getRoomAndUserIds() {
    return { roomId: this.roomId, userId: this.userId };
  }

  setRoomDetails(roomId: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      // If we already have room details locally and they match the requested roomId, return them
      if (this.roomDetails && this.roomDetails.roomId === roomId) {
        resolve(this.roomDetails);
        return;
      }
  
      // Set the roomId in the instance to ensure it's available for updateLocalRoomDetails
      this.roomId = roomId;
      
      // Check WebSocket connection
      if (this.socket?.readyState === WebSocket.OPEN) {
        // Create a one-time message handler for room details
        const detailsHandler = this.onMessage('ROOM_DETAILS', (data) => {
          detailsHandler(); // Remove the handler after receiving response
  
          // Ensure roomId is in the data before updating local details
          if (!data.roomId) {
            data.roomId = roomId;
          }
          
          // Update local room details
          this.updateLocalRoomDetails(data);
  
          resolve(this.roomDetails!);
        });
  
        // Send request for room details
        this.send('GET_ROOM_DETAILS', { roomId });
  
        // Set timeout to reject if no response
        setTimeout(() => {
          detailsHandler(); // Clean up handler
          reject(new Error('Timeout waiting for room details'));
        }, 5000);
      } else {
        reject(new Error('WebSocket not connected or no room ID'));
      }
    });
  }

  getRoomDetails(roomId: string) {
    return this.roomDetails?.roomId === roomId ? this.roomDetails : null;
  }
  

  startLocationUpdates(intervalMs: number = 10000) {
    this.stopLocationUpdates();

    this.locationInterval = setInterval(async () => {
      if (!this.userId || !this.roomId || this.socket?.readyState !== WebSocket.OPEN) return;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({});
        this.updateLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }, intervalMs);
  }

  stopLocationUpdates() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
  }
}

// React hook wrapper
export function useWebSocket() {
  const service = WebSocketService.getInstance();

  return {
    connect: (customUrl?: string) => service.connect(customUrl),
    isConnected: () => service.isConnected(),
    send: (type: string, payload: any) => service.send(type, payload),
    disconnect: () => service.disconnect(),
    onMessage: (type: string, callback: (data: any) => void) =>
      service.onMessage(type, callback),
    createRoom: (
      username: string,
      location: { latitude: number; longitude: number },
      destination: { latitude: number; longitude: number },
      placeId: string
    ) => service.createRoom(username, location, destination, placeId),
    joinRoom: (
      roomId: string,
      username: string,
      location: { latitude: number; longitude: number }
    ) => service.joinRoom(roomId, username, location),
    updateLocation: (location: { latitude: number; longitude: number }) =>
      service.updateLocation(location),
    updateRoute: (userId:string , route: { points: any[]; duration: string; distance: string; mode: string }) =>
      service.updateRoute(userId,route),
    leaveRoom: () => service.leaveRoom(),
    terminateRoom: () => service.terminateRoom(),
    setRoomAndUserIds: (roomId: string, userId: string) =>
      service.setRoomAndUserIds(roomId, userId),
    startLocationUpdates: (intervalMs?: number) =>
      service.startLocationUpdates(intervalMs),
    stopLocationUpdates: () => service.stopLocationUpdates(),
    setServerUrl: (url: string) => service.setServerUrl(url),
    getServerUrl: () => service.getServerUrl(),
    getRoomAndUserIds: () => service.getRoomAndUserIds(),
    getRoomDetails: (roomId:string) => service.getRoomDetails(roomId),
    getWebSocketUrl: () => service.getServerUrl(),
    setWebSocketUrl: (url: string) => service.setServerUrl(url),
    getInstance: () => service,
    setRoomDetails: (roomId:string) => service.setRoomDetails(roomId),
  };
}

export default WebSocketService;
