import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useWebSocket } from '../services/WebSocketService';
import * as Location from 'expo-location';

export default function JoinPage() {
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
    const webSocketService = useWebSocket();

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required to join a room');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        })();
    }, []);

    const handleJoin = async () => {
        if (!roomId || !username) {
            Alert.alert("Error", "Please enter both Room ID and Username");
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
            webSocketService.onMessage('JOIN_SUCCESS', (payload) => {
                const { roomId, userId, users, destination } = payload;
                
                // Store the room and user IDs
                webSocketService.setRoomAndUserIds(roomId, userId);

                
                // Navigate to live map
                router.push({
                    pathname: '/livemap',
                    params: {
                        username,
                        roomId,
                        slat: userLocation.latitude.toString(),
                        slng: userLocation.longitude.toString(),
                        dlat: destination.latitude.toString(),
                        dlng: destination.longitude.toString(),
                    }
                });
            });
            
            webSocketService.onMessage('ERROR', (payload) => {
                Alert.alert("Error", payload.message || "Failed to join room");
            });
            
            // Try to join the room
            webSocketService.joinRoom(roomId, username, userLocation);
            
        } catch (error) {
            console.error("Failed to join room:", error);
            Alert.alert("Error", "Failed to connect to server");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Join a Collaborative Trip</Text>
            
            <View style={styles.formContainer}>
                <Text style={styles.label}>Room ID</Text>
                <TextInput 
                    style={styles.input} 
                    value={roomId} 
                    onChangeText={setRoomId}
                    placeholder="Enter the Room ID"
                />
                
                <Text style={styles.label}>Your Name</Text>
                <TextInput 
                    style={styles.input} 
                    value={username} 
                    onChangeText={setUsername}
                    placeholder="Enter your name"
                />

                <TouchableOpacity 
                    style={[styles.button, !userLocation && styles.disabledButton]}
                    onPress={handleJoin}
                    disabled={!userLocation}
                >
                    <Text style={styles.buttonText}>
                        {userLocation ? 'Join Room' : 'Getting location...'}
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
        backgroundColor: 'white',
    },
    title: {
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 20,
        marginTop: 40,
        textAlign: 'center'
    },
    formContainer: {
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
        marginBottom: 5,
        fontWeight: 'bold',
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
