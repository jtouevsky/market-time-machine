import type { MouseEvent, ReactNode } from 'react';
import '../../../styles/families/earlyweb.css';
import '../../../styles/families/early-web.css';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { AdvanceTime } from '../../modules/AdvanceTime';
import { HistoricalTicker } from '../../modules/Environment';
import { BrowserFrame } from '../headers/ew-browser';
import { DirectoryHeader } from '../headers/earlyweb';
import { DocHeader, PersonalHeader, Win98Header } from '../headers/ew-headers';
import { DirectoryHome, DocAddress } from '../families/homes-earlyweb';
import { PersonalFooterExtras, ConstructionBanner, PersonalMarquee } from '../families/ew-personal';
import { Win98Window } from '../families/ew-win98';
import { ComposedHome, DefaultFooter, MainView, StandardFrame, type FrameProps, type HeaderComponent } from '../shared';

/** Marks a clicked text link as visited (purple), the way an early browser's history did. Kept in the DOM only. */
function markVisited(e: MouseEvent<HTMLElement>) {
  const el = (e.target as HTMLElement).closest?.('.m-story-title, .dir-list a, .dir-cat, .dir-topics a, .dir-more a, .ew-doc-links a, .h-dir-links a, .m-link, .m-movers a, .m-quote-name a');
  if (el) el.setAttribute('data-visited', '1');
}

function Page({ data, onSources, Header, extraTop, extraBottom, className = '' }: FrameProps & { Header: HeaderComponent; extraTop?: ReactNode; extraBottom?: ReactNode; className?: string }) {
  const era = useEra();
  const { date, view } = useSim();
  return (
    <div className={`w-frame ${className}`} onClick={markVisited}>
      {extraTop}
      <Header />
      <HistoricalTicker snap={data.markets} />
      <main className="w-main" key={`${date}-${view.name}`}>
        <MainView data={data} Home={era.exp.composition ? ComposedHome : DirectoryHome} />
      </main>
      {extraBottom}
      <DefaultFooter onSources={onSources} />
    </div>
  );
}

const Dock = () => <div className="w-advance-dock"><AdvanceTime /></div>;

export default function EarlyWebFrame(props: FrameProps) {
  const era = useEra();
  switch (era.id) {
    case 'hypertext':
      return (
        <>
          <BrowserFrame variant={era.exp.opts?.chrome === 'netscape' ? 'netscape' : 'mosaic'}>
            <Page {...props} Header={DocHeader} className="ew-page" extraBottom={<DocAddress />} />
          </BrowserFrame>
          <Dock />
        </>
      );
    case 'personal':
      return (
        <>
          <Page {...props} Header={PersonalHeader} className="ew-page ew-personal" extraTop={<><ConstructionBanner /><PersonalMarquee /></>} extraBottom={<PersonalFooterExtras />} />
          <Dock />
        </>
      );
    case 'win98':
      return (
        <>
          <Win98Window>
            <Page {...props} Header={Win98Header} className="ew-page ew98-page" />
          </Win98Window>
          <Dock />
        </>
      );
    default:
      return <div style={{ display: 'contents' }} onClick={markVisited}><StandardFrame {...props} Header={DirectoryHeader} Home={era.exp.composition ? ComposedHome : DirectoryHome} /></div>;
  }
}
