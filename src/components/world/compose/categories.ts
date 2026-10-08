import type { NewsItem } from '../../../core/types';

/** Category directory used by directory-style archetypes (1997 directory, 1998 quick links, 2002 tree). */
export const DOS_CATS: { key: NewsItem['category'][]; label: string; dir: string }[] = [
  { key: ['finance', 'economy', 'markets'], label: 'Finance', dir: 'Business & Economy' },
  { key: ['world'], label: 'World', dir: 'News & Media' },
  { key: ['business'], label: 'Business', dir: 'Companies' },
  { key: ['technology', 'science'], label: 'Technology', dir: 'Computers & Internet' },
  { key: ['politics'], label: 'Politics', dir: 'Government' },
  { key: ['culture'], label: 'Culture', dir: 'Entertainment' },
  { key: ['sports'], label: 'Sports', dir: 'Recreation & Sports' },
];
