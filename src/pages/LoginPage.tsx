import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const PRIVACY_POLICY = `
## Privacy Policy

**What we collect:** When you sign in with Google, we get your name, email, and profile picture. That's it. We don't snoop through your contacts, your calendar, or what you watched on YouTube last night.

**What we store:** Your display name, your avatar, the spots you submit, the spots you like, and any comments you leave. We store it so the app works — you wouldn't want to lose all your saved spots every time you close the tab, right?

**What we don't do:** We don't sell your data. We don't share it with third parties. We don't send you marketing emails. We're drifters building a tool for drifters — not a data brokerage.

**Photos you upload:** Photos submitted with locations are publicly visible to anyone using the app. Don't upload anything you wouldn't want other drifters to see.

**Deleting your data:** Want out? Delete your spots and likes from your profile, then hit us up and we'll scrub your account. Everything goes poof.

**Cookies:** Supabase (our backend) uses a session cookie to keep you signed in. No tracking cookies, no analytics scripts following you around the web.

Questions? Find us on Discord or wherever drifters congregate.
`;

const TERMS_OF_USE = `
## Terms of Use

**Use at your own risk, homie.** DriftScout is a directory of spots where people practice drifting. We don't own these spots. We don't control them. We're just collecting and sharing info. If you show up somewhere and security kicks you out, that's on you. If the pavement is trash and you shred a tire, that's on you too.

**Don't ruin spots.** This is the one rule that matters. If a spot gets hot because people are acting reckless — doing burnouts in residential areas, blasting music at 2 AM, leaving trash everywhere — that spot disappears for everyone. Be respectful. Keep it low-key. Pack out what you pack in.

**Absolutely no takeover talk.** No street takeovers, no intersection takeovers, none of that. DriftScout is about finding parking lots, industrial areas, and tracks where you can practice safely and legally (or at least without bothering anyone). Takeover content will be removed and your account will be banned. We're not even slightly ambiguous about this.

**You're responsible for your own actions.** DriftScout provides information. What you do with it is your business — and your liability. We're not responsible for property damage, injuries, tickets, impounded cars, angry property owners, or anything else that results from you going to a spot you found here.

**Spots can change.** Security shows up. Lots get repaved. Gates go up. A spot that was good last month might be locked down today. If you notice something changed, submit an update or report it.

**Be cool.** Don't harass other users. Don't post fake spots just to mess with people. Don't submit spots on active military bases. You know the deal.

**We can remove anything.** If you submit garbage, if you're being a punk, if your content violates the spirit of this community — we'll take it down. Your spots, your comments, your account. This is a community resource, not a free speech platform.

**Pre-release disclaimer:** This app is brand new and things will change. Features might break. Your data might get reset. We'll try not to, but it's a pre-release — adjust your expectations accordingly.

By using DriftScout, you agree to all of the above. If you don't agree, close the tab and go drive your car instead.
`;

function SlidePanel({
  open,
  onClose,
  title,
  content,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-bg text-ink"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          <div className="sticky top-0 z-10 h-12 px-3 flex items-center gap-2 bg-bg/85 backdrop-blur-xl border-b border-tab-border shrink-0">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 h-10 px-2 rounded-full hover:bg-surface text-ink-mute active:scale-[.97] transition-transform duration-100"
            >
              <span>←</span>
              <span className="text-[13px] font-mono">Back</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 pb-12 prose prose-invert prose-sm max-w-[600px] mx-auto">
            <h1 className="font-display font-bold text-[26px] leading-[1.1] tracking-tight text-ink mb-6">
              {title}
            </h1>
            {content.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <br key={i} />;
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={i} className="font-display font-bold text-[20px] text-ink mt-8 mb-2">
                    {trimmed.replace('## ', '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                return (
                  <p key={i} className="font-semibold text-ink mt-4 mb-1">
                    {trimmed.replace(/\*\*/g, '')}
                  </p>
                );
              }
              return (
                <p key={i} className="text-ink/80 leading-relaxed text-[14px] mb-3">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.get('code');
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState(urlCode ?? '');
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Already signed in? Skip the gate
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleEnter = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setCodeError(null);
    setChecking(true);

    // Validate code before proceeding
    const { data: status } = await supabase.rpc('check_invite_code', {
      code_param: trimmed,
    });

    setChecking(false);

    if (status === 'active') {
      sessionStorage.setItem('invite_code', trimmed);
      signIn();
    } else if (status === 'expired') {
      setCodeError('This code has expired. Codes last 48 hours.');
    } else if (status === 'used') {
      setCodeError('This code has already been used.');
    } else {
      setCodeError('Invalid invite code. Check the code and try again.');
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/background.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Gate card */}
      <div className="relative z-10 text-center w-full max-w-md px-6 py-10 mx-4 rounded-card bg-black/20 backdrop-blur-sm border border-white/10">
        {/* Logo */}
        <h1
          className="flex items-center justify-center gap-2 text-[42px] font-bold mb-3 text-white drop-shadow-lg"
          style={{ fontFamily: "'Pacifico', cursive" }}
        >
          <img src="/logo-icon.png" alt="" className="w-11 h-auto" />
          DriftScout
        </h1>

        {/* Subheader */}
        <p className="text-white/85 text-[15px] leading-relaxed mb-6 max-w-[360px] mx-auto">
          Welcome to DriftScout. Our mission is to help you find and share great
          locations to drift. This is a pre-release version — many things are
          subject to change. Welcome in, Scout.
        </p>

        {/* ── Invite code input ── */}
        <div className="mb-5">
          <label className="block text-[10px] uppercase tracking-[.15em] text-white/50 font-mono mb-2">
            Invite Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setCodeError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
            placeholder="Enter your code"
            maxLength={10}
            className="w-full max-w-[260px] bg-black/30 border border-white/20 rounded-card px-4 py-3 text-center text-[22px] font-mono tracking-[.15em] text-white placeholder-white/20 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
          {/* Error message */}
          {codeError && (
            <p className="mt-2 text-[12px] text-red-400/90 font-mono">{codeError}</p>
          )}
        </div>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={!code.trim() || checking}
          className="w-full max-w-[320px] bg-white text-black font-semibold py-3.5 px-6 rounded-card hover:bg-white/90 transition-colors active:scale-[.98] duration-100 flex items-center justify-center gap-3 mx-auto disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {checking ? (
            <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Enter
            </>
          )}
        </button>

        {/* Already a member — subtle escape hatch for trusted users */}
        <button
          onClick={signIn}
          className="mt-5 text-[12px] text-white/35 hover:text-white/60 transition-colors underline underline-offset-2"
        >
          Already have access? Sign in
        </button>

        {/* Footer links */}
        <div className="mt-5 flex items-center justify-center gap-4 text-[12px] text-white/50">
          <button
            onClick={() => setShowPrivacy(true)}
            className="hover:text-white/90 transition-colors underline underline-offset-2"
          >
            Privacy Policy
          </button>
          <span>·</span>
          <button
            onClick={() => setShowTerms(true)}
            className="hover:text-white/90 transition-colors underline underline-offset-2"
          >
            Terms of Use
          </button>
        </div>
      </div>

      {/* Slide-in panels */}
      <SlidePanel
        open={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
        content={PRIVACY_POLICY}
      />
      <SlidePanel
        open={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms of Use"
        content={TERMS_OF_USE}
      />
    </div>
  );
}
