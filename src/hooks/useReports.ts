import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useReports(locationId?: string) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const submitReport = async (reason: string, detail: string) => {
    if (!user || !locationId) return;
    setSubmitting(true);
    await supabase.from('reports').insert({
      location_id: locationId,
      reporter_id: user.id,
      reason,
      detail: detail || null,
    });
    setSubmitting(false);
  };

  return { submitReport, submitting };
}
