import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

interface PlaceMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
}

const PlaceMarker = ({ coordinate, title }: PlaceMarkerProps) => {
  return (
    <Marker coordinate={coordinate}>
      <View style={styles.labelContainer}>
        <Text style={styles.labelText} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    backgroundColor: 'white',
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    maxWidth: 160,
  },
  markerIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
});

export default PlaceMarker;
