import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useRoomStore, useUserStore, useChatStore } from '../../stores';
import { locationService } from '../../services/locationService';

export default function RoomScreen() {
  const { roomCode } = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useUserStore();
  const { currentRoom, leaveRoom } = useRoomStore();
  
  // Load room data on mount
  useEffect(() => {
    async function loadRoomData() {
      if (!roomCode) {
        setError('No room code provided');
        setIsLoading(false);
        return;
      }
      
      // Room data is already loaded via socket connection
      setIsLoading(false);
    }
    
    loadRoomData();
    
    // Start location tracking for room
    locationService.startLocationTracking(5000);
    
    // Cleanup on unmount
    return () => {
      locationService.stopLocationTracking();
    };
  }, [roomCode]);  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      // Navigate back to the tabs interface
      router.navigate("/");
    } catch (error) {
      setError('Failed to leave room');
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Loading Room..." }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading room data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !currentRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Error" }} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Failed to load room'}</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: currentRoom.name || "Room",
          headerRight: () => (
            <TouchableOpacity onPress={handleLeaveRoom} style={styles.leaveButton}>
              <Text style={styles.leaveButtonText}>Leave</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.roomCode}>Room Code: {currentRoom.roomCode}</Text>
          <Text style={styles.roomDetails}>
            Mode: {currentRoom.mode} • 
            Created: {new Date(currentRoom.createdAt).toLocaleTimeString()}
          </Text>
        </View>
        
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>Map Interface Coming Soon</Text>
        </View>
        
        <View style={styles.chatPlaceholder}>
          <Text style={styles.placeholderText}>Chat Interface Coming Soon</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginVertical: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roomCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  roomDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  chatPlaceholder: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leaveButton: {
    marginRight: 10,
    padding: 8,
  },
  leaveButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
});
