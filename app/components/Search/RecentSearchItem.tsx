import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchedPlace } from '@/app/types';

interface RecentSearchItemProps {
  item: SearchedPlace;
  onPress: (item: SearchedPlace) => void;
}

const RecentSearchItem = ({ item, onPress }: RecentSearchItemProps) => {
  return (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => onPress(item)}
    >
      <Ionicons
        name="time-outline"
        size={22}
        color="#555"
        style={styles.recentIcon}
      />
      <View style={styles.recentTextContainer}>
        <Text style={styles.recentItemTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.recentItemSubtitle} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
    width: '100%',
  },
  recentIcon: { 
    marginRight: 12 
  },
  recentTextContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  recentItemTitle: {
    fontSize: 16,
    color: '#000',
    width: '100%',
  },
  recentItemSubtitle: {
    fontSize: 14,
    color: '#555',
    width: '100%',
  },
});

export default RecentSearchItem;
