import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { fetchBugReports, updateBugReport } from '../lib/bugReports';
import type { BugReport } from '../lib/bugReports';

export default function AdminBugsPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBugReports().then((data) => {
      setBugs(data);
      setLoading(false);
    });
  }, []);

  const handleClose = async (id: string) => {
    setSaving(true);
    await updateBugReport(id, { status: 'closed', admin_notes: adminNotes });
    const data = await fetchBugReports();
    setBugs(data);
    setSaving(false);
    setExpanded(null);
    setAdminNotes('');
  };

  const filtered = showClosed ? bugs : bugs.filter((b) => b.status === 'open');
  const openCount = bugs.filter((b) => b.status === 'open').length;

  return (
    <div className={`${isDesktop ? 'max-w-[680px] mx-auto px-8 py-10' : 'px-4 pt-3 pb-20'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold lg:font-display lg:text-[26px] lg:tracking-tight">Bug Reports</h1>
          <p className="text-[12px] font-mono text-ink-mute mt-1">
            {openCount} open · {bugs.length - openCount} closed
          </p>
        </div>
        <button
          onClick={() => setShowClosed(!showClosed)}
          className={`text-[12px] font-mono px-3 py-1.5 rounded-pill border transition-colors ${
            showClosed ? 'bg-accent/20 border-accent/40 text-accent' : 'border-chip-border text-ink-mute'
          }`}
        >
          {showClosed ? 'Showing all' : 'Open only'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface rounded-card h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-ink-mute">
          <p className="text-lg mb-1">No bugs found</p>
          <p className="text-sm">{showClosed ? 'All clear.' : 'No open bugs — nice.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((bug) => (
            <div
              key={bug.id}
              className="bg-surface border border-chip-border rounded-card overflow-hidden"
            >
              <button
                onClick={() => {
                  setExpanded(expanded === bug.id ? null : bug.id);
                  setAdminNotes(bug.admin_notes || '');
                }}
                className="w-full text-left p-4 flex items-start gap-3"
              >
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${bug.status === 'open' ? 'bg-accent' : 'bg-ink-dim'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink truncate">{bug.title}</p>
                  <p className="text-[11px] font-mono text-ink-mute mt-0.5">
                    {new Date(bug.created_at).toLocaleDateString()}
                    {bug.status === 'closed' && bug.closed_at && <> · Closed {new Date(bug.closed_at).toLocaleDateString()}</>}
                  </p>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                  bug.status === 'open' ? 'bg-accent/15 text-accent border-accent/30' : 'bg-white/5 text-ink-dim border-white/10'
                }`}>
                  {bug.status}
                </span>
              </button>

              {expanded === bug.id && (
                <div className="px-4 pb-4 border-t border-chip-border pt-3 space-y-3">
                  {bug.description && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[.08em] text-ink-dim font-mono mb-1">Description</p>
                      <p className="text-[13px] text-ink/80 leading-relaxed">{bug.description}</p>
                    </div>
                  )}
                  {bug.steps && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[.08em] text-ink-dim font-mono mb-1">Steps to Reproduce</p>
                      <p className="text-[13px] text-ink/80 leading-relaxed whitespace-pre-wrap font-mono">{bug.steps}</p>
                    </div>
                  )}
                  {bug.status === 'open' && (
                    <>
                      <div>
                        <label className="text-[10px] uppercase tracking-[.08em] text-ink-dim font-mono mb-1 block">
                          Admin Notes
                        </label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Notes on this bug..."
                          rows={2}
                          className="w-full bg-bg border border-chip-border rounded-card px-3 py-2 text-[13px] text-ink outline-none focus:border-accent placeholder:text-ink-dim resize-none"
                        />
                      </div>
                      <button
                        onClick={() => handleClose(bug.id)}
                        disabled={saving}
                        className="w-full h-10 rounded-card bg-accent text-ink font-semibold text-[13px] active:scale-[.98] transition-transform disabled:opacity-40"
                      >
                        {saving ? 'Closing...' : 'Close Bug'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isDesktop && (
        <button onClick={() => navigate(-1)} className="mt-4 text-xs text-ink-mute hover:text-ink font-mono">
          ← Back
        </button>
      )}
    </div>
  );
}
