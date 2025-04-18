// WebSocketService.ts
import * as Location from 'expo-location';

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
  roomId?: string; // optional, for reference if needed
};

// URL should ideally come from environment variables
const WEBSOCKET_URL = 'ws://192.168.1.2:3001';

class WebSocketService {
  private static instance: WebSocketService | null = null;
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private userId: string | null = null;
  private roomId: string | null = null;
  private locationInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(WEBSOCKET_URL);

        this.socket.onopen = () => {
          console.log(' WebSocket connection established');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(' Received WebSocket message:', data.type);

            const handler = this.messageHandlers.get(data.type);
            handler?.(data.payload); // safe optional chaining
          } catch (error) {
            console.error(' Error parsing WebSocket message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error(' WebSocket error:', error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log(' WebSocket connection closed');
          this.stopLocationUpdates();
        };
      } catch (error) {
        console.error(' Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.stopLocationUpdates();
      this.socket.close();
      this.socket = null;
      this.userId = null;
      this.roomId = null;
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
      console.error(' WebSocket is not connected');
    }
  }

  // 1. Create a room
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

  // 2. Join an existing room
  joinRoom(
    roomId: string,
    username: string,
    location: { latitude: number; longitude: number }
  ) {
    this.send('JOIN_ROOM', {
      roomId,
      name: username,
      location,
    });
  }

  // 3. Update user location
  updateLocation(location: { latitude: number; longitude: number }) {
    if (this.userId && this.roomId) {
      this.send('UPDATE_LOCATION', {
        userId: this.userId,
        location,
      });
    }
  }

  // New method to update route
  updateRoute(route: { points: any[], duration: string, distance: string, mode: string }) {
    if (this.userId && this.roomId) {
      this.send('UPDATE_ROUTE', {
        userId: this.userId,
        roomId: this.roomId,
        route
      });
    }
  }

  // 4. Leave a room
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
  }

  // 5. Terminate a room (admin only)
  terminateRoom() {
    if (this.userId && this.roomId) {
      this.send('TERMINATE_ROOM', {
        userId: this.userId,
        roomId: this.roomId,
      });
      this.stopLocationUpdates();
      this.userId = null;
      this.roomId = null;
    }
  }

  // Save user/room IDs
  setRoomAndUserIds(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
  }

  // Start location tracking
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
        console.error(' Error updating location:', error);
      }
    }, intervalMs);
  }

  // Stop location tracking
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
    connect: () => service.connect(),
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
    updateRoute: (route: { points: any[], duration: string, distance: string, mode: string }) =>
      service.updateRoute(route),
    leaveRoom: () => service.leaveRoom(),
    terminateRoom: () => service.terminateRoom(),
    setRoomAndUserIds: (roomId: string, userId: string) =>
      service.setRoomAndUserIds(roomId, userId),
    startLocationUpdates: (intervalMs?: number) =>
      service.startLocationUpdates(intervalMs),
    stopLocationUpdates: () => service.stopLocationUpdates(),
  };
}

export default WebSocketService;
