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
import { placeService } from '@/app/services';
import { SearchedPlace, GooglePlaceData, GooglePlaceDetail } from '@/app/types';
import RecentSearchItem from '../Search/RecentSearchItem';
import SuggestionItem from '../Search/SuggestionItem';

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
    };    const handleInputChange = (text: string) => {
        setInputEmpty(text.trim() === '');
    };
    
    const handleRecentItemPress = (item: SearchedPlace) => {
        if (!item.location) return; // Ensure location exists for recent searches

        searchRef.current?.setAddressText(item.name);
        
        // When selecting recent search, either use existing details or fetch fresh ones
        if (item.photoUrls && item.formattedAddress) {
            // If we already have detailed data, reuse it
            const placeData = placeService.createPlaceDataFromSearchedPlace(item);
            const placeDetails = placeService.createPlaceDetailFromSearchedPlace(item);
            
            if (placeDetails) {
                addPlaceFromGoogleData(placeData, placeDetails);
            }
        } else {
            // If we don't have detailed data, fetch it again
            placeService.fetchPlaceDetails(item.placeId)
                .then(details => {
                    if (details) {
                        const placeData = placeService.createPlaceDataFromSearchedPlace(item);
                        addPlaceFromGoogleData(placeData, details);
                    }
                })
                .catch(error => {
                    console.error('Error fetching place details:', error);
                    // Fall back to basic info if fetch fails
                    if (item.location) {
                        const placeData = placeService.createPlaceDataFromSearchedPlace(item);
                        const placeDetails = placeService.createPlaceDetailFromSearchedPlace(item);
                        
                        if (placeDetails) {
                            addPlaceFromGoogleData(placeData, placeDetails);
                        }
                    }
                });
        }

        if (onPlaceSelected) {
            onPlaceSelected(item);
        }

        Keyboard.dismiss();
        setIsFocused(false);
    };
    
    const renderRecentItem = ({ item }: { item: SearchedPlace }) => (
        <RecentSearchItem item={item} onPress={handleRecentItemPress} />
    );const renderSuggestion = (row: GooglePlaceData, index: number) => (
        <SuggestionItem 
            suggestion={row} 
            onPress={() => {
                if (searchRef.current) {
                    // First set the address text to show in the input
                    searchRef.current.setAddressText(row.description);
                    
                    // Fetch place details
                    placeService.fetchPlaceDetails(row.place_id)
                        .then(details => {
                            if (details) {
                                handlePlaceSelect(row, details);
                            }
                        })
                        .catch(error => console.error('Error fetching place details:', error));
                }
            }} 
        />
    );

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
    },    // Removed styles that were moved to the individual components
});

export default SearchBar;