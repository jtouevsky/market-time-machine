import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { headline } from '../../../theme/format';
import { Loading } from '../../modules/common';
import { FrontPages, HistoricalContextCard } from '../../modules/Environment';
import { HistoricalNews, LeadStory, splitLead } from '../../modules/HistoricalNews';
import { CompaniesInNews, EconomicSnapshot } from '../../modules/MarketSnapshot';
import { Ad, Markets, Movers, News, Sports } from './home-helpers';

// ================================================================== 1700s–1899
export function ArchiveHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-archive">
      <div className="paper-cols">
        <div className="col col-lead">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}<HistoricalNews items={rest.slice(0, 3)} /></div>
        <div className="col"><Markets data={data} /><EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} /></div>
        <div className="col"><News data={data} items={rest.slice(3, 12)} title={era.labels.headlines} /></div>
        <div className="col">
          <HistoricalContextCard kind="weather" weather={data.weather} />
          <HistoricalContextCard kind="culture" culture={data.culture} />
          <Sports data={data} limit={4} />
          <Ad data={data} />
          <FrontPages pages={data.frontPages} limit={1} />
          <Ad data={data} i={1} />
        </div>
      </div>
    </div>
  );
}

// ================================================================== 1900–1945
export function BroadsheetHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className={`home home-broadsheet bs-${era.sub}`}>
      {lead ? <div className="banner"><h1 className="banner-hl">{headline(lead.title, era)}</h1></div> : <div className="banner"><Loading /></div>}
      <div className="paper-cols">
        <div className="col col-lead">
          <LeadStory item={lead} />
          <HistoricalNews items={rest.slice(0, 4)} />
        </div>
        <div className="col col-market">
          <Markets data={data} groups={['indexes', 'rates', 'commodities', 'international']} title={era.labels.markets} />
          <Movers data={data} />
        </div>
        <div className="col">
          <News data={data} items={rest.slice(4, 12)} title={era.labels.headlines} withSummary={false} />
          <EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} />
        </div>
        <div className="col col-side">
          <HistoricalContextCard kind="weather" weather={data.weather} />
          <Sports data={data} limit={6} />
          <HistoricalContextCard kind="culture" culture={data.culture} />
          <Ad data={data} />
          <CompaniesInNews news={data.news} snap={data.markets} />
          <Ad data={data} i={1} />
        </div>
      </div>
      <FrontPages pages={data.frontPages} limit={4} />
    </div>
  );
}

// ================================================================== 1946–1959
export function MidcenturyHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-mid">
      <div className="mid-hero">
        <div className="mid-hero-flag">{lead?.availableAt === date ? 'Bulletin' : 'Latest'}</div>
        {data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}
      </div>
      <div className="mid-grid">
        <div className="mid-news"><News data={data} items={rest} limit={9} title={era.labels.headlines} /></div>
        <div className="mid-markets">
          <Markets data={data} groups={['indexes', 'commodities', 'international']} />
          <Movers data={data} />
        </div>
        <div className="mid-side">
          <EconomicSnapshot economy={data.economy} snap={data.markets} />
          <Sports data={data} limit={5} />
          <HistoricalContextCard kind="weather" weather={data.weather} />
          <HistoricalContextCard kind="culture" culture={data.culture} />
          <Ad data={data} />
        </div>
      </div>
      <FrontPages pages={data.frontPages} limit={4} />
    </div>
  );
}

