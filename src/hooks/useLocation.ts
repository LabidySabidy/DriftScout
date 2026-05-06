import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { LocationWithSubmitter } from '../types';

export function useLocation(id: string) {
  const [location, setLocation] = useState<LocationWithSubmitter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    supabase
      .from('locations')
      .select('*, submitter:profiles!locations_submitter_id_fkey(*), photos:location_photos(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setLocation(data as LocationWithSubmitter);
        setLoading(false);
      });
  }, [id]);

  return { location, loading };
}
