import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MapMarker as MapMarkerType } from '@/app/types';
import PlaceMarker from '../Map/PlaceMarker';

interface HomeMapProps {
  mapRef: React.RefObject<MapView>;
  marker?: MapMarkerType | null;
}

const HomeMap = ({ mapRef, marker }: HomeMapProps): JSX.Element => {
  
  return (
    <View style={styles.container}>      
    <MapView
        ref={mapRef}
        style={styles.map}       
        provider='google'
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false} // We use our custom button
        showsCompass={false}
        showsIndoors={false}
        showsTraffic={false}
        showsBuildings={false}
        showsScale={false}
        showsIndoorLevelPicker={false}      
      >
        {marker && (
          <PlaceMarker
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default HomeMap;
