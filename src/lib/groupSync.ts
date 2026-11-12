// Re-imports the Entra (Azure AD) group members stored in rule tags
// ("Azure Group Owner is / is not a member of"). Each group is read once even
// when several tags use it.
import { fetchGroupMembers } from '../data/liveGroups';
import type { GroupMember, GroupSnapshot, Tag, TagCondition } from '../data/types';

/** Snapshots older than this are shown as stale. */
export const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export const groupConditions = (t: Tag): (TagCondition & { group: GroupSnapshot })[] =>
  (t.conditions ?? []).filter((c): c is TagCondition & { group: GroupSnapshot } => !!c.group);

export const hasGroups = (t: Tag) => groupConditions(t).length > 0;

/** Oldest member snapshot of the tag ('' when it has no group condition). */
export const oldestImport = (t: Tag) =>
  groupConditions(t)
    .map((c) => c.group.importedAt)
    .filter(Boolean)
    .sort()[0] ?? '';

export const isStale = (t: Tag) => {
  const at = oldestImport(t);
  return !!at && Date.now() - new Date(at).getTime() > STALE_AFTER_MS;
};

const memberKey = (m: GroupMember) => (m.upn || m.mail || m.name).toLowerCase();

export interface GroupSyncResult {
  /** Updated conditions per tag id (only tags whose groups all loaded, or partially loaded). */
  updates: Map<string, TagCondition[]>;
  groups: number;
  failed: { group: string; error: string }[];
  added: number;
  removed: number;
}

export async function syncTagGroups(tags: Tag[]): Promise<GroupSyncResult> {
  const unique = new Map<string, GroupSnapshot>();
  for (const t of tags) for (const c of groupConditions(t)) if (!unique.has(c.group.id)) unique.set(c.group.id, c.group);

  const fresh = new Map<string, GroupSnapshot>();
  const failed: GroupSyncResult['failed'] = [];
  let added = 0;
  let removed = 0;
  await Promise.all(
    [...unique.values()].map(async (old) => {
      try {
        const next = await fetchGroupMembers(old);
        fresh.set(old.id, next);
        const before = new Set(old.members.map(memberKey));
        const after = new Set(next.members.map(memberKey));
        added += [...after].filter((k) => !before.has(k)).length;
        removed += [...before].filter((k) => !after.has(k)).length;
      } catch (e) {
        failed.push({ group: old.name, error: e instanceof Error ? e.message : 'unknown error' });
      }
    }),
  );

  const updates = new Map<string, TagCondition[]>();
  for (const t of tags) {
    if (!groupConditions(t).some((c) => fresh.has(c.group.id))) continue;
    updates.set(
      t.id,
      (t.conditions ?? []).map((c) => (c.group && fresh.has(c.group.id) ? { ...c, group: fresh.get(c.group.id)! } : c)),
    );
  }
  return { updates, groups: fresh.size, failed, added, removed };
}

export function describeSync(r: GroupSyncResult): string {
  if (!r.groups && r.failed.length) return `Group sync failed: ${r.failed.map((f) => `${f.group} (${f.error})`).join(', ')}`;
  const changes = r.added || r.removed ? `+${r.added} / −${r.removed} members` : 'no membership changes';
  const failed = r.failed.length ? ` · ${r.failed.length} failed: ${r.failed.map((f) => f.group).join(', ')}` : '';
  return `${r.groups} Azure group${r.groups === 1 ? '' : 's'} synced across ${r.updates.size} tag${r.updates.size === 1 ? '' : 's'} · ${changes}${failed}`;
}
