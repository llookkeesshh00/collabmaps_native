import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Location } from '../types';
import { apiService } from '../services/apiService';

interface UserState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Authentication methods
  initialize: () => Promise<void>;
  createUser: (displayName: string, location?: Location) => Promise<void>;
  updateLocation: (location: Location) => Promise<void>;
  logout: () => Promise<void>;
  
  // Getters
  getUserId: () => string | null;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,
    initialize: async () => {
    set({ isLoading: true });
    try {
      // Try to get user ID from AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      
      if (userId) {
        try {
          // If user ID exists, attempt to fetch user data from API
          const user = await apiService.getUser(userId);
          
          // Set user data in store and API service
          set({ user, isLoading: false, isInitialized: true });
          apiService.setUserId(userId);
        } catch (apiError) {
          console.warn('Backend might be down, using stored userId to continue:', apiError);
          
          // Create a minimal user object with the stored ID when backend is unavailable
          const fallbackUser: User = {
            id: userId,
            displayName: 'User', // Default display name
          };
          
          // Set fallback user data in store and API service
          set({ user: fallbackUser, isLoading: false, isInitialized: true });
          apiService.setUserId(userId);
        }
      } else {
        // No user found in storage
        set({ isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error('Failed to initialize user:', error);
      set({ 
        error: 'Failed to initialize user', 
        isLoading: false, 
        isInitialized: true 
      });
    }
  },
  
  createUser: async (displayName: string, location?: Location) => {
    set({ isLoading: true, error: null });
    try {
      // Create user via API
      const user = await apiService.createUser(displayName, location);
      
      // Store user ID in AsyncStorage for persistence
      await AsyncStorage.setItem('userId', user.id);
      
      // Update state and API service
      set({ user, isLoading: false });
      apiService.setUserId(user.id);
    } catch (error) {
      console.error('Failed to create user:', error);
      set({ 
        error: 'Failed to create user', 
        isLoading: false 
      });
    }
  },
  
  updateLocation: async (location: Location) => {
    const userId = get().user?.id;
    if (!userId) return;
    
    try {
      const updatedUser = await apiService.updateUserLocation(userId, location);
      set({ user: updatedUser });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  },
  
  logout: async () => {
    try {
      const userId = get().user?.id;
      
      // Remove user ID from AsyncStorage
      await AsyncStorage.removeItem('userId');
      
      // Reset state
      set({ user: null });
      
      // Reset API service
      apiService.setUserId(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  },
  
  getUserId: () => get().user?.id || null,
}));