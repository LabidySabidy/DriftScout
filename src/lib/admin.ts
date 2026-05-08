import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  username: string;
  avatar_url: string | null;
  role: 'admin' | 'trusted' | 'scout' | 'pending';
  email: string;
  created_at: string;
  spot_count: number;
  like_count: number;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .rpc('admin_list_users');

  if (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
  return (data as AdminUser[]) ?? [];
}

export interface WeeklyStats {
  total_users: number;
  new_users_week: number;
  total_spots: number;
  new_spots_week: number;
  total_likes: number;
  new_likes_week: number;
  active_users_week: number;
}

export async function fetchWeeklyStats(): Promise<WeeklyStats | null> {
  const { data, error } = await supabase.rpc('admin_weekly_stats');
  if (error) {
    console.error('Error fetching weekly stats:', error);
    return null;
  }
  return data as WeeklyStats;
}

export async function adminDeleteUser(
  targetUserId: string,
  deleteAssets: boolean,
): Promise<{ success: boolean; error: string | null }> {
  const { data, error } = await supabase
    .rpc('admin_delete_user', {
      target_user_id: targetUserId,
      delete_assets: deleteAssets,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data === 'deleted') {
    return { success: true, error: null };
  }

  return { success: false, error: (data as string) ?? 'Unknown error' };
}
