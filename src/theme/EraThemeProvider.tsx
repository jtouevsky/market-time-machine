import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ISODate } from '../core/dates';
import { type EraTheme } from './eras';
import { ensureFonts } from './fonts';
import { eraFor } from './registry';

const EraContext = createContext<EraTheme | null>(null);

/** Derives the presentation layer entirely from the simulated date. */
export function EraThemeProvider({ date, children }: { date: ISODate; children: React.ReactNode }) {
  const theme = useMemo(() => eraFor(date), [date]);
  useEffect(() => {
    document.documentElement.dataset.era = theme.id;
    return () => { delete document.documentElement.dataset.era; };
  }, [theme.id]);
  useEffect(() => { ensureFonts(theme.exp.typography.fonts); }, [theme.exp]);
  return <EraContext.Provider value={theme}>{children}</EraContext.Provider>;
}

export function useEra(): EraTheme {
  const t = useContext(EraContext);
  if (!t) throw new Error('useEra outside EraThemeProvider');
  return t;
}
