import { useEffect, useState } from 'react';
import { fmtAgo } from '../lib/format';

const HOUR_MS = 60 * 60 * 1000;

/** "Last synced 5 min ago" next to a Sync button; re-renders every minute so the age stays current. */
export function SyncInfo({ at, oldest, missing = 0, title }: { at?: string; oldest?: string; missing?: number; title?: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);
  const parts = [at ? `Last synced ${fmtAgo(at).toLowerCase()}` : 'Not synced yet'];
  if (at && oldest && new Date(at).getTime() - new Date(oldest).getTime() > HOUR_MS) parts.push(`oldest ${fmtAgo(oldest).toLowerCase()}`);
  if (at && missing > 0) parts.push(`${missing} not synced yet`);
  return (
    <span className="sync-info small muted" title={title}>
      {parts.join(' · ')}
    </span>
  );
}
