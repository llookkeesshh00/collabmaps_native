import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useWebSocket } from './services/WebSocketService';
import * as Location from 'expo-location';

export default function CollabPage() {
    const { name, address, dlat, dlng, placeId } = useLocalSearchParams();
    const [username, setUsername] = useState('');
    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
    const webSocketService = useWebSocket();

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required to create a room');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        })();
    }, []);

    const handleCreateRoom = async () => {
        if (!username) {
            Alert.alert("Please enter your name");
            return;
        }
        
        if (!userLocation) {
            Alert.alert("Error", "Unable to get your location. Please try again.");
            return;
        }
        
        try {
            // Connect to WebSocket
            await webSocketService.connect();
            
            // Set up message handlers
            webSocketService.onMessage('CREATED_ROOM', (payload) => {
                const { roomId, userId } = payload;
                
                // Store the room and user IDs
                webSocketService.setRoomAndUserIds(roomId, userId);
                
                // Navigate to live map page
                router.push({
                    pathname: '/livemap',
                    params: {
                        username,
                        slat: userLocation.latitude.toString(),
                        slng: userLocation.longitude.toString(),
                        dlat: dlat as string,
                        dlng: dlng as string,
                        placeId: placeId as string,
                    }
                });
            });
            
            webSocketService.onMessage('ERROR', (payload) => {
                Alert.alert("Error", payload.message || "Failed to create room");
            });
            
            // Create the room with current location
            webSocketService.createRoom(
                username,
                userLocation,
                {
                    latitude: parseFloat(dlat as string),
                    longitude: parseFloat(dlng as string)
                },
                placeId as string,
            );
            
        } catch (error) {
            console.error("Failed to create room:", error);
            Alert.alert("Error", "Failed to connect to server");
        }
    };
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Start a Collaborative Trip</Text>
            
            <View style={styles.detailsContainer}>
                <Text style={styles.label}>Destination</Text>
                <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={name as string}
                    editable={false}
                />
                
                <Text style={styles.label}>Address</Text>
                <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={address as string}
                    editable={false}
                    multiline
                />
                
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    value={username}
                    onChangeText={setUsername}
                />

                <TouchableOpacity 
                    style={[styles.button, !userLocation && styles.disabledButton]}
                    onPress={handleCreateRoom}
                    disabled={!userLocation}
                >
                    <Text style={styles.buttonText}>
                        {userLocation ? 'Create Room' : 'Getting location...'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1,
        padding: 20,
        backgroundColor: '#fff'
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 20,
        marginTop: 40
    },
    detailsContainer: {
        backgroundColor: '#f8f8f8',
        padding: 20,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
        color: '#333'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
        backgroundColor: '#fff'
    },
    disabledInput: {
        backgroundColor: '#f0f0f0',
        color: '#666'
    },
    button: {
        backgroundColor: '#2D79F4',
        padding: 15,
        borderRadius: 40,
        alignItems: 'center',
        marginTop: 10
    },
    disabledButton: {
        backgroundColor: '#9BC0F6',
    },
    buttonText: { 
        color: 'white', 
        fontWeight: 'bold',
        fontSize: 16
    }
});
