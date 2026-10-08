import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { Loading, Section } from '../../modules/common';
import { HistoricalContextCard } from '../../modules/Environment';
import { HistoricalNews, LeadStory, splitLead } from '../../modules/HistoricalNews';
import { CompaniesInNews, EconomicSnapshot } from '../../modules/MarketSnapshot';
import { Ad, byCategory, Markets, Movers, Sports } from './home-helpers';

// ================================================================== 1999–2002: portal / search hybrid
export function PortalHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-portal">
      <div className="portal-left">
        <Markets data={data} groups={['indexes', 'international', 'commodities', 'rates']} />
        <Movers data={data} />
      </div>
      <div className="portal-main">
        <Section title={era.labels.topStories} id="sec-news">
          {data.status.news === 'loading' ? <Loading /> : <><LeadStory item={lead} /><HistoricalNews items={rest.slice(0, 5)} withSummary={false} className="news-links" /></>}
        </Section>
        <div className="portal-cats">
          {byCategory(rest.slice(5)).slice(0, 6).map((c) => (
            <Section key={c.label} title={c.label}><HistoricalNews items={c.items} limit={4} withSummary={false} className="news-links" /></Section>
          ))}
        </div>
        <CompaniesInNews news={data.news} snap={data.markets} />
        <EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} />
      </div>
      <div className="portal-right">
        <Ad data={data} />
        <HistoricalContextCard kind="weather" weather={data.weather} />
        <Sports data={data} limit={6} />
        <HistoricalContextCard kind="culture" culture={data.culture} />
        <Ad data={data} i={1} />
      </div>
    </div>
  );
}

