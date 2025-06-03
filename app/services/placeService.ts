import Constants from 'expo-constants';
import { GooglePlaceData, GooglePlaceDetail, SearchedPlace } from '@/app/types';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || '';

/**
 * Service to handle Google Places API interactions
 */
class PlaceService {
  /**
   * Fetch details for a place using Google Places API
   * @param placeId The Google Place ID
   * @returns Promise with place details
   */
  async fetchPlaceDetails(placeId: string): Promise<GooglePlaceDetail | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name,photos,types,rating,price_level,international_phone_number,website,opening_hours&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (!data.result) {
        console.error('No result returned from Places API', data);
        return null;
      }
      
      return {
        geometry: {
          location: {
            lat: data.result.geometry.location.lat,
            lng: data.result.geometry.location.lng,
          },
        },
        formatted_address: data.result.formatted_address,
        name: data.result.name,
        photos: data.result.photos,
        types: data.result.types,
        rating: data.result.rating,
        price_level: data.result.price_level,
        international_phone_number: data.result.international_phone_number,
        website: data.result.website,
        opening_hours: data.result.opening_hours,
      };
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  /**
   * Creates the Google Places Photo URL from a photo reference
   * @param photoReference The photo reference string from Google Places
   * @param maxWidth Optional width for the photo
   * @returns Photo URL
   */
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  }

  /**
   * Convert photo URLs to photo references
   * @param photoUrls Array of photo URLs
   * @returns Array of photo reference objects compatible with Google Places API
   */
  convertUrlsToPhotoReferences(photoUrls: string[]): Array<{
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
  }> {
    return photoUrls.map(url => {
      const photoRef = url.split('photoreference=')[1]?.split('&')[0];
      return {
        photo_reference: photoRef || '',
        height: 400,
        width: 400,
        html_attributions: []
      };
    });
  }

  /**
   * Create GooglePlaceData from SearchedPlace for consistency
   * @param place SearchedPlace object
   * @returns GooglePlaceData object
   */
  createPlaceDataFromSearchedPlace(place: SearchedPlace): GooglePlaceData {
    return {
      place_id: place.placeId,
      description: place.name,
      structured_formatting: {
        main_text: place.name,
        secondary_text: place.address,
      }
    };
  }
  
  /**
   * Create GooglePlaceDetail from SearchedPlace for consistency
   * @param place SearchedPlace object
   * @returns GooglePlaceDetail object
   */
  createPlaceDetailFromSearchedPlace(place: SearchedPlace): GooglePlaceDetail | null {
    if (!place.location) return null;
    
    return {
      geometry: {
        location: {
          lat: place.location.latitude,
          lng: place.location.longitude,
        },
      },
      formatted_address: place.formattedAddress || place.address,
      name: place.name,
      photos: place.photoUrls ? this.convertUrlsToPhotoReferences(place.photoUrls) : undefined,
      types: place.placeTypes,
      rating: place.rating,
      price_level: place.priceLevel
    };
  }
}

export const placeService = new PlaceService();
