/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchLocationsSorted } from '../lib/locations';
import type { LocationWithSubmitter } from '../types';

export function useLocations() {
  const [locations, setLocations] = useState<LocationWithSubmitter[]>([]);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      setUserCoords([32.7767, -96.7970]);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setGeoError(null);
      },
      () => {
        setGeoError('Location access denied');
        setUserCoords([32.7767, -96.7970]);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!userCoords) return;

    setLoading(true);
    fetchLocationsSorted(userCoords[0], userCoords[1]).then((data) => {
      setLocations(data);
      setLoading(false);
    });
  }, [userCoords]);

  const refresh = useCallback(() => {
    if (!userCoords) return;
    setLoading(true);
    fetchLocationsSorted(userCoords[0], userCoords[1]).then((data) => {
      setLocations(data);
      setLoading(false);
    });
  }, [userCoords]);

  return {
    locations,
    userCoords,
    loading,
    geoError,
    refresh,
  };
}
