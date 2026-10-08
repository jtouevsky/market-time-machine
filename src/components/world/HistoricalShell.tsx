/**
 * The world shell. It owns the things every era shares (sources panel, command palette, reveal
 * and digest overlays, page state) and hands the page itself to the era's lazily loaded family.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { PageProvider } from '../../state/page';
import { useSim } from '../../state/simulation';
import { useHomeData } from '../../state/useHistorical';
import { useEra } from '../../theme/EraThemeProvider';
import { baseOf } from '../../theme/registry';
import { experienceStyle, needsSheet } from '../../theme/styleVars';
import { useDebugLabels } from '../modules/Provenance';
import { DigestToast, RevealModal } from '../modules/Reveal';
import { collectSources, SourcesPanel } from '../modules/Sources';
import { FRAMES } from './frames';
import '../../styles/world.css';
import '../../styles/families/shared.css';

const CommandPalette = lazy(() => import('./CommandPalette').then((m) => ({ default: m.CommandPalette })));
const EasterEggs = lazy(() => import('./EasterEggs'));
const EraBehaviors = lazy(() => import('./EraBehaviors'));

/** Era-voiced placeholder shown while a family's code is still arriving. */
function EraLoading() {
  const era = useEra();
  return <div className="w-loading w-loading-era" role="status" aria-busy="true"><p>{era.exp.loading}</p></div>;
}

export function HistoricalShell() {
  const era = useEra();
  const data = useHomeData();
  const { date } = useSim();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  useDebugLabels();
  const rows = useMemo(() => collectSources(data), [data]);
  const wantsPalette = era.exp.interactions.includes('command-palette') || era.id === 'flat' || era.id === 'fintech';

  useEffect(() => {
    if (!wantsPalette) return;
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [wantsPalette]);

  const Frame = FRAMES[era.family];
  const skin = typeof era.exp.opts?.skin === 'string' ? ` v-${era.exp.opts.skin}` : '';
  const base = baseOf(era.id);

  return (
    <div className={`world w-${era.id}${base !== era.id ? ` w-${base}` : ''} v-${era.variant}${skin} fam-${era.family}${needsSheet(era.exp) ? ' has-sheet' : ''}`} style={experienceStyle(era.exp)}
      data-era={era.id} data-sub={era.sub} data-family={era.family} data-motion={era.exp.motion.profile} key={`${era.sub}`}>
      <PageProvider key={`${era.sub}:${date}`}>
        <Suspense fallback={<EraLoading />}>
          <Frame data={data} onSources={() => setSourcesOpen(true)} onPalette={() => setPalette(true)} />
        </Suspense>
      </PageProvider>
      {sourcesOpen ? <SourcesPanel rows={rows} onClose={() => setSourcesOpen(false)} /> : null}
      {palette ? <Suspense fallback={null}><CommandPalette open={palette} onClose={() => setPalette(false)} onSources={() => setSourcesOpen(true)} /></Suspense> : null}
      <Suspense fallback={null}><EasterEggs /><EraBehaviors onPalette={() => setPalette(true)} /></Suspense>
      <RevealModal />
      <DigestToast />
    </div>
  );
}
