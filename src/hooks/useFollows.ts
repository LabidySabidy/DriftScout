import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useFollows() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .then(({ data }) => {
        if (data) setFollowing(new Set(data.map((f: { following_id: string }) => f.following_id)));
      });
  }, [user]);

  const toggleFollow = useCallback(async (targetId: string) => {
    if (!user) return;
    const isFollowing = following.has(targetId);
    if (isFollowing) {
      setFollowing((prev) => { const n = new Set(prev); n.delete(targetId); return n; });
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    } else {
      setFollowing((prev) => new Set(prev).add(targetId));
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
    }
  }, [user, following]);

  return { following, toggleFollow };
}
