import { useEffect } from 'react';
import '../../../styles/families/print.css';
import '../../../styles/families/print-early.css';
import '../../../styles/families/mid-century.css';
import { useEra } from '../../../theme/EraThemeProvider';
import { MidHeader, PaperHeader, PrintFooter } from '../headers/print';
import { ArchiveHome, BroadsheetHome, MidcenturyHome } from '../families/homes-print';
import { Mid1950Home } from '../families/homes-mid';
import { ComposedHome, StandardFrame, type FrameProps, type HeaderComponent, type HomeComponent } from '../shared';

/** Lead paragraphs that open with a digit ("23 – The World…") can't carry a drop cap: mark them so CSS skips the initial. */
function useDigitLeads() {
  useEffect(() => {
    let raf = 0;
    const mark = () => { raf = 0; document.querySelectorAll<HTMLElement>('.m-lead-deck:not([data-numlead])').forEach((el) => { if (/^\W*\d/.test(el.textContent ?? '')) el.setAttribute('data-numlead', ''); }); };
    mark();
    const mo = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(mark); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);
}

export default function PrintFrame(props: FrameProps) {
  const era = useEra();
  const pre50 = era.exp.to < '1950-01-01';
  useDigitLeads();
  const Header: HeaderComponent = era.id === 'midcentury' || era.id === 'swiss' ? MidHeader : PaperHeader;
  const Home: HomeComponent = era.exp.composition ? ComposedHome : era.id === 'archive' ? ArchiveHome : era.id === 'broadsheet' ? BroadsheetHome : era.id === 'midcentury' ? Mid1950Home : MidcenturyHome;
  return <StandardFrame {...props} Header={Header} Home={Home} Footer={PrintFooter} className={pre50 ? 'pre50' : ''} />;
}
