import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Bot, Coins, Download, Gauge, Info, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Workflow } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { DonutChart } from '../components/DonutChart';
import { FilterSelect, KpiCard, Pagination, PoweredByPill, SidePanel, SortTh, Tabs, Toast } from '../components/ui';
import { useTable } from '../lib/useTable';
import { downloadCsv, fmtAgo, fmtDateTime, fmtNumber, TYPE_COLOR } from '../lib/format';
import { clickableRow } from '../lib/clickableRow';
import { isSystemOwned, useHideSystem } from '../lib/hideSystem';
import { isInAiHub, useAiHubOverrides } from '../lib/aiHubEnvs';
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
import { cachedAgentUsage, fetchAgentUsage, mockAgentUsage, type AgentUsage } from '../data/liveAiUsage';
import { cachedCopilotCapacity, fetchCopilotCapacity, mockCopilotCapacity, type CopilotCapacity } from '../data/liveCopilotCapacity';
import {
  cachedResourceConsumption,
  creditsOf,
  fetchResourceThresholds,
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
import { cachedThresholds, isThresholdDefined, saveThresholdDefaults, thresholdOf, type ResourceThreshold, type ThresholdCache } from '../data/liveThresholds';
import { AgentDetailPanel, BulkThresholdPanel, ThresholdDefaultsPanel } from './AiThresholds';
import { isAgent, thresholdText } from '../lib/aiThresholds';
import { isActiveThresholdJob, latestThresholdJob, thresholdJobProgress, useThresholdJobs } from '../lib/thresholdJobs';
import { isHosted } from '../data/api';
import type { Environment, Resource } from '../data/types';

/** Environments queried at the same time for agent sessions / licensing data. */
const USAGE_CONCURRENCY = 3;
const ENV_COLORS = ['#009999', '#6a3fd1', '#0f62a8', '#e05a9c', '#f2a900', '#3aa6a6', '#5f9fdf', '#d9363e', '#7d8e99', '#1aa260'];
const OTHER_COLOR = '#c3ccd2';
const PREPAID_COLOR = '#009999';
const PAYGO_COLOR = '#f2a900';

/** Environments shown in the Cost by Environment donut; the rest are grouped as "Others". */
const TOP_ENVS = 5;
const OTHERS = 'Others';

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

/** When the Agents tab data was last fetched: resources/limits/sessions ("Sync") and consumption ("Fetch consumption"). */
interface AgentsRefreshed {
  synced?: string;
  consumption?: string;
}
const AGENTS_REFRESHED_KEY = 'ppm.aiHub.agentsRefreshedAt';
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
  const { environments, resources, resourceLoads, resourceSync, showCachedResources, syncMonitoredResources } = useStore();
  const [hideSystem] = useHideSystem();
  const [assumptions, saveAssumptions] = useCostAssumptions();
  const [hosted, setHosted] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<Record<string, AgentUsage | null>>({});
  const [usageBusy, setUsageBusy] = useState(0);
  const [capacity, setCapacity] = useState<Record<string, CopilotCapacity | null>>({});
  const [capacityBusy, setCapacityBusy] = useState(0);
  const [consumption, setConsumption] = useState<Record<string, ResourceConsumption | null>>({});
  const [billing, setBilling] = useState<Record<string, ResourceConsumption | null>>({});
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [creditsBusy, setCreditsBusy] = useState(false);
  const [creditsLog, setCreditsLog] = useState<string[]>([]);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingLog, setBillingLog] = useState<string[]>([]);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryLog, setSummaryLog] = useState<string[]>([]);
  const [flowAi, setFlowAi] = useState<Record<string, FlowAiConsumption | null>>({});
  const [flowAiBusy, setFlowAiBusy] = useState(false);
  const [flowAiLog, setFlowAiLog] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [q, setQ] = useState('');
  const [envFilter, setEnvFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
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
    setCapacity((prev) => {
      const next = { ...prev };
      for (const e of allMonitored) if (!(e.id in next)) next[e.id] = cachedCopilotCapacity(e.id);
      return next;
    });
    setConsumption((prev) => {
      const next = { ...prev };
      for (const e of allMonitored) if (!(e.id in next)) next[e.id] = cachedResourceConsumption(e.id);
      return next;
    });
    setBilling((prev) => {
      const next = { ...prev };
      for (const e of allMonitored) if (!(e.id in next)) next[e.id] = cachedAgentBillingSummary(e.id);
      return next;
    });
    setFlowAi((prev) => {
      const next = { ...prev };
      for (const e of allMonitored) if (!(e.id in next)) next[e.id] = cachedFlowAiConsumption(e.id);
      return next;
    });
  }

  useEffect(() => {
    void isHosted().then(setHosted);
  }, []);

  const resourcesLoading = allMonitored.some((e) => resourceLoads[e.id]?.state === 'loading' || resourceLoads[e.id]?.refreshing);

  const aiResources = useMemo(() => {
    const ids = new Set(monitored.map((e) => e.id));
    const out = resources.filter((r) => ids.has(r.envId) && AI_TYPES.has(r.type) && !(hideSystem && isSystemOwned(r)));
    // Cloud flows are not AI resources by type: add those with AI Builder consumption this month (synced row when there is one).
    const listed = new Set(out.map((r) => `${r.envId}:${r.id.toLowerCase()}`));
    const byKey = new Map(resources.map((r) => [`${r.envId}:${r.id.toLowerCase()}`, r]));
    for (const env of monitored)
      for (const f of Object.values(flowAi[env.id]?.byFlow ?? {})) {
        const key = `${env.id}:${f.id}`;
        if (f.consumed <= 0 || listed.has(key)) continue;
        const r = byKey.get(key) ?? flowAiResource(env.id, f);
        if (hideSystem && isSystemOwned(r)) continue;
        listed.add(key);
        out.push(r);
      }
    return out;
  }, [monitored, resources, hideSystem, flowAi]);

  /** Monitored environments that contain at least one agent (the only ones worth a transcript query). */
  const agentEnvs = useMemo(() => {
    const withAgents = new Set(aiResources.filter((r) => r.type === 'Copilot Studio').map((r) => r.envId));
    return monitored.filter((e) => withAgents.has(e.id));
  }, [monitored, aiResources]);

  // Latest lists, read by "Sync" after the resource sync re-rendered the page (its closure has the old ones).
  const monitoredRef = useRef(monitored);
  const agentEnvsRef = useRef(agentEnvs);
  useLayoutEffect(() => {
    monitoredRef.current = monitored;
    agentEnvsRef.current = agentEnvs;
  }, [monitored, agentEnvs]);

  /** Monitored environments with any agent or agent flow (licensing data is read for these). */
  const aiEnvs = useMemo(() => {
    const withAi = new Set(aiResources.map((r) => r.envId));
    return monitored.filter((e) => withAi.has(e.id));
  }, [monitored, aiResources]);

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

  const loadUsage = (targets: Environment[]) => {
    return runQueue(targets, async (env) => {
      const result = await fetchAgentUsage(env);
      setUsage((prev) => ({ ...prev, [env.id]: result }));
    }, setUsageBusy);
  };

  const loadCapacity = (targets: Environment[]) => {
    return runQueue(targets, async (env) => {
      const result = await fetchCopilotCapacity(env);
      setCapacity((prev) => ({ ...prev, [env.id]: result }));
    }, setCapacityBusy);
  };

  /** Old billing endpoint (Copilot Studio billing API): kept for its fetch log only, the table is not changed. */
  const loadAgentBilling = async () => {
    setBillingBusy(true);
    setBillingLog([]);
    const log = (line: string) => {
      console.info('[agentBilling]', line);
      setBillingLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${line}`]);
    };
    try {
      const n = Object.keys(await fetchAgentBilling(monitored, resources, log)).length;
      log(`Done: ${n} environment${n === 1 ? '' : 's'} answered (log only, table not changed)`);
    } catch (e) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBillingBusy(false);
    }
  };

  /** Credits consumed this month per Standard agent and agent flow (billing summary API): the consumption shown in the table. */
  const loadBillingSummary = async () => {
    setSummaryBusy(true);
    setSummaryLog([]);
    const log = (line: string) => {
      console.info('[agentBillingSummary]', line);
      setSummaryLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${line}`]);
    };
    try {
      const b = await fetchAgentBillingSummary(monitored, resources, log);
      setBilling((prev) => ({ ...prev, ...b }));
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

  /** AI Builder credits consumed this month per cloud flow (msdyn_aievents, PowerAutomate/AIBuilder): adds those cloud flows to the table. */
  const loadFlowAi = async () => {
    setFlowAiBusy(true);
    setFlowAiLog([]);
    const log = (line: string) => {
      console.info('[flowAiConsumption]', line);
      setFlowAiLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${line}`]);
    };
    try {
      const f = await fetchFlowAiConsumption(monitored, log);
      setFlowAi((prev) => ({ ...prev, ...f }));
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

  /** Limits per resource for all monitored environments (one tenant-wide resourceThresholds call). */
  const loadResourceCredits = async (targets: Environment[]) => {
    setCreditsBusy(true);
    setCreditsLog([]);
    const log = (line: string) => {
      console.info('[resourceThresholds]', line);
      setCreditsLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${line}`]);
    };
    try {
      log(`GET resourceThresholds (MCSMessages) for ${targets.length} monitored environment${targets.length === 1 ? '' : 's'}`);
      const r = await fetchResourceThresholds(targets, log);
      if (!r) {
        log('No data returned: kept the cached limits');
        return null;
      }
      setConsumption((prev) => ({ ...prev, ...r.byEnv }));
      // The fetched rows are used directly (the browser cache may be full and keep older values).
      if (r.thresholds) {
        setThresholds(r.thresholds);
        matchLog(r.thresholds).forEach(log);
      } else reloadThresholds();
      if (r.note) log(r.note);
      const check = diagnose(r.byEnv);
      check.forEach(log);
      return [r.note ?? '', check[0] ?? ''].filter(Boolean).join(' · ');
    } catch (e) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    } finally {
      setCreditsBusy(false);
    }
  };

  // Nothing is queried automatically: the last fetched data (browser cache) is shown until one of the buttons is clicked.

  /** Overview › "Refresh": Copilot Credits per environment (licensing API) only. */
  const refreshEnvironments = async () => {
    if (!hosted) {
      setToast('Local preview: environment credits are sample data');
      return;
    }
    await loadCapacity(aiEnvs);
    setToast(`Refreshed Copilot Credits for ${aiEnvs.length} environment${aiEnvs.length === 1 ? '' : 's'}`);
  };

  /** Agents › "Sync": all AI resources (agents, agent flows, cloud flows), their limits (resourceThresholds) and agent sessions. */
  const syncResources = async (quiet = false) => {
    if (!hosted) {
      await syncMonitoredResources(true);
      const msg = 'Local preview: limits and sessions are sample data';
      if (!quiet) setToast(msg);
      return msg;
    }
    await syncMonitoredResources(true);
    // Environments with agents are known once the synced resources are rendered: wait for that commit.
    await new Promise((r) => setTimeout(r, 0));
    const [limits] = await Promise.all([loadResourceCredits(monitoredRef.current), loadUsage(agentEnvsRef.current)]);
    stampAgentsRefreshed('synced');
    const msg = [`Synced AI resources`, limits === null ? 'limits unavailable (kept the cached data)' : `limits fetched${limits ? ` (${limits})` : ''}`].join(' · ');
    if (!quiet) setToast(`${msg} · see the Debug logs tab`);
    return msg;
  };

  /** Agents › "Fetch consumption": agents and agent flows (billing summary API), cloud flows (AI Builder events); the old billing call logs only. */
  const fetchConsumption = async (quiet = false) => {
    if (!hosted) {
      const msg = 'Local preview: the consumption APIs are only available in the hosted app';
      if (!quiet) setToast(msg);
      return msg;
    }
    const [billedEnvs, aiFlows] = await Promise.all([loadBillingSummary(), loadFlowAi(), loadAgentBilling()]);
    stampAgentsRefreshed('consumption');
    const msg = [`consumption of agents and agent flows: ${billedEnvs} environment${billedEnvs === 1 ? '' : 's'}`, `cloud flows with AI Builder consumption: ${aiFlows}`].join(' · ');
    if (!quiet) setToast(`${msg} · see the Debug logs tab`);
    return msg;
  };

  /** Licensing data per environment: live/cached when hosted, sample data in local preview. */
  const capacityFor = useMemo(() => {
    if (hosted !== false) return capacity;
    return Object.fromEntries(monitored.map((e) => [e.id, mockCopilotCapacity(e.id)]));
  }, [hosted, capacity, monitored]);

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
      const used = c && !c.error ? c.consumed + c.payGoConsumed : 0;
      out[id] = c && used > 0 ? (c.consumed * prepaidPrice + c.payGoConsumed * payGoPrice) / used : prepaidPrice;
    }
    return out;
  }, [capacityFor, prepaidPrice, payGoPrice]);

  const rows = useMemo<AiRow[]>(
    () =>
      aiResources.map((r) => {
        const u = usageFor[r.envId];
        const usage = !isAgent(r) ? r.runs30d : u && !u.error ? (u.sessions[r.id.toLowerCase()] ?? 0) : undefined;
        const c = consumptionFor[r.envId];
        // null = report imported for the environment, no line for this resource (nothing consumed).
        const credits = c && !c.error ? (creditsOf(c, r) ?? null) : undefined;
        // Limits come from the resource threshold row. Consumption of agents and agent flows comes only from the billing summary
        // API, matched on cdsBotId (bot id / workflow id); other resources keep "resourceConsumption" of their threshold row.
        const threshold = thresholdOf(thresholds, r);
        const b = isSummaryResource(r) ? billing[r.envId]?.byResource[r.id.toLowerCase()] : undefined;
        const fa = isCloudFlow(r) ? flowAi[r.envId]?.byFlow[r.id.toLowerCase()] : undefined;
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
    [aiResources, usageFor, consumptionFor, billing, flowAi, thresholds, priceFor, prepaidPrice, envName],
  );

  /** Report lines whose resource is not among the listed agents / agent flows (deleted, renamed, system-owned, other kinds). */
  const unmatched = useMemo(() => {
    const listed = new Set(aiResources.flatMap((r) => [`${r.envId}:${r.id.toLowerCase()}`, `${r.envId}:name:${r.name.trim().toLowerCase()}`]));
    const out: { envId: string; envName: string; id: string; credits: ResourceCredits }[] = [];
    for (const env of monitored) {
      const c = consumptionFor[env.id];
      if (!c || c.error) continue;
      for (const [id, credits] of Object.entries(c.byResource))
        if (!listed.has(`${env.id}:${id}`) && credits.consumed > 0) out.push({ envId: env.id, envName: env.name, id, credits });
    }
    return out.sort((a, b) => b.credits.consumed - a.credits.consumed);
  }, [monitored, aiResources, consumptionFor]);

  /** resourceId of each API row matched against the listed agents (botid) and agent flows (workflowid). */
  const matchLog = (cache: ThresholdCache): string[] => {
    const all = Object.values(cache.byKey);
    const matched = aiResources.flatMap((r) => {
      const t = thresholdOf(cache, r);
      return t ? [{ r, t }] : [];
    });
    const used = matched.filter((m) => m.t.consumption > 0).sort((a, b) => b.t.consumption - a.t.consumption);
    return [
      `resourceId match: ${matched.length} of ${aiResources.length} listed agents / agent flows have an API row (${used.length} with resourceConsumption > 0; ${all.length} API rows in total).`,
      ...used.slice(0, 5).map((m) => `   ${m.r.name} (${m.r.type}) ← ${m.t.resourceId}: ${fmtCredits(m.t.consumption)} credits`),
    ];
  };

  /** How the fetched credits line up with the listed agents / agent flows (log lines, to diagnose ID mismatches). */
  const diagnose = (byEnv: Record<string, ResourceConsumption>): string[] => {
    const byId = new Map(resources.map((r) => [r.id.toLowerCase(), r]));
    const listedIds = new Set(aiResources.map((r) => `${r.envId}:${r.id.toLowerCase()}`));
    let entries = 0, withCredits = 0, matched = 0, matchedCredits = 0, otherEnv = 0, otherType = 0;
    const otherTypes = new Map<string, number>();
    const samples: string[] = [];
    for (const [envId, c] of Object.entries(byEnv))
      for (const [id, v] of Object.entries(c.byResource)) {
        entries++;
        if (v.consumed > 0) withCredits++;
        if (listedIds.has(`${envId}:${id}`)) {
          matched++;
          if (v.consumed > 0) matchedCredits++;
          continue;
        }
        const r = byId.get(id);
        if (r && r.envId !== envId) otherEnv++;
        else if (r) {
          otherType++;
          const k = AI_TYPES.has(r.type) ? `${r.type} (hidden: system-owned)` : r.type;
          otherTypes.set(k, (otherTypes.get(k) ?? 0) + 1);
        } else if (v.consumed > 0 && samples.length < 5) samples.push(`${envName.get(envId) ?? envId}: ${id} (${fmtCredits(v.consumed)})`);
      }
    const agents = aiResources.filter((r) => r.type === 'Copilot Studio');
    const flows = aiResources.filter((r) => r.type === 'Agent Flow');
    const withData = (list: Resource[]) => list.filter((r) => byEnv[r.envId]).length;
    return [
      `Matching: ${matched} of ${entries} API resources are listed agents / agent flows (${matchedCredits} of ${withCredits} with credits > 0).`,
      `   Listed: ${agents.length} agents, ${flows.length} agent flows (${withData(agents)} / ${withData(flows)} in environments with API data).`,
      ...(otherEnv ? [`   ${otherEnv} API ids belong to a listed resource of another environment.`] : []),
      ...(otherType ? [`   ${otherType} API ids are other inventory items: ${[...otherTypes].map(([k, n]) => `${k} ${n}`).join(', ')}.`] : []),
      ...(samples.length ? ['   API ids with credits not found in the inventory:', ...samples.map((s) => `     ${s}`)] : []),
      ...(agents.length ? ['   Sample agent ids (botid):', ...agents.slice(0, 3).map((r) => `     ${envName.get(r.envId) ?? r.envId}: ${r.id.toLowerCase()} ${r.name}`)] : []),
      ...(flows.length ? ['   Sample agent flow ids (workflowid):', ...flows.slice(0, 3).map((r) => `     ${envName.get(r.envId) ?? r.envId}: ${r.id.toLowerCase()} ${r.name}`)] : []),
    ];
  };

  const envRows = useMemo<EnvRow[]>(() => {
    const map = new Map<string, EnvRow>();
    for (const env of monitored) map.set(env.id, { env, agents: 0, flows: 0, capacity: capacityFor[env.id] });
    const withRows = new Set<string>();
    for (const row of rows) {
      const e = map.get(row.r.envId)!;
      withRows.add(row.r.envId);
      if (row.r.type === 'Copilot Studio') e.agents++;
      else if (row.r.type === 'Agent Flow') e.flows++;
    }
    return [...map.values()].filter((e) => withRows.has(e.env.id));
  }, [monitored, rows, capacityFor]);

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

  // Cost by environment: the 5 most expensive, the rest grouped as "Others".
  const envSlices = useMemo(() => {
    const cost = (e: EnvRow) => envCost(e).total;
    const sorted = [...envRows].filter((e) => cost(e) > 0).sort((a, b) => cost(b) - cost(a));
    const top = sorted.slice(0, TOP_ENVS).map((e, i) => ({ id: e.env.id, label: e.env.name, value: Math.round(cost(e) * 100) / 100, color: ENV_COLORS[i % ENV_COLORS.length]! }));
    const rest = sorted.slice(TOP_ENVS).reduce((s, e) => s + cost(e), 0);
    if (rest > 0) top.push({ id: '', label: OTHERS, value: Math.round(rest * 100) / 100, color: OTHER_COLOR });
    return top;
    // envCost only depends on the prices
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envRows, prepaidPrice, payGoPrice]);

  const envTable = useTable<EnvRow>(
    envRows,
    {
      name: (e) => e.env.name,
      agents: (e) => e.agents,
      flows: (e) => e.flows,
      allocated: (e) => capNum(e, (c) => c.allocated),
      consumed: (e) => capNum(e, (c) => c.consumed),
      payGo: (e) => capNum(e, (c) => (c.payGo ? 1 : 0)),
      payGoConsumed: (e) => capNum(e, (c) => c.payGoConsumed),
      tenantPool: (e) => capNum(e, (c) => (c.tenantPool ? 1 : 0)),
      cost: (e) => capNum(e, () => envCost(e).total),
    },
    'consumed',
    10,
    'desc',
  );

  // Newest capacity fetch across environments = when "Refresh" last ran.
  const lastRefreshed = useMemo(() => {
    let max = 0;
    for (const e of envRows) {
      const t = e.capacity?.savedAt ? Date.parse(e.capacity.savedAt) : 0;
      if (t > max) max = t;
    }
    return max ? new Date(max).toISOString() : '';
  }, [envRows]);
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
        (!envFilter || row.r.envId === envFilter) &&
        (!typeFilter || typeLabel(row.r) === typeFilter),
    );
  }, [rows, q, envFilter, typeFilter]);
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
          ? `${SUMMARY_SOURCE}, ${month}`
          : fa
            ? `${FLOW_AI_SOURCE}, ${month}: ${fmtNumber(fa.events)} event${fa.events === 1 ? '' : 's'} · ` +
              Object.entries(fa.models)
                .sort((a, b) => b[1].credits - a[1].credits)
                .map(([k, m]) => `${k} ${fmtCredits(m.credits)}`)
                .join(', ') +
              (fa.llms.length ? ` · LLM ${fa.llms.join(', ')}` : '')
            : undefined
        : isSummaryResource(x.r)
          ? `Nothing reported by the ${SUMMARY_SOURCE} yet (Fetch consumption)`
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

  const envOptions = useMemo(() => envRows.map((e) => ({ value: e.env.id, label: e.env.name })).sort((a, b) => a.label.localeCompare(b.label)), [envRows]);
  const money = (n: number) => fmtMoney(n, assumptions.currency);
  const month = monthLabel();
  /** Table row of the resource open in the detail panel: the panel shows the same consumption as the table. */
  const selectedRow = selected ? rows.find((x) => x.r.envId === selected.envId && x.r.id === selected.id) : undefined;
  /** Agents (not agent flows) consuming the most Copilot Credits. */
  const topAgents = useMemo(
    () =>
      rows
        .filter((x) => isAgent(x.r) && (x.consumed ?? 0) > 0)
        .sort((a, b) => (b.consumed ?? 0) - (a.consumed ?? 0))
        .slice(0, 10)
        .map((x) => ({ label: x.r.name, env: x.envName, value: x.consumed ?? 0 })),
    [rows],
  );
  /** Agents and agent flows together, by Copilot Credits consumed. */
  const topConsumers = useMemo(
    () =>
      rows
        .filter((x) => (x.consumed ?? 0) > 0)
        .sort((a, b) => (b.consumed ?? 0) - (a.consumed ?? 0))
        .slice(0, 10),
    [rows],
  );

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
    if (c === null) return <span className="muted">Not loaded</span>;
    if (c.error)
      return (
        <span className="ai-err" title={c.error}>
          Unavailable
        </span>
      );
    return render(c);
  };
  const yesNo = (v: boolean) => <span className={`ai-flag${v ? ' on' : ''}`}>{v ? 'Yes' : 'No'}</span>;

  const envBusy = capacityBusy > 0;
  const syncBusy = !!resourceSync || creditsBusy || usageBusy > 0;
  const fetching = summaryBusy || flowAiBusy || billingBusy;
  const resourcesLeft = resourceSync ? resourceSync.total - resourceSync.done : 0;
  const syncLabel = [
    resourcesLeft ? `resources (${resourcesLeft} left)` : resourceSync ? 'resources' : '',
    creditsBusy ? 'limits' : '',
    usageBusy ? `sessions (${usageBusy} left)` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const logs = [
    { title: 'Limits fetch log (resourceThresholds)', lines: creditsLog, running: creditsBusy, clear: () => setCreditsLog([]) },
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
      <div className="page-head row">
        <div>
          <h1>AI Hub</h1>
          <p>Copilot Credit consumption and cost per environment ({month}), and the agents, agent flows and cloud flows using AI Builder in each.</p>
        </div>
        <div className="spacer" />
        {tab === 'overview' && (
          <>
            <button className="btn" onClick={() => setShowAssumptions(true)}>
              <SlidersHorizontal size={16} /> Cost assumptions
            </button>
            <button className="btn btn-primary" onClick={refreshEnvironments} disabled={envBusy} title="Refresh the Copilot Credits of each environment (licensing API)">
              <RefreshCw size={16} className={envBusy ? 'spin' : undefined} />
              {envBusy ? `Refreshing environments (${capacityBusy} left)…` : 'Refresh'}
            </button>
          </>
        )}
        {tab === 'agents' && (
          <>
            <button className="btn" onClick={() => setShowDefaults(true)} title="Default Copilot Credit limit settings for agents">
              <ShieldCheck size={16} /> Default limits
            </button>
            <button
              className="btn"
              onClick={() => void fetchConsumption()}
              disabled={fetching}
              title={`Consumption per agent and agent flow from the ${SUMMARY_SOURCE}, AI Builder consumption of cloud flows from the ${FLOW_AI_SOURCE}`}
            >
              <Gauge size={16} className={fetching ? 'spin' : undefined} /> {fetching ? 'Fetching consumption…' : 'Fetch consumption'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void syncResources()}
              disabled={syncBusy}
              title="Refresh all agents, agent flows and cloud flows, their Copilot Credit limits (resourceThresholds) and agent sessions"
            >
              <RefreshCw size={16} className={syncBusy ? 'spin' : undefined} />
              {syncBusy ? `Refreshing ${syncLabel}…` : 'Refresh'}
            </button>
          </>
        )}
      </div>

      <Tabs<AiHubTab>
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'agents', label: 'Agents', count: rows.length },
          { key: 'logs', label: 'Debug logs', count: activeLogs },
        ]}
        value={tab}
        onChange={setTab}
      />

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
          label={`Cost (${month})`}
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
        <KpiCard
          icon={<BadgeCheck size={22} />}
          color="#00a35a"
          label="Agents Published"
          value={fmtNumber(totals.published)}
          sub={
            totals.standard + totals.msft
              ? `${Math.round((totals.published / (totals.standard + totals.msft)) * 100)}% of agents · ${fmtNumber(totals.standard + totals.msft - totals.published)} not published`
              : 'No agents'
          }
        />
        <KpiCard icon={<Workflow size={22} />} color={TYPE_COLOR['Agent Flow']} label="Agent flows" value={fmtNumber(totals.flows)} sub={`${fmtNumber(totals.runs)} runs (30 days)`} />
      </div>

      <div className="home-row">
        <div className="card card-pad home-chart">
          <div className="card-title">
            Cost by Environment
            {envFilter && (
              <button className="link-btn" onClick={() => setEnvFilter('')}>
                Clear filter
              </button>
            )}
          </div>
          <div className="home-chart-body">
            {envSlices.length ? (
              <DonutChart
                size={150}
                centerLabel={assumptions.currency}
                data={envSlices}
                active={envSlices.find((s) => s.id && s.id === envFilter)?.label}
                onSelect={(l) => {
                  const id = envSlices.find((s) => s.label === l)?.id;
                  if (id) setEnvFilter(envFilter === id ? '' : id);
                }}
              />
            ) : (
              <p className="muted small">{capacityBusy > 0 ? 'Loading credits…' : 'No credits consumed this month.'}</p>
            )}
          </div>
        </div>
        <div className="card card-pad home-chart">
          <div className="card-title">Prepaid vs Pay-as-you-go</div>
          <div className="home-chart-body">
            {totals.cost > 0 ? (
              <DonutChart
                size={150}
                centerLabel={assumptions.currency}
                data={[
                  { label: 'Prepaid', value: Math.round(totals.prepaidCost * 100) / 100, color: PREPAID_COLOR },
                  { label: 'Pay-as-you-go', value: Math.round(totals.payGoCost * 100) / 100, color: PAYGO_COLOR },
                ]}
              />
            ) : (
              <p className="muted small">{capacityBusy > 0 ? 'Loading credits…' : 'No credits consumed this month.'}</p>
            )}
          </div>
        </div>
        <div className="card card-pad home-chart">
          <div className="card-title">Top consumers (agents, agent flows &amp; cloud flows)</div>
          <div className="home-chart-body" style={{ display: 'block' }}>
            {topConsumers.length ? (
              <ul className="hbars hbars-tall">
                {topConsumers.map((x, i) => (
                  <li key={i} title={`${x.r.name} · ${x.envName} · ${typeLabel(x.r)}`}>
                    <span className="lbl">{x.r.name}</span>
                    <span className="track">
                      <span className="bar" style={{ width: `${Math.max(2, ((x.consumed ?? 0) / (topConsumers[0].consumed || 1)) * 100)}%`, background: TYPE_COLOR[x.r.type] }} />
                    </span>
                    <span className="num">{fmtCredits(x.consumed ?? 0)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">{fetching ? 'Fetching consumption…' : 'No consumption loaded yet (Agents tab › Fetch consumption).'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
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
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <SortTh k="name" label="Environment" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="agents" label="Agents" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="flows" label="Agent flows" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="allocated" label="Credits allocated" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="consumed" label="Credits Consumption" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="payGo" label="PayGo" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="payGoConsumed" label="PayGo Consumption" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="tenantPool" label="Draw from tenant" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
                <SortTh k="cost" label="Cost" sortKey={envTable.sortKey} sortDir={envTable.sortDir} onSort={envTable.toggleSort} />
              </tr>
            </thead>
            <tbody>
              {envTable.pageRows.map((e) => (
                <tr key={e.env.id} className={`clickable${envFilter === e.env.id ? ' selected' : ''}`} {...clickableRow(() => setEnvFilter(envFilter === e.env.id ? '' : e.env.id))}>
                  <td>
                    <Link to={`/environments/${e.env.id}`} onClick={(ev) => ev.stopPropagation()}>
                      {e.env.name}
                    </Link>
                    <div className="small muted">{e.env.type}</div>
                  </td>
                  <td className="num-cell">{fmtNumber(e.agents)}</td>
                  <td className="num-cell">{fmtNumber(e.flows)}</td>
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
            <FilterSelect label="Environment" value={envFilter} onChange={setEnvFilter} options={envOptions} />
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
            <Info size={14} /> <strong>Consumption</strong> and <strong>Cost</strong> come from the licensing API (resource thresholds: current consumption per resource) and cover <strong>{reportPeriod.startsWith('last') ? `the ${reportPeriod}` : reportPeriod || 'the period of the data'}</strong>.
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
                  credits: deleted, renamed, system-owned or other kinds)
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
            No fetch logs yet. Logs appear here when you run Sync or Fetch consumption on the Agents tab.
          </div>
        ))}

      {tab !== 'logs' && (
        <p className="small muted ai-disclaimer">
          <Info size={13} /> Copilot Credits per environment (allocated, month-to-date consumption, pay-as-you-go and overage settings) come from the Power Platform
          licensing API, the same data as the admin center (Licensing › Copilot Studio › Environments), on Refresh (Overview tab); reading it needs Power Platform
          admin rights. On the Agents tab, Sync loads all agents, agent flows and cloud flows, their Copilot Credit limits (licensing API, resource thresholds) and
          agent sessions of the last 30 days (conversation transcripts, read-only FetchXML); agent flow runs come from the resource sync. Fetch consumption loads the
          credits consumed per agent and agent flow, and the AI Builder credits of cloud flows this month (AI Builder events, read-only FetchXML, prompt content is
          not read). Everything is saved in this browser only, and each tab shows the last data fetched.
        </p>
      )}

      {showAssumptions && (
        <AssumptionsPanel
          value={assumptions}
          month={month}
          topAgents={topAgents}
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
            selectedRow?.billed ? `${SUMMARY_SOURCE}, ${month}` : selectedRow?.flowAi ? `${FLOW_AI_SOURCE}, ${month}` : undefined
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

interface TopAgent {
  label: string;
  env: string;
  value: number;
}

function AssumptionsPanel({
  value,
  month,
  topAgents,
  onClose,
  onSave,
}: {
  value: CostAssumptions;
  month: string;
  topAgents: TopAgent[];
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
          (resource thresholds: resourceConsumption per resource) on Refresh usage, matched by agent id.
        </li>
      </ul>

      <h4 className="ai-section">Top agents by Copilot Credits</h4>
      {topAgents.length ? (
        <ul className="hbars hbars-tall">
          {topAgents.map((a, i) => (
            <li key={i} title={`${a.label} · ${a.env}`} style={{ gridTemplateColumns: '150px 1fr 60px' }}>
              <span className="lbl">{a.label}</span>
              <span className="track">
                <span className="bar" style={{ width: `${Math.max(2, (a.value / topAgents[0].value) * 100)}%`, background: TYPE_COLOR['Copilot Studio'] }} />
              </span>
              <span className="num">{fmtCredits(a.value)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small muted">No agent consumption loaded yet (Refresh usage).</p>
      )}
    </SidePanel>
  );
}
