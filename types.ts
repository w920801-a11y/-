
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number; // In meters
}

export interface Restaurant {
  name: string;
  uri: string;
  snippet?: string;
  sourceType?: string;
  lat?: number;
  lng?: number;
}

export interface SearchResult {
  text: string;
  restaurants: Restaurant[];
}
