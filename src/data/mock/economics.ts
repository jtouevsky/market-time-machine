/**
 * MOCK macroeconomic series. The key idea is the *release lag*: an August unemployment rate
 * describes August, but nobody could read it until early September. Each reading's
 * availableAt is its publication date, not its reference period.
 */
import type { EconomicReading } from '../../core/types';
import { addDays, daysInMonth, MONTHS, toISO, type ISODate } from '../../core/dates';

interface SeriesSpec {
  id: string;
  label: string;
  unit: string;
  frequency: 'monthly' | 'quarterly';
  /** Days after the end of the reference period until publication. */
  lag: number;
  /** Before this date the statistic simply was not published. */
  firstPublished: ISODate;
  source: string;
  anchors: [string, number][]; // ["YYYY-MM", value]
}

const A = (s: string): [string, number][] =>
  s.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [k, v] = x.split('='); return [k, Number(v)]; });

const SPECS: SeriesSpec[] = [
  {
    id: 'UNRATE', label: 'Unemployment rate', unit: '%', frequency: 'monthly', lag: 7, firstPublished: '1948-02-01', source: 'Bureau of Labor Statistics',
    anchors: A(`1948-01=3.4,1949-10=7.9,1951-06=3.1,1953-05=2.5,1954-09=6.1,1957-03=3.7,1958-07=7.5,1960-06=5.4,1961-05=7.1,
1966-01=4.0,1969-05=3.4,1969-06=3.5,1969-07=3.5,1970-12=6.1,1973-10=4.6,1975-05=9.0,1979-05=5.6,1980-07=7.8,1981-07=7.2,
1982-11=10.8,1984-12=7.3,1987-01=6.6,1987-08=5.9,1987-09=5.9,1989-03=5.0,1990-06=5.2,1992-06=7.8,1995-06=5.6,1999-12=4.0,
2000-01=4.0,2000-02=4.1,2000-04=3.8,2001-07=4.6,2001-08=4.9,2001-12=5.7,2003-06=6.3,2006-10=4.4,2006-11=4.5,2006-12=4.5,
2007-05=4.4,2008-07=5.8,2008-08=6.1,2009-10=10.0,2012-12=7.9,2015-12=5.0,2019-09=3.5,2020-01=3.6,2020-02=3.5,2020-03=4.4,
2020-04=14.7,2020-12=6.7,2022-01=4.0,2023-04=3.4,2024-12=4.1,2025-11=4.6`),
  },
  {
    id: 'CPI', label: 'Consumer prices, year over year', unit: '%', frequency: 'monthly', lag: 20, firstPublished: '1921-02-01', source: 'Bureau of Labor Statistics',
    anchors: A(`1914-12=1.0,1917-12=18.1,1918-12=20.4,1919-12=14.5,1920-06=23.7,1921-06=-15.8,1922-12=-2.3,1925-12=3.5,1928-12=-1.0,
1929-08=1.2,1929-09=0.0,1929-12=0.6,1930-12=-6.4,1932-12=-10.3,1933-12=0.8,1937-06=4.3,1938-12=-2.8,1941-12=9.9,1942-12=9.0,
1946-12=18.1,1947-12=8.8,1949-12=-2.1,1951-02=9.4,1955-06=-0.6,1958-04=3.6,1965-12=1.9,1968-12=4.7,1969-05=5.4,1969-06=5.5,
1969-12=6.2,1970-12=5.6,1973-12=8.7,1974-12=12.3,1976-12=4.9,1979-12=13.3,1980-03=14.8,1983-06=2.6,1986-12=1.1,1987-08=4.3,
1987-09=4.4,1990-10=6.3,1995-12=2.5,1998-12=1.6,2000-01=2.7,2000-02=3.2,2000-03=3.8,2001-07=2.7,2001-08=2.7,2002-06=1.1,
2005-09=4.7,2006-11=2.0,2006-12=2.5,2008-07=5.6,2008-08=5.4,2009-07=-2.1,2011-09=3.9,2015-04=-0.2,2019-12=2.3,2020-01=2.5,
2020-02=2.3,2020-05=0.1,2021-06=5.4,2022-06=9.1,2023-06=3.0,2024-12=2.9,2025-11=2.7`),
  },
  {
    id: 'GDP', label: 'Real GDP growth (annualized)', unit: '%', frequency: 'quarterly', lag: 30, firstPublished: '1947-05-01', source: 'Commerce Department',
    anchors: A(`1947-03=-1.0,1950-12=8.7,1954-03=-1.9,1958-03=-10.0,1959-06=9.7,1962-12=6.0,1966-03=10.0,1968-12=6.0,1969-03=6.4,
1969-06=1.2,1969-12=-1.9,1970-12=-4.2,1973-03=10.3,1974-12=-1.5,1975-03=-4.8,1976-03=9.4,1980-06=-8.0,1981-03=8.1,1982-03=-6.1,
1983-06=9.3,1984-03=8.0,1987-03=3.0,1987-06=4.3,1987-09=4.4,1990-12=-3.6,1991-03=-1.9,1995-12=2.8,1999-09=5.7,1999-12=7.3,
2000-03=1.2,2001-03=-1.3,2001-06=-1.6,2001-09=-1.1,2003-09=6.8,2006-09=2.0,2006-12=3.5,2008-03=-1.6,2008-06=2.3,2008-09=-2.1,
2008-12=-8.5,2009-06=-0.6,2010-06=3.9,2014-09=5.0,2019-09=2.6,2019-12=2.1,2020-03=-5.5,2020-06=-28.0,2020-09=34.8,
2021-06=7.0,2022-03=-1.0,2023-09=4.4,2024-12=2.4,2025-06=3.8,2025-09=4.3`),
  },
];

function interp(anchors: [string, number][], y: number, m: number): number | null {
  const key = y * 12 + (m - 1);
  const pts = anchors.map(([k, v]) => { const [ay, am] = k.split('-').map(Number); return [ay * 12 + am - 1, v] as const; });
  if (key < pts[0][0] || key > pts[pts.length - 1][0]) return null;
  for (let i = 0; i < pts.length - 1; i++) {
    const [k0, v0] = pts[i];
    const [k1, v1] = pts[i + 1];
    if (key >= k0 && key <= k1) return Math.round((v0 + ((v1 - v0) * (key - k0)) / Math.max(1, k1 - k0)) * 10) / 10;
  }
  return null;
}

function build(spec: SeriesSpec): EconomicReading[] {
  const out: EconomicReading[] = [];
  const [fy, fm] = spec.anchors[0][0].split('-').map(Number);
  const [ly, lm] = spec.anchors[spec.anchors.length - 1][0].split('-').map(Number);
  const step = spec.frequency === 'monthly' ? 1 : 3;
  let prior: number | undefined;
  for (let k = fy * 12 + fm - 1; k <= ly * 12 + lm - 1; k += step) {
    const y = Math.floor(k / 12);
    const m = (k % 12) + 1;
    const v = interp(spec.anchors, y, m);
    if (v === null) continue;
    const periodEnd = toISO(y, m, daysInMonth(y, m));
    let published = addDays(periodEnd, spec.lag);
    if (published < spec.firstPublished) published = spec.firstPublished;
    const period = spec.frequency === 'monthly' ? `${MONTHS[m - 1].slice(0, 3)} ${y}` : `Q${Math.ceil(m / 3)} ${y}`;
    out.push({
      id: `${spec.id}-${y}-${m}`, seriesId: spec.id, label: spec.label, title: `${spec.label}: ${v}${spec.unit} (${period})`,
      category: 'economy', period, value: v, unit: spec.unit, prior,
      eventDate: periodEnd, publishedAt: published, availableAt: published, source: spec.source, provenance: 'MOCK',
    });
    prior = v;
  }
  return out;
}

export const ECONOMIC_READINGS: EconomicReading[] = SPECS.flatMap(build);
