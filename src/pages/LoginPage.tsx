import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { signIn } = useAuth();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg text-ink p-6">
      <div className="text-center w-full max-w-sm lg:max-w-[400px] lg:rounded-card lg:border lg:border-chip-border lg:bg-surface lg:p-10">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Pacifico', cursive" }}>DriftScout</h1>
        <p className="text-ink-mute mb-8">Find and share drifting practice locations.</p>
        <button
          onClick={signIn}
          className="w-full bg-ink text-bg font-semibold py-3 px-6 rounded-card hover:bg-zinc-200 transition-colors active:scale-[.97]"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
