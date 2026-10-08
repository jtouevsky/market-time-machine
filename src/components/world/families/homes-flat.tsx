import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { Loading } from '../../modules/common';
import { HistoricalContextCard } from '../../modules/Environment';
import { LeadStory, splitLead } from '../../modules/HistoricalNews';
import { ClosedNotice, CompaniesInNews, EconomicSnapshot, MarketSnapshot } from '../../modules/MarketSnapshot';
import { Est } from '../../modules/Provenance';
import { Ad, Movers, News, Sports } from './home-helpers';

// ================================================================== 2013–2018
export function FlatHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-flat">
      <div className="flat-indices" id="sec-markets">
        {data.markets.indexes.slice(0, 3).map((q) => (
          <div key={q.id} className={`flat-index is-${(q.change ?? 0) >= 0 ? 'up' : 'down'}`}>
            <span className="flat-index-name">{q.name}</span>
            <span className="flat-index-val">{q.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}<Est p={q.provenance} /></span>
            <span className="flat-index-chg">{q.change !== null ? `${q.change >= 0 ? '+' : '−'}${Math.abs(q.change).toFixed(2)} (${q.changePct!.toFixed(2)}%)` : ''}</span>
          </div>
        ))}
        {data.status.markets === 'loading' ? <Loading /> : null}
      </div>
      <ClosedNotice snap={data.markets} />
      <div className="flat-grid">
        <div className="card card-lead">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
        <div className="card"><Movers data={data} /></div>
        <div className="card card-wide"><News data={data} items={rest} limit={7} title={era.labels.topStories} /></div>
        <div className="card"><MarketSnapshot snap={data.markets} groups={['commodities', 'rates', 'international', 'digital']} /></div>
        <div className="card"><EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} /></div>
        <div className="card"><CompaniesInNews news={data.news} snap={data.markets} /></div>
        {data.sports.length || data.culture.length ? <div className="card"><Sports data={data} limit={6} /><HistoricalContextCard kind="culture" culture={data.culture} /></div> : null}
        {data.weather.length || data.ads.length ? <div className="card"><HistoricalContextCard kind="weather" weather={data.weather} /><Ad data={data} /></div> : null}
      </div>
    </div>
  );
}

