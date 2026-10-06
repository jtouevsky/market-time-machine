import { useEffect, useState } from 'react';
import { EMPTY, type ModuleName, type ModuleStatus, type WorldModules } from '../data/aggregator';
import type { HistoricalDataProvider } from '../data/provider';
import { useSim } from './simulation';

/** Run a provider query keyed on the simulated date (plus any extra deps). */
export function useHistorical<T>(fn: (p: HistoricalDataProvider, date: string) => Promise<T>, deps: unknown[] = []): T | undefined {
  const { provider, date } = useSim();
  const [data, setData] = useState<T>();
  useEffect(() => {
    let live = true;
    setData(undefined);
    fn(provider, date).then((d) => { if (live) setData(d); }).catch((e) => console.error(e));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, date, ...deps]);
  return data;
}

const MODULES: ModuleName[] = ['markets', 'news', 'economy', 'sports', 'culture', 'weather', 'ads', 'frontPages'];

export type HomeData = WorldModules & { status: Record<ModuleName, ModuleStatus> };

/**
 * The day's world, delivered progressively: the page renders immediately with empty modules,
 * and each module fills in as its provider answers. One failing source never blocks the rest.
 */
export function useHomeData(): HomeData {
  const { world, date } = useSim();
  const [state, setState] = useState<HomeData>(() => ({ ...EMPTY(date), status: Object.fromEntries(MODULES.map((m) => [m, 'loading'])) as HomeData['status'] }));
  useEffect(() => {
    let live = true;
    setState({ ...EMPTY(date), status: Object.fromEntries(MODULES.map((m) => [m, 'loading'])) as HomeData['status'] });
    for (const m of MODULES) {
      world.module(m, date).then(
        (v) => live && setState((s) => ({ ...s, [m]: v, status: { ...s.status, [m]: 'ready' } })),
        (e) => { console.warn(`[${m}]`, e?.message ?? e); if (live) setState((s) => ({ ...s, status: { ...s.status, [m]: 'error' } })); },
      );
    }
    return () => { live = false; };
  }, [world, date]);
  return state;
}
