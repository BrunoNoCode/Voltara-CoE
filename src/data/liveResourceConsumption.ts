// Copilot Credits consumed per resource (agent / agent flow). Read from the licensing resourceThresholds API
// (current consumption per resourceId), or imported from the report downloaded in the Power Platform admin
// center (Licensing › Copilot Studio › environment › Copilot credit consumption details › Download), read in
// the browser (CSV, or gzip-compressed CSV). Cached per environment in localStorage.
import { getClient } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo';
import { PowerPlatformforAdminsV2Service } from '../generated/services/PowerPlatformforAdminsV2Service';
import { readJson, writeJson } from './liveEnvironments';
import { apiVersionsToTry, creditAmount, rememberApiVersion, saveThresholds, thresholdFromRow, type ResourceThreshold, type ThresholdCache } from './liveThresholds';
import type { Environment, Resource } from './types';

const cacheKey = (envId: string) => `ppm.resourceConsumption.import.${envId}.v1`;

export interface FeatureCredits {
  /** Billed Copilot Credits. Non-billed credits are ignored. */
  consumed: number;
}

export interface ResourceCredits {
  /** Billed Copilot Credits (sum of every report line for the resource). */
  consumed: number;
  /** The report has one line per product / feature (and per day): the same agent appears several times. */
  byFeature: Record<string, FeatureCredits>;
  /** Agent name in the report. */
  name?: string;
}

export interface ResourceConsumption {
  savedAt: string;
  /** Period covered by the report (yyyy-mm-dd), when it has a date column. */
  from?: string;
  to?: string;
  fileName?: string;
  /** Lookback of the report in days (from the file name suffix, e.g. `…_MCSMessages_30.csv` = last 30 days). */
  lookbackDays?: number;
  /** Per resource: lowercase resource id, or `name:<lowercase agent name>` when the report has no id column. */
  byResource: Record<string, ResourceCredits>;
  error?: string;
}

export function monthLabel(now = new Date()) {
  return now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // "Oct 2026", whatever the browser locale
}

export function cachedResourceConsumption(envId: string): ResourceConsumption | null {
  return readJson<ResourceConsumption>(cacheKey(envId));
}

export function saveResourceConsumption(envId: string, data: ResourceConsumption | null) {
  writeJson(cacheKey(envId), data);
}

/** Period covered by a report: 'last 30 days', the date range of its lines, or '' when unknown. */
export function periodOf(c: ResourceConsumption): string {
  if (c.lookbackDays) return `last ${c.lookbackDays} days`;
  return c.from && c.to ? `${c.from} – ${c.to}` : '';
}

/** Looks up a resource's credits: by id first, then by name. */
export function creditsOf(c: ResourceConsumption, r: Resource): ResourceCredits | undefined {
  return c.byResource[r.id.toLowerCase()] ?? c.byResource[`name:${r.name.trim().toLowerCase()}`];
}

/** Readable text of a connector error (the SDK returns plain { message, status } objects, not Errors). */
export function errorText(err: unknown, fallback = 'Licensing request failed'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const e = err as { message?: unknown; status?: unknown };
    const message = typeof e.message === 'string' && e.message ? e.message : '';
    const status = typeof e.status === 'number' ? `HTTP ${e.status}` : '';
    const text = [status, message].filter(Boolean).join(': ');
    if (text) return text;
    try {
      return JSON.stringify(err).slice(0, 300);
    } catch {
      return fallback;
    }
  }
  return String(err);
}

// ---------- Report parsing ----------

/** Reads a file as text, decompressing gzip (.csv.gz) when needed. */
async function fileText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) throw new Error('This looks like an Excel file: download or save the report as CSV.');
  return new TextDecoder().decode(bytes);
}

/** Minimal CSV parser (quoted fields, escaped quotes, CRLF); the delimiter is detected from the header line. */
function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '');
  const firstLine = src.slice(0, src.indexOf('\n') >>> 0);
  const delim = [',', ';', '\t'].map((d) => [d, firstLine.split(d).length] as const).sort((a, b) => b[1] - a[1])[0]![0];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

/** Parses "1,234.5", "1.234,5", "1 234" or "12.5" into a number. */
function parseNum(s: string | undefined): number {
  if (!s) return 0;
  let t = s.replace(/[\s\u00A0']/g, '');
  const comma = t.lastIndexOf(',');
  const dot = t.lastIndexOf('.');
  if (comma > -1 && dot > -1) t = comma > dot ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  else if (comma > -1) t = /,\d{3}$/.test(t) && t.split(',').length > 1 && !/^0,/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Finds the first header matching one of the tests (in priority order). */
function col(headers: string[], ...tests: ((h: string) => boolean)[]) {
  for (const test of tests) {
    const i = headers.findIndex(test);
    if (i > -1) return i;
  }
  return -1;
}

const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export interface ImportResult {
  /** Per environment id. */
  byEnv: Record<string, ResourceConsumption>;
  rows: number;
  /** Rows skipped because their environment could not be identified. */
  skipped: number;
  columns: string[];
  /** One-line outcome for the UI (what the API returned and what was matched). */
  note?: string;
  /** Threshold rows read from the resourceThresholds API (resourceConsumption per resourceId). */
  thresholds?: ThresholdCache;
}

/**
 * Parses one or more admin center consumption reports. Rows are assigned to an environment by the report's
 * environment id / name column, or to `fallbackEnv` when the report has no environment column.
 */
export async function importConsumptionReports(files: File[], environments: Environment[], fallbackEnv?: Environment): Promise<ImportResult> {
  const envById = new Map(environments.map((e) => [e.id.toLowerCase(), e]));
  const envByName = new Map(environments.map((e) => [e.name.trim().toLowerCase(), e]));
  const out: ImportResult = { byEnv: {}, rows: 0, skipped: 0, columns: [] };

  for (const file of files) {
    const table = parseCsv(await fileText(file));
    // The header is the first line with a credits column (reports may start with title lines).
    const headerAt = table.findIndex((r) => r.some((h) => /credit|consum|billed/i.test(h)));
    if (headerAt < 0) throw new Error(`${file.name}: no credits column found.`);
    const raw = table[headerAt]!;
    const h = raw.map(norm);
    out.columns = raw.map((c) => c.trim());

    const iBilled = col(
      h,
      (x) => /^billed/.test(x) || (/bill/.test(x) && !/non ?bill/.test(x) && /credit/.test(x)),
      (x) => /consum/.test(x) && !/non ?bill/.test(x),
      (x) => /credit/.test(x) && !/non ?bill/.test(x),
    );
    const iResId = col(
      h,
      (x) => /(agent|resource|bot|flow) id/.test(x),
      (x) => x === 'resourceid' || x === 'id',
    );
    const iName = col(
      h,
      (x) => /(agent|resource|bot|flow) name/.test(x),
      (x) => x === 'agent' || x === 'resource' || x === 'name',
    );
    const iEnvId = col(h, (x) => /environment id/.test(x));
    const iEnvName = col(
      h,
      (x) => /environment name/.test(x),
      (x) => x === 'environment',
    );
    const iProduct = col(h, (x) => /^product/.test(x) && !/feature/.test(x));
    const iFeature = col(
      h,
      (x) => /feature/.test(x),
      (x) => /^product/.test(x),
    );
    const iDate = col(h, (x) => /date|day/.test(x));
    // Admin center report files end with the lookback in days: `…PerAgentDetailsReport_MCSMessages_30.csv`.
    const lookbackDays = Number(file.name.match(/_(\d{1,3})(?:\.csv)?(?:\.gz)?$/i)?.[1]) || undefined;
    if (iBilled < 0) throw new Error(`${file.name}: no billed credits column found.`);
    if (iResId < 0 && iName < 0) throw new Error(`${file.name}: no agent id or agent name column found.`);

    for (const r of table.slice(headerAt + 1)) {
      const envIdCell = iEnvId > -1 ? (r[iEnvId] ?? '').match(GUID)?.[0]?.toLowerCase() : undefined;
      const env =
        (envIdCell && envById.get(envIdCell)) || (iEnvName > -1 ? envByName.get((r[iEnvName] ?? '').trim().toLowerCase()) : undefined) || (iEnvId < 0 && iEnvName < 0 ? fallbackEnv : undefined);
      if (!env) {
        out.skipped++;
        continue;
      }
      const resId = iResId > -1 ? (r[iResId] ?? '').match(GUID)?.[0]?.toLowerCase() : undefined;
      const name = iName > -1 ? (r[iName] ?? '').trim() : '';
      const key = resId ?? (name ? `name:${name.toLowerCase()}` : '');
      if (!key) continue;

      const c = (out.byEnv[env.id] ??= { savedAt: new Date().toISOString(), fileName: file.name, lookbackDays, byResource: {} });
      // An agent has one line per product / feature / channel / tool…: its billed credits are summed.
      const entry = (c.byResource[key] ??= { consumed: 0, byFeature: {}, name: name || undefined });
      if (name && !entry.name) entry.name = name;
      const billed = parseNum(r[iBilled]);
      entry.consumed += billed;
      const product = iProduct > -1 && iProduct !== iFeature ? (r[iProduct] ?? '').trim() : '';
      const feature = iFeature > -1 ? (r[iFeature] ?? '').trim() : '';
      const f = (entry.byFeature[[product, feature].filter(Boolean).join(' · ') || 'Other'] ??= { consumed: 0 });
      f.consumed += billed;

      const d = iDate > -1 ? Date.parse(r[iDate] ?? '') : NaN;
      if (!Number.isNaN(d)) {
        const day = new Date(d).toISOString().slice(0, 10);
        if (!c.from || day < c.from) c.from = day;
        if (!c.to || day > c.to) c.to = day;
      }
      out.rows++;
    }
  }
  for (const [envId, c] of Object.entries(out.byEnv)) saveResourceConsumption(envId, c);
  return out;
}

// ---------- Automatic report (experimental) ----------

const REPORT = 'FeatureDetailsPerResource';
const REPORT_API_VERSIONS = ['2024-10-01', '2022-03-01-preview'];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dump = (v: unknown, max = 1500) => {
  try {
    return JSON.stringify(v, (_k, x) => (typeof x === 'string' && x.length > 400 ? `${x.slice(0, 400)}… (${x.length} chars)` : x)).slice(0, max);
  } catch {
    return String(v).slice(0, max);
  }
};

/** Bytes of a downloaded file: the connector may return base64, a { $content } envelope or a binary string. */
function downloadBytes(data: unknown): Uint8Array<ArrayBuffer> {
  let s = data as unknown;
  if (s && typeof s === 'object' && '$content' in (s as Record<string, unknown>)) s = (s as Record<string, unknown>)['$content'];
  if (typeof s !== 'string') throw new Error(`Unexpected download content: ${dump(data, 300)}`);
  const compact = s.replace(/\s/g, '');
  if (compact.length % 4 === 0 && /^[A-Za-z0-9+/]+=*$/.test(compact)) {
    const bin = atob(compact);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }
  return Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);
}

/**
 * Step 0: the direct call used by the copilot-credit-alerts flow (GET /licensing/entitlements/MCSMessages/resources,
 * yyyy-MM-dd dates, no page size). Returns null when it fails, so the report route is tried next.
 */
async function fetchTenantResources(environments: Environment[], fromDate: string, toDate: string, log: (line: string) => void): Promise<ImportResult | null> {
  const envById = new Map(environments.map((e) => [e.id.toLowerCase(), e]));
  const out: ImportResult = { byEnv: {}, rows: 0, skipped: 0, columns: ['API: resourceId', 'environmentId', 'consumed', 'metadata'] };
  let token: string | undefined;
  for (let page = 1; page <= 50; page++) {
    log(`0. GetTenantResourcesAcrossEnvironments MCSMessages ${fromDate} → ${toDate} (api-version 2024-10-01, no page size)${token ? `, page ${page}` : ''}…`);
    let r;
    try {
      r = await PowerPlatformforAdminsV2Service.GetTenantResourcesAcrossEnvironments('MCSMessages', fromDate, toDate, '2024-10-01', undefined, token);
    } catch (err) {
      log(`   Threw: ${errorText(err)}`);
      return null;
    }
    if (!r.success) {
      log(`   Failed: ${errorText(r.error)}`);
      log(`   Response: ${dump(r)}`);
      return null;
    }
    const rows = r.data?.value ?? [];
    log(`   OK: ${rows.length} rows. First: ${dump(rows[0] ?? null, 600)}`);
    for (const row of rows) {
      const env = envById.get((row.environmentId ?? '').toLowerCase());
      const resId = row.resourceId?.toLowerCase();
      if (!env || !resId) {
        out.skipped++;
        continue;
      }
      const meta = row.metadata ?? {};
      const billed = Math.max(0, (row.consumed ?? 0) - (Number(meta['nonBillableConsumed'] ?? 0) || 0));
      const c = (out.byEnv[env.id] ??= { savedAt: new Date().toISOString(), from: fromDate, to: toDate, fileName: 'Licensing API', byResource: {} });
      const entry = (c.byResource[resId] ??= { consumed: 0, byFeature: {} });
      entry.consumed += billed;
      const label = [meta['ProductName'] ?? meta['productName'], meta['Feature'] ?? meta['feature']].filter((x) => typeof x === 'string' && x).join(' · ') || 'Other';
      const f = (entry.byFeature[label] ??= { consumed: 0 });
      f.consumed += billed;
      out.rows++;
    }
    token = r.data?.continuationtoken || undefined;
    if (!token) break;
  }
  for (const [envId, c] of Object.entries(out.byEnv)) saveResourceConsumption(envId, c);
  log(`   Imported ${out.rows} rows in ${Object.keys(out.byEnv).length} environments (${out.skipped} skipped: other environments or no id).`);
  return out;
}

// ---------- Resource thresholds (current consumption per resource) ----------

const thresholdsClient = getClient(dataSourcesInfo);

/** Rows and continuation of a thresholds page: a plain array, or { value, continuationToken | nextLink }. */
function thresholdsPage(data: unknown): { rows: Record<string, unknown>[]; token?: string } {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return { rows: [] };
    }
  }
  if (Array.isArray(data)) return { rows: data as Record<string, unknown>[] };
  let d = (data ?? {}) as Record<string, unknown>;
  // Some SDK versions wrap the body once more ({ data: {...} } or { body: {...} }).
  for (const k of ['data', 'body', 'Body']) if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) d = d[k] as Record<string, unknown>;
  const list = ['value', 'items', 'resourceThresholds', 'resources', 'results', 'data'].map((k) => d[k]).find(Array.isArray) ?? Object.values(d).find(Array.isArray) ?? [];
  const rows = list as Record<string, unknown>[];
  const raw = [d.continuationToken, d.continuationtoken, d.ContinuationToken, d.nextLink, d['@odata.nextLink']].find((x) => typeof x === 'string' && x) as string | undefined;
  if (!raw || !/^https?:/i.test(raw)) return { rows, token: raw };
  const url = new URL(raw);
  return { rows, token: url.searchParams.get('continuationToken') ?? url.searchParams.get('$skiptoken') ?? url.searchParams.get('skipToken') ?? undefined };
}

/**
 * Current Copilot Credit consumption of every resource in the tenant (GET /licensing/entitlements/MCSMessages/resourceThresholds),
 * matched to agents / agent flows by resourceId and saved per environment. Monitored environments without any row get an empty
 * result (nothing consumed). Returns null when the call fails; the cached data is then kept.
 */
export async function fetchResourceThresholds(environments: Environment[], log: (line: string) => void = () => {}): Promise<ImportResult | null> {
  const envById = new Map(environments.map((e) => [e.id.toLowerCase(), e]));
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  const savedAt = now.toISOString();
  const out: ImportResult = { byEnv: {}, rows: 0, skipped: 0, columns: ['API: resourceId', 'environmentId', 'resourceConsumption', 'limit'] };
  const seen = new Set<string>();
  let token: string | undefined;
  let total = 0;
  let firstEmpty = '';
  const versions = apiVersionsToTry();
  let version = versions[0];
  const byKey = new Map<string, ResourceThreshold>();
  let merged = 0;
  let withCredits = 0;
  let monitoredWithCredits = 0;
  const creditSamples: string[] = [];
  const otherSamples: string[] = [];
  for (let page = 1; page <= 50; page++) {
    let r;
    // The first page picks the api-version that works; next pages keep it.
    for (const v of page === 1 ? versions : [version]) {
      log(`Resource thresholds MCSMessages (api-version ${v})${token ? `, page ${page}` : ''}…`);
      const params: Record<string, string> = { entitlementId: 'MCSMessages', 'api-version': v, ...(token ? { continuationToken: token } : {}) };
      try {
        r = await thresholdsClient.executeAsync<Record<string, string>, unknown>({
          connectorOperation: { tableName: 'powerplatformadminv2', operationName: 'GetAllResourceThresholds', parameters: params },
        });
      } catch (err) {
        log(`   Threw: ${errorText(err)}`);
        r = undefined;
        continue;
      }
      if (!r.success) {
        log(`   Failed: ${errorText(r.error)}`);
        continue;
      }
      version = v;
      break;
    }
    if (!r || !r.success) return null;
    if (page === 1) rememberApiVersion(version);
    const { rows, token: next } = thresholdsPage(r.data);
    log(`   OK: ${rows.length} rows${next ? ' (more pages)' : ''}. First: ${dump(rows[0] ?? null, 600)}`);
    if (page === 1 && !rows.length) firstEmpty = dump(r.data, 300);
    total += rows.length;
    let fresh = 0;
    for (const row of rows) {
      // Identical rows (a page sent twice) are skipped; other rows of the same resource are merged (credits summed).
      const sig = JSON.stringify(row);
      if (seen.has(sig)) continue;
      seen.add(sig);
      fresh++;
      const resId = str(field(row, 'resourceId')).toLowerCase().replace(/[{}]/g, '').trim();
      const envId = str(field(row, 'environmentId')).toLowerCase().replace(/[{}]/g, '').trim();
      const key = `${envId}:${resId}`;
      const consumed = creditAmount(field(row, 'resourceConsumption'));
      const env = envById.get(envId);
      if (consumed > 0) {
        withCredits++;
        if (env) {
          monitoredWithCredits++;
          if (creditSamples.length < 5) creditSamples.push(`${env.name}: ${resId} = ${consumed} credits`);
        } else if (otherSamples.length < 3) otherSamples.push(`${envId || '(no env)'}: ${resId} = ${consumed} credits`);
      }
      const prev = resId && envId ? byKey.get(key) : undefined;
      if (prev) {
        merged++;
        const t = thresholdFromRow(row, field);
        prev.consumption += t.consumption;
        if (t.limit > prev.limit) prev.limit = t.limit;
        prev.stopResource ||= t.stopResource;
      } else if (resId && envId) byKey.set(key, thresholdFromRow(row, field));
      if (!env || !resId) {
        if (!prev) out.skipped++;
        continue;
      }
      const c = (out.byEnv[env.id] ??= { savedAt, from, to, fileName: 'Licensing API (resource thresholds)', byResource: {} });
      if (!c.byResource[resId]) out.rows++;
      const entry = (c.byResource[resId] ??= { consumed: 0, byFeature: {} });
      entry.consumed += consumed;
      const f = (entry.byFeature['Copilot Credits (current period)'] ??= { consumed: 0 });
      f.consumed += consumed;
    }
    // Stop when there is no continuation, or the API ignored it and sent the same page again.
    if (!next || next === token || !fresh) break;
    token = next;
  }
  log(`   Rows with resourceConsumption > 0: ${withCredits} (${monitoredWithCredits} in monitored environments). Rows of the same resource merged: ${merged}.`);
  creditSamples.forEach((s) => log(`     monitored: ${s}`));
  if (!monitoredWithCredits) otherSamples.forEach((s) => log(`     NOT monitored (environment not in the list): ${s}`));
  out.thresholds = saveThresholds([...byKey.values()]);
  if (!out.thresholds.persisted) log('   Browser storage is full: the consumption is shown, but not kept after a reload.');
  if (out.rows || out.skipped) for (const env of environments) out.byEnv[env.id] ??= { savedAt, from, to, fileName: 'Licensing API (resource thresholds)', byResource: {} };
  for (const [envId, c] of Object.entries(out.byEnv)) saveResourceConsumption(envId, c);
  log(`   Saved ${out.rows} resources in ${Object.keys(out.byEnv).length} environments (${out.skipped} skipped: other environments or no id).`);
  out.note = total
    ? `resource thresholds: ${total} rows, ${out.rows} in monitored environments${out.skipped ? `, ${out.skipped} elsewhere / without id` : ''}`
    : `resource thresholds returned no rows (${firstEmpty || 'empty'})`;
  return out;
}

/** Field of an API row, whatever the casing of its name; also looked up in nested objects (e.g. "properties"). */
function field(row: Record<string, unknown>, name: string, depth = 0): unknown {
  if (name in row) return row[name];
  const lower = name.toLowerCase();
  const key = Object.keys(row).find((k) => k.toLowerCase() === lower);
  if (key) return row[key];
  if (depth >= 2) return undefined;
  for (const v of Object.values(row))
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const found = field(v as Record<string, unknown>, name, depth + 1);
      if (found !== undefined) return found;
    }
  return undefined;
}

const str = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

/**
 * Tries to generate, poll and download the admin center report through the connector (tenant-wide, month to date).
 * The API returns the operation id only in the Location header, which the SDK does not expose; this looks for it in
 * whatever the SDK returns and logs every step so the result can be diagnosed.
 */
export async function fetchLicensingReport(environments: Environment[], log: (line: string) => void): Promise<ImportResult | null> {
  const svc = PowerPlatformforAdminsV2Service;
  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const endDate = now.toISOString().slice(0, 10);

  const thresholds = await fetchResourceThresholds(environments, log);
  if (thresholds && thresholds.rows) return thresholds;

  const direct = await fetchTenantResources(environments, startDate, endDate, log);
  if (direct) return direct;

  let apiVersion = '';
  let generated: unknown;
  for (const v of REPORT_API_VERSIONS) {
    log(`1. GenerateLicensingReport ${REPORT} ${startDate} → ${endDate} (Summary, api-version ${v})…`);
    try {
      const r = await svc.GenerateLicensingReport(REPORT, v, { startDate, endDate, granularity: 'Summary' });
      log(`   Response: ${dump(r)}`);
      if (r.success) {
        apiVersion = v;
        generated = r;
        break;
      }
      log(`   Failed: ${errorText(r.error)}`);
    } catch (err) {
      log(`   Threw: ${errorText(err)}`);
    }
  }
  if (!apiVersion) {
    log('Stopped: the report could not be started.');
    return null;
  }

  // The operation id: a GUID anywhere in the response (Location URL, body, headers if the runtime passes them).
  const opId = dump(generated, 100000).match(/operations\/([0-9a-f-]{36})/i)?.[1] ?? dump(generated, 100000).match(GUID)?.[0];
  if (!opId) {
    log('Stopped: the report was started, but the response contains no operation id (it is only in the Location header, which the SDK does not return).');
    return null;
  }
  log(`2. Candidate operation id: ${opId}. Polling GetLicensingReportOperation…`);

  let fileName = '';
  for (let i = 0; i < 60 && !fileName; i++) {
    const r = await svc.GetLicensingReportOperation(REPORT, opId, apiVersion);
    const status = r.data?.status ?? '';
    log(`   ${i + 1}: ${r.success ? status || dump(r.data, 300) : `failed: ${errorText(r.error)}`}`);
    if (!r.success) return null;
    if (/succeeded/i.test(status)) fileName = r.data?.fileName ?? '';
    else if (/failed/i.test(status)) {
      log(`Stopped: report generation failed: ${r.data?.error ?? ''}`);
      return null;
    } else await sleep(5000);
  }
  if (!fileName) {
    log('Stopped: the report was not ready after 5 minutes.');
    return null;
  }

  log(`3. DownloadLicensingReportFile ${fileName}…`);
  const d = await svc.DownloadLicensingReportFile(REPORT, fileName, apiVersion);
  if (!d.success) {
    log(`Stopped: download failed: ${errorText(d.error)}`);
    return null;
  }
  const bytes = downloadBytes(d.data);
  log(`   ${bytes.length} bytes (${bytes[0] === 0x1f && bytes[1] === 0x8b ? 'gzip' : 'not gzip'}).`);
  const result = await importConsumptionReports([new File([bytes], fileName)], environments);
  for (const [envId, c] of Object.entries(result.byEnv)) {
    c.from ??= startDate;
    c.to ??= endDate;
    saveResourceConsumption(envId, c);
  }
  log(`4. Imported ${result.rows} lines in ${Object.keys(result.byEnv).length} environments (${result.skipped} skipped). Columns: ${result.columns.join(' · ')}`);
  return result;
}

/** Local preview (not hosted): stable pseudo-random credits per resource. */
export function mockResourceConsumption(resources: Resource[]): ResourceConsumption {
  const byResource: Record<string, ResourceCredits> = {};
  for (const r of resources) {
    let h = 0;
    for (const c of r.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    if (h % 4 === 0) continue;
    const byFeature: Record<string, FeatureCredits> =
      r.type === 'Agent Flow'
        ? { 'Copilot Studio · Agent flow actions': { consumed: h % 600 } }
        : {
            'Copilot Studio · Generative answer': { consumed: h % 3000 },
            'Copilot Studio · Classic answer': { consumed: h % 400 },
            ...(h % 3 === 0 ? { 'Copilot Studio · Agent action': { consumed: h % 900 } } : {}),
          };
    const sum = (k: keyof FeatureCredits) => Object.values(byFeature).reduce((s, f) => s + f[k], 0);
    byResource[r.id.toLowerCase()] = { consumed: sum('consumed'), byFeature, name: r.name };
  }
  return { savedAt: new Date().toISOString(), fileName: 'Sample data', lookbackDays: 30, byResource };
}
