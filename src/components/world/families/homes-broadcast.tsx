import { useState } from 'react';
import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { headline } from '../../../theme/format';
import { FrontPages, HistoricalContextCard, HistoricalSports } from '../../modules/Environment';
import { splitLead } from '../../modules/HistoricalNews';
import { CompaniesInNews, EconomicSnapshot } from '../../modules/MarketSnapshot';
import { Ad, Markets, Movers, News } from './home-helpers';

// ================================================================== 1955–1969: newspaper + television
/** The "please stand by" card: colour-less test bars while a bulletin is on its way. */
function Standby() {
  const era = useEra();
  return (
    <div className="bc-standby" role="status" aria-busy="true">
      <span className="bc-bars" aria-hidden />
      <span className="bc-standby-txt">{String(era.exp.loading ?? 'Please stand by…')}</span>
    </div>
  );
}

export function BroadcastHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  const live = lead?.availableAt === date;
  // the big dial is a real control: each click "changes channel" to the next bulletin
  const stories = [lead, ...rest.slice(0, 2)].filter((x): x is NonNullable<typeof lead> => !!x);
  const [ch, setCh] = useState(0);
  const at = stories.length ? ch % stories.length : 0;
  const shown = stories[at];
  const tag = at === 0 ? (live ? 'Bulletin' : 'Late News') : `Report ${at + 1}`;
  return (
    <div className="home home-bc">
      <div className="bc-stage">
        <div className="bc-tv" role="group" aria-label="Television bulletin">
          <span className="bc-antenna" aria-hidden />
          <div className="bc-screen">
            <span className="bc-glass" aria-hidden />
            <span className="bc-chyron">{tag}</span>
            {data.status.news === 'loading' ? <Standby /> : shown ? (
              <div key={at} className="bc-pic">
                <h1 className="bc-hl">{headline(shown.title, era)}</h1>
                {shown.summary ? <p className="bc-deck">{shown.summary}</p> : null}
                <div className="bc-lower">
                  <span className="bc-lower-tag">{shown.publication && shown.publication !== 'Wikipedia' ? shown.publication : era.formatShort(shown.availableAt)}</span>
                  <span className="bc-lower-line">{era.publication} · {era.motto}</span>
                </div>
              </div>
            ) : null}
          </div>
          <div className="bc-tv-panel">
            <button type="button" className="bc-dial" style={{ ['--spin' as string]: `${ch * 72}deg` }} onClick={() => setCh((c) => c + 1)} aria-label={`Change channel: next bulletin (${at + 1} of ${Math.max(stories.length, 1)})`} />
            <span className="bc-dial small" aria-hidden />
            <span className="bc-lamp" aria-hidden />
            <span className="bc-grille" aria-hidden />
          </div>
        </div>
        <div className="bc-board">
          <Markets data={data} groups={['indexes', 'rates']} title={era.labels.markets} />
        </div>
      </div>
      {data.weather.length ? (
        <div className="bc-wx-strip" aria-label={era.labels.weather}>
          <span className="bc-wx-label">{era.labels.weather}</span>
          {data.weather.map((w) => <span key={w.id} className="bc-wx">{w.city} <b>{w.high}°</b>/{w.low}° <small>{w.sky}</small></span>)}
        </div>
      ) : null}
      <div className="bc-cols">
        <News data={data} items={rest} limit={8} title={era.labels.headlines} />
        <div>
          <Movers data={data} limit={6} />
          <CompaniesInNews news={data.news} snap={data.markets} />
        </div>
        <div>
          <EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} />
          <HistoricalContextCard kind="culture" culture={data.culture} />
          <Ad data={data} />
        </div>
      </div>
      <SportsCrawl data={data} />
      <FrontPages pages={data.frontPages} limit={4} />
    </div>
  );
}

function SportsCrawl({ data }: { data: HomeData }) {
  const era = useEra();
  const results = data.sports.filter((s) => 'league' in s) as { id: string; league: string; away: string; awayScore: number; home: string; homeScore: number }[];
  if (!results.length) return <div id="sec-sports"><HistoricalSports items={data.sports} /></div>;
  const line = results.map((r) => `${r.league}: ${r.away} ${r.awayScore}, ${r.home} ${r.homeScore}`);
  return (
    <div className="bc-crawl" id="sec-sports" aria-label={era.labels.sports}>
      <span className="bc-crawl-flag">{era.labels.sports}</span>
      <div className="m-ticker-track"><div className="m-ticker-run">{line.map((l, i) => <span key={i}>{l}</span>)}</div><div className="m-ticker-run" aria-hidden>{line.map((l, i) => <span key={i}>{l}</span>)}</div></div>
    </div>
  );
}

