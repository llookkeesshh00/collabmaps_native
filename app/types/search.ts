import { Location } from './location';

/**
 * Simplified interface for Google Places Autocomplete result
 * Contains only the essential fields we need
 */
export interface GooglePlaceData {
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  place_id: string;
}

/**
 * Simplified interface for Google Place Details result
 * Contains only the essential fields we need
 */
export interface GooglePlaceDetail {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
  name: string;
}

/**
 * Represents a place result from the search
 * Simplified version of Google Place data for storage
 */
export interface SearchedPlace {
  placeId: string;          // Google Place ID for retrieving place details
  name: string;             // Main text (place name)
  address: string;          // Secondary text (address/location description)
  location?: Location;      // Coordinates, may not be available until fetched
  timestamp?: number;       // When this place was searched
}

/**
 * Represents a marker on the map
 */
export interface MapMarker {
  coordinate: Location;
  title: string;
  description: string;
  placeId: string;
}

/**
 * Search state interface
 */
export interface SearchState {
  recentSearches: SearchedPlace[];
  selectedPlace: SearchedPlace | null;
  isSearchActive: boolean;
  mapMarker: MapMarker | null;
}

/**
 * Search store interface with actions
 */
export interface SearchStore extends SearchState {
  addRecentSearch: (place: SearchedPlace) => void;
  addPlaceFromGoogleData: (placeData: GooglePlaceData, placeDetail?: GooglePlaceDetail) => void;
  clearRecentSearches: () => void;
  setSelectedPlace: (place: SearchedPlace | null) => void;
  setSearchActive: (active: boolean) => void;
  removeRecentSearch: (placeId: string) => void;
  setMapMarker: (place: SearchedPlace | null) => void;
  clearSelection: () => void;
}
