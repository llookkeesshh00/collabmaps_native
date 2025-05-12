import Constants from "expo-constants";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useEffect, useState } from "react";
import { useLocation } from "@/app/hooks";
import { locationService } from "@/app/services/locationService";
import { Location, SearchedPlace } from "@/app/types";
import { useSearchStore } from "@/app/stores";
import SearchBar from "./SearchBar";

export default function HomeMap(): JSX.Element {
    const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;
    const mapRef = useRef<MapView>(null);
    const userLocation = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    
    // Get search state from our Zustand store
    const { 
        selectedPlace, 
        mapMarker,
        setMapMarker,
        clearSelection 
    } = useSearchStore();
      const goToMyLocation = async () => {
        setIsLoading(true);
        try {
            // First try to use the cached location
            let location: Location | null = userLocation?.currentLocation || null;
            
            // If no cached location, request a new one
            if (!location) {
                location = await locationService.getCurrentLocation();
            }
            
            if (!location) {
                Alert.alert("Location unavailable", "Unable to access your current location. Please check your permissions.");
                return;
            }
            
            mapRef.current?.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        } catch (error) {
            console.error("Error getting location:", error);
            Alert.alert("Error", "Something went wrong while accessing your location.");
        } finally {
            setIsLoading(false);
        }
    };// Handle place selection from search
    const handlePlaceSelected = (place: SearchedPlace) => {
        if (place.location) {
            // Animate map to the selected place
            mapRef.current?.animateToRegion({
                latitude: place.location.latitude,
                longitude: place.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
            
            // Set the map marker for the selected place
            setMapMarker(place);
        }
    };    // Automatically go to user location when it becomes available
    // Only if no place is selected
    useEffect(() => {
        if (userLocation?.currentLocation && !selectedPlace && !mapMarker) {
            mapRef.current?.animateToRegion({
                latitude: userLocation.currentLocation.latitude,
                longitude: userLocation.currentLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        }
    }, [userLocation?.currentLocation, selectedPlace, mapMarker]);return (
        <SafeAreaView style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                provider="google"
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false} // Disable default button
                showsCompass={false}
                showsIndoors={false}
                showsTraffic={false}
                showsBuildings={false}
                showsScale={false}
                showsIndoorLevelPicker={false}
            >
                {mapMarker && (
                    <Marker
                        coordinate={mapMarker.coordinate}
                        title={mapMarker.title}
                        description={mapMarker.description}
                    />
                )}
            </MapView>
            
            {/* Search Bar */}
            <SearchBar onPlaceSelected={handlePlaceSelected} />
            
            {/* My Location Button */}
            <TouchableOpacity 
                style={styles.userLocationButton}
                onPress={goToMyLocation}
                disabled={isLoading}
            >
                <Ionicons 
                    name="locate" 
                    size={24} 
                    color={isLoading ? "#cccccc" : "#0080ff"} 
                />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    userLocationButton: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 10,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 1,
    },
});