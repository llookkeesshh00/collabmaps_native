import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import SearchBar from '../components/SearchBar';
import axios from 'axios';
import Constants from 'expo-constants';
type LatLng = {
  latitude: number;
  longitude: number;
};

const HomepageMap = () => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(true); // 🔹 Loading state

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Please allow location access in settings.");
        setLoading(false); // 🔹 Stop loading if permission denied
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      if (!location) {
        Alert.alert("Location Error", "Failed to get current location. Please enable GPS.");
        setLoading(false);
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

      setLoading(false); // 🔹 Stop loading once location is set
    })();
  }, []);



  // Fetch route coordinates from Google Directions API
  const fetchRoute = async (origin: LatLng, destination: LatLng) => {
    try {
      const apiKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;

      const response = await axios.get(url);
      if (response.data.routes.length) {
        const points = response.data.routes[0].legs[0].steps.map((step: any) => ({
          latitude: step.start_location.lat,
          longitude: step.start_location.lng,
        }));
        setRouteCoords(points);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };
  return (
    <View className="flex-1">
      <SearchBar
        onPlaceSelected={(details) => {
          const { lat, lng } = details.geometry.location;
          setDestination({ latitude: lat, longitude: lng });
          mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }}
      />

      {loading ? ( // 🔹 Show loader while fetching location
        <View className="absolute inset-0 flex items-center justify-center bg-white opacity-75">
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
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
      )}
    </View>
  );
};

export default HomepageMap;
