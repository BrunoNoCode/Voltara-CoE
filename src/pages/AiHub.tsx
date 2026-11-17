import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Bot, ChevronLeft, ChevronRight, Coins, Download, ExternalLink, Gauge, Globe, Info, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Workflow } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { AiHeroArt } from '../components/AiHeroArt';
import { FilterSelect, KpiCard, Pagination, PoweredByPill, RowMenu, SidePanel, SortTh, Tabs, Toast } from '../components/ui';
import { useTable } from '../lib/useTable';
import { downloadCsv, fmtAgo, fmtDateTime, fmtNumber, TYPE_COLOR } from '../lib/format';
import { clickableRow } from '../lib/clickableRow';
import { isSystemOwned, useHideSystem } from '../lib/hideSystem';
import { isInAiHub, useAiHubOverrides } from '../lib/aiHubEnvs';
import { AGENTS_REFRESHED_KEY } from '../lib/aiHubSync';
import {
  AI_TYPES,
  convert,
  CURRENCIES,
  DEFAULT_ASSUMPTIONS,
  fmtCredits,
  fmtMoney,
  fmtUnitPrice,
  payGoListPrice,
  prepaidPricePerCredit,
  useCostAssumptions,
  type CostAssumptions,
} from '../lib/aiCosts';
import { cachedAgentUsage, mockAgentUsage, type AgentUsage } from '../data/liveAiUsage';
import { cachedCopilotCapacity, fetchCopilotCapacity, mockCopilotCapacity, type CopilotCapacity } from '../data/liveCopilotCapacity';
import {
  cachedResourceConsumption,
  creditsOf,
  mockResourceConsumption,
  monthLabel,
  periodOf,
  type ResourceConsumption,
  type ResourceCredits,
} from '../data/liveResourceConsumption';
import {
  BILLING_SOURCE,
  SUMMARY_SOURCE,
  cachedAgentBillingSummary,
  fetchAgentBilling,
  fetchAgentBillingSummary,
  isAgentFlow,
  isSummaryResource,
} from '../data/liveAgentBilling';
import {
  FLOW_AI_SOURCE,
  cachedFlowAiConsumption,
  fetchFlowAiConsumption,
  flowAiResource,
  type FlowAiConsumption,
  type FlowAiEntry,
} from '../data/liveFlowAiConsumption';
import { cachedThresholds, isThresholdDefined, saveThresholdDefaults, thresholdOf, type ResourceThreshold } from '../data/liveThresholds';
import { AgentDetailPanel, BulkThresholdPanel, ThresholdDefaultsPanel } from './AiThresholds';
import { isAgent, thresholdText } from '../lib/aiThresholds';
import { isActiveThresholdJob, latestThresholdJob, thresholdJobProgress, useThresholdJobs } from '../lib/thresholdJobs';
import { isHosted } from '../data/api';
import { currentMonthKey, isCurrentMonth, monthDate, monthElapsed, monthPeriod, selectableMonths } from '../data/aiMonths';
import type { Environment, Resource } from '../data/types';

/** Environments queried at the same time for agent sessions / licensing data. */
const USAGE_CONCURRENCY = 3;
/** Environments shown in the Credit allocation vs consumption card. */
const ALLOCATION_TOP = 10;
/** Dot colour per rank in Top Consumers. */
const TOP_PALETTE = ['#6a3fd1', '#0f62a8', '#009999', '#e05a9c', '#f2a900', '#3aa6a6', '#5f9fdf', '#d9363e', '#7d8e99', '#1aa260'];

/** Month-scoped state key: consumption is kept per month and environment. */
const mk = (month: string, envId: string) => `${month}|${envId}`;
/** The entries of one month, keyed by environment id. */
function ofMonth<T>(rec: Record<string, T>, month: string): Record<string, T> {
  const out: Record<string, T> = {};
  const p = `${month}|`;
  for (const [k, v] of Object.entries(rec)) if (k.startsWith(p)) out[k.slice(p.length)] = v;
  return out;
}
const withMonth = <T,>(rec: Record<string, T>, month: string): Record<string, T> => Object.fromEntries(Object.entries(rec).map(([k, v]) => [mk(month, k), v]));

interface AiRow {
  r: Resource;
  envName: string;
  /** Sessions (agents) or runs (agent flows) in the last 30 days; undefined = unknown. */
  usage?: number;
  /** Copilot Credits from the imported admin center report (all lines of the resource); undefined = no report for the environment. */
  credits?: ResourceCredits | null;
  /** Copilot Credits consumed this month (billing summary API for agents and agent flows, else "resourceConsumption" of the resource threshold); undefined = unknown. */
  consumed?: number;
  /** `consumed` comes from the Copilot Studio billing summary API. */
  billed?: boolean;
  /** Copilot Credit limit row of the resource. */
  threshold?: ResourceThreshold;
  /** Estimated cost of `consumed`. */
  cost?: number;
  /** AI Builder consumption of a cloud flow (msdyn_aievents). */
  flowAi?: FlowAiEntry;
}

interface EnvRow {
  env: Environment;
  agents: number;
  flows: number;
  capacity?: CopilotCapacity | null;
}

/** Sort value for licensing columns: rows without data go last. */
const capNum = (e: EnvRow, pick: (c: CopilotCapacity) => number) => (e.capacity && !e.capacity.error ? pick(e.capacity) : -1);

type AiHubTab = 'overview' | 'agents' | 'logs';
const TAB_KEY = 'ppm.aiHub.tab';
const readTab = (): AiHubTab => {
  try {
    const t = localStorage.getItem(TAB_KEY);
    return t === 'agents' || t === 'logs' ? t : 'overview';
  } catch {
    return 'overview';
  }
};

/** When the Agents tab data was last fetched ("Refresh"): resources/limits/sessions and consumption. */
interface AgentsRefreshed {
  synced?: string;
  consumption?: string;
}
const readAgentsRefreshed = (): AgentsRefreshed => {
  try {
    return JSON.parse(localStorage.getItem(AGENTS_REFRESHED_KEY) ?? '{}') as AgentsRefreshed;
  } catch {
    return {};
  }
};

const isCloudFlow = (r: Resource) => r.type === 'Cloud Flow' || r.type === 'Scheduled Flow';

/** Agent = Copilot Studio; Agent flow = Power Automate kind "Agent Flow"; Cloud flow = cloud flow with AI Builder consumption. */
const typeLabel = (r: Resource) => (r.type === 'Copilot Studio' ? 'Agent' : r.type === 'Agent Flow' ? 'Agent flow' : isCloudFlow(r) ? 'Cloud flow' : 'Other');

export function AiHub() {
  const { environments, resources, resourceLoads, resourceSync, showCachedResources } = useStore();
  const [hideSystem] = useHideSystem();
  const [assumptions, saveAssumptions] = useCostAssumptions();
  const [hosted, setHosted] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<Record<string, AgentUsage | null>>({});
  const [capacity, setCapacity] = useState<Record<string, CopilotCapacity | null>>({});
  const [capacityBusy, setCapacityBusy] = useState(0);
  const [consumption, setConsumption] = useState<Record<string, ResourceConsumption | null>>({});
  const [billing, setBilling] = useState<Record<string, ResourceConsumption | null>>({});
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingLog, setBillingLog] = useState<string[]>([]);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryLog, setSummaryLog] = useState<string[]>([]);
  const [flowAi, setFlowAi] = useState<Record<string, FlowAiConsumption | null>>({});
  const [flowAiBusy, setFlowAiBusy] = useState(false);
  const [flowAiLog, setFlowAiLog] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [q, setQ] = useState('');
  /** Selected month ("yyyy-mm": current or last month) and AI Hub environment ('' = all): they scope the whole page. */
  const [month, setMonth] = useState(currentMonthKey);
  const [hubEnv, setHubEnv] = useState('');
  const [topType, setTopType] = useState('');
  /** "Nov 2026" */
  const monthText = monthLabel(monthDate(month));
  const [typeFilter, setTypeFilter] = useState('');
  const navigate = useNavigate();
  const envTableRef = useRef<HTMLDivElement>(null);
  const [thresholds, setThresholds] = useState(() => cachedThresholds());
  const [showDefaults, setShowDefaults] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [tab, setTabState] = useState<AiHubTab>(readTab);
  const setTab = (t: AiHubTab) => {
    setTabState(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {
      /* storage unavailable: the tab is not remembered */
    }
  };
  const [agentsRefreshed, setAgentsRefreshed] = useState<AgentsRefreshed>(readAgentsRefreshed);
  const stampAgentsRefreshed = (part: keyof AgentsRefreshed) =>
    setAgentsRefreshed((prev) => {
      const next = { ...prev, [part]: new Date().toISOString() };
      try {
        localStorage.setItem(AGENTS_REFRESHED_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: kept for this session only */
      }
      return next;
    });
  const reloadThresholds = () => setThresholds(cachedThresholds());
  // "Set limits" runs in the background: show its progress and pick up the new limits as agents are updated.
  const tjob = latestThresholdJob(useThresholdJobs());
  const tjobActive = isActiveThresholdJob(tjob);
  const tjobProgress = tjob ? thresholdJobProgress(tjob) : undefined;
  const tjobDone = tjobProgress?.done ?? 0;
  const [seenTjobDone, setSeenTjobDone] = useState(tjobDone);
  if (seenTjobDone !== tjobDone) {
    setSeenTjobDone(tjobDone);
    setThresholds(cachedThresholds());
  }

  const allMonitored = useMemo(() => environments.filter((e) => e.monitored), [environments]);
  const aiHubOverrides = useAiHubOverrides();
  /** Monitored environments included in the AI Hub (environment setting "Include in AI Hub"). */
  const monitored = useMemo(() => allMonitored.filter((e) => isInAiHub(e.id, resources, aiHubOverrides)), [allMonitored, resources, aiHubOverrides]);

  useEffect(() => {
    // Cached resources of every monitored environment: the default of "Include in AI Hub" depends on them.
    showCachedResources(allMonitored.map((e) => e.id));
  }, [allMonitored, showCachedResources]);

  // Cached figures of newly monitored environments (adjusting state during render, not in an effect).
  const [seenMonitored, setSeenMonitored] = useState<Environment[] | null>(null);
  if (seenMonitored !== allMonitored) {
    setSeenMonitored(allMonitored);
    setUsage((prev) => {
      const next = { ...prev };
      for (const e of allMonitored) if (!(e.id in next)) next[e.id] = cachedAgentUsage(e.id);
      return next;
    });
    // Month-scoped figures: the current month and last month (the months the user can pick).
    const months = selectableMonths();
    const seed = <T,>(prev: Record<string, T>, read: (envId: string, m: string) => T) => {
      const next = { ...prev };
      for (const m of months) for (const e of allMonitored) if (!(mk(m, e.id) in next)) next[mk(m, e.id)] = read(e.id, m);
      return next;
    };
    setCapacity((prev) => seed(prev, (id, m) => cachedCopilotCapacity(id, m)));
    setConsumption((prev) => {
      const next = { ...prev };
      for (const e of allMonitored) if (!(e.id in next)) next[e.id] = cachedResourceConsumption(e.id);
      return next;
    });
    setBilling((prev) => seed(prev, (id, m) => cachedAgentBillingSummary(id, m)));
    setFlowAi((prev) => seed(prev, (id, m) => cachedFlowAiConsumption(id, m)));
  }

  useEffect(() => {
    void isHosted().then(setHosted);
  }, []);

  const resourcesLoading = allMonitored.some((e) => resourceLoads[e.id]?.state === 'loading' || resourceLoads[e.id]?.refreshing);

  /** Consumption of the selected month, keyed by environment. */
  const billingM = useMemo(() => ofMonth(billing, month), [billing, month]);
  const flowAiM = useMemo(() => ofMonth(flowAi, month), [flowAi, month]);
  const isCurMonth = isCurrentMonth(month);

  const aiResources = useMemo(() => {
    const ids = new Set(monitored.map((e) => e.id));
    const out = resources.filter((r) => ids.has(r.envId) && AI_TYPES.has(r.type) && !(hideSystem && isSystemOwned(r)));
    // Cloud flows are not AI resources by type: add those with AI Builder consumption this month (synced row when there is one).
    const listed = new Set(out.map((r) => `${r.envId}:${r.id.toLowerCase()}`));
    const byKey = new Map(resources.map((r) => [`${r.envId}:${r.id.toLowerCase()}`, r]));
    for (const env of monitored)
      for (const f of Object.values(flowAiM[env.id]?.byFlow ?? {})) {
        const key = `${env.id}:${f.id}`;
        if (f.consumed <= 0 || listed.has(key)) continue;
        const r = byKey.get(key) ?? flowAiResource(env.id, f);
        if (hideSystem && isSystemOwned(r)) continue;
        listed.add(key);
        out.push(r);
      }
    return out;
  }, [monitored, resources, hideSystem, flowAiM]);

  /** Monitored environments with any agent or agent flow (licensing data is read for these). */
  const aiEnvs = useMemo(() => {
    const withAi = new Set(aiResources.map((r) => r.envId));
    return monitored.filter((e) => withAi.has(e.id));
  }, [monitored, aiResources]);

  // The selected environment scopes the whole page (charts, tables and Refresh). A selection no longer in the AI Hub is ignored.
  const scopeEnv = hubEnv && monitored.some((e) => e.id === hubEnv) ? hubEnv : '';
  const scopedMonitored = useMemo(() => (scopeEnv ? monitored.filter((e) => e.id === scopeEnv) : monitored), [monitored, scopeEnv]);
  const scopedAiEnvs = useMemo(() => (scopeEnv ? aiEnvs.filter((e) => e.id === scopeEnv) : aiEnvs), [aiEnvs, scopeEnv]);
  const hubEnvOptions = useMemo(() => [...monitored].sort((a, b) => a.name.localeCompare(b.name)), [monitored]);

  /** Runs `load` for each environment, a few at a time, tracking how many are still pending. */
  const runQueue = async (targets: Environment[], load: (env: Environment) => Promise<void>, setBusy: (fn: (n: number) => number) => void) => {
    if (!targets.length) return;
    setBusy((n) => n + targets.length);
    const queue = [...targets];
    const worker = async () => {
      for (let env = queue.shift(); env; env = queue.shift()) {
        await load(env);
        setBusy((n) => n - 1);
      }
    };
    await Promise.all(Array.from({ length: Math.min(USAGE_CONCURRENCY, targets.length) }, worker));
  };

  const loadCapacity = (targets: Environment[]) => {
    return runQueue(targets, async (env) => {
      // The licensing API only returns the current month (it is also saved as that month's snapshot).
      const result = await fetchCopilotCapacity(env);
      setCapacity((prev) => ({ ...prev, [mk(currentMonthKey(), env.id)]: result }));
    }, setCapacityBusy);
  };

  /** Old billing endpoint (Copilot Studio billing API): kept for its fetch log only, the table is not changed. */
  const loadAgentBilling = async (targets: Environment[]) => {
    setBillingBusy(true);
    setBillingLog([]);
    const log = (line: string) => {
      console.info('[agentBilling]', line);
      setBillingLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${line}`]);
    };
    try {
      const n = Object.keys(await fetchAgentBilling(targets, resources, log)).length;
      log(`Done: ${n} environment${n === 1 ? '' : 's'} answered (log only, table not changed)`);
    } catch (e) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBillingBusy(false);
    }
  };

  /** Credits consumed in month `m` per Standard agent and agent flow (billing summary API): the consumption shown in the table. */
  const loadBillingSummary = async (targets: Environment[], m: string) => {
    setSummaryBusy(true);
    setSummaryLog([]);
    const log = (line: string) => {
      console.info('[agentBillingSummary]', line);
      setSummaryLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${line}`]);
    };
    try {
      const b = await fetchAgentBillingSummary(targets, resources, log, m);
      setBilling((prev) => ({ ...prev, ...withMonth(b, m) }));
      const n = Object.keys(b).length;
      log(`Done: consumption updated for ${n} environment${n === 1 ? '' : 's'}`);
      return n;
    } catch (e) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
      return 0;
    } finally {
      setSummaryBusy(false);
    }
  };

  /** AI Builder credits consumed in month `m` per cloud flow (msdyn_aievents, PowerAutomate/AIBuilder): adds those cloud flows to the table. */
  const loadFlowAi = async (targets: Environment[], m: string) => {
    setFlowAiBusy(true);
    setFlowAiLog([]);
    const log = (line: string) => {
      console.info('[flowAiConsumption]', line);
      setFlowAiLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${line}`]);
    };
    try {
      const f = await fetchFlowAiConsumption(targets, log, m);
      setFlowAi((prev) => ({ ...prev, ...withMonth(f, m) }));
      const flows = Object.values(f).reduce((n, c) => n + Object.values(c.byFlow).filter((x) => x.consumed > 0).length, 0);
      const n = Object.keys(f).length;
      log(`Done: ${flows} cloud flow${flows === 1 ? '' : 's'} with AI Builder consumption in ${n} environment${n === 1 ? '' : 's'}`);
      return flows;
    } catch (e) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
      return 0;
    } finally {
      setFlowAiBusy(false);
    }
  };

  // Nothing is queried automatically: the last fetched data (browser cache) is shown until one of the buttons is clicked.

  /** Scope of a refresh, for the toasts: "all environments" or the selected one, and the month. */
  const scopeText = () => `${scopeEnv ? (envName.get(scopeEnv) ?? 'the environment') : 'all environments'} · ${monthText}`;

  /**
   * Overview › "Refresh", scoped to the selected environment (default: all) and month: Copilot Credits per environment
   * (licensing API, current month only; its settings are also used to estimate a past month without a snapshot) and the
   * consumption per agent, agent flow and cloud flow of the selected month.
   */
  const refreshEnvironments = async () => {
    if (!hosted) {
      setToast('Local preview: environment credits are sample data');
      return;
    }
    const [, billedEnvs, aiFlows] = await Promise.all([loadCapacity(scopedAiEnvs), loadBillingSummary(scopedMonitored, month), loadFlowAi(scopedMonitored, month)]);
    stampAgentsRefreshed('consumption');
    setToast(`Refreshed ${scopeText()}: credits of ${scopedAiEnvs.length} environment${scopedAiEnvs.length === 1 ? '' : 's'}, consumption of ${billedEnvs} environment${billedEnvs === 1 ? '' : 's'}, ${aiFlows} cloud flow${aiFlows === 1 ? '' : 's'} with AI`);
  };

  /**
   * Agents › "Refresh" (selected environment and month): only the consumption, the resources are not synced. Agents and agent
   * flows (billing summary API), cloud flows (AI Builder events); the old billing call (current month only) logs only.
   */
  const fetchConsumption = async () => {
    if (!hosted) {
      setToast('Local preview: the consumption APIs are only available in the hosted app');
      return;
    }
    const [billedEnvs, aiFlows] = await Promise.all([
      loadBillingSummary(scopedMonitored, month),
      loadFlowAi(scopedMonitored, month),
      isCurMonth ? loadAgentBilling(scopedMonitored) : Promise.resolve(),
    ]);
    stampAgentsRefreshed('consumption');
    const msg = [`${scopeText()}`, `consumption of agents and agent flows: ${billedEnvs} environment${billedEnvs === 1 ? '' : 's'}`, `cloud flows with AI Builder consumption: ${aiFlows}`].join(' · ');
    setToast(`${msg} · see the Debug logs tab`);
  };

  /**
   * Licensing data per environment for the selected month: live/cached when hosted, sample data in local preview.
   * The licensing API only returns the current month: a past month uses the snapshot saved during that month, else it is
   * estimated from the consumption summed per resource and the current allocation / pay-as-you-go settings.
   */
  const capacityFor = useMemo<Record<string, CopilotCapacity | null | undefined>>(() => {
    if (hosted === false)
      return Object.fromEntries(
        monitored.map((e) => {
          const c = mockCopilotCapacity(e.id);
          return [e.id, isCurMonth ? c : { ...c, consumed: Math.round(c.consumed * 0.85), payGoConsumed: Math.round(c.payGoConsumed * 0.85) }];
        }),
      );
    const cur = ofMonth(capacity, currentMonthKey());
    if (isCurMonth) return cur;
    const snaps = ofMonth(capacity, month);
    const out: Record<string, CopilotCapacity | null> = {};
    for (const e of monitored) {
      const snap = snaps[e.id];
      if (snap && !snap.error) {
        out[e.id] = snap;
        continue;
      }
      const b = billingM[e.id]?.error ? undefined : billingM[e.id];
      const f = flowAiM[e.id];
      const settings = cur[e.id] && !cur[e.id]!.error ? cur[e.id]! : null;
      if (!b && !f) {
        out[e.id] = null;
        continue;
      }
      const total =
        Object.values(b?.byResource ?? {}).reduce((s, x) => s + x.consumed, 0) + Object.values(f?.byFlow ?? {}).reduce((s, x) => s + x.consumed, 0);
      const allocated = settings ? settings.allocated + settings.autoAllocated : 0;
      const prepaid = settings?.payGo ? Math.min(total, allocated) : total;
      const savedAt = [b?.savedAt, f?.savedAt].filter(Boolean).sort().pop() ?? new Date().toISOString();
      out[e.id] = {
        savedAt,
        allocated: settings?.allocated ?? 0,
        autoAllocated: settings?.autoAllocated ?? 0,
        consumed: prepaid,
        payGo: settings?.payGo ?? false,
        payGoConsumed: total - prepaid,
        tenantPool: settings?.tenantPool ?? false,
        estimated: true,
      };
    }
    return out;
  }, [hosted, capacity, monitored, month, isCurMonth, billingM, flowAiM]);

  /** Agent sessions per environment: live/cached when hosted, sample data in local preview. */
  const usageFor = useMemo(() => {
    if (hosted !== false) return usage;
    const mock: Record<string, AgentUsage> = {};
    for (const e of monitored) mock[e.id] = mockAgentUsage(aiResources.filter((r) => r.envId === e.id && r.type === 'Copilot Studio'));
    return mock;
  }, [hosted, usage, monitored, aiResources]);

  /** Credits per resource: imported reports; sample data in local preview until a report is imported. */
  const consumptionFor = useMemo(() => {
    if (hosted !== false) return consumption;
    return Object.fromEntries(monitored.map((e) => [e.id, consumption[e.id] ?? mockResourceConsumption(aiResources.filter((r) => r.envId === e.id))]));
  }, [hosted, consumption, monitored, aiResources]);

  /** Period covered by the imported reports ('last 30 days'); '' when unknown, undefined when nothing is imported. */
  const reportPeriod = useMemo(() => {
    const periods = new Set(monitored.flatMap((e) => (consumptionFor[e.id] && !consumptionFor[e.id]!.error ? [periodOf(consumptionFor[e.id]!)] : [])));
    if (!periods.size) return undefined;
    return periods.size === 1 ? [...periods][0]! : 'various periods';
  }, [monitored, consumptionFor]);

  const envName = useMemo(() => new Map(environments.map((e) => [e.id, e.name])), [environments]);

  const prepaidPrice = prepaidPricePerCredit(assumptions);
  const payGoPrice = assumptions.payGoPricePerCredit;

  /** Blended price per credit in an environment (its prepaid / pay-as-you-go mix this month); prepaid price when unknown. */
  const priceFor = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [id, c] of Object.entries(capacityFor)) {
      if (c === undefined) continue;
      const used = c && !c.error ? c.consumed + c.payGoConsumed : 0;
      out[id] = c && used > 0 ? (c.consumed * prepaidPrice + c.payGoConsumed * payGoPrice) / used : prepaidPrice;
    }
    return out;
  }, [capacityFor, prepaidPrice, payGoPrice]);

  const rows = useMemo<AiRow[]>(
    () =>
      aiResources.filter((r) => !scopeEnv || r.envId === scopeEnv).map((r) => {
        const u = usageFor[r.envId];
        const usage = !isAgent(r) ? r.runs30d : u && !u.error ? (u.sessions[r.id.toLowerCase()] ?? 0) : undefined;
        const c = consumptionFor[r.envId];
        // null = report imported for the environment, no line for this resource (nothing consumed).
        const credits = c && !c.error ? (creditsOf(c, r) ?? null) : undefined;
        // Limits come from the resource threshold row. Consumption of agents and agent flows comes only from the billing summary
        // API, matched on cdsBotId (bot id / workflow id); other resources keep "resourceConsumption" of their threshold row.
        const threshold = thresholdOf(thresholds, r);
        const b = isSummaryResource(r) ? billingM[r.envId]?.byResource[r.id.toLowerCase()] : undefined;
        const fa = isCloudFlow(r) ? flowAiM[r.envId]?.byFlow[r.id.toLowerCase()] : undefined;
        const consumed = isAgent(r) || isAgentFlow(r)
          ? b?.consumed
          : fa
            ? fa.consumed
            : threshold
            ? threshold.consumption
            : credits === undefined
              ? undefined
              : (credits?.consumed ?? 0);
        const cost = consumed === undefined ? undefined : consumed * (priceFor[r.envId] ?? prepaidPrice);
        return { r, envName: envName.get(r.envId) ?? '', usage, credits, consumed, billed: !!b, threshold, cost, flowAi: fa };
      }),
    [aiResources, scopeEnv, usageFor, consumptionFor, billingM, flowAiM, thresholds, priceFor, prepaidPrice, envName],
  );

  /** Report lines whose resource is not among the listed agents / agent flows (deleted, renamed, MSFT-owned, other kinds). */
  const unmatched = useMemo(() => {
    const listed = new Set(aiResources.flatMap((r) => [`${r.envId}:${r.id.toLowerCase()}`, `${r.envId}:name:${r.name.trim().toLowerCase()}`]));
    const out: { envId: string; envName: string; id: string; credits: ResourceCredits }[] = [];
    for (const env of scopedMonitored) {
      const c = consumptionFor[env.id];
      if (!c || c.error) continue;
      for (const [id, credits] of Object.entries(c.byResource))
        if (!listed.has(`${env.id}:${id}`) && credits.consumed > 0) out.push({ envId: env.id, envName: env.name, id, credits });
    }
    return out.sort((a, b) => b.credits.consumed - a.credits.consumed);
  }, [scopedMonitored, aiResources, consumptionFor]);

  const envRows = useMemo<EnvRow[]>(() => {
    const map = new Map<string, EnvRow>();
    for (const env of scopedMonitored) map.set(env.id, { env, agents: 0, flows: 0, capacity: capacityFor[env.id] });
    const withRows = new Set<string>();
    for (const row of rows) {
      const e = map.get(row.r.envId)!;
      withRows.add(row.r.envId);
      if (row.r.type === 'Copilot Studio') e.agents++;
      else if (row.r.type === 'Agent Flow') e.flows++;
    }
    return [...map.values()].filter((e) => withRows.has(e.env.id));
  }, [scopedMonitored, rows, capacityFor]);

  /** Cost this month: prepaid Consumption at the prepaid price + Pay-as-you-go consumed at the pay-as-you-go price. */
  const envCost = (e: EnvRow) => {
    const c = e.capacity;
    if (!c || c.error) return { prepaid: 0, payGo: 0, total: 0 };
    const prepaid = c.consumed * prepaidPrice;
    const payGo = c.payGoConsumed * payGoPrice;
    return { prepaid, payGo, total: prepaid + payGo };
  };

  const totals = useMemo(() => {
    const t = { credits: 0, prepaidCredits: 0, payGoCredits: 0, prepaidCost: 0, payGoCost: 0, agents: 0, flows: 0, sessions: 0, runs: 0, withCapacity: 0 };
    for (const e of envRows) {
      t.agents += e.agents;
      t.flows += e.flows;
      const c = e.capacity;
      if (!c || c.error) continue;
      t.withCapacity++;
      t.prepaidCredits += c.consumed;
      t.payGoCredits += c.payGoConsumed;
    }
    t.credits = t.prepaidCredits + t.payGoCredits;
    t.prepaidCost = t.prepaidCredits * prepaidPrice;
    t.payGoCost = t.payGoCredits * payGoPrice;
    let standard = 0;
    let msft = 0;
    let published = 0;
    for (const row of rows) {
      if (row.r.type === 'Copilot Studio') {
        t.sessions += row.usage ?? 0;
        if (row.r.status === 'Published') published++;
        if (row.r.poweredBy === 'MSFT Copilot') msft++;
        else standard++;
      } else if (row.r.type === 'Agent Flow') t.runs += row.usage ?? 0;
    }
    return { ...t, standard, msft, published, cost: t.prepaidCost + t.payGoCost };
  }, [envRows, rows, prepaidPrice, payGoPrice]);

  /** Share of the month elapsed (1 for a past month): the expected consumption pace of an even spread. */
  const pace = monthElapsed(month);
  /** Period of the selected month shown in the footnote: 1st – today (current month) or the full month. */
  const monthRange = `${monthPeriod(month).start.slice(0, 10)} – ${(isCurMonth ? new Date().toISOString() : monthPeriod(month).end).slice(0, 10)}`;

  /**
   * Credit allocation vs consumption: environments with prepaid credits allocated (no pay-as-you-go, none without
   * credits), by % of the allocation consumed; projected = consumption at the current pace by the end of the month.
   */
  const allocation = useMemo(() => {
    const list = envRows.flatMap((e) => {
      const c = e.capacity;
      const allocated = c && !c.error ? c.allocated + c.autoAllocated : 0;
      if (!c || c.error || c.payGo || allocated <= 0) return [];
      return [{ env: e.env, consumed: c.consumed, allocated, pct: c.consumed / allocated, projected: c.consumed / (pace || 1) }];
    });
    return list.sort((a, b) => b.pct - a.pct);
  }, [envRows, pace]);

  const envTable = useTable<EnvRow>(
    envRows,
    {
      name: (e) => e.env.name,
      allocated: (e) => capNum(e, (c) => c.allocated + c.autoAllocated),
      consumed: (e) => capNum(e, (c) => c.consumed),
      pct: (e) => capNum(e, (c) => (c.allocated + c.autoAllocated ? c.consumed / (c.allocated + c.autoAllocated) : 0)),
      payGo: (e) => capNum(e, (c) => (c.payGo ? 1 : 0)),
      payGoConsumed: (e) => capNum(e, (c) => c.payGoConsumed),
      tenantPool: (e) => capNum(e, (c) => (c.tenantPool ? 1 : 0)),
      cost: (e) => capNum(e, () => envCost(e).total),
    },
    'consumed',
    10,
    'desc',
  );

  // Newest fetch of the selected month's data across the listed environments = when "Refresh" last ran.
  const lastRefreshed = useMemo(() => {
    let max = 0;
    for (const e of envRows)
      for (const at of [e.capacity?.savedAt, billingM[e.env.id]?.savedAt, flowAiM[e.env.id]?.savedAt]) {
        const t = at ? Date.parse(at) : 0;
        if (t > max) max = t;
      }
    return max ? new Date(max).toISOString() : '';
  }, [envRows, billingM, flowAiM]);
  const agentsRefreshedNote: ReactNode = (() => {
    if (hosted === false) return 'Sample data';
    if (resourceSync) return 'Refreshing…';
    const { synced, consumption } = agentsRefreshed;
    if (!synced) return 'Not refreshed yet';
    const tip = `Agents, limits & sessions refreshed: ${fmtDateTime(synced)} · Consumption fetched: ${consumption ? fmtDateTime(consumption) : 'never'}`;
    return <span title={tip}>Last refreshed {fmtAgo(synced)}</span>;
  })();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (!needle || row.r.name.toLowerCase().includes(needle) || row.r.owner.toLowerCase().includes(needle)) &&
        (!typeFilter || typeLabel(row.r) === typeFilter),
    );
  }, [rows, q, typeFilter]);
  const filteredAgents = useMemo(() => filtered.filter((x) => isAgent(x.r)).length, [filtered]);

  /** A limit is defined for the row (agents only: agent flows have no limit). */
  const hasLimit = (x: AiRow) => isAgent(x.r) && isThresholdDefined(x.threshold);

  /**
   * Consumption cell, always the same two lines:
   * 1. "X used" (0 when nothing was reported)
   * 2. "Limit N (P%)" / "No limit" / "Limits apply to agents only"
   */
  const consumptionCell = (x: AiRow) => {
    const t = hasLimit(x) ? x.threshold : undefined;
    const used = x.consumed ?? 0;
    const pct = t && t.limit > 0 ? Math.round((used / t.limit) * 100) : 0;
    const fa = x.flowAi;
    const usedTitle =
      x.consumed !== undefined
        ? x.billed
          ? `${SUMMARY_SOURCE}, ${monthText}`
          : fa
            ? `${FLOW_AI_SOURCE}, ${monthText}:${fmtNumber(fa.events)} event${fa.events === 1 ? '' : 's'} · ` +
              Object.entries(fa.models)
                .sort((a, b) => b[1].credits - a[1].credits)
                .map(([k, m]) => `${k} ${fmtCredits(m.credits)}`)
                .join(', ') +
              (fa.llms.length ? ` · LLM ${fa.llms.join(', ')}` : '')
            : undefined
        : isSummaryResource(x.r)
          ? `Nothing reported by the ${SUMMARY_SOURCE} yet (Refresh)`
          : 'No consumption returned by the licensing API for this resource';
    const second = t
      ? `Limit ${fmtNumber(t.limit)}${t.limit > 0 ? ` (${pct}%)` : ''}${t.stopResource ? ' · Stopped' : ''}`
      : isAgent(x.r)
        ? 'No limit'
        : 'Limits apply to agents only';
    return (
      <span
        className={t && (t.stopResource || pct >= 100) ? 'ai-err' : undefined}
        title={
          [usedTitle, t ? `Notify at ${t.notificationThreshold}%${t.stopIfOverCapacity ? ' · stops when over the limit' : ''}` : '']
            .filter(Boolean)
            .join(' · ') || undefined
        }
      >
        {fmtCredits(used)} used
        <div className="small muted">{second}</div>
      </span>
    );
  };

  const resTable = useTable<AiRow>(
    filtered,
    {
      name: (x) => x.r.name,
      type: (x) => typeLabel(x.r),
      env: (x) => x.envName,
      owner: (x) => x.r.owner,
      usage: (x) => x.usage ?? -1,
      consumption: (x) => x.consumed ?? -1,
      cost: (x) => x.cost ?? -1,
    },
    'usage',
    25,
    'desc',
  );

  const money = (n: number) => fmtMoney(n, assumptions.currency);
  /** Table row of the resource open in the detail panel: the panel shows the same consumption as the table. */
  const selectedRow = selected ? rows.find((x) => x.r.envId === selected.envId && x.r.id === selected.id) : undefined;
  /** Agents, agent flows and cloud flows with AI (or one type, Top Consumers dropdown), by Copilot Credits consumed. */
  const topConsumers = useMemo(
    () =>
      rows
        .filter((x) => (x.consumed ?? 0) > 0 && (!topType || typeLabel(x.r) === topType))
        .sort((a, b) => (b.consumed ?? 0) - (a.consumed ?? 0))
        .slice(0, 10),
    [rows, topType],
  );

  const exportEnvCsv = () =>
    downloadCsv(`ai-hub-environments-${month}.csv`, [
      ['Environment', 'Credits allocated', 'Credits consumption', 'Consumption %', 'PayGo', 'PayGo consumption', 'Draw from tenant', `Cost (${assumptions.currency})`, 'Estimated'],
      ...envTable.sorted.map((e) => {
        const c = e.capacity && !e.capacity.error ? e.capacity : null;
        const allocated = c ? c.allocated + c.autoAllocated : 0;
        return [
          e.env.name,
          c ? allocated : '',
          c ? Math.round(c.consumed * 100) / 100 : '',
          c && allocated ? Math.round((c.consumed / allocated) * 1000) / 10 : '',
          c ? (c.payGo ? 'Yes' : 'No') : '',
          c ? Math.round(c.payGoConsumed * 100) / 100 : '',
          c ? (c.tenantPool ? 'Yes' : 'No') : '',
          c ? Math.round(envCost(e).total * 100) / 100 : '',
          c?.estimated ? 'Yes' : '',
        ];
      }),
    ]);

  const exportCsv = () =>
    downloadCsv('ai-hub-resources.csv', [
      ['Name', 'Type', 'Agent type', 'Environment', 'Owner', 'Usage (30 days)', 'Usage unit', 'Consumption', `Copilot Credits used${reportPeriod ? ` (${reportPeriod})` : ''}`, `Cost (${assumptions.currency})`],
      ...filtered.map((x) => [
        x.r.name,
        typeLabel(x.r),
        x.r.poweredBy ?? '',
        x.envName,
        x.r.owner,
        x.usage ?? '',
        x.r.type === 'Copilot Studio' ? 'sessions' : 'runs',
        hasLimit(x) ? thresholdText(x.threshold) : 'Not available',
        x.consumed === undefined ? '' : Math.round(x.consumed * 100) / 100,
        x.cost === undefined ? '' : Math.round(x.cost * 100) / 100,
      ]),
    ]);

  /** A licensing cell, or the loading / error state shared by all licensing columns. */
  const capCell = (e: EnvRow, render: (c: CopilotCapacity) => ReactNode) => {
    const c = e.capacity;
    if (c === undefined || (c === null && capacityBusy > 0)) return <span className="muted">Loading…</span>;
    if (c === null) return <span className="muted">{isCurMonth ? 'Not loaded' : 'No data'}</span>;
    if (c.error)
      return (
        <span className="ai-err" title={c.error}>
          Unavailable
        </span>
      );
    return render(c);
  };
  const yesNo = (v: boolean) => <span className={`ai-flag${v ? ' on' : ''}`}>{v ? 'Yes' : 'No'}</span>;
  const estimatedTip = 'Estimated: no snapshot saved during this month. Consumption is summed per resource; allocation and pay-as-you-go settings are the current ones.';

  const envBusy = capacityBusy > 0 || summaryBusy || flowAiBusy;
  const [lastMonth, curMonth] = [selectableMonths()[1], selectableMonths()[0]];
  const pctOf = (c: CopilotCapacity) => {
    const allocated = c.allocated + c.autoAllocated;
    return allocated ? c.consumed / allocated : 0;
  };
  const publishedPct = totals.standard + totals.msft ? totals.published / (totals.standard + totals.msft) : 0;
  const fetching = summaryBusy || flowAiBusy || billingBusy;
  const logs = [
    { title: `Consumption fetch log (agents & agent flows · ${SUMMARY_SOURCE})`, lines: summaryLog, running: summaryBusy, clear: () => setSummaryLog([]) },
    { title: `Consumption fetch log (cloud flows · ${FLOW_AI_SOURCE})`, lines: flowAiLog, running: flowAiBusy, clear: () => setFlowAiLog([]) },
    { title: `Consumption fetch log (old · ${BILLING_SOURCE}, log only)`, lines: billingLog, running: billingBusy, clear: () => setBillingLog([]) },
  ];
  const activeLogs = logs.filter((l) => l.running || l.lines.length > 0).length;

  /** A fetch log box (shown while fetching or once it has lines). */
  const fetchLog = (title: string, lines: string[], running: boolean, clear: () => void) =>
    (running || lines.length > 0) && (
      <details key={title} className="card card-pad" style={{ marginBottom: 16 }} open>
        <summary className="card-title" style={{ cursor: 'pointer' }}>
          {title} ({lines.length} line{lines.length === 1 ? '' : 's'})
          <span className="spacer" />
          <button className="link-btn" onClick={(ev) => { ev.preventDefault(); void navigator.clipboard?.writeText(lines.join('\n')); setToast('Fetch log copied'); }}>
            Copy
          </button>
          <button className="link-btn" onClick={(ev) => { ev.preventDefault(); clear(); }} disabled={running}>
            Clear
          </button>
        </summary>
        <pre style={{ maxHeight: 260, overflow: 'auto', fontSize: 12, whiteSpace: 'pre-wrap', margin: '8px 0 0', background: 'var(--surface-2, rgba(0,0,0,0.04))', padding: 10, borderRadius: 6 }}>
          {lines.join('\n') || 'Starting…'}
        </pre>
      </details>
    );

  return (
    <>
      <div className="ai-hero">
        <AiHeroArt />
        <div className="ai-hero-text">
          <h1>AI Hub</h1>
          <p>Copilot Credit consumption and cost per environment ({monthText}), and the agents, agent flows and cloud flows using AI Builder in each.</p>
          <div className="ai-hero-actions">
        {tab === 'overview' && (
          <>
            <button className="btn" onClick={() => setShowAssumptions(true)}>
              <SlidersHorizontal size={16} /> Cost assumptions
            </button>
            <button
              className="btn btn-primary"
              onClick={refreshEnvironments}
              disabled={envBusy}
              title={`Refresh the Copilot Credits of ${scopeText()} (${isCurMonth ? 'licensing API and consumption per resource' : 'consumption per resource of the month'})`}
            >
              <RefreshCw size={16} className={envBusy ? 'spin' : undefined} />
              {envBusy ? (capacityBusy > 0 ? `Refreshing environments (${capacityBusy} left)…` : 'Refreshing…') : 'Refresh'}
            </button>
          </>
        )}
        {tab === 'agents' && (
          <>
            <button className="btn" onClick={() => setShowDefaults(true)} title="Default Copilot Credit limit settings for agents">
              <ShieldCheck size={16} /> Default limits
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void fetchConsumption()}
              disabled={fetching}
              title={`Fetch the consumption of ${scopeText()}: per agent and agent flow from the ${SUMMARY_SOURCE} and AI Builder consumption of cloud flows from the ${FLOW_AI_SOURCE}. The resources are not synced (use Sync on Home).`}
            >
              <Gauge size={16} className={fetching ? 'spin' : undefined} />
              {fetching ? 'Fetching consumption…' : 'Refresh'}
            </button>
          </>
        )}
          </div>
        </div>
        <div className="ai-hero-tag">
          <strong>People + AI</strong>
          <span>Greater together</span>
        </div>
      </div>

      <div className="ai-tabs-row">
        <Tabs<AiHubTab>
          tabs={[
            { key: 'overview', label: 'Overview' },
            { key: 'agents', label: 'AI Consumption', count: rows.length },
            { key: 'logs', label: 'Debug logs', count: activeLogs },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab !== 'logs' && (
          <div className="ai-filters">
            <label className="ai-env-select" title="Filters the whole AI Hub">
              <Globe size={16} />
              <select value={scopeEnv} onChange={(e) => setHubEnv(e.target.value)} aria-label="Environment">
                <option value="">All environments</option>
                {hubEnvOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="ai-month-switch" role="group" aria-label="Month">
              <button className="icon-btn" onClick={() => setMonth(lastMonth)} disabled={month === lastMonth} aria-label="Previous month">
                <ChevronLeft size={16} />
              </button>
              {[lastMonth, curMonth].map((m) => (
                <button key={m} className={`ai-month${month === m ? ' active' : ''}`} onClick={() => setMonth(m)} aria-pressed={month === m}>
                  {monthLabel(monthDate(m))}
                </button>
              ))}
              <button className="icon-btn" onClick={() => setMonth(curMonth)} disabled={month === curMonth} aria-label="Next month">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {tab === 'overview' && (
      <>
      <div className="kpis">
        <KpiCard
          icon={<Gauge size={22} />}
          color="#0f62a8"
          label="Copilot Credits consumed"
          value={fmtCredits(totals.credits)}
          sub={`${fmtNumber(totals.withCapacity)} of ${fmtNumber(envRows.length)} environment${envRows.length === 1 ? '' : 's'} reported`}
        />
        <KpiCard
          icon={<Coins size={22} />}
          color="#009999"
          label={`Cost (${monthText})`}
          value={money(totals.cost)}
          sub={`${money(totals.prepaidCost)} prepaid · ${money(totals.payGoCost)} pay-as-you-go`}
        />
        <KpiCard
          icon={<Bot size={22} />}
          color={TYPE_COLOR['Copilot Studio']}
          label="Agents"
          value={fmtNumber(totals.agents)}
          sub={`${fmtNumber(totals.standard)} Standard · ${fmtNumber(totals.msft)} MSFT Copilot`}
        />
        <KpiCard icon={<Workflow size={22} />} color={TYPE_COLOR['Agent Flow']} label="Agent flows" value={fmtNumber(totals.flows)} sub={`${fmtNumber(totals.runs)} runs (30 days)`} />
        <KpiCard
          icon={<BadgeCheck size={22} />}
          color="#00a35a"
          label="Agents published"
          value={fmtNumber(totals.published)}
          sub={totals.standard + totals.msft ? `${fmtNumber(totals.standard + totals.msft - totals.published)} not published` : 'No agents'}
          extra={
            <svg className="ai-ring" viewBox="0 0 36 36" role="img" aria-label={`${Math.round(publishedPct * 100)}% published`}>
              <circle cx="18" cy="18" r="15.5" className="ai-ring-bg" />
              <circle cx="18" cy="18" r="15.5" className="ai-ring-fg" strokeDasharray={`${publishedPct * 97.4} 97.4`} />
              <text x="18" y="21" textAnchor="middle">
                {Math.round(publishedPct * 100)}%
              </text>
            </svg>
          }
        />
      </div>

      <div className="env-charts">
        <div className="card card-pad home-chart">
          <div className="card-title">Credit allocation vs consumption</div>
          <div className="small muted">Top {ALLOCATION_TOP} environments · {monthText}</div>
          <div className="ai-legend small">
            <span>
              <i className="sw consumed" /> Consumed
            </span>
            <span>
              <i className="sw allocated" /> Allocated
            </span>
            {isCurMonth && (
              <span title="Projected consumption by the end of the month at the current pace (capped at the end of the bar when it exceeds the allocation).">
                <i className="sw pace" /> Expected pace ({Math.round(pace * 100)} % of month)
              </span>
            )}
          </div>
          {allocation.length ? (
            <ul className="ai-alloc">
              {allocation.slice(0, ALLOCATION_TOP).map((a) => (
                <li
                  key={a.env.id}
                  className={`clickable${scopeEnv === a.env.id ? ' selected' : ''}`}
                  {...clickableRow(() => setHubEnv(scopeEnv === a.env.id ? '' : a.env.id))}
                  title={`${a.env.name}: ${fmtCredits(a.consumed)} of ${fmtCredits(a.allocated)} consumed${
                    isCurMonth && a.pct < 1 ? ` · at this pace ~${fmtCredits(a.projected)} by the end of the month` : ''
                  }`}
                >
                  <span className="lbl">{a.env.name}</span>
                  <span className="track">
                    <span className={`bar${a.pct >= 1 ? ' over' : isCurMonth && a.projected > a.allocated ? ' warn' : ''}`} style={{ width: `${Math.min(a.pct, 1) * 100}%` }} />
                    {isCurMonth && <span className="ai-pace" style={{ left: `${Math.min(a.allocated > 0 ? a.projected / a.allocated : 1, 1) * 100}%` }} />}
                  </span>
                  <span className="num">
                    <strong>{Math.round(a.pct * 100)} %</strong>
                    <span className="small muted">
                      {fmtCredits(a.consumed)} / {fmtCredits(a.allocated)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">{envBusy ? 'Loading credits…' : 'No environment with prepaid credits allocated (pay-as-you-go environments are not shown).'}</p>
          )}
          {allocation.length > 0 && (
            <button className="link-btn ai-card-foot" onClick={() => envTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              View all {fmtNumber(envRows.length)} →
            </button>
          )}
        </div>
        <div className="card card-pad home-chart">
          <div className="card-title">
            Top Consumers
            <select className="select ai-top-select" value={topType} onChange={(e) => setTopType(e.target.value)} aria-label="Top consumers type">
              <option value="">All</option>
              <option value="Agent">Agents</option>
              <option value="Agent flow">Agent flows</option>
              <option value="Cloud flow">Cloud flows with AI</option>
            </select>
          </div>
          <div className="small muted">Copilot Credits · {monthText}</div>
          {topConsumers.length ? (
            <ul className="ai-top">
              {topConsumers.map((x, i) => (
                <li key={`${x.r.envId}:${x.r.id}`} className="clickable" {...clickableRow(() => setSelected(x.r))} title={`${x.r.name} · ${x.envName} · ${typeLabel(x.r)}`}>
                  <span className="dot" style={{ background: TOP_PALETTE[i % TOP_PALETTE.length] }} />
                  <span className="lbl">
                    {x.r.name} <span className="muted">· {x.r.poweredBy ?? typeLabel(x.r)}</span>
                  </span>
                  <span className="track">
                    <span className="bar" style={{ width: `${Math.max(2, ((x.consumed ?? 0) / (topConsumers[0].consumed || 1)) * 100)}%` }} />
                  </span>
                  <span className="num">{fmtCredits(x.consumed ?? 0)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">{fetching || envBusy ? 'Fetching consumption…' : `No consumption loaded for ${monthText} yet (Refresh).`}</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }} ref={envTableRef}>
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Copilot Credits per Environment
            <span className="small muted" style={{ marginLeft: 'auto', fontWeight: 400 }}>
              {hosted === false ? (
                'Sample data'
              ) : envBusy ? (
                'Refreshing…'
              ) : lastRefreshed ? (
                <span title={fmtDateTime(lastRefreshed)}>Last refreshed {fmtAgo(lastRefreshed)}</span>
              ) : (
                'Not refreshed yet'
              )}
            </span>
            <button className="btn btn-sm" onClick={exportEnvCsv} disabled={!envTable.total}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <SortTh k="name" label="Environment" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="allocated" label="Credits allocated" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="consumed" label="Credits consumption" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="pct" label="Consumption %" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="payGo" label="PayGo" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="payGoConsumed" label="PayGo Consumption" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="tenantPool" label="Draw from tenant" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="cost" label="Cost" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {envTable.pageRows.map((e) => (
                <tr
                  key={e.env.id}
                  className={`clickable${scopeEnv === e.env.id ? ' selected' : ''}`}
                  {...clickableRow(() => setHubEnv(scopeEnv === e.env.id ? '' : e.env.id))}
                  title={scopeEnv === e.env.id ? 'Show all environments' : 'Filter the AI Hub to this environment'}
                >
                  <td>
                    <Link to={`/environments/${e.env.id}`} onClick={(ev) => ev.stopPropagation()}>
                      {e.env.name}
                    </Link>
                    <div className="small muted">
                      {e.env.type}
                      {e.capacity?.estimated && (
                        <span className="ai-est" title={estimatedTip}>
                          {' '}
                          · Estimated
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="num-cell">
                    {capCell(e, (c) => (
                      <span title={c.autoAllocated ? `Includes ${fmtCredits(c.autoAllocated)} auto-allocated` : undefined}>{fmtCredits(c.allocated + c.autoAllocated)}</span>
                    ))}
                  </td>
                  <td className="num-cell">
                    {capCell(e, (c) => (
                      <>
                        {fmtCredits(c.consumed)}
                        {c.status === 'Overage' && <div className="small ai-err">Overage</div>}
                      </>
                    ))}
                  </td>
                  <td>
                    {capCell(e, (c) => {
                      const p = pctOf(c);
                      return c.allocated + c.autoAllocated > 0 ? (
                        <span className="ai-pct">
                          <span className="track">
                            <span className={`bar${p >= 1 ? ' over' : p >= 0.8 ? ' warn' : ''}`} style={{ width: `${Math.min(p, 1) * 100}%` }} />
                          </span>
                          {Math.round(p * 100)} %
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      );
                    })}
                  </td>
                  <td>{capCell(e, (c) => yesNo(c.payGo))}</td>
                  <td className="num-cell">{capCell(e, (c) => (c.payGo || c.payGoConsumed ? fmtCredits(c.payGoConsumed) : <span className="muted">—</span>))}</td>
                  <td>{capCell(e, (c) => yesNo(c.tenantPool))}</td>
                  <td className="num-cell">
                    {capCell(e, () => {
                      const cost = envCost(e);
                      return (
                        <strong title={`Prepaid ${money(cost.prepaid)} + pay-as-you-go ${money(cost.payGo)}`}>
                          {money(cost.total)}
                        </strong>
                      );
                    })}
                  </td>
                  <td>
                    <RowMenu
                      items={[
                        { label: 'Open environment', icon: <ExternalLink size={14} />, onClick: () => navigate(`/environments/${e.env.id}`) },
                        {
                          label: 'View agents',
                          icon: <Bot size={14} />,
                          onClick: () => {
                            setHubEnv(e.env.id);
                            setTab('agents');
                          },
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {envTable.total === 0 && (
                <tr>
                  <td className="empty" colSpan={9}>
                    {resourcesLoading ? 'Loading resources…' : 'No agents or agent flows in your monitored environments.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {envTable.total > envTable.pageSize && <Pagination page={envTable.page} pageSize={envTable.pageSize} total={envTable.total} onPage={envTable.setPage} />}
      </div>
      </>
      )}

      {tab === 'agents' && (
      <div className="card">
        <div className="toolbar">
          <div className="toolbar-row">
            <div className="search">
              <Search size={16} />
              <input placeholder="Search agents and flows by name or owner..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={['Agent', 'Agent flow', 'Cloud flow']} />
            <span className="spacer" />
            <span className="small muted">{agentsRefreshedNote}</span>
            {tjobActive && tjobProgress ? (
              <button className="btn" onClick={() => setShowBulk(true)} title="Limits are being set in the background. Click to see the progress.">
                <ShieldCheck size={16} /> Setting limits… {fmtNumber(tjobProgress.done)}/{fmtNumber(tjobProgress.total)}
              </button>
            ) : (
              <button className="btn" onClick={() => setShowBulk(true)} disabled={!filteredAgents} title="Set a Copilot Credit limit on the agents matching the filters (agent flows excluded)">
                <ShieldCheck size={16} /> Set limits ({fmtNumber(filteredAgents)} agent{filteredAgents === 1 ? '' : 's'})
              </button>
            )}
            <button className="btn" onClick={exportCsv}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>
        {reportPeriod !== undefined && (
          <div className="card-pad small muted ai-report-note">
            <Info size={14} /> <strong>Consumption</strong> and <strong>Cost</strong> come from the licensing API (resource thresholds: current consumption per resource) and cover <strong>{monthRange}</strong>.
          </div>
        )}
        <div className="table-wrap tall">
          <table className="table">
            <thead>
              <tr>
                <SortTh k="name" label="Name" sortKey={resTable.sortKey} sortDir={resTable.sortDir} onSort={resTable.toggleSort} />
                <SortTh k="type" label="Type" sortKey={resTable.sortKey} sortDir={resTable.sortDir} onSort={resTable.toggleSort} />
                <SortTh k="env" label="Environment" sortKey={resTable.sortKey} sortDir={resTable.sortDir} onSort={resTable.toggleSort} />
                <SortTh k="owner" label="Owner" sortKey={resTable.sortKey} sortDir={resTable.sortDir} onSort={resTable.toggleSort} />
                <SortTh k="usage" label="Usage (30 days)" sortKey={resTable.sortKey} sortDir={resTable.sortDir} onSort={resTable.toggleSort} />
                <SortTh k="consumption" label="Consumption" sortKey={resTable.sortKey} sortDir={resTable.sortDir} onSort={resTable.toggleSort} />
                <SortTh k="cost" label="Cost" sortKey={resTable.sortKey} sortDir={resTable.sortDir} onSort={resTable.toggleSort} />
              </tr>
            </thead>
            <tbody>
              {resTable.pageRows.map((x) => (
                // Solution components keep their id across environments: key by environment too.
                <tr
                  key={`${x.r.envId}:${x.r.id}`}
                  className="clickable"
                  {...clickableRow(() => setSelected(x.r))}
                  title={isAgent(x.r) ? 'Open agent details and Copilot Credit limit' : `Open ${typeLabel(x.r).toLowerCase()} details`}
                >
                  <td>
                    <span className="row" style={{ gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR[x.r.type], flexShrink: 0 }} />
                      <span className="name">{x.r.name}</span>
                    </span>
                  </td>
                  <td>
                    <span className="type-pill">{typeLabel(x.r)}</span>
                    {x.r.poweredBy && (
                      <>
                        {' '}
                        <PoweredByPill value={x.r.poweredBy} />
                      </>
                    )}
                  </td>
                  <td>{x.envName}</td>
                  <td>{x.r.owner}</td>
                  <td className="num-cell">
                    {x.usage === undefined ? (
                      <span className="muted" title={x.r.type === 'Copilot Studio' ? 'Agent sessions not available for this environment' : 'Runs not loaded yet'}>
                        —
                      </span>
                    ) : (
                      `${fmtNumber(x.usage)}${x.r.runsPartial ? '+' : ''} ${x.r.type === 'Copilot Studio' ? 'sessions' : 'runs'}`
                    )}
                  </td>
                  <td>{consumptionCell(x)}</td>
                  <td className="num-cell">{x.cost === undefined ? <span className="muted">—</span> : money(x.cost)}</td>
                </tr>
              ))}
              {resTable.total === 0 && (
                <tr>
                  <td className="empty" colSpan={7}>
                    No agents, agent flows or cloud flows with AI Builder consumption found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={resTable.page} pageSize={resTable.pageSize} total={resTable.total} onPage={resTable.setPage} />
        {unmatched.length > 0 && (
          <div className="card-pad ai-consumption-notes">
            {unmatched.length > 0 && (
              <details>
                <summary className="muted">
                  {unmatched.length} resource{unmatched.length === 1 ? '' : 's'} with credits not matched to the list above ({fmtCredits(unmatched.reduce((s, u) => s + u.credits.consumed, 0))}{' '}
                  credits: deleted, renamed, MSFT-owned or other kinds)
                </summary>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Environment</th>
                      <th>Features</th>
                      <th className="num-cell">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unmatched.map((u) => (
                      <tr key={`${u.envId}:${u.id}`}>
                        <td>
                          {u.credits.name ?? ''}
                          {!u.id.startsWith('name:') && <div className="small mono muted">{u.id}</div>}
                        </td>
                        <td>{u.envName}</td>
                        <td className="small">{Object.keys(u.credits.byFeature).join(', ')}</td>
                        <td className="num-cell">{fmtCredits(u.credits.consumed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>
        )}
      </div>
      )}

      {tab === 'logs' &&
        (activeLogs ? (
          logs.map((l) => fetchLog(l.title, l.lines, l.running, l.clear))
        ) : (
          <div className="card card-pad muted small" style={{ marginBottom: 16 }}>
            No fetch logs yet. Logs appear here when you run Refresh on the Agents tab.
          </div>
        ))}

      {tab !== 'logs' && (
        <p className="small muted ai-disclaimer">
          <Info size={13} /> Copilot Credits per environment (allocated, month-to-date consumption, pay-as-you-go and overage settings) come from the Power Platform
          licensing API, the same data as the admin center (Licensing › Copilot Studio › Environments), on Refresh (Overview tab); reading it needs Power Platform
          admin rights. Agents, agent flows and cloud flows, their Copilot Credit limits (licensing API, resource thresholds), agent sessions of the last 30 days
          (conversation transcripts, read-only FetchXML) and agent flow runs come from Sync on Home. On the Agents tab, Refresh only loads the consumption: the
          credits consumed per agent and agent flow, and the AI Builder credits of cloud flows (AI Builder events, read-only FetchXML, prompt content is not read). Everything is saved in this browser only, and each tab shows the last data fetched.
        </p>
      )}

      {showAssumptions && (
        <AssumptionsPanel
          value={assumptions}
          month={monthText}
          onClose={() => setShowAssumptions(false)}
          onSave={(a) => {
            saveAssumptions(a);
            setShowAssumptions(false);
            setToast('Cost assumptions saved');
          }}
        />
      )}
      {showDefaults && (
        <ThresholdDefaultsPanel
          onClose={() => setShowDefaults(false)}
          onSave={(s) => {
            saveThresholdDefaults(s);
            setShowDefaults(false);
            setToast('Default limits saved');
          }}
        />
      )}
      {showBulk && (
        <BulkThresholdPanel
          resources={filtered.map((x) => x.r)}
          envName={(id) => envName.get(id) ?? id}
          onClose={() => setShowBulk(false)}
          onApplied={(message) => {
            reloadThresholds();
            setToast(message);
          }}
        />
      )}
      {selected && (
        <AgentDetailPanel
          key={`${selected.envId}:${selected.id}`}
          resource={selected}
          env={environments.find((e) => e.id === selected.envId)}
          threshold={thresholdOf(thresholds, selected)}
          consumed={selectedRow?.consumed}
          consumedSource={
            selectedRow?.billed ? `${SUMMARY_SOURCE}, ${monthText}` : selectedRow?.flowAi ? `${FLOW_AI_SOURCE}, ${monthText}` : undefined
          }
          flowAi={selectedRow?.flowAi}
          onClose={() => setSelected(null)}
          onSaved={(message) => {
            reloadThresholds();
            setToast(message);
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}

type NumberKey = Exclude<keyof CostAssumptions, 'currency'>;
const NUMBER_KEYS: NumberKey[] = ['payGoPricePerCredit', 'creditsPerPack', 'costPerPack'];
type Draft = Record<NumberKey, string> & { currency: string };

const toDraft = (a: CostAssumptions): Draft => ({
  currency: a.currency,
  payGoPricePerCredit: String(a.payGoPricePerCredit),
  creditsPerPack: String(a.creditsPerPack),
  costPerPack: String(a.costPerPack),
});

/** Rounds a converted amount to a sensible number of decimals for the input. */
const roundTo = (n: number, digits: number) => String(Math.round(n * 10 ** digits) / 10 ** digits);

function AssumptionsPanel({
  value,
  month,
  onClose,
  onSave,
}: {
  value: CostAssumptions;
  month: string;
  onClose: () => void;
  onSave: (a: CostAssumptions) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(value));
  const parsed: CostAssumptions = {
    currency: draft.currency,
    payGoPricePerCredit: Number(draft.payGoPricePerCredit),
    creditsPerPack: Number(draft.creditsPerPack),
    costPerPack: Number(draft.costPerPack),
  };
  const valid = NUMBER_KEYS.every((k) => draft[k] !== '' && Number.isFinite(parsed[k]) && parsed[k] >= 0) && parsed.creditsPerPack > 0;
  const prepaid = prepaidPricePerCredit(parsed);

  /** Changing the currency converts both prices (approximate exchange rates). */
  const changeCurrency = (currency: string) =>
    setDraft((d) => ({
      ...d,
      currency,
      payGoPricePerCredit: roundTo(convert(Number(d.payGoPricePerCredit) || 0, d.currency, currency), 5),
      costPerPack: roundTo(convert(Number(d.costPerPack) || 0, d.currency, currency), 2),
    }));

  const field = (key: NumberKey, label: string, step: string, hint?: ReactNode) => (
    <div className="field">
      <label htmlFor={`ai-${key}`}>{label}</label>
      <input id={`ai-${key}`} className="input" type="number" min="0" step={step} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
      {hint && <div className="small muted">{hint}</div>}
    </div>
  );

  return (
    <SidePanel
      title="Cost assumptions"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={() => setDraft(toDraft(DEFAULT_ASSUMPTIONS))}>
            Reset to defaults
          </button>
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!valid} onClick={() => onSave(parsed)}>
            Save
          </button>
        </>
      }
    >
      <p className="small muted" style={{ marginTop: 0 }}>
        Used to turn Copilot Credits into cost: prepaid consumption at the prepaid price, pay-as-you-go consumption at the pay-as-you-go price. Saved in this browser
        only.
      </p>
      <div className="field">
        <label htmlFor="ai-currency">Currency</label>
        <select id="ai-currency" className="select" value={draft.currency} onChange={(e) => changeCurrency(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="small muted">Changing the currency converts the prices below with approximate exchange rates. Adjust them to your contract.</div>
      </div>

      <h4 className="ai-section">Pay-as-you-go</h4>
      {field(
        'payGoPricePerCredit',
        'Pay-as-you-go price per Copilot Credit',
        '0.0001',
        <>List price is 0.01 USD (≈ {fmtUnitPrice(payGoListPrice(draft.currency), draft.currency)}).</>,
      )}

      <h4 className="ai-section">Prepaid consumption</h4>
      {field('creditsPerPack', 'Number of credits per message pack', '1')}
      {field('costPerPack', 'Cost per pack', '0.01')}
      <div className="ai-unit-price">
        Estimated cost per Copilot Credit: <strong>{valid ? fmtUnitPrice(prepaid, draft.currency) : '—'}</strong>
      </div>

      <h4 className="ai-section">How costs are calculated</h4>
      <ul className="ai-notes">
        <li>
          <strong>Prepaid:</strong> Credits Consumption × {valid ? fmtUnitPrice(prepaid, draft.currency) : '—'} per credit (
          {valid ? fmtMoney(parsed.costPerPack, draft.currency, 2) : '—'} per pack of {valid ? fmtCredits(parsed.creditsPerPack) : '—'} credits).
        </li>
        <li>
          <strong>Pay-as-you-go:</strong> PayGo Consumption × {valid ? fmtUnitPrice(parsed.payGoPricePerCredit, draft.currency) : '—'} per credit.
        </li>
        <li>
          <strong>Per agent / agent flow:</strong> its consumption × the environment's blended price (its prepaid / pay-as-you-go mix).
        </li>
        <li className="muted">
          Environment credits come from the Power Platform licensing API ({month}, month to date). Consumption per agent / agent flow comes from the licensing API
          (resource thresholds: resourceConsumption per resource) on Refresh, matched by agent id.
        </li>
      </ul>
    </SidePanel>
  );
}
