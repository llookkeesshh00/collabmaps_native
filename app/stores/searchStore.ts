import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchStore, SearchedPlace, GooglePlaceData, GooglePlaceDetail, MapMarker } from '@/app/types';
import { Location } from '@/app/types';

/**
 * Zustand store for managing search history and current selection
 */
export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      recentSearches: [],
      selectedPlace: null,
      isSearchActive: false,
      mapMarker: null,

      /**
       * Add a place to recent searches from Google Places data
       * @param place The place to add
       */
      addRecentSearch: (place: SearchedPlace) => {
        set((state) => {
          // Add timestamp to track when the place was searched
          const placeWithTimestamp = { 
            ...place, 
            timestamp: Date.now() 
          };
          
          // Filter out any existing entries with the same placeId
          const filteredSearches = state.recentSearches.filter(
            (item) => item.placeId !== place.placeId
          );
          
          // Add the new place at the beginning and limit to 7 entries
          return { 
            recentSearches: [
              placeWithTimestamp, 
              ...filteredSearches
            ].slice(0, 7),
            selectedPlace: place, // Also set as selected place
          };
        });
      },
        /**
       * Convert Google Places data to our SearchedPlace format and add to recent searches
       * @param placeData Data from Google Places Autocomplete
       * @param placeDetail Optional place details with more information
       */
      addPlaceFromGoogleData: (placeData: GooglePlaceData, placeDetail?: GooglePlaceDetail) => {
        const place: SearchedPlace = {
          placeId: placeData.place_id,
          name: placeData.structured_formatting?.main_text || placeData.description.split(',')[0],
          address: placeData.structured_formatting?.secondary_text || 
                  placeData.description.split(',').slice(1).join(',').trim(),
          location: placeDetail ? {
            latitude: placeDetail.geometry.location.lat,
            longitude: placeDetail.geometry.location.lng
          } : undefined,
          timestamp: Date.now()
        };
        
        set((state) => {
          // Filter out any existing entries with the same placeId
          const filteredSearches = state.recentSearches.filter(
            (item) => item.placeId !== place.placeId
          );
          
          return { 
            recentSearches: [
              place, 
              ...filteredSearches
            ].slice(0, 7),
            selectedPlace: place,
          };
        });
      },

      /**
       * Clear all recent searches
       */
      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },

      /**
       * Set the currently selected place
       * @param place The place to select, or null to clear
       */
      setSelectedPlace: (place: SearchedPlace | null) => {
        set({ selectedPlace: place });
      },

      /**
       * Set whether search is active or collapsed
       * @param active Whether search is active
       */
      setSearchActive: (active: boolean) => {
        set({ isSearchActive: active });
      },

      /**
       * Remove a specific place from recent searches
       * @param placeId The ID of the place to remove
       */      removeRecentSearch: (placeId: string) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter(
            (item) => item.placeId !== placeId
          ),
        }));
      },      /**
       * Set the map marker for the selected place
       * @param place The place to create a marker for, or null to clear
       */
      setMapMarker: (place: SearchedPlace | null) => {
        if (!place || !place.location) {
          set({ mapMarker: null });
          return;
        }
        
        const marker: MapMarker = {
          coordinate: place.location,
          title: place.name,
          description: place.address,
          placeId: place.placeId
        };
        
        set({ mapMarker: marker });
      },

      /**
       * Clear the selected place and associated map marker
       */
      clearSelection: () => {
        set({ 
          selectedPlace: null,
          mapMarker: null 
        });
      },
    }),
    {
      name: 'search-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

