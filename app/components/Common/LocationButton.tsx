import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationButtonProps {
  onPress: () => void;
  isLoading: boolean;
}

const LocationButton = ({ onPress, isLoading }: LocationButtonProps) => {
  return (
    <TouchableOpacity 
      style={styles.userLocationButton}
      onPress={onPress}
      disabled={isLoading}
    >
      <Ionicons 
        name="locate" 
        size={24} 
        color={isLoading ? "#cccccc" : "#0080ff"} 
      />
    </TouchableOpacity>
  );
};

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

export default LocationButton;
