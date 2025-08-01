import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Alert, View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import SearchBar from '../components/SearchBar';
import Modal from 'react-native-modal';
import { ScrollView } from 'react-native';
import { useRouter } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { MapPin, Navigation, Users, X } from 'lucide-react-native';

// Hard-code the API key directly to avoid runtime issues
const GOOGLE_MAPS_API_KEY = Constants.expoConfig!.extra!.googleMapsApiKey;
//defining a structure for an object 
type LatLng = {
  latitude: number;
  longitude: number;
};

const HomepageMap = () => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<{ name: string; address: string; photoUrls?: string[]; placeId?: string; } | null>(null);
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Memoize the initial region to prevent re-renders
  const initialRegion = useMemo(() => ({
    latitude: userLocation?.latitude ?? 37.78825,
    longitude: userLocation?.longitude ?? -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }), [userLocation]);

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log("Location permission denied");
        Alert.alert("Permission Denied", "Location permission is required to show your position on the map.");
        setUserLocation(null); // Explicitly set to null
        return; // Exit if permission is denied
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (location?.coords) {
        // This function now ONLY sets state. No side-effects.
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error("Location setup error:", error);
      Alert.alert("Location Error", "Could not fetch your current location. Please ensure location services are enabled.");
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // NEW useEffect to handle the map animation side-effect
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [userLocation]); // This runs only when userLocation changes

  const getPlacePhoto = useCallback(async (placeId: string, name: string) => {
    // This function now works as originally intended
    const apiKey = GOOGLE_MAPS_API_KEY;
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,photos&key=${apiKey}`;

    const res = await fetch(detailsUrl);
    const data = await res.json();

    const formattedAddress = data.result?.formatted_address || "No address found";
    const photos = data.result?.photos || [];

    const photoUrls = photos.slice(0, 5).map((photo: any) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
    );

    setPlaceDetails({
      name: name,
      address: formattedAddress,
      photoUrls,
      placeId,
    });
  }, []);

  const handleSearchSelect = useCallback((details: any) => {
    setDestination(details);

    if (details) {
      setQuery(details.name);
      setPlaceDetails({
        name: details.name,
        address: details.formatted_address,
        placeId: details.place_id
      });
      getPlacePhoto(details.place_id, details.name);
      
      const { lat, lng } = details.geometry.location;
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      setQuery('');
      setPlaceDetails(null);
    }
  }, [getPlacePhoto]);

  useEffect(() => {
    setIsModalVisible(!!destination);
  }, [destination]);

  const handleMyLocationPress = useCallback(async () => {
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
  }, []);

  const handleCollabPress = useCallback(async () => {
    // Close the modal before navigation
    setIsModalVisible(false);
    router.push({
      pathname: '/collab',
      params: {
        dlat: destination?.geometry.location.lat,
        dlng: destination?.geometry.location.lng,
        address : placeDetails?.address,
        name : placeDetails?.name,
        placeId: placeDetails?.placeId,
      },
    });
  }, [destination, placeDetails, router]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar translucent style="dark" />
      <View style={styles.container}>
        <View style={styles.searchBarContainer}>
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            onPlaceSelected={handleSearchSelect}
          />
        </View>

        {/* --- MAPVIEW --- */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider="google"
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          mapPadding={{ top: 0, right: 0, bottom: 100, left: 0 }}
        >
          {destination && (
            <Marker
              coordinate={{
                latitude: destination.geometry.location.lat,
                longitude: destination.geometry.location.lng,
              }}
              title={destination.name}
            />
          )}
        </MapView>
        
        <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocationPress}>
          <MapPin size={24} color="#333" />
        </TouchableOpacity>

        {/* --- RESTORING MODAL --- */}
        <Modal
          isVisible={isModalVisible}
          onBackdropPress={() => setIsModalVisible(false)}
          style={styles.bottomModal}
          backdropOpacity={0}
        >
          <View style={styles.modalContent}>
            {placeDetails && (
              <View>
                <Text style={styles.modalTitle}>{placeDetails.name}</Text>
                <Text style={styles.modalAddress}>{placeDetails.address}</Text>
                {placeDetails.photoUrls && placeDetails.photoUrls.length > 0 && (
                  <View style={{ height: 150, marginBottom: 10 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {placeDetails.photoUrls.map((url, index) => (
                        <Image
                          key={index}
                          source={{ uri: url }}
                          style={{
                            width: 250,
                            height: 150,
                            marginRight: 10,
                            borderRadius: 10,
                          }}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  setIsModalVisible(false);
                  if (userLocation && destination) {
                    router.push({
                      pathname: '/route',
                      params: {
                        slat: userLocation.latitude,
                        slng: userLocation.longitude,
                        dlat: destination.geometry.location.lat,
                        dlng: destination.geometry.location.lng,
                        from: "homepage",
                      },
                    })
                  }
                }}
              >
                <Navigation size={24} color="white" />
                <Text style={styles.optionText}>Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optButton}
                onPress={() => { handleCollabPress() }}
              >
                <Users size={24} color="white" />
                <Text style={styles.optionText}>Collab</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: '#EEEEEE' }]}
                onPress={() => { setIsModalVisible(false); }}
              >
                <X size={24} color="black" />
                <Text style={[styles.optionText, { color: 'black' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column' },
  searchBarContainer: {
    position: 'absolute',
    top: 20,
    left: 15,
    right: 15,
    zIndex: 999,
    elevation: 999, // for Android
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  map: { flex: 1 },
  myLocationButton: {
    position: 'absolute',
    top: 88,
    right: 15,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
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
  asideIcon: {
    width: 24,
    height: 24,
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  optionButton: {
    marginTop: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2D79F4',
    borderRadius: 40,
  },
  optButton: {
    marginTop: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'green',
    borderRadius: 40,
  },  optionText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
});

export default HomepageMap;
