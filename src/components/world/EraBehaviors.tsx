/**
 * Cross-cutting era behaviours that are driven purely by the registry's `interactions` list, so no
 * frame needs to know about them:
 *   collapsible-widgets → section titles collapse/expand their module (dashboard-widget era)
 *   drawer-nav          → a menu button opens the era's navigation as a slide-in drawer + a floating action button (Material)
 *   tile-nav            → tile hover/focus lift (Metro)
 *   contextual-panel    → pointer-tilt-free side panel: focusing a headline shows its source in a docked panel
 * Pure DOM delegation on the frame; nothing here touches data.
 */
import { useEffect, useState } from 'react';
import './EraBehaviors.css';
import { useSim } from '../../state/simulation';
import { useEra } from '../../theme/EraThemeProvider';

export default function EraBehaviors({ onPalette }: { onPalette: () => void }) {
  const era = useEra();
  const { view, go } = useSim();
  const has = (k: string) => era.exp.interactions.includes(k as never);
  const [drawer, setDrawer] = useState(false);

  // collapsible widgets: annotate titles as buttons and toggle on click / Enter / Space
  useEffect(() => {
    if (!has('collapsible-widgets')) return;
    const root = document.querySelector('.w-main') ?? document.body;
    const annotate = () => root.querySelectorAll<HTMLElement>('.m-section > .m-section-head .m-section-title, .m-section > .m-section-title').forEach((t) => {
      if (t.dataset.cw) return; t.dataset.cw = '1'; t.tabIndex = 0; t.setAttribute('role', 'button'); t.setAttribute('aria-expanded', 'true');
    });
    annotate();
    const mo = new MutationObserver(annotate); mo.observe(root, { childList: true, subtree: true });
    const toggle = (t: HTMLElement) => { const sec = t.closest('.m-section'); if (!sec) return; const c = sec.classList.toggle('is-collapsed'); t.setAttribute('aria-expanded', String(!c)); };
    const click = (e: Event) => { const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cw]'); if (t) toggle(t); };
    const key = (e: KeyboardEvent) => { const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cw]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(t); } };
    root.addEventListener('click', click); root.addEventListener('keydown', key as EventListener);
    return () => { mo.disconnect(); root.removeEventListener('click', click); root.removeEventListener('keydown', key as EventListener); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [era.exp.id, view.name]);

  // contextual panel: show the focused/hovered headline's provenance in a docked card
  const [ctx, setCtx] = useState<{ title: string; meta: string } | null>(null);
  useEffect(() => {
    if (!has('contextual-panel')) return;
    const show = (e: Event) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('.m-story');
      if (!row) return;
      setCtx({ title: row.querySelector('.m-story-title, a, button')?.textContent?.trim() ?? '', meta: row.querySelector('.m-story-meta')?.textContent?.trim() ?? '' });
    };
    document.addEventListener('focusin', show); document.addEventListener('mouseover', show);
    return () => { document.removeEventListener('focusin', show); document.removeEventListener('mouseover', show); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [era.exp.id]);

  useEffect(() => { document.body.classList.toggle('drawer-open', drawer); return () => document.body.classList.remove('drawer-open'); }, [drawer]);
  useEffect(() => { setDrawer(false); }, [view.name, era.exp.id]);

  return (
    <>
      {has('drawer-nav') ? (
        <>
          <button type="button" className="eb-menu" aria-expanded={drawer} aria-controls="eb-drawer" onClick={() => setDrawer((v) => !v)}><span aria-hidden>☰</span><span className="eb-sr">Menu</span></button>
          <nav id="eb-drawer" className={`eb-drawer${drawer ? ' is-open' : ''}`} aria-label="Navigation drawer" hidden={!drawer}>
            <button type="button" onClick={() => go({ name: 'home' })}>Home</button>
            <button type="button" onClick={() => go({ name: 'portfolio' })}>Portfolio</button>
            <button type="button" onClick={() => go({ name: 'search', q: '' })}>Search</button>
            <button type="button" onClick={onPalette}>Go to…</button>
          </nav>
          {drawer ? <div className="eb-scrim" onClick={() => setDrawer(false)} aria-hidden /> : null}
          <button type="button" className="eb-fab" aria-label="Search" onClick={() => go({ name: 'search', q: '' })}>＋</button>
        </>
      ) : null}
      {ctx && has('contextual-panel') ? (
        <aside className="eb-ctx" aria-label="About this item"><b>{ctx.title.slice(0, 90)}</b><span>{ctx.meta}</span></aside>
      ) : null}
    </>
  );
}
