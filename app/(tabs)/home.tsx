import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import SearchBar from '../components/SearchBar';

type LatLng = {
  latitude: number;
  longitude: number;
};

const HomepageMap = () => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

  useEffect(() => {
    (async () => {
      // Request Location Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Please allow location access in settings.");
        return;
      }

      // Get Current Location
      let location = await Location.getCurrentPositionAsync({});
      if (!location) {
        Alert.alert("Location Error", "Failed to get current location. Please enable GPS.");
        return;
      }

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Center map on user location
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  return (
    <View className="flex-1">
      <SearchBar onPlaceSelected={(details) => {
        const { lat, lng } = details.geometry.location;
        setDestination({ latitude: lat, longitude: lng });
      }} />

      <MapView
        ref={mapRef}
        style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
        provider="google"
        initialRegion={{
          latitude: userLocation?.latitude || 37.78825,
          longitude: userLocation?.longitude || -122.4324,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {userLocation && <Marker coordinate={userLocation} title="You" />}
        {destination && <Marker coordinate={destination} title="Destination" />}
        {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />}
      </MapView>
    </View>
  );
};

export default HomepageMap;
