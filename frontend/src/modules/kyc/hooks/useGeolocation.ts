import { useState, useEffect } from 'react';

interface GeoLocation {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  city: string | null;
  country: string | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation(): GeoLocation {
  const [geo, setGeo] = useState<GeoLocation>({
    latitude: null, longitude: null, accuracy: null,
    city: null, country: null, loading: true, error: null
  });
  
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Reverse geocode using free Nominatim API (no key needed)
        let city = null, country = null;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'User-Agent': 'Sentinel-KYC/1.0' } }
          );
          const data = await res.json();
          // Often desktop IPs return suburbs/villages (e.g. Anandnagar) instead of the main city. 
          // We extract the city, but prioritize state_district if available to be more recognizable
          const exactCity = data.address?.city || data.address?.town || data.address?.village;
          const district = data.address?.state_district;
          const state = data.address?.state;
          
          city = district || exactCity || state || null;
          country = data.address?.country || null;
        } catch { /* Geocoding is optional, don't block KYC */ }
        
        setGeo({ latitude, longitude, accuracy, city, country, loading: false, error: null });
      },
      (error) => {
        setGeo(prev => ({
          ...prev, loading: false,
          error: error.code === 1 ? 'Location permission denied' :
                 error.code === 2 ? 'Location unavailable' :
                 'Location request timed out'
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);
  
  return geo;
}
