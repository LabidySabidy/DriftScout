import { useState, useEffect } from 'react';
import { useInviteCodes } from '../hooks/useInviteCodes';
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

function CodeRow({ code }: { code: InviteCode }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/join?code=${code.code}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badge = (() => {
    switch (code.status) {
      case 'active':
        return {
          text: <ExpiresIn expiresAt={code.expires_at} />,
          cls: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
      case 'used':
        return { text: 'Used', cls: 'bg-white/10 text-white/40 border-white/10' };
      case 'expired':
        return { text: 'Expired', cls: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'burned_by_cap':
        return { text: 'Burned (cap)', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    }
  })();

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface/50 transition-colors group">
      <code className="text-[11px] font-mono text-ink-mute flex-1 truncate select-all">
        {code.code}
      </code>
      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap ${badge.cls}`}>
        {badge.text}
      </span>
      {code.status === 'active' && (
        <button
          onClick={handleCopy}
          className="text-[10px] font-mono text-ink-dim hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
    </div>
  );
}

export function InviteCodePanelInner({ userId }: { userId: string }) {
  const { codes, loading, generating, generate } = useInviteCodes(userId);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLastError(null);
    const { error } = await generate();
    if (error) setLastError(error);
  };

  const activeCount = codes.filter(
    (c) => c.status === 'active' && new Date(c.expires_at) > new Date(),
  ).length;

  return (
    <div className="px-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-1.5">
        <p className="text-[10px] uppercase tracking-[.08em] text-ink-dim font-mono">
          Invites
        </p>
        <span className="text-[9px] font-mono text-ink-dim">
          {activeCount}/3
        </span>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating || activeCount >= 3}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-card text-[12px] font-mono text-ink-mute border border-chip-border hover:border-accent hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-[.97] mb-2"
      >
        {generating ? (
          <span className="w-3 h-3 border border-ink-mute border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>+ Generate Invite</span>
        )}
      </button>

      {/* Error */}
      {lastError && (
        <p className="text-[10px] text-red-400 font-mono px-2 mb-2">{lastError}</p>
      )}

      {/* Code list */}
      {loading ? (
        <div className="px-2 py-2">
          <div className="w-4 h-4 border border-ink-dim border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : codes.length === 0 ? (
        <p className="text-[11px] text-ink-dim px-2 py-1">No invites yet</p>
      ) : (
        <div className="space-y-0.5">
          {codes.map((code) => (
            <CodeRow key={code.id} code={code} />
          ))}
        </div>
      )}
    </div>
  );
}
