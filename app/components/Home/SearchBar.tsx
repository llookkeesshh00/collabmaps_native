import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Keyboard,
    FlatList,
    BackHandler,
    Platform,
} from 'react-native';
import {
    GooglePlacesAutocomplete,
    GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
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
        setSearchActive,
        addPlaceFromGoogleData,
        clearSelection,
    } = useSearchStore();

    const searchRef = useRef<GooglePlacesAutocompleteRef>(null);

    // track focus + whether input is empty
    const [isFocused, setIsFocused] = useState(false);
    const [inputEmpty, setInputEmpty] = useState(true);

    useEffect(() => {
        if (selectedPlace && searchRef.current) {
            searchRef.current.setAddressText(selectedPlace.name);
            setInputEmpty(false);
        }
    }, [selectedPlace]);

    // Handle hardware back button press
    useEffect(() => {
        const backHandler = () => {
            if (isFocused) {
                handleClearSearch();
                return true;
            }
            return false;
        };

        if (Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', backHandler);
        }

        return () => {
            if (Platform.OS === 'android') {
                BackHandler.removeEventListener('hardwareBackPress', backHandler);
            }
        };
    }, [isFocused]);

    const handlePlaceSelect = (data: GooglePlaceData, details: GooglePlaceDetail | null) => {
        if (!data || !details) return; // Ensure details are available

        addPlaceFromGoogleData(data, details);

        const place: SearchedPlace = {
            placeId: data.place_id,
            name: data.structured_formatting?.main_text || data.description.split(',')[0],
            address:
                data.structured_formatting?.secondary_text ||
                data.description.split(',').slice(1).join(',').trim(),
            location: {
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
            },
            timestamp: Date.now(),
        };

        if (onPlaceSelected) {
            onPlaceSelected(place);
        }

        Keyboard.dismiss();
        setIsFocused(false);
    };

    const handleClearSearch = () => {
        searchRef.current?.setAddressText('');
        clearSelection();
        setInputEmpty(true);
        setIsFocused(false);
        setSearchActive(false);
        Keyboard.dismiss();
    };

    const handleInputChange = (text: string) => {
        setInputEmpty(text.trim() === '');
    };    const renderRecentItem = ({ item }: { item: SearchedPlace }) => (
        <TouchableOpacity
            style={styles.recentItem}
            onPress={() => {
                if (!item.location) return; // Ensure location exists for recent searches

                searchRef.current?.setAddressText(item.name);
                
                // When selecting recent search, either use existing details or fetch fresh ones
                if (item.photoUrls && item.formattedAddress) {
                    // If we already have detailed data, reuse it
                    addPlaceFromGoogleData(
                        {
                            place_id: item.placeId,
                            description: item.name,
                            structured_formatting: {
                                main_text: item.name,
                                secondary_text: item.address,
                            },
                        },
                        {
                            geometry: {
                                location: {
                                    lat: item.location.latitude,
                                    lng: item.location.longitude,
                                },
                            },
                            formatted_address: item.formattedAddress || item.address,
                            name: item.name,
                            photos: item.photoUrls ? item.photoUrls.map(url => {
                                const photoRef = url.split('photoreference=')[1]?.split('&')[0];
                                return {
                                    photo_reference: photoRef,
                                    height: 400,
                                    width: 400,
                                    html_attributions: []
                                };
                            }) : undefined,
                            rating: item.rating,
                            types: item.placeTypes,
                            price_level: item.priceLevel
                        }
                    );
                } else {
                    // If we don't have detailed data, fetch it again
                    fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.placeId}&fields=geometry,formatted_address,name,photos,types,rating,price_level,international_phone_number,website,opening_hours&key=${GOOGLE_MAPS_API_KEY}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.result) {
                                const details: GooglePlaceDetail = {
                                    geometry: {
                                        location: {
                                            lat: item.location?.latitude || data.result.geometry.location.lat,
                                            lng: item.location?.longitude || data.result.geometry.location.lng,
                                        }
                                    },
                                    formatted_address: data.result.formatted_address,
                                    name: data.result.name,
                                    photos: data.result.photos,
                                    types: data.result.types,
                                    rating: data.result.rating,
                                    price_level: data.result.price_level,
                                    international_phone_number: data.result.international_phone_number,
                                    website: data.result.website,
                                    opening_hours: data.result.opening_hours,
                                };                                        addPlaceFromGoogleData(
                                    {
                                        place_id: item.placeId,
                                        description: item.name,
                                        structured_formatting: {
                                            main_text: item.name,
                                            secondary_text: item.address,
                                        },
                                    },
                                    details
                                );
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching place details:', error);
                            // Fall back to basic info if fetch fails
                            // We can safely use item.location here because we check for its existence at the start of the function
                            if (item.location) {
                                addPlaceFromGoogleData(
                                    {
                                        place_id: item.placeId,
                                        description: item.name,
                                        structured_formatting: {
                                            main_text: item.name,
                                            secondary_text: item.address,
                                        },
                                    },
                                    {
                                        geometry: {
                                            location: {
                                                lat: item.location.latitude,
                                                lng: item.location.longitude,
                                            },
                                        },
                                        formatted_address: item.address,
                                        name: item.name,
                                    }
                                );
                            }
                        });
                }

                if (onPlaceSelected) {
                    onPlaceSelected(item);
                }

                Keyboard.dismiss();
                setIsFocused(false);
            }}
        >
            <Ionicons
                name="time-outline"
                size={22}
                color="#555"
                style={styles.recentIcon}
            />
            <View style={styles.recentTextContainer}>
                <Text style={styles.recentItemTitle} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={styles.recentItemSubtitle} numberOfLines={1}>
                    {item.address}
                </Text>
            </View>
        </TouchableOpacity>
    );    const renderSuggestion = (row: GooglePlaceData, index: number) => {
        const mainText =
            row.structured_formatting?.main_text ||
            row.description.split(',')[0];
        const secondaryText =
            row.structured_formatting?.secondary_text ||
            row.description.split(',').slice(1).join(',').trim();
        return (
            <View style={styles.suggestionItemWrapper}>
                <TouchableOpacity 
                    style={styles.suggestionItem}
                    onPress={() => {
                        // Handle the onPress directly here since we can't access the internal methods
                        // This way we manually trigger the same functionality
                        if (searchRef.current) {
                            // First set the address text to show in the input
                            searchRef.current.setAddressText(row.description);
                            // Then fetch details and handle selection
                            // Include additional fields for place details
                            fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${row.place_id}&fields=geometry,formatted_address,name,photos,types,rating,price_level,international_phone_number,website,opening_hours&key=${GOOGLE_MAPS_API_KEY}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (data.result) {
                                        const details: GooglePlaceDetail = {
                                            geometry: {
                                                location: {
                                                    lat: data.result.geometry.location.lat,
                                                    lng: data.result.geometry.location.lng,
                                                }
                                            },
                                            formatted_address: data.result.formatted_address,
                                            name: data.result.name,
                                            photos: data.result.photos,
                                            types: data.result.types,
                                            rating: data.result.rating,
                                            price_level: data.result.price_level,
                                            international_phone_number: data.result.international_phone_number,
                                            website: data.result.website,
                                            opening_hours: data.result.opening_hours,
                                        };
                                        handlePlaceSelect(row, details);
                                    }
                                })
                                .catch(error => console.error('Error fetching place details:', error));
                        }
                    }}
                >
                    <Ionicons
                        name="location-outline"
                        size={22}
                        color="#555"
                        style={styles.suggestionIcon}
                    />
                    <View style={styles.suggestionTextContainer}>
                        <Text
                            style={styles.suggestionPrimary}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {mainText}
                        </Text>

                        {secondaryText.length > 0 && (
                            <Text
                                style={styles.suggestionSecondary}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {secondaryText}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <GooglePlacesAutocomplete
                ref={searchRef}
                placeholder="Search here"
                query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
                fetchDetails
                onPress={handlePlaceSelect}
                onFail={(err) => console.error('Places error:', err)}
                enablePoweredByContainer={false}
                styles={{
                    container: styles.searchContainer,
                    textInput: styles.textInput,
                    listView: styles.listView,
                    row: {
                        width: '100%',
                        padding: 0,
                        margin: 0,
                    },
                    separator: { height: 0 },
                    description: { width: '100%' },
                    poweredContainer: {
                        marginHorizontal: 15,
                        paddingVertical: 2,
                        borderTopWidth: 1,
                        borderTopColor: '#e0e0e0',
                        width: 'auto',
                    },
                }}
                textInputProps={{
                    onFocus: () => {
                        setIsFocused(true);
                        setSearchActive(true);
                    },
                    onBlur: () => {
                        setSearchActive(false);
                    },
                    onChangeText: handleInputChange,
                    placeholderTextColor: '#999',
                }}
                renderRow={renderSuggestion}
                renderRightButton={() => (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={inputEmpty ? undefined : handleClearSearch}
                    >
                        <Ionicons
                            name={inputEmpty ? 'search-outline' : 'close-circle'}
                            size={20}
                            color="#777"
                        />
                    </TouchableOpacity>
                )}
            />

            {/* Recent Searches Panel */}
            {isFocused && inputEmpty && recentSearches.length > 0 && (
                <FlatList
                    data={recentSearches}
                    keyExtractor={(item) => item.placeId}
                    renderItem={renderRecentItem}
                    style={styles.recentSearchesContainer}
                    ListHeaderComponent={
                        <Text style={styles.recentTitle}>Recent Searches</Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    searchContainer: {
        backgroundColor: 'transparent',
        paddingHorizontal: 15,
        borderBottomWidth: 0,
    },
    textInput: {
        height: 50,
        backgroundColor: '#f2f2f2',
        paddingLeft: 15,
        paddingRight: 40,
        borderRadius: 30,
        fontSize: 16,
        color: '#000',
    },
    listView: {
        marginHorizontal: 15,
        backgroundColor: '#fff',
        borderRadius: 5,
        elevation: 2,
        marginTop: 5,
        overflow: 'hidden',
    },
    clearButton: {
        position: 'absolute',
        right: 25,
        top: 15,
    },
    recentSearchesContainer: {
        backgroundColor: '#f8f8f8',
        marginHorizontal: 15,
        marginTop: 10,
        borderRadius: 5,
        elevation: 2,
        paddingBottom: 8,
    },
    recentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        margin: 12,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#f8f8f8',
        width: '100%',
    },
    recentIcon: { marginRight: 12 },
    recentTextContainer: {
        flex: 1,
        width: '100%',
        overflow: 'hidden',
    },
    recentItemTitle: {
        fontSize: 16,
        color: '#000',
        width: '100%',
    },
    recentItemSubtitle: {
        fontSize: 14,
        color: '#555',
        width: '100%',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fff',
        width: '100%',
    },
    suggestionIcon: {
        marginRight: 12,
    },
    suggestionTextContainer: {
        flex: 1,
        width: '100%',
        overflow: 'hidden',
    },
    suggestionPrimary: {
        fontSize: 16,
        color: '#000',
        flexShrink: 1,
        width: '100%',
    },
    suggestionSecondary: {
        fontSize: 14,
        color: '#555',
        flexShrink: 1,
        width: '100%',
    },
    suggestionItemWrapper: {
        width: '100%',
        overflow: 'hidden',
    },
});

export default SearchBar;