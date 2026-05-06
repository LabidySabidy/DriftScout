import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { signIn } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white p-6">
      <div className="text-center max-w-sm">
        <h1 className="text-3xl font-bold mb-2">DriftScout</h1>
        <p className="text-zinc-400 mb-8">
          Find and share drifting practice locations.
        </p>
        <button
          onClick={signIn}
          className="w-full bg-white text-black font-semibold py-3 px-6 rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
