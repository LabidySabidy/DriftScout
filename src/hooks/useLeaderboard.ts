import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LeaderboardEntry {
  submitter: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  spot_count: number;
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .rpc('leaderboard')
      .then(({ data, error }) => {
        if (!error && data) setEntries(data as LeaderboardEntry[]);
        setLoading(false);
      });
  }, []);

  return { entries, loading };
}
