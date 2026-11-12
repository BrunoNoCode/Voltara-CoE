// Rule-based resource tags: which resources a tag applies to, evaluated in the
// browser against the resources already loaded (nothing is stored per resource).
import type { Environment, Resource, ResourceType, Tag, TagCategory, TagCondition } from '../data/types';

export const TAG_CATEGORIES: { key: TagCategory; types: ResourceType[] }[] = [
  { key: 'Cloud / Desktop Flow', types: ['Cloud Flow', 'Desktop Flow'] },
  { key: 'Scheduled Flow', types: ['Scheduled Flow'] },
  { key: 'Agent Flow', types: ['Agent Flow'] },
  { key: 'Canvas App', types: ['Canvas App'] },
  { key: 'Model-Driven App', types: ['Model-driven App'] },
  { key: 'Code App', types: ['Code App'] },
  { key: 'AI Model', types: ['AI Model'] },
  { key: 'Dataverse Tables', types: ['Dataverse Table'] },
  { key: 'Copilot Studio', types: ['Copilot Studio'] },
];

/** True for tags created with the rule builder (as opposed to the legacy demo tags). */
export const isRuleTag = (t: Tag) => t.kind === 'resource' && t.categories !== undefined;

function typesOf(categories: Tag['categories']): Set<ResourceType> | null {
  if (!categories || categories === 'all') return null;
  return new Set(TAG_CATEGORIES.filter((c) => categories.includes(c.key)).flatMap((c) => c.types));
}

const norm = (s: string | undefined) => (s ?? '').trim().toLowerCase();

/** Owner tag values are e-mail addresses; display names differ per source and are never matched. */
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+$/.test(s.trim());

/** The owner's e-mail and UPN (in Entra ID the UPN is usually the e-mail too). */
const ownerMails = (r: Resource) => [r.ownerEmail, r.ownerUpn].map(norm).filter(Boolean);

function conditionMatches(c: TagCondition, r: Resource): boolean {
  let hit: boolean;
  switch (c.field) {
    case 'Owner': {
      const values = c.values.map(norm).filter(Boolean);
      if (values.length === 0) return true;
      const mails = ownerMails(r);
      hit = c.operator === 'contains' ? values.some((v) => mails.some((m) => m.includes(v))) : values.some((v) => mails.includes(v));
      break;
    }
    case 'Environment':
      if (c.values.length === 0) return true;
      hit = c.values.includes(r.envId);
      break;
    case 'Azure Group Owner': {
      if (!c.group) return true;
      hit = memberIndex(c).has(r);
      break;
    }
  }
  return c.operator === 'is not' ? !hit : hit;
}

// Lookup sets per condition, built once per group snapshot.
const indexCache = new WeakMap<TagCondition, { has: (r: Resource) => boolean }>();
function memberIndex(c: TagCondition) {
  let idx = indexCache.get(c);
  if (!idx) {
    const ids = new Set<string>();
    const names = new Set<string>();
    for (const m of c.group?.members ?? []) {
      if (m.mail) ids.add(norm(m.mail));
      if (m.upn) ids.add(norm(m.upn));
      if (m.name) names.add(norm(m.name));
    }
    idx = {
      // E-mail / UPN is reliable; the display name is the fallback for rows cached before e-mails were read.
      has: (r) =>
        (!!r.ownerEmail && ids.has(norm(r.ownerEmail))) ||
        (!!r.ownerUpn && ids.has(norm(r.ownerUpn))) ||
        (!r.ownerEmail && !r.ownerUpn && names.has(norm(r.owner))),
    };
    indexCache.set(c, idx);
  }
  return idx;
}

/** Builds a matcher for one rule-based tag. Inactive or legacy tags never match. */
export function tagMatcher(tag: Tag): (r: Resource) => boolean {
  if (!isRuleTag(tag) || !tag.active) return () => false;
  const types = typesOf(tag.categories);
  const conditions = tag.conditions ?? [];
  const any = tag.match === 'any';
  return (r) => {
    if (types && !types.has(r.type)) return false;
    if (conditions.length === 0) return true;
    return any ? conditions.some((c) => conditionMatches(c, r)) : conditions.every((c) => conditionMatches(c, r));
  };
}

/** Adds the names of matching active rule-based tags to each resource's tags. */
export function applyRuleTags(resources: Resource[], tags: Tag[]): Resource[] {
  const matchers = tags.filter((t) => isRuleTag(t) && t.active).map((t) => ({ name: t.name, test: tagMatcher(t) }));
  if (matchers.length === 0) return resources;
  return resources.map((r) => {
    const extra = matchers.filter((m) => m.test(r) && !r.tags.includes(m.name)).map((m) => m.name);
    return extra.length ? { ...r, tags: [...r.tags, ...extra] } : r;
  });
}

export function describeCategories(categories: Tag['categories']): string {
  if (!categories || categories === 'all') return 'All resources';
  return categories.join(', ');
}

export function describeCondition(c: TagCondition, envs: Environment[]): string {
  switch (c.field) {
    case 'Owner':
      return `Owner ${c.operator} ${c.values.join(' or ')}`;
    case 'Environment': {
      const names = c.values.map((id) => envs.find((e) => e.id === id)?.name ?? id);
      return `Environment ${c.operator} ${names.join(' or ')}`;
    }
    case 'Azure Group Owner':
      return `Owner ${c.operator === 'is not' ? 'not in' : 'in'} group ${c.group?.name ?? '?'}`;
  }
}

/** Short rule summary stored on the tag (shown in the table and kept in exported files). */
export function describeRule(conditions: TagCondition[], match: Tag['match']): string {
  if (conditions.length === 0) return 'Type only';
  const fields = [...new Set(conditions.map((c) => c.field))].join(match === 'any' ? ' or ' : ' + ');
  return conditions.length > 1 ? `${fields} (${conditions.length} conditions)` : fields;
}
