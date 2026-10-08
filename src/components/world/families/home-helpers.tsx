/**
 * Front pages. Each information architecture arranges the day with its own hierarchy, density
 * and reading order — a broadsheet leads with a banner and stock tables, a 1960s report with a
 * television bulletin and a channel dial, a terminal with panes and a command line, a 1996 site
 * with a directory and "What's New", a modern app with cards.
 */
import type { NewsItem } from '../../../core/types';
import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { Loading, Section } from '../../modules/common';
import { HistoricalContextCard, HistoricalSports } from '../../modules/Environment';
import { HistoricalNews } from '../../modules/HistoricalNews';
import { MarketMovers, MarketSnapshot } from '../../modules/MarketSnapshot';

export const CATS: { key: NewsItem['category'][]; label: string; dir: string }[] = [
  { key: ['finance', 'economy', 'markets'], label: 'Finance', dir: 'Business & Economy' },
  { key: ['world'], label: 'World', dir: 'News & Media' },
  { key: ['business'], label: 'Business', dir: 'Companies' },
  { key: ['technology', 'science'], label: 'Technology', dir: 'Computers & Internet' },
  { key: ['politics'], label: 'Politics', dir: 'Government' },
  { key: ['culture'], label: 'Culture', dir: 'Entertainment' },
  { key: ['sports'], label: 'Sports', dir: 'Recreation & Sports' },
];
export const byCategory = (items: NewsItem[]) => CATS.map((c) => ({ ...c, items: items.filter((i) => c.key.includes(i.category)) })).filter((c) => c.items.length);

export function Ad({ data, i = 0 }: { data: HomeData; i?: number }) {
  const { date } = useSim();
  if (!data.ads.length) return null;
  const ad = data.ads[(i + Number(date.slice(8, 10))) % data.ads.length];
  return <HistoricalContextCard kind="ad" ad={ad} />;
}

/** Markets block that shows an era-voiced placeholder while loading. */
export function Markets({ data, groups, title }: { data: HomeData; groups?: Parameters<typeof MarketSnapshot>[0]['groups']; title?: string }) {
  const era = useEra();
  if (data.status.markets === 'loading') return <Section title={title ?? era.labels.markets} id="sec-markets"><Loading /></Section>;
  return <div id="sec-markets"><MarketSnapshot snap={data.markets} groups={groups} title={title} /></div>;
}
export function News({ data, items, title, limit, withSummary = true, className }: { data: HomeData; items: NewsItem[]; title: string; limit?: number; withSummary?: boolean; className?: string }) {
  return (
    <Section title={title} id="sec-news">
      {data.status.news === 'loading' ? <Loading /> : <HistoricalNews items={items} limit={limit} withSummary={withSummary} className={className} />}
    </Section>
  );
}
export const Sports = ({ data, limit }: { data: HomeData; limit?: number }) => <div id="sec-sports"><HistoricalSports items={data.sports} limit={limit} /></div>;
export const Movers = ({ data, limit }: { data: HomeData; limit?: number }) => <div id="sec-movers">{data.status.markets === 'ready' ? <MarketMovers snap={data.markets} limit={limit} /> : null}</div>;
