import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Comment } from '../types';

export function useComments(locationId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(() => {
    supabase
      .from('comments')
      .select('*, user:profiles!comments_user_id_fkey(id, username, avatar_url)')
      .eq('location_id', locationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setComments(data as unknown as Comment[]);
        setLoading(false);
      });
  }, [locationId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (body: string) => {
    if (!user || !body.trim()) return;
    const { data, error } = await supabase
      .from('comments')
      .insert({ location_id: locationId, user_id: user.id, body: body.trim() })
      .select('*, user:profiles!comments_user_id_fkey(id, username, avatar_url)')
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data as unknown as Comment]);
    }
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return { comments, loading, addComment, deleteComment };
}
