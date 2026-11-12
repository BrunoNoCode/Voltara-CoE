// AI Hub cost model: Copilot Credits are billed per environment, either from prepaid
// capacity (message packs) or pay-as-you-go. Each has its own price per credit.
// Assumptions are editable and kept in this browser (localStorage).
import { useCallback, useState } from 'react';
import { readJson, writeJson } from '../data/liveEnvironments';
import type { Resource } from '../data/types';

const KEY = 'ppm.aiHub.assumptions.v2';

export interface CostAssumptions {
  currency: string;
  /** Pay-as-you-go price of one Copilot Credit (list price 0.01 USD). */
  payGoPricePerCredit: number;
  /** Copilot Credits included in one prepaid message pack. */
  creditsPerPack: number;
  /** Price of one prepaid message pack. */
  costPerPack: number;
}

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

/** Approximate value of 1 USD in each currency, used to convert prices when the currency changes. */
const USD_RATE: Record<string, number> = { USD: 1, EUR: 0.86, GBP: 0.75, CHF: 0.8 };

/** Pay-as-you-go list price in USD. */
const PAYGO_LIST_USD = 0.01;

export const DEFAULT_ASSUMPTIONS: CostAssumptions = {
  currency: 'EUR',
  payGoPricePerCredit: Math.round(PAYGO_LIST_USD * USD_RATE.EUR! * 10000) / 10000,
  creditsPerPack: 25000,
  costPerPack: 202.62,
};

/** Converts an amount between currencies with the approximate rates above. */
export function convert(amount: number, from: string, to: string) {
  const a = USD_RATE[from];
  const b = USD_RATE[to];
  return a && b ? (amount / a) * b : amount;
}

/** Pay-as-you-go list price (0.01 USD) in the given currency. */
export const payGoListPrice = (currency: string) => convert(PAYGO_LIST_USD, 'USD', currency);

/** Prepaid price of one Copilot Credit (cost per pack / credits per pack). */
export const prepaidPricePerCredit = (a: CostAssumptions) => (a.creditsPerPack > 0 ? a.costPerPack / a.creditsPerPack : 0);

export function useCostAssumptions(): [CostAssumptions, (a: CostAssumptions) => void] {
  const [value, setValue] = useState<CostAssumptions>(() => ({ ...DEFAULT_ASSUMPTIONS, ...(readJson<Partial<CostAssumptions>>(KEY) ?? {}) }));
  const save = useCallback((a: CostAssumptions) => {
    writeJson(KEY, a);
    setValue(a);
  }, []);
  return [value, save];
}

/** Types metered in Copilot Credits. */
export const AI_TYPES = new Set<Resource['type']>(['Copilot Studio', 'Agent Flow']);

export function fmtMoney(n: number, currency: string, maxDigits = n >= 100 ? 0 : 2) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: maxDigits }).format(n);
  } catch {
    return `${n.toFixed(maxDigits)} ${currency}`;
  }
}

/** Price of a single credit (needs more decimals than other amounts). */
export const fmtUnitPrice = (n: number, currency: string) => fmtMoney(n, currency, 6);

export function fmtCredits(n: number) {
  return Math.round(n).toLocaleString();
}
