import { supabase } from '../lib/supabase';
import type { LocationWithSubmitter } from '../types';

export async function fetchLocations(
  lat: number,
  lng: number,
  radiusMiles: number = 15
): Promise<LocationWithSubmitter[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*, submitter:profiles!locations_submitter_id_fkey(*), photos:location_photos(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching locations:', error);
    return [];
  }

  return (data as LocationWithSubmitter[]).map((loc) => {
    const distance = haversineDistance(lat, lng, loc.latitude, loc.longitude);
    return { ...loc, distance };
  }).filter((loc) => loc.distance <= radiusMiles);
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // One decimal place
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
