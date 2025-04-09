import React, { useRef, useState } from 'react';
import { StyleSheet, View, Dimensions, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import SearchBar from '../components/SearchBar';
import Constants from 'expo-constants';

type LatLng = {
  latitude: number;
  longitude: number;
};

const HomepageMap = () => {
  const mapRef = useRef<MapView>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

  const origin: LatLng = {
    latitude: 37.78825,
    longitude: -122.4324,
  };

  const API_KEY = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;

  const fetchDirections = async (destinationCoords: { lat: number; lng: number }) => {
    if (!API_KEY) {
      console.error("Google Maps API key is missing.");
      Alert.alert("Error", "Google Maps API key is missing.");
      return;
    }

    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destStr = `${destinationCoords.lat},${destinationCoords.lng}`;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);
      } else {
        const errorMsg = data.error_message || "No directions found";
        console.error("Directions API error:", errorMsg);
        Alert.alert("Directions Error", errorMsg);
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
      Alert.alert("Network Error", "Failed to fetch directions. Check your internet connection.");
    }
  };

  const decodePolyline = (t: string): LatLng[] => {
    const points: LatLng[] = [];
    let index = 0,
      lat = 0,
      lng = 0;

    while (index < t.length) {
      let b, shift = 0,
        result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const handlePlaceSelected = (details: any) => {
    try {
      const { lat, lng } = details.geometry.location;
      const selectedDestination: LatLng = { latitude: lat, longitude: lng };

      setDestination(selectedDestination);
      fetchDirections({ lat, lng });

      mapRef.current?.animateToRegion({
        ...selectedDestination,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.error("Invalid place details:", error);
      Alert.alert("Selection Error", "Could not retrieve location details.");
    }
  };

  return (
    <View style={styles.container}>
      <SearchBar onPlaceSelected={handlePlaceSelected} />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        initialRegion={{
          ...origin,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={origin} title="You" />
        {destination && <Marker coordinate={destination} title="Destination" />}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>
    </View>
  );
};

export default HomepageMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
