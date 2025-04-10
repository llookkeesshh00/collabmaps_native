import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import SearchBar from '../components/SearchBar';
import DirectionsSheet from '../components/DirectionsSheet';
import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@env';
import polyline from '@mapbox/polyline';

type LatLng = {
  latitude: number;
  longitude: number;
};

const HomepageMap = () => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [placeDetails, setPlaceDetails] = useState<{ name: string; address: string } | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | undefined>(undefined);
  const [routeDuration, setRouteDuration] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log("Location permission denied");
          setUserLocation(null); // Use default location if permission denied
        } else {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          if (location?.coords) {
            const coords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setUserLocation(coords);
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                ...coords,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }, 1000);
            }
          }
        }
      } catch (error) {
        console.error("Location setup error:", error);
      }
    })();
  }, []);

  const fetchRoute = async (origin: LatLng, destination: LatLng) => {
    try {
      const apiKey = GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        Alert.alert("Configuration Error", "Google Maps API key is missing.");
        return;
      }
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;
      const response = await axios.get(url);
      if (response.data.routes.length) {
        const encodedPolyline = response.data.routes[0].overview_polyline.points;
        const decodedCoords = polyline.decode(encodedPolyline).map(([latitude, longitude]) => ({
          latitude,
          longitude,
        }));
        const leg = response.data.routes[0].legs[0];
        setRouteCoords(decodedCoords);
        setRouteDistance(leg.distance.text);
        setRouteDuration(leg.duration.text);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const handleSearchSelect = (details: any) => {
    const { lat, lng } = details.geometry.location;
    const newDestination = { latitude: lat, longitude: lng };
    setDestination(newDestination);
    setPlaceDetails({
      name: details.name || "Unknown Place",
      address: details.formatted_address || "No address available",
    });
    setIsSheetOpen(true);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...newDestination,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 800);
    }
    if (userLocation) {
      fetchRoute(userLocation, newDestination);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <SearchBar onPlaceSelected={handleSearchSelect} />
      </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        initialRegion={
          userLocation
            ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : {
                latitude: 37.78825,
                longitude: -122.4324,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
        }
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {destination && <Marker coordinate={destination} title="Destination" />}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>
      <DirectionsSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setRouteCoords([]);
          setRouteDistance(undefined);
          setRouteDuration(undefined);
        }}
        placeDetails={placeDetails}
        distance={routeDistance}
        duration={routeDuration}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  searchBarContainer: {
    height: 60, // Fixed height for the search bar
    width: '100%',
    backgroundColor: 'white', // Optional, makes it visually distinct
    zIndex: 1, // Ensures it appears above the map
  },
  map: {
    flex: 1, // Takes up the remaining space below the search bar
  },
});

export default HomepageMap;