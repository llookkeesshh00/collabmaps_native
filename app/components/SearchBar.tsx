import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAR8Sxn_UmTfySxL4DT1RefR8j-QYGntpA'; // Ensure this key is correct and enabled

type Props = {
  query: string;
  onQueryChange: (text: string) => void;
  onPlaceSelected: (details: {
    geometry: { location: { lat: number; lng: number } };
    name: string;
    formatted_address: string;
    place_id: string;
  } | null) => void; // Allow null to signal a clear event
};

const SearchBar = ({ query, onQueryChange, onPlaceSelected }: Props) => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const justSelected = useRef(false); // Flag to prevent re-fetching

  const getPlacePredictions = async (text: string) => {
    if (text.length < 2) { // Start searching at 2 characters
      setPredictions([]);
      return;
    }
    setLoading(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`;
      const response = await axios.get(url);
      setPredictions(response.data.predictions || []);
    } catch (error) {
      console.error('Error fetching place predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceDetails = useCallback(async (placeId: string) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address,place_id&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await axios.get(url);
      if (response.data.result) {
        onPlaceSelected(response.data.result);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  }, [onPlaceSelected]);
  
  const handlePressRow = (placeId: string, description: string) => {
    justSelected.current = true;
    setPredictions([]); // Hide list immediately on press
    onQueryChange(description);
    getPlaceDetails(placeId);
  };

  const handleClear = () => {
    onQueryChange('');
    onPlaceSelected(null);
    setPredictions([]);
  };

  useEffect(() => {
    // If a place was just selected, don't re-fetch
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (query.length > 2) {
      debounceTimeout.current = setTimeout(() => getPlacePredictions(query), 300);
    } else {
      setPredictions([]);
    }
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          placeholder="Search for a location"
          value={query}
          onChangeText={onQueryChange} // Controlled by parent
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Image source={require('../../assets/images/close.png')} style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>
      {loading && <ActivityIndicator style={styles.loader} />}
      {predictions.length > 0 && (
        <View style={styles.listView}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => handlePressRow(item.place_id, item.description)}>
                <Image source={require('../../assets/images/location.png')} style={styles.locationIcon} />
                <Text style={styles.suggestionText}>{item.description}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
    fontSize: 16,
  },
  clearButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    width: 16,
    height: 16,
    tintColor: '#888'
  },
  loader: {
    position: 'absolute',
    right: 50, // Adjusted to make space for clear button
    top: 14,
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
    maxHeight: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#555',
  },
  suggestionText: {
    flex: 1,
  }
});

export default SearchBar;
