import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Alert, View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import SearchBar from '../components/SearchBar';
import Modal from 'react-native-modal';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Hard-code the API key directly to avoid runtime issues
const GOOGLE_MAPS_API_KEY = 'AIzaSyAR8Sxn_UmTfySxL4DT1RefR8j-QYGntpA';
//defining a structure for an object 
type LatLng = {
  latitude: number;
  longitude: number;
};

const HomepageMap = () => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<{ name: string; address: string; photoUrls?: string[]; placeId?: string; } | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize the initial region to prevent re-renders
  const initialRegion = useMemo(() => ({
    latitude: userLocation?.latitude ?? 37.78825,
    longitude: userLocation?.longitude ?? -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }), [userLocation]);

  const requestLocation = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false); // Ensure loading is set to false after completion
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

  const getPlacePhoto = useCallback(async (placeId: string, nameFromAutocomplete: string) => {
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
      name: nameFromAutocomplete,
      address: formattedAddress,
      photoUrls,
      placeId,
    });
  }, []);

  const handleSearchSelect = useCallback((details: any) => {
    // Handle the clear button press
    if (!details) {
      setDestination(null);
      setIsModalVisible(false);
      return;
    }

    const { lat, lng } = details.geometry.location;
    const placeId = details.place_id;
    const name = details.name;

    const newDestination = { latitude: lat, longitude: lng };
    setDestination(newDestination);
    setIsModalVisible(true);

    mapRef.current?.animateToRegion({
      ...newDestination,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 800);

    getPlacePhoto(placeId, name);
  }, [getPlacePhoto]);

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
        dlat: destination?.latitude,
        dlng: destination?.longitude,
        address : placeDetails?.address,
        name : placeDetails?.name,
        placeId: placeDetails?.placeId,
      },
    });
  }, [destination, placeDetails]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" style="dark" />
      <View style={styles.container}>
        <View style={styles.searchBarContainer}>
          <SearchBar 
            onPlaceSelected={handleSearchSelect} 
            // No longer passing query or setQuery
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
            <Marker coordinate={destination}>
              <Callout>
                <Text>Destination</Text>
              </Callout>
            </Marker>
          )}
        </MapView>
        
        <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocationPress}>
          <Image source={require('../../assets/images/my-location.png')} style={styles.asideIcon} />
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
                      params: {                        slat: userLocation.latitude,
                        slng: userLocation.longitude,
                        dlat: destination.latitude,
                        dlng: destination.longitude,
                        from: "homepage",
                      },
                    })

                  }
                }
                }
              >
                <Image source={require('../../assets/images/directions.png')} style={styles.asideIcon} />
                <Text style={styles.optionText}>Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optButton}
                onPress={() => {handleCollabPress()}}
              >
                <Image source={require('../../assets/images/coolab.png')} style={styles.asideIcon} />
                <Text style={styles.optionText}>Collab</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: '#EEEEEE' }]}
                onPress={() => { setIsModalVisible(false); }}
              >
                <Image source={require('../../assets/images/close.png')} style={styles.asideIcon} />
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
  container: { flex: 1, flexDirection: 'column' },  searchBarContainer: {
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
