import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Image, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import Constants from 'expo-constants';
import Modal from 'react-native-modal'; // You need to install this package

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;

type LatLng = {
  latitude: number;
  longitude: number;
};

type RouteInfo = {
  coords: LatLng[];
  summary: string;
  duration: number;
  distance: number,
};

export default function RouteScreen() {
  const { username, slat, slng, dlat, dlng, placeId, from } = useLocalSearchParams();
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('bike'); // default to bike
  const [modeRouteDetails, setModeRouteDetails] = useState<RouteInfo | null>(null);


  const source = {
    latitude: parseFloat(slat as string),
    longitude: parseFloat(slng as string),
  };
  const destination = {
    latitude: parseFloat(dlat as string),
    longitude: parseFloat(dlng as string),
  };

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const googleMode = 'driving'
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${source.latitude},${source.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${googleMode}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await axios.get(url);

        const routeList: RouteInfo[] = response.data.routes.map((route: any) => {
          const points = polyline.decode(route.overview_polyline.points);
          const coords = points.map(([lat, lng]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          }));
          return {
            coords,
            summary: route.summary,
            duration: route.legs[0].duration.value,
          };
        });

        // Sort by duration (ascending) and take the best 3
        const topRoutes = routeList.sort((a, b) => a.duration - b.duration).slice(0, 3);
        setRoutes(topRoutes);
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    fetchRoutes();
  }, []);

  if (!routes.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const getData = async (mode: string) => {
    let googleMode = '';

    switch (mode) {
      case 'bike':
        googleMode = 'bicycling';
        break;
      case 'car':
        googleMode = 'driving';
        break;
      case 'train':
        googleMode = 'transit';
        break;
      case 'walk':
        googleMode = 'walking';
        break;
      default:
        googleMode = 'driving';
    }

    setSelectedMode(mode); // set selected mode

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${source.latitude},${source.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${googleMode}&alternatives=false&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await axios.get(url);

      const route = response.data.routes[0];

      if (route) {
        const points = polyline.decode(route.overview_polyline.points);
        const coords = points.map(([lat, lng]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        }));

        const routeInfo: RouteInfo = {
          coords,
          summary: route.summary,
          duration: route.legs[0].duration.value,
          distance: route.legs[0].distance.value,
        };

        setModeRouteDetails(routeInfo);
        //note moderoutedetails contains bike ,car,walk specific detials 

      }
    } catch (error) {
      console.error('Error fetching mode-specific data:', error);
    }
  };
  const handleRoute =() => {
    const routeData = modeRouteDetails || selectedRoute;
    if (!routeData) return;
  
    const encodedCoords = JSON.stringify(routeData.coords);
  
    const commonParams = {
      username,
      slat: slat as string,
      slng: slng as string,
      dlat: dlat as string,
      dlng: dlng as string,
      placeId: placeId as string,
      points: encodedCoords,
      duration: routeData.duration.toString(),
      distance: routeData.distance?.toString() || "0",
      mode: selectedMode,
    };
  
    setModalVisible(false);
    if(from === 'livemap') {
        router.push({
          pathname: '/livemap',
          params: commonParams,
        });
    }
    else{
      console.log('navigation under implementation');
    };
  }
;
  

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFillObject} initialRegion={{ latitude: source.latitude, longitude: source.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }} >
        <Marker coordinate={source}>
          <View style={{ width: 50, height: 40 }}>
            <Image
              source={require('../assets/images/current.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        </Marker>

        <Marker coordinate={destination}>
          <View style={{ width: 50, height: 30 }}>
            <Image
              source={require('../assets/images/destination.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        </Marker>

        {/* Render all alternate routes first */}
        {routes.map((route, index) => {
          const midPointIndex = Math.floor(route.coords.length / 2);
          const midPoint = route.coords[midPointIndex];

          return (
            <React.Fragment key={`route-${index}`}>
              {/* Border Polyline (background stroke) */}
              {/* Border Polyline (thicker, behind) */}
              <Polyline
                coordinates={route.coords}
                strokeWidth={index === 0 ? 10 : 7}
                strokeColor={index === 0 ? "blue" : "#00A8DC"}
                zIndex={index === 0 ? 2 : 1}
              />

              {/* Main Polyline (thinner, on top of border) */}
              <Polyline
                coordinates={route.coords}
                strokeWidth={index === 0 ? 7 : 4}
                strokeColor={index === 0 ? "#4F7BFF" : "#D0EDFB"}
                zIndex={index === 0 ? 3 : 2}
              />


              {/* Invisible Marker for interaction */}
              <Marker
                coordinate={midPoint}

                onPress={async () => {
                  setSelectedRoute(route);
                  setSelectedMode('bike');
                  await getData('bike');
                  setModalVisible(true);
                }}
              />
            </React.Fragment>

          );
        })}
      </MapView>

      {/* Modal to show selected route details */}
      <Modal isVisible={modalVisible} onBackdropPress={() => setModalVisible(false)} style={styles.bottomModal} backdropOpacity={0}>
        <View style={styles.modalContent}>
          {selectedRoute && (
            <>
              <Text style={styles.modalTitle}>Trip Summary</Text>
              <View className='flex flex-row gap-4 justify-between items-center'>
                <TouchableOpacity style={[styles.opbutton, selectedMode === 'bike' && styles.selectedModeButton]} onPress={() => { getData("bike") }}>
                  <Image source={require('../assets/images/bike.png')} />

                </TouchableOpacity>
                <TouchableOpacity style={[styles.opbutton, selectedMode === 'car' && styles.selectedModeButton]} onPress={() => { getData("car") }}>
                  <Image source={require('../assets/images/car.png')} />

                </TouchableOpacity>
                <TouchableOpacity style={[styles.opbutton, selectedMode === 'train' && styles.selectedModeButton]} onPress={() => { getData("train") }}>
                  <Image source={require('../assets/images/train.png')} />

                </TouchableOpacity>
                <TouchableOpacity style={[styles.opbutton, selectedMode === 'walk' && styles.selectedModeButton]} onPress={() => { getData("walk") }}>
                  <Image source={require('../assets/images/walk.png')} />
                </TouchableOpacity>

              </View>
              <View className='border-t-2 border-gray-200  mt-4 mb-4 p-4'>
                {modeRouteDetails && (
                  <View className='flex flex-row  gap-2 '>
                    <View className='flex flex-col justify-between items-center'>
                      <Text style={{ fontSize: 26, color: '#FF4D00' }}>{(modeRouteDetails.duration / 60).toFixed(1)} </Text>
                      <Text style={{ color: '#FF4D00' }}>min</Text>
                    </View>

                    <View className=' flex flex-col items-start justify-center '>
                      <Text style={{ fontWeight: 'bold', marginLeft: 4 }}>{selectedMode.toLocaleUpperCase()}</Text>
                      <Text> {selectedRoute.summary}</Text>
                      <Text style={{ color: '#2D79F4', marginLeft: 3 }}>{(modeRouteDetails.distance / 1000).toFixed(1)} km</Text>
                    </View>


                  </View>
                )}
              </View>

              <View className='flex flex-row gap-5 justify-center items-center'>
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={() => {
                    handleRoute();
                  }}
                >
                  <Image source={require('../assets/images/start.png')} style={styles.myLocationIcon} />
                  <Text style={styles.optionText}>{from === 'livemap' ? 'Select Route' : 'Start'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.optionButton, { backgroundColor: '#EEEEEE' }]} onPress={() => { setModalVisible(false) }}     >
                  <Image source={require('../assets/images/close.png')} style={styles.myLocationIcon} />
                  <Text style={[styles.optionText, { color: 'black' }]}>Cancel</Text>
                </TouchableOpacity>

              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  myLocationIcon: {
    width: 24,
    height: 24,

  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedModeButton: {
    borderRadius: 40,
    padding: 5,
    backgroundColor: '#A0F1F9',
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
    marginTop: 2,
    padding: 10
  },

  optionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  opbutton: {
    backgroundColor: '#EEEEEE',
    borderRadius: 30,
    padding: 20,
    height: 60,
    width: 60,
    display: 'flex',
    justifyContent: 'center',
    alignItems: "center"
  },
  opbutton1: {
    backgroundColor: '#EEEEEE',
    borderRadius: 30,
    padding: 20,
    height: 40,
    width: 40,
    display: 'flex',
    justifyContent: 'center',
    alignItems: "center"
  }
});
