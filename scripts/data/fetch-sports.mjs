// REAL sports results. Every result becomes available the morning AFTER the game
// (the next day's paper), so an evening game is never revealed before it ended.
//
//   MLB  Retrosheet game logs 1871–present        https://www.retrosheet.org
//        "The information used here was obtained free of charge from and is copyrighted
//         by Retrosheet. Interested parties may contact Retrosheet at www.retrosheet.org."
//   NBA  FiveThirtyEight nba-elo dataset 1946–2015 (CC BY 4.0)
//   NFL  FiveThirtyEight nfl-elo-game 1920–2020 (CC BY 4.0) + nflverse games 1999–present (CC BY 4.0)
//   NHL  NHL public stats API (api.nhle.com) 1917–present
//   Intl. football  martj42/international_results (CC0)
//
// Output: public/data/sports/<YEAR>.json.gz = { items: [[date, league, away, awayScore, home, homeScore, note]] }
import { inflateRawSync } from 'node:zlib';
import { get, parseCsv, pool, writeGz } from './lib.mjs';

function unzipFirst(buf) {
  // minimal ZIP reader: first local file entry (Retrosheet zips hold one .TXT)
  if (buf.readUInt32LE(0) !== 0x04034b50) throw new Error('not a zip');
  const method = buf.readUInt16LE(8);
  let csize = buf.readUInt32LE(18);
  const nameLen = buf.readUInt16LE(26), extraLen = buf.readUInt16LE(28);
  const start = 30 + nameLen + extraLen;
  if (csize === 0) { // data descriptor: find central directory
    const cd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    csize = buf.readUInt32LE(cd + 20);
  }
  const data = buf.subarray(start, start + csize);
  return (method === 8 ? inflateRawSync(data) : data).toString('latin1');
}

const MLB = {
  ANA: 'Angels', CAL: 'Angels', LAA: 'Angels', ARI: 'Diamondbacks', ATL: 'Braves', BAL: 'Orioles', BOS: 'Red Sox', CHA: 'White Sox', CHN: 'Cubs',
  CIN: 'Reds', CLE: 'Indians', COL: 'Rockies', DET: 'Tigers', FLO: 'Marlins', MIA: 'Marlins', HOU: 'Astros', KCA: 'Royals', LAN: 'Dodgers',
  MIL: 'Brewers', ML4: 'Brewers', ML1: 'Braves', MIN: 'Twins', NYA: 'Yankees', NYN: 'Mets', OAK: 'Athletics', ATH: 'Athletics', PHA: 'Athletics', KC1: 'Athletics',
  PHI: 'Phillies', PIT: 'Pirates', SDN: 'Padres', SEA: 'Mariners', SE1: 'Pilots', SFN: 'Giants', NY1: 'Giants', BRO: 'Dodgers', SLA: 'Browns',
  SLN: 'Cardinals', TBA: 'Rays', TEX: 'Rangers', TOR: 'Blue Jays', WS1: 'Senators', WS2: 'Senators', WAS: 'Nationals', MON: 'Expos', BSN: 'Braves', BOS1: 'Braves',
};
const mlbName = (code, date) => (code === 'CLE' && date >= '2022-01-01' ? 'Guardians' : code === 'TBA' && date < '2008-01-01' ? 'Devil Rays' : code === 'ANA' && date < '2005-01-01' ? 'Angels' : MLB[code] ?? code);

const NFL = {
  ARI: 'Cardinals', ATL: 'Falcons', BAL: 'Ravens', BUF: 'Bills', CAR: 'Panthers', CHI: 'Bears', CIN: 'Bengals', CLE: 'Browns', DAL: 'Cowboys',
  DEN: 'Broncos', DET: 'Lions', GB: 'Packers', HOU: 'Texans', IND: 'Colts', JAX: 'Jaguars', KC: 'Chiefs', LAC: 'Chargers', SD: 'Chargers',
  LAR: 'Rams', LA: 'Rams', STL: 'Rams', MIA: 'Dolphins', MIN: 'Vikings', NE: 'Patriots', NO: 'Saints', NYG: 'Giants', NYJ: 'Jets', OAK: 'Raiders',
  LV: 'Raiders', PHI: 'Eagles', PIT: 'Steelers', SEA: 'Seahawks', SF: '49ers', TB: 'Buccaneers', TEN: 'Titans', WSH: 'Redskins', WAS: 'Redskins',
};
function nflName(code, date) {
  if ((code === 'WSH' || code === 'WAS')) return date >= '2022-02-02' ? 'Commanders' : date >= '2020-07-23' ? 'Football Team' : 'Redskins';
  if (code === 'TEN' && date < '1999-01-01') return 'Oilers';
  return NFL[code] ?? code;
}

const addDay = (iso) => new Date(Date.parse(iso) + 864e5).toISOString().slice(0, 10);
const MAJOR_SOCCER = /^(FIFA World Cup|UEFA Euro|Copa América|African Cup of Nations|AFC Asian Cup|Gold Cup|Confederations Cup|UEFA Nations League)$/;

export async function fetchSports({ from = 1871, to = new Date().getUTCFullYear(), log = console.log } = {}) {
  const items = [];
  const push = (date, league, away, as, home, hs, note = '') => {
    if (!date || as === '' || hs === '' || as == null || hs == null || Number.isNaN(Number(as)) || Number.isNaN(Number(hs))) return;
    items.push([date, league, away, Number(as), home, Number(hs), note]);
  };

  // --- MLB (Retrosheet)
  const years = []; for (let y = Math.max(from, 1871); y <= to; y++) years.push(y);
  let mlb = 0;
  await pool(years, 3, async (y) => {
    try {
      const txt = unzipFirst(await get(`https://www.retrosheet.org/gamelogs/gl${y}.zip`, { binary: true }));
      for (const line of txt.split(/\r?\n/)) {
        if (!line) continue;
        const f = parseCsv(line)[0];
        const d = `${f[0].slice(0, 4)}-${f[0].slice(4, 6)}-${f[0].slice(6, 8)}`;
        push(d, 'MLB', mlbName(f[3], d), f[9], mlbName(f[6], d), f[10]); mlb++;
      }
    } catch (e) { if (y < to) log(`   MLB ${y}: ${e.message}`); }
  });
  log(`  MLB ${mlb}`);

  // --- NBA (538, 1946–2015)
  const nba = parseCsv(await get('https://raw.githubusercontent.com/fivethirtyeight/data/master/nba-elo/nbaallelo.csv'));
  const h = nba[0];
  const ix = (k) => h.indexOf(k);
  let nbaN = 0;
  for (const r of nba.slice(1)) {
    if (r[ix('_iscopy')] !== '0' || r[ix('lg_id')] !== 'NBA') continue;
    const [m, d, y] = r[ix('date_game')].split('/');
    const date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const loc = r[ix('game_location')];
    const a = [r[ix('fran_id')], r[ix('pts')]], b = [r[ix('opp_fran')], r[ix('opp_pts')]];
    const [away, home] = loc === 'H' ? [b, a] : [a, b];
    push(date, 'NBA', away[0], away[1], home[0], home[1], r[ix('is_playoffs')] === '1' ? 'Playoffs' : ''); nbaN++;
  }
  log(`  NBA ${nbaN}`);

  // --- NFL
  const n538 = parseCsv(await get('https://raw.githubusercontent.com/fivethirtyeight/nfl-elo-game/master/data/nfl_games.csv'));
  let nflN = 0;
  for (const r of n538.slice(1)) {
    if (!r[0] || r[0] >= '1999-01-01') continue; // nflverse covers 1999+
    push(r[0], 'NFL', nflName(r[5], r[0]), r[10], nflName(r[4], r[0]), r[9], r[3] === '1' ? 'Playoffs' : ''); nflN++;
  }
  const nv = parseCsv(await get('https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv'));
  const nh = nv[0]; const ni = (k) => nh.indexOf(k);
  for (const r of nv.slice(1)) {
    const d = r[ni('gameday')];
    if (!d) continue;
    push(d, 'NFL', nflName(r[ni('away_team')], d), r[ni('away_score')], nflName(r[ni('home_team')], d), r[ni('home_score')], r[ni('game_type')] !== 'REG' ? (r[ni('game_type')] === 'SB' ? 'Super Bowl' : 'Playoffs') : ''); nflN++;
  }
  log(`  NFL ${nflN}`);

  // --- NHL
  const teams = JSON.parse(await get('https://api.nhle.com/stats/rest/en/team')).data;
  const tname = new Map(teams.map((t) => [t.id, t.fullName.replace(/^.* (?=\S+$)/, (m) => (/(Maple|Red|Blue|Golden|Blue)\s$/.test(m) ? m.split(' ').slice(-2).join(' ') : ''))]));
  const nick = (id) => { const t = teams.find((x) => x.id === id); if (!t) return String(id); const w = t.fullName.split(' '); return /^(Maple Leafs|Red Wings|Blue Jackets|Golden Knights|Black Hawks)$/.test(w.slice(-2).join(' ')) ? w.slice(-2).join(' ') : w.at(-1); };
  void tname;
  const seasons = []; for (let y = Math.max(from, 1917); y <= to; y++) seasons.push(`${y}${y + 1}`);
  let nhlN = 0;
  await pool(seasons, 3, async (s) => {
    try {
      const j = JSON.parse(await get(`https://api.nhle.com/stats/rest/en/game?cayenneExp=season=${s}%20and%20gameType%3E=2`));
      for (const g of j.data) {
        if (g.gameStateId !== 7 && g.gameStateId !== 6 && g.homeScore == null) continue;
        push(g.gameDate, 'NHL', nick(g.visitingTeamId), g.visitingScore, nick(g.homeTeamId), g.homeScore, g.gameType === 3 ? 'Playoffs' : g.period > 3 ? (g.period > 4 ? 'SO' : 'OT') : ''); nhlN++;
      }
    } catch (e) { log(`   NHL ${s}: ${e.message}`); }
  });
  log(`  NHL ${nhlN}`);

  // --- International football (major tournaments only)
  const sc = parseCsv(await get('https://raw.githubusercontent.com/martj42/international_results/master/results.csv'));
  let scN = 0;
  for (const r of sc.slice(1)) {
    if (!MAJOR_SOCCER.test(r[5] ?? '')) continue;
    push(r[0], 'Soccer', r[2], r[4], r[1], r[3], r[5]); scN++;
  }
  log(`  Soccer ${scN}`);

  // bucket by AVAILABLE year (morning after)
  const byYear = new Map();
  for (const it of items) {
    const avail = addDay(it[0]);
    const y = Number(avail.slice(0, 4));
    if (y < from || y > to) continue;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(it);
  }
  let bytes = 0;
  for (const [y, list] of byYear) { list.sort((a, b) => (a[0] < b[0] ? -1 : 1)); bytes += writeGz(`sports/${y}.json.gz`, { year: y, availableLagDays: 1, items: list }); }
  log(`  sports: ${items.length} results, ${(bytes / 1e6).toFixed(1)} MB gz`);
}

if (import.meta.url === `file://${process.argv[1]}`) fetchSports();
