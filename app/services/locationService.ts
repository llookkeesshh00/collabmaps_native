import * as ExpoLocation from 'expo-location';
import { EventEmitter } from 'events';
import { Location } from '../types';

class LocationService extends EventEmitter {
  private watchId: ExpoLocation.LocationSubscription | null = null;
  private currentLocation: Location | null = null;
  private isTrackingActive: boolean = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  private updateIntervalMs: number = 10000; // 10 seconds default

  constructor() {
    super();
  }

  /**
   * Request location permissions from the user
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Get the current location once
   */
  async getCurrentLocation(): Promise<Location | null> {
    try {
      const hasPermissions = await this.checkLocationPermissions();
      
      if (!hasPermissions) {
        const granted = await this.requestLocationPermissions();
        if (!granted) {
          throw new Error('Location permission not granted');
        }
      }

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });

      this.currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async checkLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  /**
   * Start tracking location with continuous updates
   * @param intervalMs How often to update location in milliseconds
   */
  async startLocationTracking(intervalMs: number = 10000): Promise<boolean> {
    if (this.isTrackingActive) {
      return true; // Already tracking
    }

    try {
      const hasPermissions = await this.checkLocationPermissions();
      
      if (!hasPermissions) {
        const granted = await this.requestLocationPermissions();
        if (!granted) {
          throw new Error('Location permission not granted');
        }
      }

      this.updateIntervalMs = intervalMs;
      
      // First get location immediately
      await this.getCurrentLocation();
      
      // Then start watching for changes
      this.watchId = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.Balanced,
          distanceInterval: 10, // Minimum change in meters
          timeInterval: intervalMs,
        },
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          this.currentLocation = location;
          this.emit('locationUpdate', location);
        }
      );

      this.isTrackingActive = true;
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  /**
   * Stop tracking location
   */
  stopLocationTracking(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    this.isTrackingActive = false;
  }

  /**
   * Get the last known location
   */
  getLastKnownLocation(): Location | null {
    return this.currentLocation;
  }

  /**
   * Check if location tracking is currently active
   */
  isTracking(): boolean {
    return this.isTrackingActive;
  }

  /**
   * Get estimated distance between two locations in meters
   */
  getDistanceBetweenPoints(start: Location, end: Location): number {
    // Haversine formula to calculate distance between two points
    const R = 6371e3; // metres
    const φ1 = (start.latitude * Math.PI) / 180;
    const φ2 = (end.latitude * Math.PI) / 180;
    const Δφ = ((end.latitude - start.latitude) * Math.PI) / 180;
    const Δλ = ((end.longitude - start.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

// Export a singleton instance
export const locationService = new LocationService();