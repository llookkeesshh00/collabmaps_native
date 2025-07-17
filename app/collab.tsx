import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useWebSocket } from './services/WebSocketService';
import * as Location from 'expo-location';

export default function CollabPage() {
  const { name, address, dlat, dlng, placeId } = useLocalSearchParams();
  const [username, setUsername] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const webSocketService = useWebSocket();

  // Refs to store unsubscribe handlers
  const createdHandlerRef = useRef<(() => void) | null>(null);
  const errorHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Request location permission on mount
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to create a room');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();

    // Set up event handlers for room creation
    createdHandlerRef.current = webSocketService.onMessage('CREATED_ROOM', (payload) => {
      const { roomId } = payload;
      
      // Get the userId from the WebSocketService
      const { userId } = webSocketService.getRoomAndUserIds() || {};
      
      if (!roomId) {
        Alert.alert('Error', 'Invalid response from server.');
        return;
      }
      
      // Store room ID (userId should already be stored by USER_ID_ASSIGNED)
      if (userId) {
        webSocketService.setRoomAndUserIds(roomId, userId);
      }

      // Navigate to livemap
      router.push({
        pathname: '/livemap',
        params: {
          username,
          roomId,
          slat: userLocation?.latitude.toString() || "0",
          slng: userLocation?.longitude.toString() || "0",
          dlat: dlat as string,
          dlng: dlng as string,
        }
      });
    });
    
    // Add a specific handler for USER_ID_ASSIGNED
    const userIdHandler = webSocketService.onMessage('USER_ID_ASSIGNED', (payload) => {
      const { userId } = payload;
      if (userId) {
        // The room ID might be assigned later with CREATED_ROOM
        webSocketService.setRoomAndUserIds(webSocketService.getRoomAndUserIds()?.roomId || '', userId);
      }
    });

    // Handle any errors from server
    errorHandlerRef.current = webSocketService.onMessage('ERROR', (payload) => {
      Alert.alert('Error', payload.message || 'Failed to create room');
    });

    // Cleanup WebSocket message listeners on unmount
    return () => {
      createdHandlerRef.current?.();
      errorHandlerRef.current?.();
      userIdHandler?.();
    };
  }, [dlat, dlng, userLocation?.latitude, userLocation?.longitude, username, webSocketService]);

  const handleCreateRoom = async () => {
    if (!username) {
      Alert.alert('Please enter your name');
      return;
    }

    if (!userLocation) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }

    try {
      // Only connect if not already connected
      if (!webSocketService.isConnected()) {
        await webSocketService.connect();
      }

      // Remove previous handlers if any
      createdHandlerRef.current?.();
      errorHandlerRef.current?.();

      // Store the roomId received from CREATED_ROOM event
      let receivedRoomId: string | null = null;

      // Handle successful room creation
      createdHandlerRef.current = webSocketService.onMessage('CREATED_ROOM', (payload) => {
        // Extract roomId from the payload
        receivedRoomId = payload.roomId;
        
        // Store the room details that we've received
        if (receivedRoomId) {
          const userId = webSocketService.getRoomAndUserIds()?.userId;
          
          // If we already have a userId, we can navigate immediately
          if (userId) {
            webSocketService.setRoomAndUserIds(receivedRoomId, userId);
            navigateToLiveMap(receivedRoomId);
          }
        }
      });

      // Add handler for USER_ID_ASSIGNED - this might come after CREATED_ROOM
      const userIdHandler = webSocketService.onMessage('USER_ID_ASSIGNED', (payload) => {
        const userId = payload.userId;
        
        if (userId) {
          if (receivedRoomId) {
            // If we already have a roomId, we can navigate now
            webSocketService.setRoomAndUserIds(receivedRoomId, userId);
            navigateToLiveMap(receivedRoomId);
          } else {
            // Just store the userId for now
            webSocketService.setRoomAndUserIds('', userId);
          }
        }
      });

      // Helper function to navigate to LiveMap
      const navigateToLiveMap = (roomId: string) => {
        router.push({
          pathname: '/livemap',
          params: {
            username,
            roomId,
            slat: userLocation.latitude.toString(),
            slng: userLocation.longitude.toString(),
            dlat: dlat as string,
            dlng: dlng as string,
          }
        });
      };

      // Handle any errors from server
      errorHandlerRef.current = webSocketService.onMessage('ERROR', (payload) => {
        Alert.alert('Error', payload.message || 'Failed to create room');
      });

      // Send create room request
      webSocketService.createRoom(
        username,
        userLocation,
        {
          latitude: parseFloat(dlat as string),
          longitude: parseFloat(dlng as string)
        },
        placeId as string
      );

      // Clean up on component unmount or when navigating away
      return () => {
        createdHandlerRef.current?.();
        errorHandlerRef.current?.();
        userIdHandler?.(); // Clean up USER_ID_ASSIGNED handler
      };

    } catch (error) {
      console.error('Failed to create room:', error);
      Alert.alert('Connection Error', 'Failed to connect to the server. Please check your network or server status.');
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
    shadowOffset: { width: 0, height: 2 },
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
