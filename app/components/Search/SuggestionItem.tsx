import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlaceData } from '@/app/types';

interface SuggestionItemProps {
  suggestion: GooglePlaceData;
  onPress: () => void;
}

const SuggestionItem = ({ suggestion, onPress }: SuggestionItemProps) => {
  const mainText =
    suggestion.structured_formatting?.main_text ||
    suggestion.description.split(',')[0];
    
  const secondaryText =
    suggestion.structured_formatting?.secondary_text ||
    suggestion.description.split(',').slice(1).join(',').trim();

  return (
    <View style={styles.suggestionItemWrapper}>
      <TouchableOpacity style={styles.suggestionItem} onPress={onPress}>
        <Ionicons
          name="location-outline"
          size={22}
          color="#555"
          style={styles.suggestionIcon}
        />
        <View style={styles.suggestionTextContainer}>
          <Text
            style={styles.suggestionPrimary}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {mainText}
          </Text>

          {secondaryText.length > 0 && (
            <Text
              style={styles.suggestionSecondary}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {secondaryText}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  suggestionItemWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    width: '100%',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  suggestionPrimary: {
    fontSize: 16,
    color: '#000',
    flexShrink: 1,
    width: '100%',
  },
  suggestionSecondary: {
    fontSize: 14,
    color: '#555',
    flexShrink: 1,
    width: '100%',
  },
});

export default SuggestionItem;
