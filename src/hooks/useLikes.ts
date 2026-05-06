import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useLikes() {
  const { user } = useAuth();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase
      .from('likes')
      .select('location_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setLikedIds(new Set(data.map((l) => l.location_id)));
      });
  }, [user]);

  const toggleLike = useCallback(
    async (locationId: string) => {
      if (!user) return;
      const isLiked = likedIds.has(locationId);

      if (isLiked) {
        setLikedIds((prev) => {
          const next = new Set(prev);
          next.delete(locationId);
          return next;
        });
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('location_id', locationId);
      } else {
        setLikedIds((prev) => new Set(prev).add(locationId));
        await supabase
          .from('likes')
          .insert({ user_id: user.id, location_id: locationId });
      }
    },
    [user, likedIds]
  );

  return { likedIds, toggleLike };
}
