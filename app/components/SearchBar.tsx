import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { View, StyleSheet, Dimensions, Text, Image } from 'react-native';
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
          language: "en",
          components: "country:ind",
          types: "geocode",
        }}
        styles={{
          textInputContainer:
          {
            backgroundColor: "white",
            borderRadius: 20,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          textInput: {
            fontSize: 16,
            borderRadius: 20,
          },
          listView: {

            backgroundColor: "white",
            borderRadius: 10,
            gap: 12,
            marginTop: 10,
            marginBottom: 10,
            elevation: 2, // For Android
            shadowColor: "#000", // For iOS
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
        }}

        renderRow={(data) => (
          <View className='flex flex-row items-center justify-center space-x-28' >
            <Image source={require("../../assets/images/location.png")} style={{ marginRight: 10 , width: 20, height: 20 }} />
            <View>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#524b4a ", }} >{data.structured_formatting.main_text}</Text>
              <Text style={{ fontSize: 10, color: "#a29694", }}>{data.structured_formatting.secondary_text}</Text>
            </View>
          </View>
        )}
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
    borderRadius: 25,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    fontSize: 16,
  },
});

export default SearchBar;
