import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function usePhotoVotes(locationId?: string) {
  const { user } = useAuth();
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!locationId) return;
    supabase
      .from('photo_votes')
      .select('photo_id, user_id')
      .eq('user_id', user?.id || '')
      .then(({ data }) => {
        if (data) {
          setUserVotes(new Set(data.map((v: { photo_id: string }) => v.photo_id)));
        }
      });
  }, [locationId, user]);

  const toggleVote = async (photoId: string) => {
    if (!user) return;
    const voted = userVotes.has(photoId);
    if (voted) {
      setUserVotes((prev) => { const n = new Set(prev); n.delete(photoId); return n; });
      await supabase.from('photo_votes').delete().eq('user_id', user.id).eq('photo_id', photoId);
    } else {
      setUserVotes((prev) => new Set(prev).add(photoId));
      await supabase.from('photo_votes').insert({ user_id: user.id, photo_id: photoId });
    }
  };

  return { userVotes, toggleVote };
}
