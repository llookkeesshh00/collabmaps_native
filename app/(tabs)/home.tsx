import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import SearchBar from '../components/SearchBar';
import Constants from 'expo-constants';

type LatLng = {
  latitude: number;
  longitude: number;
};

const HomepageMap = () => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); // NEW

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log("Location permission denied");
          setUserLocation(null);
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
            mapRef.current?.animateToRegion({
              ...coords,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Location setup error:", error);
      }
    })();
  }, []);

  const handleSearchSelect = (details: any) => {
    const { lat, lng } = details.geometry.location;
    const newDestination = { latitude: lat, longitude: lng };
    setDestination(newDestination);
    mapRef.current?.animateToRegion({
      ...newDestination,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 800);
  };

  const handleMyLocationPress = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (location?.coords && mapRef.current) {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(coords);
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Unable to get your location.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <SearchBar onPlaceSelected={handleSearchSelect} query={searchQuery} setQuery={setSearchQuery} />
      </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        initialRegion={{
          latitude: userLocation?.latitude ?? 37.78825,
          longitude: userLocation?.longitude ?? -122.4324,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        mapPadding={{ top: 0, right: 0, bottom: 100, left: 0 }}
      >
        {destination && <Marker coordinate={destination} title="Destination" />}
      </MapView>

      <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocationPress}>
        <Image source={require('../../assets/images/my-location.png')} style={styles.myLocationIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column' },
  searchBarContainer: {
    position: 'absolute',
    top: 20,
    left: 15,
    right: 15,
    zIndex: 10,
    alignItems: 'center',
  },
  map: { flex: 1 },
  myLocationButton: {
    position: 'absolute',
    top: 88,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  myLocationIcon: {
    width: 24,
    height: 24,
  },
});

export default HomepageMap;
