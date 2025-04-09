import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { View, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

type Props = {
  onPlaceSelected: (details: any) => void;
};

const SearchBar = ({ onPlaceSelected }: Props) => {
  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder="Search for a place"
        fetchDetails={true}
        onPress={(data, details = null) => {
          if (details) {
            onPlaceSelected(details);
          }
        }}
        query={{
          key: Constants.expoConfig?.android?.config?.googleMaps?.apiKey,
          language: 'en',
        }}
        styles={{
          textInput: styles.input,
        }}
        enablePoweredByContainer={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    zIndex: 999,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    fontSize: 16,
  },
});

export default SearchBar;
