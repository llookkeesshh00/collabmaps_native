export interface User {
  id: string;
  displayName: string;
  avatarUrl?: string;
  currentLocation?: Location;
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}