import { useState } from 'react';
import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { Loading } from '../../modules/common';
import { HistoricalContextCard } from '../../modules/Environment';
import { LeadStory, splitLead } from '../../modules/HistoricalNews';
import { ClosedNotice, CompaniesInNews, EconomicSnapshot } from '../../modules/MarketSnapshot';
import { Est } from '../../modules/Provenance';
import { Ad, Movers, News, Sports } from './home-helpers';

// ================================================================== 2010–2012
export function MobileHome({ data }: { data: HomeData }) {
  const { date, go } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  const ios = era.exp.id === 'ios-2011';
  const [scores, setScores] = useState(true);
  const tiles = [...data.markets.indexes, ...data.markets.commodities.slice(0, 2), ...data.markets.digital.slice(0, 1)];
  return (
    <div className="home home-mobile">
      {ios ? <div className="mob-pull" aria-hidden><span className="mob-pull-arrow" /><span className="mob-pull-text">Updated just now</span></div> : null}
      <ClosedNotice snap={data.markets} />
      <div className="mob-tiles" role="list" id="sec-markets">
        {data.status.markets === 'loading' ? <Loading /> : tiles.map((q) => (
          <div key={q.id} role="listitem" className={`mob-tile is-${(q.change ?? 0) >= 0 ? 'up' : 'down'}`}>
            <span className="mob-tile-name">{q.name}</span>
            <span className="mob-tile-val">{q.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}<Est p={q.provenance} /></span>
            <span className="mob-tile-chg">{q.changePct !== null ? `${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%` : ''}</span>
          </div>
        ))}
      </div>
      <div className="mob-card mob-lead">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
      <div className="mob-card"><News data={data} items={rest} limit={7} withSummary={false} title={era.labels.headlines} /></div>
      <div className="mob-card"><Movers data={data} /></div>
      <div className="mob-card"><CompaniesInNews news={data.news} snap={data.markets} /></div>
      <div className="mob-card"><EconomicSnapshot economy={data.economy} snap={data.markets} /></div>
      {ios && (data.sports.length || data.culture.length) ? (
        <div className="mob-group">
          <div className="mob-row">
            <span id="mob-scores-label">Scores &amp; culture</span>
            <button type="button" role="switch" aria-checked={scores} aria-labelledby="mob-scores-label" className={`mob-switch${scores ? ' is-on' : ''}`} onClick={() => setScores((v) => !v)}>
              <span className="mob-switch-state" aria-hidden>{scores ? 'ON' : 'OFF'}</span><span className="mob-switch-knob" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
      {(!ios || scores) && (data.sports.length || data.culture.length) ? <div className="mob-card"><Sports data={data} limit={5} /><HistoricalContextCard kind="culture" culture={data.culture} /></div> : null}
      <Ad data={data} />
      <button type="button" className="mob-cta" onClick={() => go({ name: 'portfolio' })}>Open Portfolio ›</button>
    </div>
  );
}

