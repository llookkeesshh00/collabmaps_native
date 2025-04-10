import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { View, Text, Image, StyleSheet } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '@env';

type Props = {
  onPlaceSelected: (details: any) => void;
};

const SearchBar = ({ onPlaceSelected }: Props) => {
  return (
    <GooglePlacesAutocomplete
      placeholder="Search for a place"
      minLength={2} // Ensures more input before triggering
      fetchDetails={true}
      onPress={(data, details = null) => {
        onPlaceSelected(details);
      }}
      query={{
        key: GOOGLE_MAPS_API_KEY,
        language: 'en',
        // types: 'geocode', // Removed for broader suggestions
        // components: 'country:in', // Optional: remove for broader global results
      }}
      enablePoweredByContainer={false}
      styles={{
        container: {
          flex: 0,
          zIndex: 100,
        },
        textInputContainer: {
          backgroundColor: '#fff',
          borderRadius: 20,
          paddingHorizontal: 10,
        },
        textInput: {
          fontSize: 16,
          borderRadius: 20,
        },
        listView: {
          backgroundColor: '#fff',
          borderRadius: 10,
          marginTop: 5,
          elevation: 3,
          zIndex: 1000,
        },
      }}
      renderRow={(data) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
          <Image
            source={require('../../assets/images/location.png')}
            style={{ width: 20, height: 20, marginRight: 8 }}
          />
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>
              {data.structured_formatting.main_text}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {data.structured_formatting.secondary_text}
            </Text>
          </View>
        </View>
      )}
    />
  );
};

export default SearchBar;
