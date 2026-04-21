'use strict';

const NHL_API_BASE      = 'https://api-web.nhle.com/v1';
const SEASON            = '20252026';
const GAME_TYPE_REGULAR = 2;
const PLAYOFF_GAME_TYPE = 3;

// ── DOM refs ─────────────────────────────────────────────────────────────────
const lastUpdatedEl        = document.getElementById('last-updated');
const standingsBodyEl      = document.getElementById('standings-body');
const skaterBodyEl         = document.getElementById('skater-body');
const goalieBodyEl         = document.getElementById('goalie-body');
const playoffSeriesListEl  = document.getElementById('playoff-series-list');
const playoffGamesListEl   = document.getElementById('playoff-games-list');
const playoffRecordsListEl = document.getElementById('playoff-records-list');
const posFilterEl          = document.getElementById('pos-filter');
const teamFilterEl         = document.getElementById('team-filter');
const minGpEl              = document.getElementById('min-gp-filter');
const skaterCountEl        = document.getElementById('skater-count');
const goalieTeamFilterEl   = document.getElementById('goalie-team-filter');
const goalieMinGpEl        = document.getElementById('goalie-min-gp-filter');
const goalieCountEl        = document.getElementById('goalie-count');

// ── Sort state ───────────────────────────────────────────────────────────────
let standingsSortKey = 'points';
let standingsSortDir = 'desc';
let skaterSortKey    = 'points';
let skaterSortDir    = 'desc';
let goalieSortKey    = 'wins';
let goalieSortDir    = 'desc';

let allSkaters   = [];
let allGoalies   = [];
let allStandings = [];

// ── Fallback snapshot ────────────────────────────────────────────────────────
const FALLBACK_SNAPSHOT = {
  standings: [
    { teamName: { default: 'Winnipeg Jets' },        gamesPlayed: 82, wins: 55, losses: 24, otLosses: 3,  points: 113, goalFor: 277, goalAgainst: 210 },
    { teamName: { default: 'Dallas Stars' },         gamesPlayed: 82, wins: 52, losses: 21, otLosses: 9,  points: 113, goalFor: 294, goalAgainst: 232 },
    { teamName: { default: 'New York Rangers' },     gamesPlayed: 82, wins: 50, losses: 24, otLosses: 8,  points: 108, goalFor: 282, goalAgainst: 239 },
    { teamName: { default: 'Carolina Hurricanes' },  gamesPlayed: 82, wins: 49, losses: 23, otLosses: 10, points: 108, goalFor: 286, goalAgainst: 233 },
    { teamName: { default: 'Colorado Avalanche' },   gamesPlayed: 82, wins: 50, losses: 25, otLosses: 7,  points: 107, goalFor: 302, goalAgainst: 254 },
    { teamName: { default: 'Edmonton Oilers' },      gamesPlayed: 82, wins: 49, losses: 27, otLosses: 6,  points: 104, goalFor: 294, goalAgainst: 237 },
    { teamName: { default: 'Toronto Maple Leafs' },  gamesPlayed: 82, wins: 47, losses: 26, otLosses: 9,  points: 103, goalFor: 279, goalAgainst: 252 },
    { teamName: { default: 'Boston Bruins' },        gamesPlayed: 82, wins: 46, losses: 28, otLosses: 8,  points: 100, goalFor: 261, goalAgainst: 238 },
    { teamName: { default: 'New Jersey Devils' },    gamesPlayed: 82, wins: 42, losses: 30, otLosses: 10, points:  94, goalFor: 266, goalAgainst: 259 },
    { teamName: { default: 'Nashville Predators' },  gamesPlayed: 82, wins: 43, losses: 31, otLosses: 8,  points:  94, goalFor: 252, goalAgainst: 249 },
    { teamName: { default: 'Florida Panthers' },     gamesPlayed: 82, wins: 47, losses: 31, otLosses: 4,  points:  98, goalFor: 268, goalAgainst: 229 },
    { teamName: { default: 'Vegas Golden Knights' }, gamesPlayed: 82, wins: 45, losses: 30, otLosses: 7,  points:  97, goalFor: 255, goalAgainst: 240 },
    { teamName: { default: 'Tampa Bay Lightning' },  gamesPlayed: 82, wins: 44, losses: 29, otLosses: 9,  points:  97, goalFor: 265, goalAgainst: 248 },
    { teamName: { default: 'Vancouver Canucks' },    gamesPlayed: 82, wins: 44, losses: 30, otLosses: 8,  points:  96, goalFor: 258, goalAgainst: 248 },
    { teamName: { default: 'Minnesota Wild' },       gamesPlayed: 82, wins: 43, losses: 32, otLosses: 7,  points:  93, goalFor: 244, goalAgainst: 245 },
    { teamName: { default: 'Los Angeles Kings' },    gamesPlayed: 82, wins: 41, losses: 33, otLosses: 8,  points:  90, goalFor: 243, goalAgainst: 248 },
  ],
  skaters: [
    { skaterFullName: 'Connor McDavid',     teamAbbrevs: 'EDM', positionCode: 'C', gamesPlayed: 82, goals: 55, assists: 90, points: 145, plusMinus:  28, penaltyMinutes:  18, pointsPerGame: 1.77, ppPoints: 44, shPoints: 5, gameWinningGoals: 10, shots: 285, shootingPctg: 19.3, timeOnIcePerGame: '22:40' },
    { skaterFullName: 'Leon Draisaitl',     teamAbbrevs: 'EDM', positionCode: 'C', gamesPlayed: 82, goals: 57, assists: 72, points: 129, plusMinus:  22, penaltyMinutes:  66, pointsPerGame: 1.57, ppPoints: 52, shPoints: 1, gameWinningGoals: 12, shots: 318, shootingPctg: 17.9, timeOnIcePerGame: '21:25' },
    { skaterFullName: 'Nathan MacKinnon',   teamAbbrevs: 'COL', positionCode: 'C', gamesPlayed: 80, goals: 47, assists: 79, points: 126, plusMinus:  24, penaltyMinutes:  40, pointsPerGame: 1.58, ppPoints: 37, shPoints: 3, gameWinningGoals:  9, shots: 284, shootingPctg: 16.5, timeOnIcePerGame: '21:50' },
    { skaterFullName: 'Nikita Kucherov',    teamAbbrevs: 'TBL', positionCode: 'R', gamesPlayed: 81, goals: 42, assists: 80, points: 122, plusMinus:  18, penaltyMinutes:  40, pointsPerGame: 1.51, ppPoints: 46, shPoints: 1, gameWinningGoals:  8, shots: 228, shootingPctg: 18.4, timeOnIcePerGame: '20:55' },
    { skaterFullName: 'David Pastrnak',     teamAbbrevs: 'BOS', positionCode: 'R', gamesPlayed: 82, goals: 54, assists: 64, points: 118, plusMinus:  20, penaltyMinutes:  30, pointsPerGame: 1.44, ppPoints: 38, shPoints: 2, gameWinningGoals: 10, shots: 312, shootingPctg: 17.3, timeOnIcePerGame: '20:30' },
    { skaterFullName: 'Mikko Rantanen',     teamAbbrevs: 'COL', positionCode: 'R', gamesPlayed: 82, goals: 46, assists: 70, points: 116, plusMinus:  25, penaltyMinutes:  36, pointsPerGame: 1.41, ppPoints: 35, shPoints: 0, gameWinningGoals:  9, shots: 268, shootingPctg: 17.2, timeOnIcePerGame: '20:10' },
    { skaterFullName: 'Cale Makar',         teamAbbrevs: 'COL', positionCode: 'D', gamesPlayed: 82, goals: 28, assists: 82, points: 110, plusMinus:  35, penaltyMinutes:  22, pointsPerGame: 1.34, ppPoints: 38, shPoints: 2, gameWinningGoals:  8, shots: 218, shootingPctg: 12.8, timeOnIcePerGame: '25:10' },
    { skaterFullName: 'Auston Matthews',    teamAbbrevs: 'TOR', positionCode: 'C', gamesPlayed: 82, goals: 62, assists: 47, points: 109, plusMinus:  16, penaltyMinutes:  22, pointsPerGame: 1.33, ppPoints: 32, shPoints: 1, gameWinningGoals: 12, shots: 344, shootingPctg: 18.0, timeOnIcePerGame: '21:15' },
    { skaterFullName: 'Brad Marchand',      teamAbbrevs: 'BOS', positionCode: 'L', gamesPlayed: 79, goals: 35, assists: 70, points: 105, plusMinus:  12, penaltyMinutes:  64, pointsPerGame: 1.33, ppPoints: 28, shPoints: 8, gameWinningGoals:  7, shots: 220, shootingPctg: 15.9, timeOnIcePerGame: '19:45' },
    { skaterFullName: 'Mitch Marner',       teamAbbrevs: 'TOR', positionCode: 'R', gamesPlayed: 82, goals: 30, assists: 74, points: 104, plusMinus:  18, penaltyMinutes:  26, pointsPerGame: 1.27, ppPoints: 36, shPoints: 4, gameWinningGoals:  6, shots: 192, shootingPctg: 15.6, timeOnIcePerGame: '20:40' },
    { skaterFullName: 'Matthew Tkachuk',    teamAbbrevs: 'FLA', positionCode: 'L', gamesPlayed: 82, goals: 40, assists: 63, points: 103, plusMinus:  21, penaltyMinutes: 100, pointsPerGame: 1.26, ppPoints: 34, shPoints: 2, gameWinningGoals:  9, shots: 242, shootingPctg: 16.5, timeOnIcePerGame: '20:55' },
    { skaterFullName: 'Kirill Kaprizov',    teamAbbrevs: 'MIN', positionCode: 'L', gamesPlayed: 82, goals: 45, assists: 57, points: 102, plusMinus:  15, penaltyMinutes:  34, pointsPerGame: 1.24, ppPoints: 30, shPoints: 1, gameWinningGoals:  8, shots: 286, shootingPctg: 15.7, timeOnIcePerGame: '20:20' },
    { skaterFullName: 'Elias Lindholm',     teamAbbrevs: 'BOS', positionCode: 'C', gamesPlayed: 82, goals: 35, assists: 65, points: 100, plusMinus:  22, penaltyMinutes:  28, pointsPerGame: 1.22, ppPoints: 24, shPoints: 6, gameWinningGoals:  8, shots: 204, shootingPctg: 17.2, timeOnIcePerGame: '19:30' },
    { skaterFullName: 'Brayden Point',      teamAbbrevs: 'TBL', positionCode: 'C', gamesPlayed: 82, goals: 42, assists: 57, points:  99, plusMinus:  16, penaltyMinutes:  32, pointsPerGame: 1.21, ppPoints: 28, shPoints: 5, gameWinningGoals:  9, shots: 258, shootingPctg: 16.3, timeOnIcePerGame: '19:55' },
    { skaterFullName: 'Sidney Crosby',      teamAbbrevs: 'PIT', positionCode: 'C', gamesPlayed: 80, goals: 33, assists: 62, points:  95, plusMinus:  10, penaltyMinutes:  32, pointsPerGame: 1.19, ppPoints: 28, shPoints: 2, gameWinningGoals:  8, shots: 226, shootingPctg: 14.6, timeOnIcePerGame: '19:20' },
    { skaterFullName: 'Quinn Hughes',       teamAbbrevs: 'VAN', positionCode: 'D', gamesPlayed: 82, goals: 14, assists: 80, points:  94, plusMinus:  20, penaltyMinutes:  18, pointsPerGame: 1.15, ppPoints: 34, shPoints: 1, gameWinningGoals:  3, shots: 148, shootingPctg:  9.5, timeOnIcePerGame: '24:30' },
    { skaterFullName: 'Jake Guentzel',      teamAbbrevs: 'CAR', positionCode: 'L', gamesPlayed: 82, goals: 42, assists: 51, points:  93, plusMinus:  24, penaltyMinutes:  20, pointsPerGame: 1.13, ppPoints: 22, shPoints: 2, gameWinningGoals: 10, shots: 254, shootingPctg: 16.5, timeOnIcePerGame: '18:45' },
    { skaterFullName: 'Aleksander Barkov',  teamAbbrevs: 'FLA', positionCode: 'C', gamesPlayed: 80, goals: 38, assists: 54, points:  92, plusMinus:  28, penaltyMinutes:  30, pointsPerGame: 1.15, ppPoints: 26, shPoints: 8, gameWinningGoals:  9, shots: 230, shootingPctg: 16.5, timeOnIcePerGame: '21:10' },
    { skaterFullName: 'Sam Reinhart',       teamAbbrevs: 'FLA', positionCode: 'R', gamesPlayed: 82, goals: 50, assists: 41, points:  91, plusMinus:  22, penaltyMinutes:  22, pointsPerGame: 1.11, ppPoints: 28, shPoints: 2, gameWinningGoals: 11, shots: 274, shootingPctg: 18.2, timeOnIcePerGame: '18:30' },
    { skaterFullName: 'Tage Thompson',      teamAbbrevs: 'BUF', positionCode: 'C', gamesPlayed: 82, goals: 44, assists: 46, points:  90, plusMinus:   4, penaltyMinutes:  50, pointsPerGame: 1.10, ppPoints: 26, shPoints: 2, gameWinningGoals:  9, shots: 296, shootingPctg: 14.9, timeOnIcePerGame: '20:40' },
    { skaterFullName: 'Sebastian Aho',      teamAbbrevs: 'CAR', positionCode: 'C', gamesPlayed: 82, goals: 35, assists: 54, points:  89, plusMinus:  20, penaltyMinutes:  28, pointsPerGame: 1.09, ppPoints: 24, shPoints: 4, gameWinningGoals:  8, shots: 238, shootingPctg: 14.7, timeOnIcePerGame: '19:55' },
    { skaterFullName: 'Roope Hintz',        teamAbbrevs: 'DAL', positionCode: 'C', gamesPlayed: 80, goals: 37, assists: 51, points:  88, plusMinus:  16, penaltyMinutes:  26, pointsPerGame: 1.10, ppPoints: 22, shPoints: 2, gameWinningGoals:  8, shots: 236, shootingPctg: 15.7, timeOnIcePerGame: '20:10' },
    { skaterFullName: 'Jason Robertson',    teamAbbrevs: 'DAL', positionCode: 'L', gamesPlayed: 82, goals: 42, assists: 45, points:  87, plusMinus:  14, penaltyMinutes:  28, pointsPerGame: 1.06, ppPoints: 26, shPoints: 0, gameWinningGoals:  9, shots: 256, shootingPctg: 16.4, timeOnIcePerGame: '19:35' },
    { skaterFullName: 'Jack Hughes',        teamAbbrevs: 'NJD', positionCode: 'C', gamesPlayed: 75, goals: 38, assists: 48, points:  86, plusMinus:  10, penaltyMinutes:  30, pointsPerGame: 1.15, ppPoints: 28, shPoints: 1, gameWinningGoals:  7, shots: 234, shootingPctg: 16.2, timeOnIcePerGame: '20:05' },
    { skaterFullName: 'Evan Bouchard',      teamAbbrevs: 'EDM', positionCode: 'D', gamesPlayed: 82, goals: 22, assists: 63, points:  85, plusMinus:  18, penaltyMinutes:  36, pointsPerGame: 1.04, ppPoints: 40, shPoints: 0, gameWinningGoals:  5, shots: 194, shootingPctg: 11.3, timeOnIcePerGame: '23:15' },
  ],
  goalies: [
    { goalieFullName: 'Connor Hellebuyck',  teamAbbrevs: 'WPG', gamesPlayed: 62, gamesStarted: 59, wins: 40, losses: 14, otLosses:  8, goalsAgainstAverage: 2.18, savePctg: 0.922, shutouts: 7, timeOnIce: '3720:00' },
    { goalieFullName: 'Ilya Sorokin',       teamAbbrevs: 'NYI', gamesPlayed: 55, gamesStarted: 52, wins: 32, losses: 17, otLosses:  6, goalsAgainstAverage: 2.32, savePctg: 0.919, shutouts: 5, timeOnIce: '3184:00' },
    { goalieFullName: 'Jeremy Swayman',     teamAbbrevs: 'BOS', gamesPlayed: 54, gamesStarted: 52, wins: 34, losses: 15, otLosses:  5, goalsAgainstAverage: 2.38, savePctg: 0.918, shutouts: 4, timeOnIce: '3116:00' },
    { goalieFullName: 'Igor Shesterkin',    teamAbbrevs: 'NYR', gamesPlayed: 52, gamesStarted: 50, wins: 30, losses: 16, otLosses:  6, goalsAgainstAverage: 2.35, savePctg: 0.921, shutouts: 5, timeOnIce: '2984:00' },
    { goalieFullName: 'Andrei Vasilevskiy', teamAbbrevs: 'TBL', gamesPlayed: 60, gamesStarted: 58, wins: 36, losses: 18, otLosses:  6, goalsAgainstAverage: 2.42, savePctg: 0.913, shutouts: 4, timeOnIce: '3478:00' },
    { goalieFullName: 'Jake Oettinger',     teamAbbrevs: 'DAL', gamesPlayed: 56, gamesStarted: 53, wins: 34, losses: 16, otLosses:  6, goalsAgainstAverage: 2.38, savePctg: 0.914, shutouts: 3, timeOnIce: '3224:00' },
    { goalieFullName: 'Juuse Saros',        teamAbbrevs: 'NSH', gamesPlayed: 57, gamesStarted: 55, wins: 34, losses: 18, otLosses:  5, goalsAgainstAverage: 2.41, savePctg: 0.916, shutouts: 4, timeOnIce: '3298:00' },
    { goalieFullName: 'Linus Ullmark',      teamAbbrevs: 'OTT', gamesPlayed: 55, gamesStarted: 53, wins: 32, losses: 19, otLosses:  4, goalsAgainstAverage: 2.45, savePctg: 0.915, shutouts: 3, timeOnIce: '3160:00' },
    { goalieFullName: 'Adin Hill',          teamAbbrevs: 'VGK', gamesPlayed: 50, gamesStarted: 47, wins: 28, losses: 17, otLosses:  5, goalsAgainstAverage: 2.52, savePctg: 0.912, shutouts: 3, timeOnIce: '2820:00' },
    { goalieFullName: 'Stuart Skinner',     teamAbbrevs: 'EDM', gamesPlayed: 52, gamesStarted: 50, wins: 30, losses: 16, otLosses:  6, goalsAgainstAverage: 2.58, savePctg: 0.908, shutouts: 2, timeOnIce: '2960:00' },
    { goalieFullName: 'Sergei Bobrovsky',   teamAbbrevs: 'FLA', gamesPlayed: 55, gamesStarted: 53, wins: 32, losses: 17, otLosses:  6, goalsAgainstAverage: 2.55, savePctg: 0.910, shutouts: 3, timeOnIce: '3140:00' },
    { goalieFullName: 'Thatcher Demko',     teamAbbrevs: 'VAN', gamesPlayed: 48, gamesStarted: 46, wins: 27, losses: 16, otLosses:  5, goalsAgainstAverage: 2.62, savePctg: 0.909, shutouts: 2, timeOnIce: '2752:00' },
  ],
  playoffGames: [
    'BOS 2 at TOR 3 (FINAL)',
    'VGK 1 at EDM 4 (FINAL)',
    'NYR 2 at CAR 1 (FINAL/OT)',
    'DAL 0 at COL 3 (FINAL)',
  ],
  playoffSeries: [
    'Boston Bruins vs Toronto Maple Leafs (1–2)',
    'Vegas Golden Knights vs Edmonton Oilers (0–2)',
    'New York Rangers vs Carolina Hurricanes (2–1)',
    'Dallas Stars vs Colorado Avalanche (1–1)',
  ],
};

// ── Utility helpers ──────────────────────────────────────────────────────────

async function fetchJson(pathOptions) {
  for (const path of pathOptions) {
    try {
      const response = await fetch(`${NHL_API_BASE}/${path}`);
      if (!response.ok) continue;
      return await response.json();
    } catch (_err) {
      // try next path
    }
  }
  throw new Error('Unable to load NHL API data.');
}

function formatTeamName(team) {
  return team?.teamName?.default || team?.teamAbbrev?.default || 'Unknown';
}

/** Escape HTML to prevent injection from API strings. */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert "MM:SS" or numeric seconds → total seconds (used for sorting TOI). */
function toiToSeconds(toi) {
  if (typeof toi === 'number') return toi;
  if (typeof toi !== 'string') return 0;
  const [mm, ss] = toi.split(':');
  return (parseInt(mm, 10) || 0) * 60 + (parseInt(ss, 10) || 0);
}

/** Return a comparable sort value for a given key. */
function getSortValue(obj, key) {
  if (key === 'timeOnIcePerGame' || key === 'timeOnIce') return toiToSeconds(obj[key]);
  if (key === 'teamName') return (obj.teamName?.default ?? '').toLowerCase();
  if (key === 'goalDiff')  return (obj.goalFor ?? 0) - (obj.goalAgainst ?? 0);
  const v = obj[key];
  if (v == null) return 0;
  return typeof v === 'string' ? v.toLowerCase() : v;
}

/** Sort an array in-place by a key and direction. */
function sortBy(arr, key, dir) {
  arr.sort((a, b) => {
    const va = getSortValue(a, key);
    const vb = getSortValue(b, key);
    if (va < vb) return dir === 'asc' ? -1 :  1;
    if (va > vb) return dir === 'asc' ?  1 : -1;
    return 0;
  });
}

/**
 * Compute percentile rank (0–1) for each item against the full list.
 * 1 = top performer (regardless of whether higher is better).
 */
function computePercentiles(items, key, higherIsBetter) {
  const sorted = [...items].sort((a, b) => {
    const va = getSortValue(a, key);
    const vb = getSortValue(b, key);
    return higherIsBetter ? va - vb : vb - va; // ascending → index = rank
  });
  const n = sorted.length;
  const map = new Map();
  sorted.forEach((item, i) => map.set(item, n > 1 ? i / (n - 1) : 1));
  return map;
}

/** Return badge HTML based on percentile (0–1, 1 = top). */
function percentileBadge(pct) {
  if (pct >= 0.9)  return '<span class="badge badge-gold"   title="Top 10% in this category">TOP 10%</span>';
  if (pct >= 0.75) return '<span class="badge badge-silver" title="Top 25% in this category">TOP 25%</span>';
  if (pct >= 0.5)  return '<span class="badge badge-bronze" title="Top 50% in this category">TOP 50%</span>';
  return '';
}

/** Format a number to fixed decimal places. */
function fmt(v, dec) {
  if (v == null || v === '') return '—';
  const n = parseFloat(v);
  return isNaN(n) ? esc(v) : n.toFixed(dec);
}

/** Format +/- with colour class. */
function fmtPM(v) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return '<span>—</span>';
  if (n > 0) return `<span class="pm-pos">+${n}</span>`;
  if (n < 0) return `<span class="pm-neg">${n}</span>`;
  return `<span>0</span>`;
}

/** Format save percentage (0.921 → .921). */
function fmtSvPct(v) {
  if (v == null) return '—';
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  return n.toFixed(3).replace(/^0/, '');
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabId}`);
  });
  document.querySelectorAll('.tab-btn').forEach(b => {
    const active = b.dataset.tab === tabId;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ── Sort-header helper ────────────────────────────────────────────────────────

/**
 * Wire all th.col-sortable inside tableEl.
 * When clicked, updates the th sort-class and calls onSort(key, dir).
 */
function wireSortHeaders(tableEl, onSort) {
  tableEl.querySelectorAll('th.col-sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const wasDesc = th.classList.contains('sort-desc');
      const dir = wasDesc ? 'asc' : (th.dataset.dir || 'desc');
      onSort(col, dir);
    });
  });
}

/** Update th sort-direction classes for a table. */
function setSortIndicator(tableEl, key, dir) {
  tableEl.querySelectorAll('th.sort-asc, th.sort-desc').forEach(h => {
    h.classList.remove('sort-asc', 'sort-desc');
  });
  const th = tableEl.querySelector(`th[data-col="${key}"]`);
  if (th) th.classList.add(dir === 'asc' ? 'sort-asc' : 'sort-desc');
}

// ── Standings ─────────────────────────────────────────────────────────────────

const standingsTableEl = document.querySelector('#tab-standings table');

function renderStandings(standings) {
  allStandings = standings || [];
  _repaintStandings();
}

function _repaintStandings() {
  const rows = [...allStandings];
  sortBy(rows, standingsSortKey, standingsSortDir);
  setSortIndicator(standingsTableEl, standingsSortKey, standingsSortDir);

  if (!rows.length) {
    standingsBodyEl.innerHTML = '<tr><td colspan="9">No standings data available.</td></tr>';
    return;
  }

  standingsBodyEl.innerHTML = rows.map(team => {
    const diff = (team.goalFor ?? 0) - (team.goalAgainst ?? 0);
    const diffCell = diff > 0
      ? `<td class="num pm-pos">+${diff}</td>`
      : diff < 0
        ? `<td class="num pm-neg">${diff}</td>`
        : `<td class="num">0</td>`;
    return `<tr>
      <td class="cell-name">${esc(formatTeamName(team))}</td>
      <td class="num">${team.gamesPlayed ?? 0}</td>
      <td class="num">${team.points ?? 0}</td>
      <td class="num">${team.wins ?? 0}</td>
      <td class="num">${team.losses ?? 0}</td>
      <td class="num">${team.otLosses ?? 0}</td>
      <td class="num">${team.goalFor ?? 0}</td>
      <td class="num">${team.goalAgainst ?? 0}</td>
      ${diffCell}
    </tr>`;
  }).join('');
}

wireSortHeaders(standingsTableEl, (key, dir) => {
  standingsSortKey = key;
  standingsSortDir = dir;
  _repaintStandings();
});

// ── Skater stats ──────────────────────────────────────────────────────────────

const skaterTableEl = document.getElementById('skater-table');

function populateTeamDropdown(selectEl, players) {
  const prev  = selectEl.value;
  const teams = [...new Set(players.map(p => p.teamAbbrevs).filter(Boolean))].sort();
  selectEl.innerHTML = '<option value="">All Teams</option>';
  teams.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    if (t === prev) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function renderSkaterTable() {
  const posFilter  = posFilterEl.value;
  const teamFilter = teamFilterEl.value;
  const minGp      = parseInt(minGpEl.value, 10) || 0;

  let rows = allSkaters.filter(p => {
    if (posFilter  && p.positionCode !== posFilter)  return false;
    if (teamFilter && p.teamAbbrevs  !== teamFilter) return false;
    if ((p.gamesPlayed ?? 0) < minGp)                return false;
    return true;
  });

  sortBy(rows, skaterSortKey, skaterSortDir);
  setSortIndicator(skaterTableEl, skaterSortKey, skaterSortDir);

  // percentile badges keyed on the active sort stat
  const pctMap = computePercentiles(rows, skaterSortKey, true);

  if (skaterCountEl) {
    skaterCountEl.textContent = `${rows.length} player${rows.length !== 1 ? 's' : ''}`;
  }

  if (!rows.length) {
    skaterBodyEl.innerHTML = '<tr><td colspan="17">No players match the current filters.</td></tr>';
    return;
  }

  skaterBodyEl.innerHTML = rows.map((p, i) => {
    const badge = percentileBadge(pctMap.get(p) ?? 0);
    return `<tr>
      <td class="cell-rank">${i + 1}</td>
      <td class="cell-name">${esc(p.skaterFullName ?? '—')}${badge}</td>
      <td class="num">${esc(p.teamAbbrevs ?? '—')}</td>
      <td>${esc(p.positionCode ?? '—')}</td>
      <td class="num">${p.gamesPlayed ?? 0}</td>
      <td class="num">${p.goals ?? 0}</td>
      <td class="num">${p.assists ?? 0}</td>
      <td class="num">${p.points ?? 0}</td>
      <td class="num">${fmtPM(p.plusMinus)}</td>
      <td class="num">${p.penaltyMinutes ?? 0}</td>
      <td class="num">${fmt(p.pointsPerGame, 2)}</td>
      <td class="num">${p.ppPoints ?? 0}</td>
      <td class="num">${p.shPoints ?? 0}</td>
      <td class="num">${p.gameWinningGoals ?? 0}</td>
      <td class="num">${p.shots ?? 0}</td>
      <td class="num">${fmt(p.shootingPctg, 1)}</td>
      <td class="num">${esc(p.timeOnIcePerGame ?? '—')}</td>
    </tr>`;
  }).join('');
}

function loadSkaters(players) {
  allSkaters = players;
  populateTeamDropdown(teamFilterEl, players);
  renderSkaterTable();
}

wireSortHeaders(skaterTableEl, (key, dir) => {
  skaterSortKey = key;
  skaterSortDir = dir;
  // sync lb-btn highlight
  document.querySelectorAll('.lb-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.sort === key);
  });
  renderSkaterTable();
});

document.querySelectorAll('.lb-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    skaterSortKey = btn.dataset.sort;
    skaterSortDir = 'desc';
    document.querySelectorAll('.lb-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderSkaterTable();
  });
});

[posFilterEl, teamFilterEl].forEach(el => el.addEventListener('change', renderSkaterTable));
minGpEl.addEventListener('input', renderSkaterTable);

// ── Goalie stats ──────────────────────────────────────────────────────────────

const goalieTableEl = document.getElementById('goalie-table');

function renderGoalieTable() {
  const teamFilter = goalieTeamFilterEl.value;
  const minGp      = parseInt(goalieMinGpEl.value, 10) || 0;

  let rows = allGoalies.filter(g => {
    if (teamFilter && g.teamAbbrevs !== teamFilter) return false;
    if ((g.gamesPlayed ?? 0) < minGp)              return false;
    return true;
  });

  sortBy(rows, goalieSortKey, goalieSortDir);
  setSortIndicator(goalieTableEl, goalieSortKey, goalieSortDir);

  const pctMap = computePercentiles(rows, 'savePctg', true);

  if (goalieCountEl) {
    goalieCountEl.textContent = `${rows.length} goalie${rows.length !== 1 ? 's' : ''}`;
  }

  if (!rows.length) {
    goalieBodyEl.innerHTML = '<tr><td colspan="12">No goalies match the current filters.</td></tr>';
    return;
  }

  goalieBodyEl.innerHTML = rows.map((g, i) => {
    const badge = percentileBadge(pctMap.get(g) ?? 0);
    return `<tr>
      <td class="cell-rank">${i + 1}</td>
      <td class="cell-name">${esc(g.goalieFullName ?? '—')}${badge}</td>
      <td class="num">${esc(g.teamAbbrevs ?? '—')}</td>
      <td class="num">${g.wins ?? 0}</td>
      <td class="num">${g.losses ?? 0}</td>
      <td class="num">${g.otLosses ?? 0}</td>
      <td class="num">${g.gamesPlayed ?? 0}</td>
      <td class="num">${g.gamesStarted ?? 0}</td>
      <td class="num">${fmtSvPct(g.savePctg)}</td>
      <td class="num">${fmt(g.goalsAgainstAverage, 2)}</td>
      <td class="num">${g.shutouts ?? 0}</td>
      <td class="num">${esc(g.timeOnIce ?? '—')}</td>
    </tr>`;
  }).join('');
}

function loadGoalies(goalies) {
  allGoalies = goalies;
  populateTeamDropdown(goalieTeamFilterEl, goalies);
  renderGoalieTable();
}

wireSortHeaders(goalieTableEl, (key, dir) => {
  goalieSortKey = key;
  goalieSortDir = dir;
  renderGoalieTable();
});

[goalieTeamFilterEl].forEach(el => el.addEventListener('change', renderGoalieTable));
goalieMinGpEl.addEventListener('input', renderGoalieTable);

// ── Playoffs ──────────────────────────────────────────────────────────────────

function renderList(element, items, emptyMessage) {
  if (!items.length) {
    element.innerHTML = `<li>${emptyMessage}</li>`;
    return;
  }
  element.innerHTML = items.map(item => `<li>${esc(item)}</li>`).join('');
}

function buildPlayoffRecords(standings) {
  return (standings || [])
    .filter(t =>
      (t.wildcardSequence != null) ||
      (t.divisionSequence != null)
    )
    .sort((a, b) => b.points - a.points)
    .slice(0, 16)
    .map(t => `${formatTeamName(t)}: ${t.wins ?? 0}–${t.losses ?? 0}–${t.otLosses ?? 0}, ${t.points ?? 0} pts`);
}

function buildPlayoffGames(scoreData) {
  return ((scoreData || {}).games || [])
    .filter(g => g.gameType === PLAYOFF_GAME_TYPE)
    .map(g => {
      const away = g.awayTeam?.abbrev || 'Away';
      const home = g.homeTeam?.abbrev || 'Home';
      const aScore = g.awayTeam?.score ?? '–';
      const hScore = g.homeTeam?.score ?? '–';
      return `${away} ${aScore} at ${home} ${hScore} (${g.gameState || 'SCHEDULED'})`;
    });
}

function buildPlayoffSeries(seriesData) {
  const rounds = (seriesData || {}).rounds || (seriesData || {}).series || [];
  return rounds.flatMap(round =>
    (round.series || []).map(item => {
      const top    = item.topSeedTeamAbbrev?.default    || item.topSeed?.teamAbbrev?.default    || 'TBD';
      const bottom = item.bottomSeedTeamAbbrev?.default || item.bottomSeed?.teamAbbrev?.default || 'TBD';
      const tw = item.topSeedWins    ?? item.topSeed?.wins    ?? 0;
      const bw = item.bottomSeedWins ?? item.bottomSeed?.wins ?? 0;
      return `${top} vs ${bottom} (${tw}–${bw})`;
    })
  );
}

// ── Main data load ────────────────────────────────────────────────────────────

async function loadPageData() {
  // Standings + Playoffs (fast, show first)
  try {
    const [standingsData, scoreData, seriesData] = await Promise.all([
      fetchJson(['standings/now']),
      fetchJson(['score/now']),
      fetchJson(['playoff-series/carousel/now', 'playoff-bracket/now']),
    ]);

    renderStandings(standingsData.standings);
    renderList(playoffGamesListEl,  buildPlayoffGames(scoreData),                       'No active playoff games.');
    renderList(playoffSeriesListEl, buildPlayoffSeries(seriesData),                     'No playoff series data yet.');
    renderList(playoffRecordsListEl, buildPlayoffRecords(standingsData.standings),      'Playoff records not available yet.');
    lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleString()}`;
  } catch (_err) {
    renderStandings(FALLBACK_SNAPSHOT.standings);
    renderList(playoffGamesListEl,  FALLBACK_SNAPSHOT.playoffGames,                    'No active playoff games.');
    renderList(playoffSeriesListEl, FALLBACK_SNAPSHOT.playoffSeries,                   'No playoff series data yet.');
    renderList(playoffRecordsListEl, buildPlayoffRecords(FALLBACK_SNAPSHOT.standings), 'Playoff records not available yet.');
    lastUpdatedEl.textContent = 'Live feed unavailable — showing bundled season snapshot.';
  }

  // Skater stats
  try {
    const data = await fetchJson([
      `stats/skater/summary?limit=100&start=0&season=${SEASON}&gameType=${GAME_TYPE_REGULAR}&sort=points&direction=DESC`,
      `stats/skater/summary?limit=100&start=0&season=${SEASON}&gameType=${GAME_TYPE_REGULAR}`,
    ]);
    loadSkaters(data?.data?.length ? data.data : FALLBACK_SNAPSHOT.skaters);
  } catch (_err) {
    loadSkaters(FALLBACK_SNAPSHOT.skaters);
  }

  // Goalie stats
  try {
    const data = await fetchJson([
      `stats/goalie/summary?limit=60&start=0&season=${SEASON}&gameType=${GAME_TYPE_REGULAR}&sort=wins&direction=DESC`,
      `stats/goalie/summary?limit=60&start=0&season=${SEASON}&gameType=${GAME_TYPE_REGULAR}`,
    ]);
    loadGoalies(data?.data?.length ? data.data : FALLBACK_SNAPSHOT.goalies);
  } catch (_err) {
    loadGoalies(FALLBACK_SNAPSHOT.goalies);
  }
}

loadPageData();

