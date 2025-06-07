import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAR8Sxn_UmTfySxL4DT1RefR8j-QYGntpA'; // Ensure this key is correct and enabled

type Props = {
  onPlaceSelected: (details: {
    geometry: { location: { lat: number; lng: number } };
    name: string;
    formatted_address: string;
    place_id: string;
  }) => void;
};

const SearchBar = ({ onPlaceSelected }: Props) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const getPlacePredictions = async (text: string) => {
    if (text.length < 3) {
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

  const getPlaceDetails = useCallback(async (placeId: string, description: string) => {
    setQuery(description); // Show full text in input
    setPredictions([]); // Hide list
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

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    if (query) {
      debounceTimeout.current = setTimeout(() => {
        getPlacePredictions(query);
      }, 500); // Debounce for 500ms
    }
  }, [query]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        placeholder="Search for a location"
        value={query}
        onChangeText={setQuery}
      />
      {loading && <ActivityIndicator style={styles.loader} />}
      {predictions.length > 0 && (
        <View style={styles.listView}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => getPlaceDetails(item.place_id, item.description)}>
                <Text>{item.description}</Text>
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
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loader: {
    position: 'absolute',
    right: 15,
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default SearchBar;
