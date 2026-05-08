/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { fetchAdminUsers, adminDeleteUser, fetchWeeklyStats } from '../lib/admin';
import type { AdminUser, WeeklyStats } from '../lib/admin';

type SortKey = 'created_at' | 'username' | 'spot_count' | 'invites_sent' | 'role';
type SortDir = 'asc' | 'desc';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleteAssets, setDeleteAssets] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [userData, statsData] = await Promise.all([
      fetchAdminUsers(),
      fetchWeeklyStats(),
    ]);
    setUsers(userData);
    setStats(statsData);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleDelete = async (userId: string) => {
    setDeleting(true);
    setError(null);
    const result = await adminDeleteUser(userId, deleteAssets);
    if (result.success) {
      setConfirming(null);
      setDeleteAssets(false);
      await load();
    } else {
      setError(result.error);
    }
    setDeleting(false);
  };

  const sorted = [...users].sort((a, b) => {
    const cmp =
      sortKey === 'username' ? a.username.localeCompare(b.username) :
      sortKey === 'spot_count' ? a.spot_count - b.spot_count :
      sortKey === 'invites_sent' ? a.invites_sent - b.invites_sent :
      sortKey === 'role' ? a.role.localeCompare(b.role) :
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const roleClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'trusted': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'scout': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-ink-dim/20 text-ink-dim border-ink-dim/30';
    }
  };

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 'desc' ? ' ↓' : ' ↑';
  };

  return (
    <div className={`${isDesktop ? 'max-w-[760px] mx-auto px-8 py-10' : 'px-4 pt-3 pb-20'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold lg:font-display lg:text-[26px] lg:tracking-tight">Users</h1>
          <p className="text-[12px] font-mono text-ink-mute mt-1">
            {users.length} users
            {' · '}
            {users.filter((u) => u.role === 'admin').length} admin
            {' · '}
            {users.filter((u) => u.role === 'pending').length} pending
          </p>
        </div>
      </div>

      {/* Weekly stats bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
          <StatCard label="Users" value={stats.total_users} delta={stats.new_users_week} deltaLabel="new this week" />
          <StatCard label="Spots" value={stats.total_spots} delta={stats.new_spots_week} deltaLabel="new this week" />
          <StatCard label="Likes" value={stats.total_likes} delta={stats.new_likes_week} deltaLabel="new this week" />
          <StatCard label="Active" value={stats.active_users_week} deltaLabel="this week" />
        </div>
      )}

      {error && (
        <div className="mb-3 p-3 rounded-card bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-surface rounded-card h-[52px] animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-ink-mute">
          <p className="text-lg mb-1">No users found</p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-[.06em] text-ink-dim font-mono border-b border-chip-border mb-1">
            <div className="w-7 shrink-0" />
            <button
              onClick={() => toggleSort('username')}
              className="flex-1 text-left hover:text-ink-mute transition-colors"
            >
              User{sortArrow('username')}
            </button>
            <button
              onClick={() => toggleSort('role')}
              className="w-[72px] text-center hover:text-ink-mute transition-colors shrink-0"
            >
              Role{sortArrow('role')}
            </button>
            <button
              onClick={() => toggleSort('spot_count')}
              className="w-12 text-center hover:text-ink-mute transition-colors shrink-0"
            >
              Spots{sortArrow('spot_count')}
            </button>
            <button
              onClick={() => toggleSort('invites_sent')}
              className="w-[68px] text-center hover:text-ink-mute transition-colors shrink-0"
            >
              Invites{sortArrow('invites_sent')}
            </button>
            <button
              onClick={() => toggleSort('created_at')}
              className="w-[84px] text-right hover:text-ink-mute transition-colors shrink-0"
            >
              Joined{sortArrow('created_at')}
            </button>
            <div className="w-8 shrink-0" />
          </div>

          {/* User rows */}
          <div className="space-y-1">
            {sorted.map((user) => (
              <div key={user.id}>
                <div
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="flex items-center gap-3 p-2 rounded-card hover:bg-surface transition-colors group cursor-pointer"
                >
                  {/* Avatar */}
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover bg-surface shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-surface shrink-0" />
                  )}

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{user.username}</p>
                    <p className="text-[11px] font-mono text-ink-mute truncate">{user.email}</p>
                  </div>

                  {/* Role badge */}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 w-[72px] text-center ${roleClass(user.role)}`}>
                    {user.role}
                  </span>

                  {/* Spot count */}
                  <span className="text-[12px] font-mono text-ink-mute w-12 text-center shrink-0">
                    {user.spot_count}
                  </span>

                  {/* Invites */}
                  <span className="text-[11px] font-mono text-ink-mute w-[68px] text-center shrink-0">
                    {user.invites_accepted > 0 ? (
                      <span className="text-green-400">{user.invites_accepted}</span>
                    ) : (
                      '0'
                    )}
                    <span className="text-ink-dim">/{user.invites_sent}</span>
                  </span>

                  {/* Joined */}
                  <span className="text-[11px] font-mono text-ink-dim w-[84px] text-right shrink-0">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>

                  {/* Delete button (always reserve space) */}
                  <div className="w-8 shrink-0 grid place-items-center">
                    {user.role !== 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirming(confirming === user.id ? null : user.id);
                          setDeleteAssets(false);
                          setError(null);
                        }}
                        className={`w-8 h-8 grid place-items-center rounded-full transition-colors ${
                          confirming === user.id
                            ? 'bg-red-500/20 text-red-400'
                            : 'text-ink-dim opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400'
                        }`}
                        title="Delete user"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirmation panel */}
                {confirming === user.id && (
                  <div className="mx-2 mb-2 p-4 rounded-card bg-red-500/5 border border-red-500/20 space-y-3">
                    <p className="text-[13px] text-ink/80">
                      Delete <span className="font-semibold text-ink">@{user.username}</span>?
                      <br />
                      <span className="text-ink-mute">This action cannot be undone.</span>
                    </p>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={deleteAssets}
                        onChange={(e) => setDeleteAssets(e.target.checked)}
                        className="w-4 h-4 rounded bg-surface border-chip-border accent-red-500"
                      />
                      <span className="text-[12px] text-ink-mute">
                        Also delete all their locations, photos, and data
                      </span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setConfirming(null); setDeleteAssets(false); setError(null); }}
                        className="flex-1 h-9 rounded-card border border-chip-border text-ink-mute text-[13px] font-semibold hover:bg-surface transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deleting}
                        className="flex-1 h-9 rounded-card bg-red-600 text-white text-[13px] font-semibold active:scale-[.98] transition-transform disabled:opacity-40"
                      >
                        {deleting ? 'Deleting...' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!isDesktop && (
        <button onClick={() => navigate(-1)} className="mt-4 text-xs text-ink-mute hover:text-ink font-mono">
          ← Back
        </button>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  deltaLabel,
}: {
  label: string;
  value: number;
  delta?: number;
  deltaLabel: string;
}) {
  return (
    <div className="bg-surface border border-chip-border rounded-card p-3">
      <p className="text-[10px] uppercase tracking-[.06em] text-ink-dim font-mono mb-1">{label}</p>
      <p className="text-[22px] font-bold text-ink leading-tight">{value.toLocaleString()}</p>
      <p className="text-[11px] font-mono text-ink-mute mt-0.5">
        {delta !== undefined ? (
          <span className={delta > 0 ? 'text-green-400' : 'text-ink-mute'}>
            +{delta}
          </span>
        ) : (
          <span>{value}</span>
        )}{' '}
        {deltaLabel}
      </p>
    </div>
  );
}
