import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'location_status';
  actor: { id: string; username: string; avatar_url: string | null } | null;
  location_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('id, type, read, created_at, location_id, comment_id, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) {
          setNotifications(data as unknown as Notification[]);
          setUnreadCount(data.filter((n: { read: boolean }) => !n.read).length);
        }
        setLoading(false);
      });
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markOneRead = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [user]);

  return { notifications, unreadCount, loading, markAllRead, markOneRead };
}
