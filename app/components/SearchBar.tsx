import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { View, Text, Image, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

type Props = {
  onPlaceSelected: (details: any) => void;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
};

export type SearchBarRef = {
  clearSearch: () => void;
};

const SearchBar = forwardRef<SearchBarRef, Props>(({ onPlaceSelected }, ref) => {
  const googleRef = useRef<any>(null);
  const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;

  useImperativeHandle(ref, () => ({
    clearSearch: () => {
      googleRef.current?.clear();
    },
  }));

  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key is not set');
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <GooglePlacesAutocomplete
        ref={googleRef}
        placeholder="Search for a location"
        minLength={2}
        fetchDetails
        onPress={(data, details = null) => onPlaceSelected({ data, details })}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
          components: 'country:in'
        }}
        enablePoweredByContainer={false}
        styles={{
          container: { width: '100%' },
          textInputContainer: {
            backgroundColor: '#fff',
            borderRadius: 10,
            height: 48,
            width: '100%',
            paddingHorizontal: 15,
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          },
          textInput: {
            fontSize: 16,
            color: '#333',
            paddingVertical: 10,
            margin: 0,
            backgroundColor: '#fff',
            borderRadius: 10,
            height: 48,
          },
          listView: {
            backgroundColor: '#fff',
            borderRadius: 10,
            marginTop: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
          },
          row: {
            flexDirection: 'row',
            padding: 12,
            alignItems: 'center',
          },
          separator: {
            height: 1,
            backgroundColor: '#eee',
          },
        }}
        renderRow={(data) => {
          const mainText = data.structured_formatting.main_text;
          const secondaryText = data.structured_formatting.secondary_text;
        
          const truncatedMainText = mainText.length > 35 ? `${mainText.slice(0, 30)}...` : mainText;
          const truncatedSecondaryText = secondaryText.length > 70 ? `${secondaryText.slice(0, 40)}...` : secondaryText;
        
          return (
            <View style={styles.suggestionRow}>
              <Image source={require('../../assets/images/location.png')} style={styles.locationIcon} />
              <View style={styles.textContainer}>
                <Text style={styles.mainText}>{truncatedMainText}</Text>
                <Text style={styles.secondaryText}>{truncatedSecondaryText}</Text>
              </View>
            </View>
          );
        }}
        
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 1000,
    width: '100%',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '100%',
  },
  textContainer: {
    flex: 1,
  },
  locationIcon: {
    width: 25,
    height: 25,
    marginRight: 10,
    tintColor: '#007AFF',
  },
  mainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  secondaryText: {
    fontSize: 12,
    color: '#555',
  },
});

export default SearchBar;
