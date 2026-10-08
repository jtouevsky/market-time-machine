import '../../../styles/families/earlyweb.css';
import '../../../styles/families/early-web.css';
import '../../../styles/families/portal.css';
import '../../../styles/families/portal-era.css';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { AdvanceTime } from '../../modules/AdvanceTime';
import { HistoricalTicker } from '../../modules/Environment';
import { PortalHeader } from '../headers/portal';
import { EnterpriseHeader, FlashHeader, XpHeader } from '../headers/pt-headers';
import { PortalHome } from '../families/homes-portal';
import { Breadcrumbs, EnterpriseHome, EntNav, EntTabProvider, EntToolbar } from '../families/pt-enterprise';
import { FlashIntro } from '../families/pt-flash';
import { XpWindow } from '../families/pt-xp';
import { ComposedHome, DefaultFooter, MainView, StandardFrame, type FrameProps } from '../shared';

const Dock = () => <div className="w-advance-dock"><AdvanceTime /></div>;

function XpFrame({ data, onSources }: FrameProps) {
  const era = useEra();
  const { date, view } = useSim();
  return (
    <>
      <XpWindow data={data} onSources={onSources}>
        <div className="pt-xp-page">
          <XpHeader />
          <HistoricalTicker snap={data.markets} />
          <main className="w-main" key={`${date}-${view.name}`}><MainView data={data} Home={era.exp.composition ? ComposedHome : PortalHome} /></main>
          <DefaultFooter onSources={onSources} />
        </div>
      </XpWindow>
      <Dock />
    </>
  );
}

function EnterpriseFrame({ data, onSources }: FrameProps) {
  const { date, view } = useSim();
  return (
    <EntTabProvider>
      <div className="w-frame pt-ent">
        <EnterpriseHeader />
        <HistoricalTicker snap={data.markets} />
        <div className="pt-ent-body">
          <EntNav />
          <main className="w-main pt-ent-main" key={`${date}-${view.name}`}>
            <EntToolbar />
            <Breadcrumbs />
            <MainView data={data} Home={EnterpriseHome} />
          </main>
        </div>
        <DefaultFooter onSources={onSources} />
      </div>
      <Dock />
    </EntTabProvider>
  );
}

export default function PortalFrame(props: FrameProps) {
  const era = useEra();
  switch (era.id) {
    case 'xp': return <XpFrame {...props} />;
    case 'enterprise': return <EnterpriseFrame {...props} />;
    case 'flash': return <><FlashIntro /><StandardFrame {...props} Header={FlashHeader} Home={ComposedHome} /></>;
    default: return <StandardFrame {...props} Header={PortalHeader} Home={era.exp.composition ? ComposedHome : PortalHome} />;
  }
}
