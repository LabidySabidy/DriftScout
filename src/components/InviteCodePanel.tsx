/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { InviteCode } from '../types';

function ExpiresIn({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setLabel('Expired');
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      if (h > 0) setLabel(`${h}h ${m}m`);
      else setLabel(`${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span>{label}</span>;
}

export function InviteCodePanelInner({ userId }: { userId: string }) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [redemptionCount, setRedemptionCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const fetchCodes = useCallback(() => {
    if (!userId) return;
    supabase
      .from('invite_codes')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCodes((data as InviteCode[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const activeCode = codes.find(
    (c) => c.status === 'active' && new Date(c.expires_at) > new Date(),
  );

  // Fetch redemption count for the active code
  useEffect(() => {
    if (!activeCode) {
      setRedemptionCount(0);
      return;
    }
    supabase
      .from('invite_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('code_id', activeCode.id)
      .then(({ count }) => {
        setRedemptionCount(count ?? 0);
      });
  }, [activeCode]);

  const handleGenerate = async () => {
    setLastError(null);
    setGenerating(true);
    const { data, error } = await supabase.rpc('generate_invite_code');
    if (!error && data) {
      await fetchCodes();
    } else if (error) {
      setLastError(error.message);
    }
    setGenerating(false);
  };

  const handleCopy = async () => {
    if (!activeCode) return;
    const inviteUrl = `${window.location.origin}/join?code=${activeCode.code}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = inviteUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  if (loading) {
    return (
      <div className="px-2 py-2">
        <div className="w-4 h-4 border border-ink-dim border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="px-2">
      <p className="text-[10px] uppercase tracking-[.08em] text-ink-dim font-mono px-2 mb-1.5">
        Invite Link
      </p>

      {activeCode ? (
        <div className="space-y-2">
          {/* Code + Copy */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-card bg-surface border border-chip-border hover:border-accent transition-colors active:scale-[.98] group"
          >
            <code className="text-[13px] font-mono text-ink-mute flex-1 text-left select-all">
              {activeCode.code}
            </code>
            {copied ? (
              <span className="text-[10px] font-mono text-accent shrink-0">Copied!</span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-dim shrink-0 group-hover:text-ink">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            )}
          </button>

          {/* Stats */}
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-mono text-ink-dim">
              {redemptionCount > 0 ? (
                <>{redemptionCount} {redemptionCount === 1 ? 'person' : 'people'} invited</>
              ) : (
                'No one invited yet'
              )}
            </span>
            <span className="text-[10px] font-mono text-ink-dim">
              <ExpiresIn expiresAt={activeCode.expires_at} />
            </span>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-card text-[12px] font-mono text-ink-mute border border-chip-border hover:border-accent hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-[.97]"
          >
            {generating ? (
              <span className="w-3 h-3 border border-ink-mute border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>+ Generate Invite Link</span>
            )}
          </button>
          {lastError && (
            <p className="text-[10px] text-red-400 font-mono px-2 mt-1.5">{lastError}</p>
          )}
        </>
      )}
    </div>
  );
}
