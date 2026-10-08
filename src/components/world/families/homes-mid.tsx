import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { fmtChange, fmtQuoteValue } from '../../../theme/format';
import { Loading } from '../../modules/common';
import { FrontPages, HistoricalContextCard } from '../../modules/Environment';
import { LeadStory, splitLead } from '../../modules/HistoricalNews';
import { EconomicSnapshot } from '../../modules/MarketSnapshot';
import { Est } from '../../modules/Provenance';
import { Ad, Markets, Movers, News, Sports } from './home-helpers';

/** 1950–54 front page: atomic-age furniture around the same modules as every other print era. */
export function Mid1950Home({ data }: { data: HomeData }) {
  const { date, go } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  const gauge = data.markets.indexes[0];
  return (
    <div className="home home-mid home-mid50">
      <div className={`mid-hero${gauge ? ' has-gauge' : ''}`}>
        <div className="mid-hero-flag">{lead?.availableAt === date ? 'Bulletin' : 'Latest'}</div>
        <div className="mid-hero-body">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
        {gauge ? (
          <aside className={`mid-gauge is-${(gauge.change ?? 0) >= 0 ? 'up' : 'down'}`} aria-label="Market barometer">
            <span className="mid-gauge-kicker">Market Barometer</span>
            <span className="mid-gauge-ring" aria-hidden />
            <button type="button" className="mid-gauge-name m-link" onClick={() => gauge.kind === 'stock' && go({ name: 'company', ticker: gauge.id })}>{gauge.name}</button>
            <span className="mid-gauge-val">{fmtQuoteValue(gauge, era, date)}<Est p={gauge.provenance} /></span>
            <span className="mid-gauge-chg">{fmtChange(gauge, era, date, 'pct')}</span>
          </aside>
        ) : null}
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
