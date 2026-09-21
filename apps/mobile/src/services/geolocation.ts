/**
 * Mobile GPS Geolocation acquisition service
 */

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export class GeolocationService {
  /**
   * Acquires current GPS coordinates using HTML5 Geolocation
   * Falls back to default Unit coordinates (Mumbai HQ) if permission is denied or in dev sandbox
   */
  async getCurrentPosition(): Promise<GpsCoordinates> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: Math.round(position.coords.accuracy),
              timestamp: position.timestamp
            });
          },
          (error) => {
            console.warn('Geolocation warning (using default unit coordinates):', error.message);
            // Default to Head Office Mumbai coordinates: 19.1176, 72.9060
            resolve({
              latitude: 19.1176,
              longitude: 72.9060,
              accuracy: 10,
              timestamp: Date.now()
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0
          }
        );
      } else {
        // Fallback
        resolve({
          latitude: 19.1176,
          longitude: 72.9060,
          accuracy: 10,
          timestamp: Date.now()
        });
      }
    });
  }
}

export const geolocationService = new GeolocationService();
