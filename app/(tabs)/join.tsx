import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { useWebSocket } from '../services/WebSocketService';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

export default function JoinPage() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [serverUrl, setServerUrl] = useState(Constants.expoConfig?.extra?.websocketUrl || 'ws://192.168.1.2:3001');
  const webSocketService = useWebSocket();

  // Store unsub functions to clean up old handlers
  const joinSuccessHandlerRef = useRef<() => void>();
  const errorHandlerRef = useRef<() => void>();

  useEffect(() => {
    // Request location on mount
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to join a room');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();

    // Cleanup message handlers on unmount
    return () => {
      joinSuccessHandlerRef.current?.();
      errorHandlerRef.current?.();
    };
  }, []);

  const handleJoin = async () => {
    if (!roomId || !username) {
      Alert.alert('Error', 'Please enter both Room ID and Username');
      return;
    }

    if (!userLocation) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }

    try {
      // If user changed the server URL, update it
      if (serverUrl !== webSocketService.getServerUrl()) {
        webSocketService.setServerUrl(serverUrl);
      }

      // Only connect if not already connected
      if (!webSocketService.isConnected()) {
        await webSocketService.connect();
      }

      // Remove any existing handlers before setting new ones
      joinSuccessHandlerRef.current?.();
      errorHandlerRef.current?.();

      // Handle successful join
      joinSuccessHandlerRef.current = webSocketService.onMessage('JOIN_SUCCESS', (payload) => {
        const { roomId, userId, destination } = payload;

        if (!roomId || !userId || !destination) {
          Alert.alert('Error', 'Invalid join response from server.');
          return;
        }

        webSocketService.setRoomAndUserIds(roomId, userId);

        // Redirect to livemap with necessary params
        router.push({
          pathname: '/livemap',
          params: {
            username,
            roomId,
            slat: userLocation.latitude.toString(),
            slng: userLocation.longitude.toString(),
            dlat: destination.latitude.toString(),
            dlng: destination.longitude.toString(),
            placeId: payload.placeId || 'default-place-id',
            isJoining: 'true',
          },
        });
      });

      // Handle join error
      errorHandlerRef.current = webSocketService.onMessage('ERROR', (payload) => {
        Alert.alert('Error', payload.message || 'Failed to join room');
      });

      // Send JOIN_ROOM request
      webSocketService.joinRoom(roomId, username, userLocation);
    } catch (error) {
      console.error('Failed to join room:', error);
      Alert.alert(
        'Connection Error',
        `Failed to connect to the server at ${serverUrl}. Please check that the server is running and accessible.`
      );
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

        <View style={styles.advancedToggleContainer}>
          <Text style={styles.advancedToggleText}>Show Advanced Settings</Text>
          <Switch
            value={showAdvanced}
            onValueChange={setShowAdvanced}
            trackColor={{ false: '#767577', true: '#2D79F4' }}
            thumbColor="#f4f3f4"
          />
        </View>

        {showAdvanced && (
          <>
            <Text style={styles.label}>Server URL</Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="WebSocket server URL (e.g., ws://192.168.1.2:3001)"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.helperText}>
              Enter the WebSocket server address of the device that created the room.
            </Text>
          </>
        )}

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
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2D79F4',
    padding: 15,
    borderRadius: 40,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#9BC0F6',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  advancedToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingVertical: 5,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
    marginTop: -15,
  },
});
