/**
 * MOCK environmental details — what was playing, the weather, and period advertisements.
 * Weather readings are illustrative, not station records.
 */
import type { AdItem, CultureItem, WeatherItem } from '../../core/types';
import type { ISODate } from '../../core/dates';

let c = 0;
const cu = (date: ISODate, kind: CultureItem['kind'], line: string, title = line): CultureItem => ({
  id: `c${++c}`, title, line, kind, category: 'culture', eventDate: date, publishedAt: date, availableAt: date, source: 'Entertainment listings', provenance: 'DERIVED',
});
const w = (date: ISODate, city: string, high: number, low: number, sky: string): WeatherItem => ({
  id: `w-${date}-${city}`, title: `${city}: ${sky}`, city, high, low, sky, category: 'weather', eventDate: date, publishedAt: date, availableAt: date, source: 'Weather bureau (illustrative)', provenance: 'MOCK',
});

export const CULTURE: CultureItem[] = [
  cu('1869-06-01', 'theatre', '“Rip Van Winkle” with Joseph Jefferson, Booth’s Theatre'),
  cu('1869-01-01', 'book', 'Mark Twain’s “The Innocents Abroad” sells briskly by subscription', '“The Innocents Abroad”'),
  cu('1869-04-01', 'book', 'Louisa May Alcott’s “Little Women,” Part Second', '“Little Women,” Part Second'),
  cu('1929-02-01', 'film', '“The Broadway Melody” — all talking, all singing, all dancing'),
  cu('1929-08-20', 'film', 'Mickey Mouse in “The Skeleton Dance,” a Silly Symphony'),
  cu('1929-10-01', 'radio', '“Amos ’n’ Andy,” NBC, nightly at 7'),
  cu('1929-09-01', 'music', '“Singin’ in the Rain” — Cliff Edwards'),
  cu('1929-10-01', 'book', 'Hemingway’s “A Farewell to Arms”'),
  cu('1929-09-15', 'theatre', '“Strike Up the Band” in rehearsal for the Gershwins'),
  cu('1969-05-25', 'film', '“Midnight Cowboy” (rated X)'),
  cu('1969-06-18', 'film', '“The Wild Bunch”'),
  cu('1969-07-14', 'film', '“Easy Rider”'),
  cu('1969-07-12', 'music', '“In the Year 2525” — Zager & Evans, No. 1'),
  cu('1969-07-11', 'music', '“Space Oddity” — David Bowie (U.K. release)'),
  cu('1969-01-01', 'tv', '“Rowan & Martin’s Laugh-In,” NBC Mondays'),
  cu('1969-02-01', 'book', 'Philip Roth’s “Portnoy’s Complaint”'),
  cu('1987-09-18', 'film', '“Fatal Attraction,” No. 1 at the box office'),
  cu('1987-08-31', 'music', 'Michael Jackson, “Bad”'),
  cu('1987-10-10', 'music', '“Here I Go Again” — Whitesnake'),
  cu('1987-09-28', 'tv', '“Star Trek: The Next Generation” premieres in syndication'),
  cu('1987-09-01', 'book', 'Tom Wolfe, “The Bonfire of the Vanities”'),
  cu('1987-10-09', 'game', 'Nintendo Entertainment System: “The Legend of Zelda”'),
  cu('2000-02-25', 'film', '“The Whole Nine Yards”'),
  cu('2000-03-10', 'film', '“Mission to Mars” opens'),
  cu('1999-12-01', 'music', 'Santana featuring Rob Thomas, “Smooth”'),
  cu('2000-02-15', 'music', 'Mariah Carey, “Thank God I Found You”'),
  cu('2000-01-10', 'tv', '“Who Wants to Be a Millionaire,” ABC'),
  cu('2000-03-04', 'game', 'PlayStation 2 (Japan)'),
  cu('2001-08-03', 'film', '“Rush Hour 2”'),
  cu('2001-09-07', 'film', '“The Others”'),
  cu('2001-08-25', 'music', 'Alicia Keys, “Fallin’”'),
  cu('2001-05-01', 'tv', '“Survivor: The Australian Outback” finale'),
  cu('2001-07-01', 'book', '“Harry Potter and the Goblet of Fire” (paperback)'),
  cu('2006-12-22', 'film', '“Night at the Museum”'),
  cu('2006-12-15', 'film', '“Dreamgirls”'),
  cu('2006-12-16', 'music', 'Beyoncé, “Irreplaceable”'),
  cu('2006-10-01', 'tv', '“Heroes,” NBC'),
  cu('2006-11-19', 'game', 'Nintendo Wii: “The Legend of Zelda: Twilight Princess”'),
  cu('2008-07-18', 'film', '“The Dark Knight” passes $500 million'),
  cu('2008-09-12', 'film', '“Burn After Reading”'),
  cu('2008-08-30', 'music', 'T.I., “Whatever You Like”'),
  cu('2008-06-14', 'music', 'Katy Perry, “I Kissed a Girl”'),
  cu('2008-01-20', 'tv', '“Breaking Bad,” AMC'),
  cu('2008-09-05', 'game', '“Spore”'),
  cu('2020-03-06', 'film', 'Pixar’s “Onward”'),
  cu('2020-02-28', 'film', '“The Invisible Man”'),
  cu('2020-01-18', 'music', 'Roddy Ricch, “The Box”'),
  cu('2019-11-29', 'music', 'The Weeknd, “Blinding Lights”'),
  cu('2020-01-24', 'tv', '“Star Trek: Picard,” CBS All Access'),
  cu('2020-02-01', 'game', '“Animal Crossing: New Horizons” pre-orders'),
];

export const WEATHER: WeatherItem[] = [
  w('1869-09-24', 'New York', 66, 54, 'Clear and pleasant'),
  w('1929-10-29', 'New York', 54, 44, 'Fair and cooler'),
  w('1929-10-29', 'Chicago', 46, 35, 'Cloudy'),
  w('1969-07-20', 'Houston', 93, 75, 'Hot, scattered thundershowers'),
  w('1969-07-20', 'New York', 84, 69, 'Partly cloudy, humid'),
  w('1969-07-20', 'Cape Kennedy', 89, 76, 'Partly cloudy'),
  w('1987-10-19', 'New York', 62, 51, 'Cloudy'),
  w('1987-10-19', 'London', 55, 43, 'Clearing after storm'),
  w('2000-03-10', 'New York', 59, 43, 'Mostly sunny'),
  w('2000-03-10', 'San Francisco', 61, 48, 'Showers'),
  w('2001-09-11', 'New York', 79, 61, 'Clear'),
  w('2001-09-11', 'Washington', 81, 61, 'Clear'),
  w('2007-01-09', 'San Francisco', 54, 37, 'Sunny, cold morning'),
  w('2007-01-09', 'New York', 47, 34, 'Partly cloudy'),
  w('2008-09-15', 'New York', 74, 61, 'Sunny'),
  w('2008-09-15', 'Houston', 86, 70, 'Clear; power out after Ike'),
  w('2020-03-11', 'New York', 59, 44, 'Cloudy, light rain'),
  w('2020-03-11', 'Seattle', 52, 39, 'Partly sunny'),
];

/** Fictional period advertisements — invented brands, period-plausible products. */
export const ADS: AdItem[] = [
  { id: 'a1', eraFrom: '1800-01-01', eraTo: '1899-12-31', availableAt: '1850-01-01', brand: 'HOLLISTER & SONS', headline: 'Fine Pocket Chronometers', body: 'Railway-grade movements, warranted to keep time within thirty seconds a week. Maiden Lane, New York.' },
  { id: 'a2', eraFrom: '1800-01-01', eraTo: '1899-12-31', availableAt: '1860-01-01', brand: 'ATLANTIC & PACIFIC EXPRESS', headline: 'Through Freight to San Francisco', body: 'Now that the rails are joined, goods forwarded with dispatch. Rates on application.' },
  { id: 'a3', eraFrom: '1800-01-01', eraTo: '1899-12-31', availableAt: '1855-01-01', brand: 'DR. ALDEN’S', headline: 'Tonic Bitters', body: 'For the weary man of business. Sold by all respectable druggists.' },
  { id: 'a4', eraFrom: '1900-01-01', eraTo: '1945-12-31', availableAt: '1925-01-01', brand: 'MERIDIAN', headline: 'The Orchestra in Your Parlor', body: 'The new Meridian Screen-Grid Radio. Walnut cabinet, single dial. $137.50 less tubes.' },
  { id: 'a5', eraFrom: '1900-01-01', eraTo: '1945-12-31', availableAt: '1920-01-01', brand: 'STERLING SIX', headline: 'A Motor Car for the Whole Family', body: 'Hydraulic four-wheel brakes. Closed sedan, $1,095 f.o.b. Detroit.' },
  { id: 'a6', eraFrom: '1900-01-01', eraTo: '1945-12-31', availableAt: '1915-01-01', brand: 'PRESCOTT & CO.', headline: 'Investment Securities', body: 'Members New York Stock Exchange. Inquiries invited regarding sound bonds yielding 5½%.' },
  { id: 'a7', eraFrom: '1946-01-01', eraTo: '1979-12-31', availableAt: '1965-01-01', brand: 'ASTROCOLOR', headline: 'See the Moon in Living Color', body: 'The 23-inch Astrocolor console. Instant-on picture. Solid-state chassis.' },
  { id: 'a8', eraFrom: '1946-01-01', eraTo: '1979-12-31', availableAt: '1960-01-01', brand: 'TRANSCONTINENTAL', headline: 'Jet to Europe Tonight', body: 'Nonstop to London and Paris. Your stewardess will serve dinner at 35,000 feet.' },
  { id: 'a9', eraFrom: '1946-01-01', eraTo: '1979-12-31', availableAt: '1958-01-01', brand: 'KEYSTONE MUTUAL FUND', headline: 'Put Your Savings to Work', body: 'A diversified share in America’s growth companies. Ask your broker for a prospectus.' },
  { id: 'a10', eraFrom: '1980-01-01', eraTo: '1994-12-31', availableAt: '1986-01-01', brand: 'TANDEM 286', headline: '640K. 20MB. One Price.', body: 'The Tandem 286/20 business computer with monochrome monitor. $2,495. Call 1-800-555-0286.' },
  { id: 'a11', eraFrom: '1980-01-01', eraTo: '1994-12-31', availableAt: '1984-01-01', brand: 'CELLULINK', headline: 'Your Office. In Your Car.', body: 'Mobile cellular telephone, professionally installed. Lease from $99/month.' },
  { id: 'a12', eraFrom: '1980-01-01', eraTo: '1994-12-31', availableAt: '1982-01-01', brand: 'BRADFORD DISCOUNT BROKERAGE', headline: 'Why pay full commission?', body: 'Trades from $35. Real-time quotes by phone.' },
  { id: 'a13', eraFrom: '1995-01-01', eraTo: '2002-12-31', availableAt: '1997-01-01', brand: 'TradeRocket.com', headline: 'Online trades $8. Click here!', body: 'Real-time quotes FREE. Open an account in 5 minutes.', cta: 'Start Trading' },
  { id: 'a14', eraFrom: '1995-01-01', eraTo: '2002-12-31', availableAt: '1996-01-01', brand: 'DialNet', headline: 'Get on the Internet FREE for 30 days!', body: '56K access in 1,500 cities. No busy signals!', cta: 'Sign up now' },
  { id: 'a15', eraFrom: '1995-01-01', eraTo: '2002-12-31', availableAt: '1999-01-01', brand: 'PetPantry.com', headline: 'Pet food delivered to your door', body: 'Free shipping on orders over $25.', cta: 'Shop now' },
  { id: 'a16', eraFrom: '2003-01-01', eraTo: '2009-12-31', availableAt: '2004-01-01', brand: 'Brightwave Broadband', headline: 'Upgrade to 6 Mbps', body: 'Download music in seconds. $29.99/mo for 6 months.', cta: 'Get it now' },
  { id: 'a17', eraFrom: '2003-01-01', eraTo: '2009-12-31', availableAt: '2004-01-01', brand: 'LoanSprout', headline: 'Rates as low as 5.25%', body: 'Refinance today. No-doc options available.', cta: 'Check rates' },
  { id: 'a18', eraFrom: '2010-01-01', eraTo: '2015-12-31', availableAt: '2010-01-01', brand: 'Pocketbook', headline: 'Your budget, in your pocket', body: 'The free personal finance app. Now on iPhone and Android.', cta: 'Download' },
  { id: 'a19', eraFrom: '2016-01-01', eraTo: '2020-12-31', availableAt: '2016-01-01', brand: 'Northline', headline: 'Investing, simplified.', body: 'Zero-commission ETFs. Automatic rebalancing.', cta: 'Get started' },
  { id: 'a20', eraFrom: '2021-01-01', eraTo: '2099-12-31', availableAt: '2021-01-01', brand: 'Ledgerly', headline: 'Earn 4.25% APY', body: 'High-yield savings with no minimums. FDIC insured through partner banks.', cta: 'Open account' },
];
