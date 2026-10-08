import '../../../styles/families/terminal.css';
import '../../../styles/families/terminal-era.css';
import { useEffect } from 'react';
import { usePage } from '../../../state/page';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { TerminalHeader } from '../headers/terminal';
import { TerminalHome } from '../families/homes-terminal';
import { ComposedHome, DefaultFooter, StandardFrame, type FrameProps } from '../shared';
import { TerminalConsole } from '../TerminalConsole';

/** DOS-style footer: copyright line plus a "Press any key" prompt that returns to the menu from sub-views. */
function TerminalFooter({ onSources }: { onSources: () => void }) {
  const era = useEra();
  const { view, go } = useSim();
  const { setPage } = usePage();
  const dos = era.exp.archetype === 'dos';
  const away = view.name !== 'home';
  useEffect(() => {
    if (!dos || !away) return;
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== 'Enter' || (t && t !== document.body)) return;
      setPage(0); go({ name: 'home' });
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [dos, away, go, setPage]);
  return (
    <>
      <DefaultFooter onSources={onSources} />
      {dos ? (
        <button type="button" className="dos-anykey" onClick={() => { setPage(0); go({ name: 'home' }); }} disabled={!away}>
          {away ? 'Press ENTER (or click here) to return to the menu' : 'Press 1-4 to choose an option'}<span className="dos-cursor" aria-hidden />
        </button>
      ) : null}
    </>
  );
}

export default function TerminalFrame(props: FrameProps) {
  const era = useEra();
  return (
    <StandardFrame {...props} Header={TerminalHeader} Home={era.exp.composition ? ComposedHome : TerminalHome} Footer={TerminalFooter}
      before={<div className="crt-overlay" aria-hidden />} Dock={<TerminalConsole onSources={props.onSources} news={props.data.news} />} />
  );
}
