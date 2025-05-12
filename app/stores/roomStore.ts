import { create } from 'zustand';
import { Room, RoomMembership, Location, CommonPoint, RoomMode } from '../types';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socketService';
import { useUserStore } from './userStore';

interface RoomState {
  currentRoom: Room | null;
  memberships: RoomMembership[];
  isLoading: boolean;
  error: string | null;
  
  // Room actions
  createRoom: (
    name: string,
    mode: RoomMode,
    commonPoint: CommonPoint,
    polyline: string,
    deviceType?: string
  ) => Promise<Room | null>;
  
  joinRoom: (
    roomCode: string,
    polyline?: string,
    deviceType?: string
  ) => Promise<Room | null>;
  
  leaveRoom: () => Promise<void>;
  
  clearRoom: () => void;
  
  // Membership actions
  updateMembership: (membership: RoomMembership) => void;
  updateMemberships: (memberships: RoomMembership[]) => void;
  removeMembership: (userId: string) => void;
  
  // Route actions
  updateMemberLocation: (userId: string, location: Location) => void;
  updateMemberPolyline: (userId: string, polyline: string) => void;
  
  // Getters
  getCreatorId: () => string | undefined;
  isCreator: () => boolean;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  currentRoom: null,
  memberships: [],
  isLoading: false,
  error: null,
  
  createRoom: async (name, mode, commonPoint, polyline, deviceType) => {
    set({ isLoading: true, error: null });
    
    try {
      const userId = useUserStore.getState().getUserId();
      if (!userId) {
        set({ error: 'User not authenticated', isLoading: false });
        return null;
      }
      
      const result = await apiService.createRoom(
        name,
        mode,
        commonPoint,
        userId,
        polyline,
        deviceType
      );
      
      set({
        currentRoom: result.room,
        memberships: [result.membership],
        isLoading: false
      });
      
      // Connect to socket for real-time updates
      socketService.connect(userId, result.room.roomCode);
      
      return result.room;
    } catch (error) {
      console.error('Failed to create room:', error);
      set({ error: 'Failed to create room', isLoading: false });
      return null;
    }
  },
  
  joinRoom: async (roomCode, polyline, deviceType) => {
    set({ isLoading: true, error: null });
    
    try {
      const userId = useUserStore.getState().getUserId();
      if (!userId) {
        set({ error: 'User not authenticated', isLoading: false });
        return null;
      }
      
      const result = await apiService.joinRoom(
        roomCode,
        userId,
        polyline,
        deviceType
      );
      
      set({
        currentRoom: result.room,
        memberships: [result.membership],
        isLoading: false
      });
      
      // Connect to socket for real-time updates
      socketService.connect(userId, result.room.roomCode);
      
      return result.room;
    } catch (error) {
      console.error('Failed to join room:', error);
      set({ error: 'Failed to join room', isLoading: false });
      return null;
    }
  },
  
  leaveRoom: async () => {
    try {
      // Use socket to leave the room
      socketService.leaveRoom();
      
      // Disconnect socket
      socketService.disconnectSocket();
      
      // Clear room state
      set({ currentRoom: null, memberships: [], error: null });
    } catch (error) {
      console.error('Failed to leave room:', error);
      set({ error: 'Failed to leave room' });
    }
  },
  
  clearRoom: () => {
    set({ currentRoom: null, memberships: [], error: null });
  },
  
  updateMembership: (membership: RoomMembership) => {
    set(state => {
      const existingIndex = state.memberships.findIndex(m => m.userId === membership.userId);
      
      if (existingIndex >= 0) {
        // Update existing membership
        const updatedMemberships = [...state.memberships];
        updatedMemberships[existingIndex] = membership;
        return { memberships: updatedMemberships };
      } else {
        // Add new membership
        return { memberships: [...state.memberships, membership] };
      }
    });
  },
  
  updateMemberships: (memberships: RoomMembership[]) => {
    set({ memberships });
  },
  
  removeMembership: (userId: string) => {
    set(state => ({
      memberships: state.memberships.filter(m => m.userId !== userId)
    }));
  },
  
  updateMemberLocation: (userId: string, location: Location) => {
    set(state => {
      const existingIndex = state.memberships.findIndex(m => m.userId === userId);
      
      if (existingIndex >= 0) {
        const updatedMemberships = [...state.memberships];
        const updatedMembership = {
          ...updatedMemberships[existingIndex],
          // Update the from or to based on room mode
          ...(state.currentRoom?.mode === 'FROM' 
            ? { from: location } 
            : { to: location })
        };
        
        updatedMemberships[existingIndex] = updatedMembership;
        return { memberships: updatedMemberships };
      }
      
      return state;
    });
  },
  
  updateMemberPolyline: (userId: string, polyline: string) => {
    set(state => {
      const existingIndex = state.memberships.findIndex(m => m.userId === userId);
      
      if (existingIndex >= 0) {
        const updatedMemberships = [...state.memberships];
        updatedMemberships[existingIndex] = {
          ...updatedMemberships[existingIndex],
          polyline
        };
        
        return { memberships: updatedMemberships };
      }
      
      return state;
    });
  },
  
  getCreatorId: () => get().currentRoom?.creatorId,
  
  isCreator: () => {
    const creatorId = get().currentRoom?.creatorId;
    const userId = useUserStore.getState().getUserId();
    return !!creatorId && creatorId === userId;
  }
}));