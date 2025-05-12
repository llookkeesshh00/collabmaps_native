import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Keyboard } from 'react-native';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useSearchStore } from '@/app/stores';
import { SearchedPlace, GooglePlaceData, GooglePlaceDetail } from '@/app/types';

interface SearchBarProps {
  onPlaceSelected?: (place: SearchedPlace) => void;
}

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || '';

const SearchBar = ({ onPlaceSelected }: SearchBarProps) => {
  const {
    recentSearches,
    selectedPlace,
    isSearchActive,
    setSearchActive,
    addPlaceFromGoogleData,
    clearSelection,
  } = useSearchStore();
    const searchRef = useRef<GooglePlacesAutocompleteRef>(null);

  useEffect(() => {
    // Update search text when selected place changes
    if (selectedPlace && searchRef.current) {
      searchRef.current.setAddressText(selectedPlace.name);
    }
  }, [selectedPlace]);
  
  const handleClearSearch = () => {
    if (searchRef.current) {
      searchRef.current.setAddressText(''); // Set text to empty string
      searchRef.current.clear(); // Clear internally stored values
    }
    clearSelection(); // Clear selected place in store
    Keyboard.dismiss();
  };

  const handlePlaceSelect = (data: GooglePlaceData, details: GooglePlaceDetail | null) => {
    // Add the selected place to recent searches
    if (data) {
      addPlaceFromGoogleData(data, details || undefined);
      
      // Notify parent component if callback provided
      if (onPlaceSelected && details) {
        const place: SearchedPlace = {
          placeId: data.place_id,
          name: data.structured_formatting?.main_text || data.description.split(',')[0],
          address: data.structured_formatting?.secondary_text || 
                  data.description.split(',').slice(1).join(',').trim(),
          location: details ? {
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng
          } : undefined,
          timestamp: Date.now()
        };
        onPlaceSelected(place);
      }
      
      // Hide keyboard and collapse search UI if needed
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        ref={searchRef}
        placeholder="Search here"
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
        }}
        fetchDetails={true}        onPress={handlePlaceSelect}
        onFail={(error) => console.error('GooglePlacesAutocomplete error:', error)}
        textInputProps={{
          onFocus: () => setSearchActive(true),
          clearButtonMode: 'never',
        }}
        enablePoweredByContainer={false}
        predefinedPlaces={[]}
        predefinedPlacesAlwaysVisible={true}
        styles={{
          container: styles.searchContainer,
          textInput: styles.textInput,
          listView: styles.listView,
          row: styles.row,
          separator: styles.separator,
          description: styles.description,
          poweredContainer: styles.hidden,
        }}        renderRightButton={() => (
          selectedPlace ? (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <Ionicons name="close-circle" size={20} color="#777" />
            </TouchableOpacity>
          ) : <View style={{width: 0}} />
        )}        listEmptyComponent={
          <View style={styles.recentSearchesContainer}>
            <Text style={styles.recentTitle}>Recent</Text>
            {recentSearches.map((place) => (
              <TouchableOpacity
                key={place.placeId}
                style={styles.recentItem}
                onPress={() => {
                  if (searchRef.current) {
                    searchRef.current.setAddressText(place.name);
                  }
                  addPlaceFromGoogleData({
                    place_id: place.placeId,
                    description: place.name,
                    structured_formatting: {
                      main_text: place.name,
                      secondary_text: place.address,
                    }
                  }, place.location ? {
                    geometry: {
                      location: {
                        lat: place.location.latitude,
                        lng: place.location.longitude,
                      }
                    },
                    formatted_address: place.address,
                    name: place.name,
                  } : undefined);
                }}
              >
                <Ionicons name="time-outline" size={24} color="#777" style={styles.recentIcon} />
                <View style={styles.recentTextContainer}>
                  <Text style={styles.recentItemTitle} numberOfLines={1}>{place.name}</Text>
                  <Text style={styles.recentItemSubtitle} numberOfLines={1}>{place.address}</Text>
                </View>
                <Text style={styles.distance}>
                  {place.location ? `${(place.location.latitude).toFixed(2)} km` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50, // For status bar
  },
  searchContainer: {
    flex: 0,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingHorizontal: 15,
  },  textInput: {
    height: 50,
    color: '#000',
    fontSize: 16,
    backgroundColor: '#f2f2f2',
    paddingLeft: 15, // Standard padding, no back button
    paddingRight: 35, // Make room for the clear button
    borderRadius: 30,
  },
  listView: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginTop: 5,
  },
  row: {
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#f2f2f2',
  },
  description: {
    fontSize: 15,
  },  hidden: {
    display: 'none',
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 15,
    zIndex: 10,
  },
  recentSearchesContainer: {
    paddingVertical: 10,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    marginHorizontal: 15,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  recentIcon: {
    marginRight: 15,
  },
  recentTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  recentItemTitle: {
    fontSize: 16,
    color: '#000',
  },
  recentItemSubtitle: {
    fontSize: 14,
    color: '#777',
  },
  distance: {
    fontSize: 14,
    color: '#777',
    width: 60,
    textAlign: 'right',
  },
});

export default SearchBar;
