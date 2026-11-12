import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '../state/AppStore';
import { ruleFetchPlan, type ActionRule } from './actions';
import type { FetchPlan } from '../data/liveResources';

/** Data synced less than this long ago is reused instead of fetched again. */
export const EVAL_MAX_AGE_MS = 60 * 60 * 1000;

export interface EvaluationSync {
  status: 'idle' | 'syncing' | 'done';
  /** Environments in the rule scope whose resources could not be refreshed (cached rows are used for them). */
  failed: number;
  /** Environments in the rule scope. */
  total: number;
  /** Environments handled so far (refreshed or reused). */
  done: number;
  /** Environments that needed a live refresh; the others reused a sync less than an hour old. */
  refreshed: number;
  /** The environment list could not be refreshed. */
  envError?: string;
  syncedAt?: string;
}

/**
 * Brings the inventory the rule needs up to date before it is evaluated: only the environments in
 * its scope, only the resource groups and lookups its trigger and action use, and only data older
 * than an hour (the environment list included).
 */
export function useEvaluationSync(
  rule: Pick<ActionRule, 'envIds' | 'types' | 'conditions' | 'action'>,
  /** Overrides the plan derived from the rule (e.g. the union of several rules' plans). */
  plan?: FetchPlan,
): [EvaluationSync, () => Promise<void>] {
  const { environments, envFetchedAt, syncAllEnvironments, syncResourcesForPlan } = useStore();
  const [state, setState] = useState<EvaluationSync>({ status: 'idle', failed: 0, total: 0, done: 0, refreshed: 0 });
  const inFlight = useRef<Promise<void> | null>(null);
  // Latest values without re-creating the callback (it runs from an effect).
  const latest = useRef({ rule, plan, environments, envFetchedAt });
  useLayoutEffect(() => {
    latest.current = { rule, plan, environments, envFetchedAt };
  });

  const run = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const p = (async () => {
      const { rule: r, plan: fetchPlan, envFetchedAt: listAt } = latest.current;
      setState((s) => ({ ...s, status: 'syncing', done: 0 }));
      let envError: string | undefined;
      if (!listAt || Date.now() - Date.parse(listAt) > EVAL_MAX_AGE_MS) {
        try {
          await syncAllEnvironments();
        } catch (err) {
          envError = err instanceof Error ? err.message : String(err);
        }
      }
      const monitored = latest.current.environments.filter((e) => e.monitored).map((e) => e.id);
      const ids = r.envIds.length ? monitored.filter((id) => r.envIds.includes(id)) : monitored;
      setState((s) => ({ ...s, total: ids.length }));
      const { total, failed, refreshed } = await syncResourcesForPlan(ids, fetchPlan ?? ruleFetchPlan(r), EVAL_MAX_AGE_MS, (done) =>
        setState((s) => ({ ...s, done })),
      );
      setState({ status: 'done', failed, total, done: total, refreshed, envError, syncedAt: new Date().toISOString() });
    })().finally(() => {
      inFlight.current = null;
    });
    inFlight.current = p;
    return p;
  }, [syncAllEnvironments, syncResourcesForPlan]);

  return [state, run];
}
