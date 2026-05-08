import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { submitBugReport } from '../lib/bugReports';
import { useIsDesktop } from '../hooks/useIsDesktop';

interface ReportBugModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ReportBugModal({ open, onClose }: ReportBugModalProps) {
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    const autoTitle = description.trim().slice(0, 80);
    const { error: err } = await submitBugReport({
      reporter_id: user.id,
      title: autoTitle,
      description: description.trim(),
      steps: steps.trim(),
    });
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      setDone(true);
      setTimeout(() => {
        onClose();
        setDescription('');
        setSteps('');
        setDone(false);
      }, 1500);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[10001] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed z-[10002] bg-surface border border-chip-border shadow-panel p-5 flex flex-col gap-4 ${
              isDesktop
                ? 'inset-x-0 mx-auto top-[15%] max-w-[420px] rounded-card'
                : 'inset-x-4 bottom-[72px] rounded-t-card rounded-b-card'
            }`}
            initial={isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {done ? (
              <div className="text-center py-6">
                <p className="text-accent text-lg font-semibold mb-1">Thanks!</p>
                <p className="text-ink-mute text-sm">Bug report submitted.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-[18px] text-ink">Report a Bug</h2>
                  <button onClick={onClose} className="text-ink-mute hover:text-ink text-lg leading-none">✕</button>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[.08em] text-ink-dim font-mono mb-1.5">
                    Describe the bug
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the bug..."
                    rows={3}
                    maxLength={500}
                    className="w-full bg-bg border border-chip-border rounded-card px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent placeholder:text-ink-dim resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[.08em] text-ink-dim font-mono mb-1.5">
                    Steps to reproduce
                  </label>
                  <textarea
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    placeholder="1. I went to...\n2. I tapped on...\n3. Something broke"
                    rows={3}
                    maxLength={500}
                    className="w-full bg-bg border border-chip-border rounded-card px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent placeholder:text-ink-dim resize-none"
                  />
                </div>

                {error && (
                  <p className="text-[12px] text-red-400 font-mono">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!description.trim() || submitting}
                  className="w-full h-11 rounded-card bg-accent text-ink font-semibold text-[14px] active:scale-[.98] transition-transform disabled:opacity-40"
                >
                  {submitting ? 'Submitting...' : 'Submit Bug Report'}
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
