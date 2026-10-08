import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { Loading } from '../../modules/common';
import { HistoricalContextCard } from '../../modules/Environment';
import { LeadStory, splitLead } from '../../modules/HistoricalNews';
import { CompaniesInNews, EconomicSnapshot, MarketSnapshot } from '../../modules/MarketSnapshot';
import { PriceChart } from '../../modules/PriceChart';
import { Movers, News, Sports } from './home-helpers';

// ================================================================== 2019+
export function FintechHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  const spx = data.markets.indexes.find((q) => q.id === '^GSPC' || q.id === 'SPX');
  return (
    <div className="home home-fin">
      <div className="fin-bento">
        <div className="fin-card fin-hero" id="sec-markets">
          {spx ? (
            <div className="fin-hero-head">
              <span className="fin-hero-name">{spx.name}</span>
              <span className="fin-hero-val">{spx.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              <span className={`fin-hero-chg ${(spx.change ?? 0) >= 0 ? 'm-up' : 'm-down'}`}>{spx.changePct !== null ? `${spx.changePct >= 0 ? '+' : ''}${spx.changePct.toFixed(2)}% today` : ''}</span>
            </div>
          ) : <Loading />}
          <PriceChart symbol="^GSPC" title="1Y" />
        </div>
        <div className="fin-card fin-lead">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
        <div className="fin-card"><Movers data={data} /></div>
        <div className="fin-card"><MarketSnapshot snap={data.markets} groups={['indexes', 'commodities', 'rates', 'digital']} /></div>
        <div className="fin-card fin-news"><News data={data} items={rest} limit={7} withSummary={false} title={era.labels.headlines} /></div>
        <div className="fin-card"><EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} /></div>
        <div className="fin-card"><CompaniesInNews news={data.news} snap={data.markets} /></div>
        {data.sports.length || data.culture.length ? <div className="fin-card"><Sports data={data} limit={6} /><HistoricalContextCard kind="culture" culture={data.culture} /></div> : null}
      </div>
    </div>
  );
}

