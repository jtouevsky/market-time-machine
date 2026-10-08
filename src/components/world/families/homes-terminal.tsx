import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { Loading, Section } from '../../modules/common';
import { HistoricalContextCard, HistoricalSports } from '../../modules/Environment';
import { HistoricalNews, LeadStory, splitLead } from '../../modules/HistoricalNews';
import { CompaniesInNews, EconomicSnapshot } from '../../modules/MarketSnapshot';
import { Ad, Markets, Movers } from './home-helpers';

// ================================================================== 1980–1994: terminal panes
export function TerminalHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-term">
      <div className="term-pane term-top">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
      <div className="term-pane term-news" id="sec-news"><Section title="NEWS WIRE  <N>">{data.status.news === 'loading' ? <Loading /> : <HistoricalNews items={rest} limit={14} />}</Section></div>
      <div className="term-pane term-mkts"><Markets data={data} groups={['indexes', 'international', 'commodities', 'rates']} title="WORLD MKTS  <W>" /></div>
      <div className="term-pane term-movers"><Movers data={data} /></div>
      <div className="term-pane term-econ"><EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} /></div>
      <div className="term-pane term-co"><CompaniesInNews news={data.news} snap={data.markets} /></div>
      <div className="term-pane term-misc" id="sec-sports">
        <HistoricalSports items={data.sports} limit={8} />
        <HistoricalContextCard kind="culture" culture={data.culture} />
        <HistoricalContextCard kind="weather" weather={data.weather} />
      </div>
      {data.ads.length ? <div className="term-pane term-ad"><Ad data={data} /></div> : null}
    </div>
  );
}

