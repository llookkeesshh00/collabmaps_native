import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import { useLocation } from '@/app/hooks';
import { locationService } from '@/app/services';
import { Location, SearchedPlace } from '@/app/types';
import { useSearchStore } from '@/app/stores';

// Components
import HomeMap from '@/app/components/Home/HomeMap';
import SearchBar from '@/app/components/Home/SearchBar';
import LocationButton from '@/app/components/Common/LocationButton';

const HomeScreen = () => {
  const mapRef = useRef<MapView>(null);
  const userLocation = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get search state from our Zustand store
  const { 
    selectedPlace, 
    mapMarker,
    setMapMarker,
    clearSelection 
  } = useSearchStore();

  // Automatically go to user location when it becomes available
  // Only if no place is selected
  useEffect(() => {
    if (userLocation?.currentLocation && !selectedPlace && !mapMarker) {
      animateToLocation(userLocation.currentLocation);
    }
  }, [userLocation?.currentLocation, selectedPlace, mapMarker]);

  const animateToLocation = (location: Location) => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const goToMyLocation = async () => {
    setIsLoading(true);
    try {
      // First try to use the cached location
      let location: Location | null = userLocation?.currentLocation || null;
      
      // If no cached location, request a new one
      if (!location) {
        location = await locationService.getCurrentLocation();
      }
      
      if (!location) {
        Alert.alert("Location unavailable", "Unable to access your current location. Please check your permissions.");
        return;
      }
      
      animateToLocation(location);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Something went wrong while accessing your location.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle place selection from search
  const handlePlaceSelected = (place: SearchedPlace) => {
    if (place.location) {
      // Animate map to the selected place
      mapRef.current?.animateToRegion({
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
        // Set the map marker for the selected place
      setMapMarker(place);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <HomeMap 
        mapRef={mapRef}
        marker={mapMarker}
      />
      
      <SearchBar onPlaceSelected={handlePlaceSelected} />
      
      <LocationButton 
        onPress={goToMyLocation}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default HomeScreen;
