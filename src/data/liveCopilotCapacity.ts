// Copilot Credits capacity per environment, as shown in the Power Platform admin center
// (Licensing › Copilot Studio › Environments). Read with the Power Platform for Admins V2
// connector: GET /licensing/environments/{id}/entitlements, entitlement "MCSMessages".
// Read-only. Cached per environment in localStorage.
import { PowerPlatformforAdminsV2Service } from '../generated/services/PowerPlatformforAdminsV2Service';
import type { EnvironmentEntitlementResponseModel } from '../generated/models/PowerPlatformforAdminsV2Model';
import { readJson, writeJson } from './liveEnvironments';
import { errorText } from './liveResourceConsumption';
import type { Environment } from './types';

const API_VERSION = '2024-10-01';
const ENTITLEMENT = 'MCSMessages';
const cacheKey = (envId: string) => `ppm.copilotCapacity.${envId}.v1`;

export interface CopilotCapacity {
  savedAt: string;
  /** Copilot Credits allocated to the environment (prepaid). */
  allocated: number;
  autoAllocated: number;
  /** Prepaid credits consumed this month. */
  consumed: number;
  /** Linked to a pay-as-you-go billing plan. */
  payGo: boolean;
  payGoConsumed: number;
  /** "Draw from the available capacity in my tenant" (TenantPool rule). */
  tenantPool: boolean;
  /** WithinCapacity, Overage, CoveredOverage. */
  status?: string;
  /** When the admin center last refreshed the consumption. */
  lastUpdated?: string;
  /** Set when the call failed (e.g. no admin rights). */
  error?: string;
}

const empty = (): CopilotCapacity => ({ savedAt: new Date().toISOString(), allocated: 0, autoAllocated: 0, consumed: 0, payGo: false, payGoConsumed: 0, tenantPool: false });

const latest = (...dates: (string | undefined)[]) =>
  dates.filter((d): d is string => !!d && !d.startsWith('0001')).sort((a, b) => Date.parse(b) - Date.parse(a))[0];

function mapEntitlement(e: EnvironmentEntitlementResponseModel | undefined): CopilotCapacity {
  const out = empty();
  const cap = e?.entitlement?.capacity;
  const pay = e?.entitlement?.payGo;
  const rule = (type: string) => cap?.enforcementRules?.some((r) => r.ruleType?.toLowerCase() === type.toLowerCase() && r.enabled) ?? false;
  out.allocated = cap?.allocated?.value ?? 0;
  out.autoAllocated = cap?.allocated?.autoAllocated ?? 0;
  out.consumed = cap?.consumed?.value ?? 0;
  out.payGoConsumed = pay?.consumed?.value ?? 0;
  out.payGo = rule('PayGo') || out.payGoConsumed > 0 || (pay?.entitled?.value ?? 0) > 0;
  out.tenantPool = rule('TenantPool');
  out.status = cap?.status;
  out.lastUpdated = latest(cap?.consumed?.lastUpdatedOn, pay?.consumed?.lastUpdatedOn);
  return out;
}

export function cachedCopilotCapacity(envId: string): CopilotCapacity | null {
  return readJson<CopilotCapacity>(cacheKey(envId));
}

export async function fetchCopilotCapacity(env: Environment): Promise<CopilotCapacity> {
  let capacity: CopilotCapacity;
  try {
    const result = await PowerPlatformforAdminsV2Service.GetManyEnvironmentEntitlements(env.id, API_VERSION);
    if (!result.success) throw new Error(errorText(result.error, 'Could not read the licensing data'));
    const list = Array.isArray(result.data) ? result.data : [];
    capacity = mapEntitlement(list.find((x) => x.entitlementId?.toLowerCase() === ENTITLEMENT.toLowerCase()));
  } catch (err) {
    capacity = { ...empty(), error: errorText(err) };
  }
  writeJson(cacheKey(env.id), capacity);
  return capacity;
}

/** Local preview (not hosted): stable pseudo-random capacity per environment. */
export function mockCopilotCapacity(envId: string): CopilotCapacity {
  let h = 0;
  for (const c of envId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const allocated = h % 4 === 0 ? 0 : 1000 * (1 + (h % 25));
  const payGo = h % 3 === 0;
  return {
    ...empty(),
    allocated,
    consumed: Math.round(allocated * ((h % 120) / 100)),
    payGo,
    payGoConsumed: payGo ? h % 4000 : 0,
    tenantPool: h % 2 === 0,
    status: allocated && h % 120 > 100 ? 'Overage' : 'WithinCapacity',
    lastUpdated: new Date(Date.now() - (h % 20) * 3600_000).toISOString(),
  };
}
