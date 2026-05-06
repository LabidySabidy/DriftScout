/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchLocations } from '../lib/locations';
import type { LocationWithSubmitter } from '../types';

export function useLocations() {
  const [locations, setLocations] = useState<LocationWithSubmitter[]>([]);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(15);
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
    fetchLocations(userCoords[0], userCoords[1], radius).then((data) => {
      setLocations(data);
      setLoading(false);
    });
  }, [userCoords, radius]);

  const refresh = useCallback(() => {
    if (!userCoords) return;
    setLoading(true);
    fetchLocations(userCoords[0], userCoords[1], radius).then((data) => {
      setLocations(data);
      setLoading(false);
    });
  }, [userCoords, radius]);

  return {
    locations,
    userCoords,
    radius,
    setRadius,
    loading,
    geoError,
    refresh,
  };
}
