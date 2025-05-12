import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services/locationService';
import { Location } from '../types';
import { useUserStore } from '../stores/userStore';

interface UseLocationOptions {
  autoStartTracking?: boolean;
  updateInterval?: number;
  onLocationUpdate?: (location: Location) => void;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { 
    autoStartTracking = false, 
    updateInterval = 10000, 
    onLocationUpdate 
  } = options;
  
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'pending'>('pending');
  const updateUserLocation = useUserStore(state => state.updateLocation);

  // Handler for location updates
  const handleLocationUpdate = useCallback((location: Location) => {
    setCurrentLocation(location);
    
    // Pass location to optional callback
    if (onLocationUpdate) {
      onLocationUpdate(location);
    }
    
    // Update user location in the store
    updateUserLocation(location);
  }, [onLocationUpdate, updateUserLocation]);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const hasPermission = await locationService.checkLocationPermissions();
        setPermissionStatus(hasPermission ? 'granted' : 'denied');
        
        // Auto-start tracking if permissions are granted and the option is enabled
        if (hasPermission && autoStartTracking) {
          startTracking();
        }
      } catch (err) {
        setError('Failed to check location permissions');
        setPermissionStatus('denied');
      }
    };
    
    checkPermissions();
    
    // Set up event listener for location updates
    locationService.on('locationUpdate', handleLocationUpdate);
    
    // Clean up event listener when component unmounts
    return () => {
      locationService.off('locationUpdate', handleLocationUpdate);
      stopTracking();
    };
  }, [autoStartTracking, handleLocationUpdate]);

  // Start location tracking
  const startTracking = async () => {
    try {
      setError(null);
      
      // Request permissions if not already granted
      if (permissionStatus !== 'granted') {
        const granted = await locationService.requestLocationPermissions();
        setPermissionStatus(granted ? 'granted' : 'denied');
        
        if (!granted) {
          setError('Location permission denied');
          return false;
        }
      }
      
      // Get current location immediately
      const initialLocation = await locationService.getCurrentLocation();
      if (initialLocation) {
        setCurrentLocation(initialLocation);
        
        // Pass location to optional callback
        if (onLocationUpdate) {
          onLocationUpdate(initialLocation);
        }
        
        // Update user location in the store
        updateUserLocation(initialLocation);
      }
      
      // Start continuous tracking
      const success = await locationService.startLocationTracking(updateInterval);
      setIsTracking(success);
      return success;
    } catch (err) {
      setError('Failed to start location tracking');
      setIsTracking(false);
      return false;
    }
  };

  // Stop location tracking
  const stopTracking = () => {
    locationService.stopLocationTracking();
    setIsTracking(false);
  };

  // Request location permissions
  const requestPermissions = async () => {
    try {
      const granted = await locationService.requestLocationPermissions();
      setPermissionStatus(granted ? 'granted' : 'denied');
      return granted;
    } catch (err) {
      setError('Failed to request location permissions');
      return false;
    }
  };

  // Get current location once
  const getCurrentLocation = async () => {
    try {
      setError(null);
      
      // Request permissions if not already granted
      if (permissionStatus !== 'granted') {
        const granted = await requestPermissions();
        if (!granted) {
          setError('Location permission denied');
          return null;
        }
      }
      
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        
        // Pass location to optional callback
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
        
        // Update user location in the store
        updateUserLocation(location);
      }
      
      return location;
    } catch (err) {
      setError('Failed to get current location');
      return null;
    }
  };

  return {
    currentLocation,
    isTracking,
    permissionStatus,
    error,
    startTracking,
    stopTracking,
    requestPermissions,
    getCurrentLocation,
  };
}