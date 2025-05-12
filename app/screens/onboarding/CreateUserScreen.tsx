import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores';
import { Location as LocationType } from '../../types';
import * as Location from 'expo-location';

export default function CreateUserScreen() {  const [displayName, setDisplayName] = useState('');
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const router = useRouter();
  
  const { createUser, isLoading, error, user } = useUserStore();

  // Check for location permission on initial load
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)/home');
    }
  }, [user]);

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setIsLocationPermissionGranted(true);
        getCurrentLocation();
      } else {
        setIsLocationPermissionGranted(false);
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use this app properly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  // Handle user creation
  const handleCreateUser = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    try {
      await createUser(displayName.trim(), currentLocation || undefined);
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'Failed to create user. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to CollabMaps</Text>
        <Text style={styles.subtitle}>Set up your profile to get started</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your display name"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!isLoading}
            autoCapitalize="none"
            maxLength={30}
          />
        </View>

        <View style={styles.locationSection}>
          <Text style={styles.locationLabel}>
            Location Status: {isLocationPermissionGranted ? 'Granted' : 'Not Granted'}
          </Text>
          
          {!isLocationPermissionGranted && (
            <TouchableOpacity 
              style={styles.locationButton} 
              onPress={requestLocationPermission}
            >
              <Text style={styles.locationButtonText}>
                Enable Location
              </Text>
            </TouchableOpacity>
          )}
          
          {currentLocation && (
            <Text style={styles.currentLocationText}>
              Location Detected
            </Text>
          )}
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleCreateUser} 
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Create Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  locationSection: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  locationLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  locationButton: {
    backgroundColor: '#0080ff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  locationButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  currentLocationText: {
    fontSize: 14,
    color: 'green',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    fontSize: 14,
  },
});
