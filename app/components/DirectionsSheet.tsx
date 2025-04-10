import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';

type DirectionsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  placeDetails: { name: string; address: string } | null;
  distance?: string;
  duration?: string;
};

export default function DirectionsSheet({
  isOpen,
  onClose,
  placeDetails,
  distance,
  duration,
}: DirectionsSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '75%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);
  
  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);
  
  const renderBackdrop = useCallback(
    (props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="none" // Allow touches to pass through to the map
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {placeDetails?.name || 'Destination'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome name="close" size={20} color="#000" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.address}>
          {placeDetails?.address || 'No address available'}
        </Text>
        
        {distance && duration ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>
              <FontAwesome name="road" size={16} color="#666" />
              {' '}{distance}
            </Text>
            <Text style={styles.infoText}>
              <FontAwesome name="clock-o" size={16} color="#666" />
              {' '}{duration}
            </Text>
          </View>
        ) : (
          <Text style={styles.calculatingText}>Calculating route...</Text>
        )}
        
        <TouchableOpacity style={styles.directionsButton}>
          <View style={styles.buttonContent}>
            <FontAwesome name="location-arrow" size={16} color="white" />
            <Text style={styles.directionsButtonText}> Start Directions</Text>
          </View>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  indicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'black',
  },
  address: {
    color: '#666',
    marginBottom: 16,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoText: {
    color: '#333',
    fontSize: 14,
  },
  calculatingText: {
    color: '#666',
    marginBottom: 20,
    fontSize: 14,
  },
  directionsButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});