import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import SearchBar from '../components/SearchBar';
import Constants from 'expo-constants';
import Modal from 'react-native-modal';
import axios from 'axios'
import { ScrollView } from 'react-native';
import { router } from 'expo-router';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;
//defining a structure for an object 
type LatLng = {
  latitude: number;
  longitude: number;
};

const HomepageMap = () => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<{ name: string; address: string; photoUrls?: string[]; } | null>(null);

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

  const handleSearchSelect = ({ data, details }: any) => {
    if (!details) return;

    const { lat, lng } = details.geometry.location;
    const name = data?.structured_formatting?.main_text || details.name || "Unknown";
    const placeId = data.place_id;

    const newDestination = { latitude: lat, longitude: lng };
    setDestination(newDestination);
    setIsModalVisible(true);

    mapRef.current?.animateToRegion({
      ...newDestination,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 800);

    getPlacePhoto(placeId, name);
  };

  const getPlacePhoto = async (placeId: string, nameFromAutocomplete: string) => {
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
    });
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
      {/* this is for */}
      <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocationPress}>
        <Image source={require('../../assets/images/my-location.png')} style={styles.myLocationIcon} />
      </TouchableOpacity>

      {/* Bottom Popup Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setIsModalVisible(false)}
        style={styles.bottomModal}
      >
        <View style={styles.modalContent}>
          {placeDetails && (
            <>
              <Text style={styles.modalTitle}>{placeDetails.name}</Text>
              <Text className='text-gray-600 mb-6'>{placeDetails.address}</Text>
              {placeDetails.photoUrls?.length > 0 && (
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

            </>
          )}

          <View className='flex flex-row justify-between gap-2 '> 
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
                      dlat: destination.latitude,
                      dlng: destination.longitude,
                    },
                  })

              }}
            }
            >
              <Image source={require('../../assets/images/start.png')} style={styles.myLocationIcon} />
              <Text style={styles.optionText}>Start</Text>
            </TouchableOpacity>
          
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                Alert.alert("Option 1", "Do something!");
                setIsModalVisible(false);
              }}
            >
              <Image source={require('../../assets/images/directions.png')} style={styles.myLocationIcon} />
              <Text style={styles.optionText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: '#ccc' }]}
              onPress={() => {setIsModalVisible(false); }}
            >
              <Image source={require('../../assets/images/close.png')} style={styles.myLocationIcon} />
              <Text style={[styles.optionText, { color: 'black' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#2D79F4',
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
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionButton: {
    marginTop: 15,
    display:'flex',
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    gap:5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2D79F4',
    borderRadius: 20,
  },
  optionText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default HomepageMap;
