import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ISODate } from '../core/dates';
import { eraFor, type EraTheme } from './eras';

const EraContext = createContext<EraTheme | null>(null);

/** Derives the presentation layer entirely from the simulated date. */
export function EraThemeProvider({ date, children }: { date: ISODate; children: React.ReactNode }) {
  const theme = useMemo(() => eraFor(date), [date]);
  useEffect(() => {
    document.documentElement.dataset.era = theme.id;
    return () => { delete document.documentElement.dataset.era; };
  }, [theme.id]);
  return <EraContext.Provider value={theme}>{children}</EraContext.Provider>;
}

export function useEra(): EraTheme {
  const t = useContext(EraContext);
  if (!t) throw new Error('useEra outside EraThemeProvider');
  return t;
}
