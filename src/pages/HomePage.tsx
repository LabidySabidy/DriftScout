import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold">DriftScout</h1>
        <div className="flex items-center gap-3">
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
          )}
          <button
            onClick={signOut}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <p className="text-zinc-400">
        Map and location feed coming in T-004.
      </p>
    </div>
  );
}
