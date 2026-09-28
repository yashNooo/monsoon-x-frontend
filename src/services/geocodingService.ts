export interface GeocodingResult {
  placeId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  village?: string;
}

export const searchPlaces = async (query: string): Promise<GeocodingResult[]> => {
  if (!query || query.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&addressdetails=1&limit=6`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const address = item.address || {};
      const block = address.subdistrict || address.county || address.tehsil || address.taluk || address.state_district || 'Block Area';
      const district = address.state_district || address.district || address.county || 'District';
      const panchayat = address.village || address.suburb || address.neighbourhood || address.hamlet || 'Panchayat Area';
      
      return {
        placeId: String(item.place_id),
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        state: address.state || 'Rajasthan',
        district,
        block,
        panchayat,
        village: address.village || address.hamlet,
      };
    });
  } catch (error) {
    console.warn('Geocoding search failed, falling back:', error);
    return [];
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<GeocodingResult | null> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim reverse error: ${response.statusText}`);
    }

    const data = await response.json();
    const address = data.address || {};

    const block = address.subdistrict || address.county || address.tehsil || address.taluk || 'Sub-district / Block';
    const district = address.state_district || address.district || address.county || 'District';
    const panchayat = address.village || address.suburb || address.neighbourhood || address.hamlet || address.town || 'Panchayat Area';

    return {
      placeId: String(data.place_id || 'reverse'),
      displayName: data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      latitude: lat,
      longitude: lon,
      state: address.state || 'Rajasthan',
      district,
      block,
      panchayat,
      village: address.village || address.hamlet,
    };
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return null;
  }
};
