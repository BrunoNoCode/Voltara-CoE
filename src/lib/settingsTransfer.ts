// Export / import of the monitor's browser-stored settings, so they can be moved to
// another device or shared with a colleague as a JSON file. Nothing goes to Dataverse.
import { readEnvMeta, readJson, writeJson, type EnvMeta } from '../data/liveEnvironments';
import type { ConditionField, ConditionOperator, GroupMember, GroupSnapshot, Tag, TagCategory, TagCondition } from '../data/types';
import { TAG_CATEGORIES } from './tagRules';
import { readHiddenOwners, readHideSystem } from './hideSystem';
import { ACTION_FIELDS, ACTION_KINDS, readActionRules, readEmailLogos, readEmailTemplates, type ActionCondition, type ActionRule, type EmailDesign, type EmailTemplate } from './actions';

const TAGS_KEY = 'ppm.tags.v1';
const FORMAT = 'power-platform-monitor-settings';
const VERSION = 1;

/** Environment settings that travel between devices (lastSynced is device-specific and stays behind). */
export type PortableEnvMeta = Omit<EnvMeta, 'lastSynced'>;

export interface SettingsFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  exportedBy?: string;
  tags: Tag[];
  environments: Record<string, PortableEnvMeta>;
  hideSystem: boolean;
  /** Owners hidden by "Hide MSFT-owned" (absent in files from older versions). */
  hiddenOwners?: string[];
  /** Action Center rules and e-mail templates (absent in files from older versions). */
  actionRules?: ActionRule[];
  emailTemplates?: EmailTemplate[];
  /** Uploaded e-mail logos referenced by template designs as `stored:<id>`. */
  emailLogos?: Record<string, string>;
}

export const readStoredTags = () => readJson<Tag[]>(TAGS_KEY);
export const writeStoredTags = (tags: Tag[]) => writeJson(TAGS_KEY, tags);

export function buildSettingsFile(tags: Tag[], exportedBy?: string): SettingsFile {
  const environments: Record<string, PortableEnvMeta> = {};
  for (const [id, m] of Object.entries(readEnvMeta())) {
    const { monitored, flags, name } = m;
    if (monitored !== undefined || flags || name) environments[id] = { monitored, flags, name };
  }
  return {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy,
    tags,
    environments,
    hideSystem: readHideSystem(),
    hiddenOwners: readHiddenOwners(),
    actionRules: readActionRules(),
    emailTemplates: readEmailTemplates(),
    emailLogos: readEmailLogos(),
  };
}

export function downloadSettingsFile(file: SettingsFile) {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pp-monitor-settings-${file.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

const FIELDS: ConditionField[] = ['Owner', 'Environment', 'Azure Group Owner'];
const OPERATORS: ConditionOperator[] = ['is', 'is not', 'contains'];
const CATEGORY_KEYS = new Set<string>(TAG_CATEGORIES.map((c) => c.key));
const optStr = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

function parseCategories(v: unknown): Tag['categories'] {
  if (v === 'all') return 'all';
  if (!Array.isArray(v)) return undefined;
  return v.filter((x): x is TagCategory => typeof x === 'string' && CATEGORY_KEYS.has(x));
}

function parseGroup(v: unknown): GroupSnapshot | undefined {
  if (!isObj(v) || typeof v.id !== 'string' || typeof v.name !== 'string') return undefined;
  const members = (Array.isArray(v.members) ? v.members : []).filter(isObj).flatMap((m): GroupMember[] => {
    if (typeof m.name !== 'string') return [];
    const mail = optStr(m.mail);
    const upn = optStr(m.upn);
    return [{ name: m.name, ...(mail ? { mail } : {}), ...(upn ? { upn } : {}) }];
  });
  return { id: v.id, name: v.name, members, importedAt: typeof v.importedAt === 'string' ? v.importedAt : '', ...(v.directOnly === true ? { directOnly: true } : {}) };
}

function parseConditions(v: unknown): TagCondition[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.filter(isObj).flatMap((c, i): TagCondition[] => {
    if (!FIELDS.includes(c.field as ConditionField)) return [];
    const group = parseGroup(c.group);
    return [
      {
        id: typeof c.id === 'string' ? c.id : `c-${i}`,
        field: c.field as ConditionField,
        operator: OPERATORS.includes(c.operator as ConditionOperator) ? (c.operator as ConditionOperator) : 'is',
        values: isStrArray(c.values) ? c.values : [],
        ...(group ? { group } : {}),
      },
    ];
  });
}

/** Parses and validates a settings file; throws with a readable message when it is not one. */
export function parseSettingsFile(text: string): SettingsFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('The file is not valid JSON.');
  }
  if (!isObj(raw) || raw.format !== FORMAT) throw new Error('This is not a settings file.');
  if (typeof raw.version !== 'number' || raw.version > VERSION) throw new Error('This settings file was made by a newer version of the app.');

  const tags: Tag[] = (Array.isArray(raw.tags) ? raw.tags : []).filter(isObj).flatMap((t): Tag[] =>
    typeof t.name === 'string' && t.name.trim() && (t.kind === 'resource' || t.kind === 'flag')
      ? [
          {
            id: typeof t.id === 'string' ? t.id : `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: t.name.trim(),
            description: typeof t.description === 'string' ? t.description : '',
            rule: typeof t.rule === 'string' ? t.rule : 'Manual',
            appliesTo: typeof t.appliesTo === 'string' ? t.appliesTo : 'All resources',
            resources: typeof t.resources === 'number' ? t.resources : 0,
            active: t.active !== false,
            kind: t.kind,
            // Rule-based resource tags (absent on legacy tags).
            ...(t.kind === 'resource' && parseCategories(t.categories) !== undefined
              ? { categories: parseCategories(t.categories), conditions: parseConditions(t.conditions) ?? [], match: t.match === 'any' ? ('any' as const) : ('all' as const) }
              : {}),
          },
        ]
      : [],
  );

  const environments: Record<string, PortableEnvMeta> = {};
  for (const [id, m] of Object.entries(isObj(raw.environments) ? raw.environments : {})) {
    if (!isObj(m)) continue;
    environments[id] = {
      monitored: typeof m.monitored === 'boolean' ? m.monitored : undefined,
      flags: isStrArray(m.flags) ? m.flags : undefined,
      name: typeof m.name === 'string' && m.name.trim() ? m.name.trim() : undefined,
    };
  }

  return {
    format: FORMAT,
    version: raw.version,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    exportedBy: typeof raw.exportedBy === 'string' ? raw.exportedBy : undefined,
    tags,
    environments,
    hideSystem: raw.hideSystem !== false,
    hiddenOwners: isStrArray(raw.hiddenOwners) ? raw.hiddenOwners : undefined,
    actionRules: parseActionRules(raw.actionRules),
    emailTemplates: parseEmailTemplates(raw.emailTemplates),
    emailLogos: parseEmailLogos(raw.emailLogos),
  };
}

function parseActionRules(v: unknown): ActionRule[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const now = new Date().toISOString();
  return v.filter(isObj).flatMap((r): ActionRule[] => {
    const action = isObj(r.action) ? r.action : undefined;
    if (typeof r.id !== 'string' || typeof r.name !== 'string' || !r.name.trim() || !action || !ACTION_KINDS.includes(action.kind as ActionRule['action']['kind'])) return [];
    const conditions = (Array.isArray(r.conditions) ? r.conditions : [])
      .filter(isObj)
      .filter((c) => typeof c.id === 'string' && ACTION_FIELDS.includes(c.field as ActionCondition['field']) && typeof c.operator === 'string')
      .map((c) => ({ ...(c as unknown as ActionCondition), values: isStrArray(c.values) ? c.values : [] }));
    return [
      {
        id: r.id,
        name: r.name.trim(),
        description: typeof r.description === 'string' ? r.description : '',
        envIds: isStrArray(r.envIds) ? r.envIds : [],
        types: isStrArray(r.types) ? (r.types as ActionRule['types']) : [],
        conditions,
        match: r.match === 'any' ? 'any' : 'all',
        excludeSystem: r.excludeSystem !== false,
        action: action as unknown as ActionRule['action'],
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : now,
        updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : now,
        evaluations: Array.isArray(r.evaluations) ? (r.evaluations.filter(isObj) as unknown as ActionRule['evaluations']) : [],
      },
    ];
  });
}

function parseEmailTemplates(v: unknown): EmailTemplate[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.filter(isObj).flatMap((t): EmailTemplate[] =>
    typeof t.id === 'string' && typeof t.name === 'string' && t.name.trim() && typeof t.subject === 'string' && typeof t.body === 'string'
      ? [
          {
            id: t.id,
            name: t.name.trim(),
            subject: t.subject,
            body: t.body,
            updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : new Date().toISOString(),
            ...(isObj(t.design) ? { design: t.design as unknown as EmailDesign } : {}),
          },
        ]
      : [],
  );
}

function parseEmailLogos(v: unknown): Record<string, string> | undefined {
  if (!isObj(v)) return undefined;
  const logos: Record<string, string> = {};
  for (const [id, src] of Object.entries(v)) if (typeof src === 'string' && src.startsWith('data:image/')) logos[id] = src;
  return logos;
}

/** Imported tags win over existing ones with the same name and kind; other existing tags are kept. */
export function mergeTags(current: Tag[], imported: Tag[]): Tag[] {
  const keyOf = (t: Tag) => `${t.kind}:${t.name.toLowerCase()}`;
  const incoming = new Map(imported.map((t) => [keyOf(t), t]));
  const merged = current.map((t) => {
    const next = incoming.get(keyOf(t));
    if (!next) return t;
    incoming.delete(keyOf(t));
    return { ...next, id: t.id };
  });
  return [...merged, ...incoming.values()];
}
