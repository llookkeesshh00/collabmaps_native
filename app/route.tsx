import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import Constants from 'expo-constants';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;

type LatLng = {
  latitude: number;
  longitude: number;
};

export default function RouteScreen() {
  const { slat, slng, dlat, dlng } = useLocalSearchParams();
  console.log(slat, slng, dlat, dlng )
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

  const source = {
    latitude: parseFloat(slat as string),
    longitude: parseFloat(slng as string),
  };
  const destination = {
    latitude: parseFloat(dlat as string),
    longitude: parseFloat(dlng as string),
  };

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${source.latitude},${source.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await axios.get(url);
        console.log(response)
        const points = polyline.decode(response.data.routes[0].overview_polyline.points);
        const coords = points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
        setRouteCoords(coords);
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    fetchRoute();
  }, []);

  if (!routeCoords.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude: source.latitude,
        longitude: source.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker coordinate={source} title="You" />
      <Marker coordinate={destination} title="Destination" />
      <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="blue" />
    </MapView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
