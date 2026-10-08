import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { Loading } from '../../modules/common';
import { HistoricalContextCard } from '../../modules/Environment';
import { LeadStory, splitLead } from '../../modules/HistoricalNews';
import { CompaniesInNews, EconomicSnapshot } from '../../modules/MarketSnapshot';
import { Ad, Markets, Movers, News, Sports } from './home-helpers';

// ================================================================== 2003–2009
export function Web2Home({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-web2">
      <div className="w2-main">
        <div className="w2-feature">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
        <div className="w2-two">
          <News data={data} items={rest} limit={8} withSummary={false} title={era.labels.headlines} />
          <CompaniesInNews news={data.news} snap={data.markets} />
        </div>
        <div className="w2-two">
          <EconomicSnapshot economy={data.economy} snap={data.markets} />
          <div><Sports data={data} limit={6} /><HistoricalContextCard kind="culture" culture={data.culture} /></div>
        </div>
      </div>
      <div className="w2-side">
        <Markets data={data} groups={['indexes', 'commodities', 'international']} />
        <Movers data={data} />
        <HistoricalContextCard kind="weather" weather={data.weather} />
        <Ad data={data} />
      </div>
    </div>
  );
}

