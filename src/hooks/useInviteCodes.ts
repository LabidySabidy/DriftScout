import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { InviteCode } from '../types';

export function useInviteCodes(userId: string | undefined) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchCodes = useCallback(() => {
    if (!userId) return;
    supabase
      .from('invite_codes')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCodes((data as InviteCode[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const generate = useCallback(async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc('generate_invite_code');
    if (!error && data) {
      await fetchCodes();
    }
    setGenerating(false);
    return { code: data as string | null, error: error?.message ?? null };
  }, [fetchCodes]);

  return { codes, loading, generating, generate };
}
