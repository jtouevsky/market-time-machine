import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { DatePortal } from './components/portal/DatePortal';
import { PREVIEW_MODE, SimulationProvider, useSim } from './state/simulation';
import { loadRegistry } from './theme/registryLoader';

// The world (all era frames), theme provider and transition are separate chunks: the landing page ships none of them.
const World = lazy(() => import('./WorldStage'));
const TimeTravelTransition = lazy(() => import('./components/portal/TimeTravelTransition').then((m) => ({ default: m.TimeTravelTransition })));

// DEV only: `?gallery` / Ctrl+Shift+G. The import() sits behind import.meta.env.DEV so production builds drop it entirely.
const Gallery = import.meta.env.DEV ? lazy(() => import('./gallery/ExperienceGallery')) : null;

function Stage() {
  const { phase, date, travel, resumeDate, travelTo } = useSim();
  const [gallery, setGallery] = useState(() => import.meta.env.DEV && new URLSearchParams(location.search).has('gallery'));
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const k = (e: KeyboardEvent) => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'g') { e.preventDefault(); setGallery((g) => !g); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  // DEV preview iframes: resume straight into the world on the requested date
  const booted = useRef(false);
  useEffect(() => {
    if (import.meta.env.DEV && PREVIEW_MODE && resumeDate && phase === 'portal' && !booted.current) { booted.current = true; travelTo(resumeDate); }
  }, [resumeDate, phase, travelTo]);
  const inWorld = phase === 'world' || (phase === 'traveling' && travel?.direction === 'forward');
  useEffect(() => {
    // warm the chunks while the visitor is choosing a date
    const idle = (window as any).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1200));
    idle(() => { void loadRegistry(); void import('./WorldStage'); void import('./components/portal/TimeTravelTransition'); });
  }, []);
  return (
    <>
      {import.meta.env.DEV && gallery && Gallery ? <Suspense fallback={null}><Gallery onClose={() => setGallery(false)} /></Suspense> : null}
      {phase === 'portal' || (phase === 'traveling' && travel?.direction === 'back') ? <DatePortal /> : null}
      {inWorld ? <Suspense fallback={null}><World date={date} /></Suspense> : null}
      {phase === 'traveling' ? <Suspense fallback={null}><TimeTravelTransition /></Suspense> : null}
    </>
  );
}

export default function App() {
  return (
    <SimulationProvider>
      <Stage />
    </SimulationProvider>
  );
}
