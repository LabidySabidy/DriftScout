import { supabase } from '../lib/supabase';

export interface BugReport {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  steps: string;
  status: 'open' | 'closed';
  admin_notes: string;
  created_at: string;
  closed_at: string | null;
}

export async function submitBugReport({
  reporter_id,
  title,
  description,
  steps,
}: {
  reporter_id: string;
  title: string;
  description: string;
  steps: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('bug_reports').insert({
    reporter_id,
    title,
    description,
    steps,
  });
  return { error: error?.message ?? null };
}

export async function fetchBugReports(): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bug reports:', error);
    return [];
  }
  return data as BugReport[];
}

export async function updateBugReport(
  id: string,
  updates: { status?: 'open' | 'closed'; admin_notes?: string },
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = { ...updates };
  if (updates.status === 'closed') {
    payload.closed_at = new Date().toISOString();
  }
  const { error } = await supabase.from('bug_reports').update(payload).eq('id', id);
  return { error: error?.message ?? null };
}
