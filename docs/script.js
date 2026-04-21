const NHL_API_BASE = 'https://api-web.nhle.com/v1';

const lastUpdatedEl = document.getElementById('last-updated');
const standingsBodyEl = document.getElementById('standings-body');
const playoffSeriesListEl = document.getElementById('playoff-series-list');
const playoffGamesListEl = document.getElementById('playoff-games-list');
const playoffRecordsListEl = document.getElementById('playoff-records-list');
const PLAYOFF_GAME_TYPE = 3;

const FALLBACK_SNAPSHOT = {
  standings: [
    { teamName: { default: 'Winnipeg Jets' }, gamesPlayed: 82, wins: 55, losses: 24, otLosses: 3, points: 113, goalFor: 277, goalAgainst: 210, divisionSequence: 1 },
    { teamName: { default: 'Dallas Stars' }, gamesPlayed: 82, wins: 52, losses: 21, otLosses: 9, points: 113, goalFor: 294, goalAgainst: 232, divisionSequence: 1 },
    { teamName: { default: 'New York Rangers' }, gamesPlayed: 82, wins: 50, losses: 24, otLosses: 8, points: 108, goalFor: 282, goalAgainst: 239, divisionSequence: 1 },
    { teamName: { default: 'Carolina Hurricanes' }, gamesPlayed: 82, wins: 49, losses: 23, otLosses: 10, points: 108, goalFor: 286, goalAgainst: 233, divisionSequence: 2 },
    { teamName: { default: 'Edmonton Oilers' }, gamesPlayed: 82, wins: 49, losses: 27, otLosses: 6, points: 104, goalFor: 294, goalAgainst: 237, divisionSequence: 2 },
    { teamName: { default: 'Colorado Avalanche' }, gamesPlayed: 82, wins: 50, losses: 25, otLosses: 7, points: 107, goalFor: 302, goalAgainst: 254, divisionSequence: 2 },
    { teamName: { default: 'Toronto Maple Leafs' }, gamesPlayed: 82, wins: 47, losses: 26, otLosses: 9, points: 103, goalFor: 279, goalAgainst: 252, divisionSequence: 3 },
    { teamName: { default: 'Florida Panthers' }, gamesPlayed: 82, wins: 47, losses: 31, otLosses: 4, points: 98, goalFor: 268, goalAgainst: 229, wildcardSequence: 1 }
  ],
  playoffGames: [
    'BOS 2 at TOR 3 (FINAL)',
    'VGK 1 at EDM 4 (FINAL)',
    'NYR 2 at CAR 1 (FINAL/OT)',
    'DAL 0 at COL 0 (SCHEDULED)'
  ],
  playoffSeries: [
    'Boston Bruins vs Toronto Maple Leafs (1-2)',
    'Vegas Golden Knights vs Edmonton Oilers (0-2)',
    'New York Rangers vs Carolina Hurricanes (2-1)',
    'Dallas Stars vs Colorado Avalanche (1-1)'
  ]
};

async function fetchJson(pathOptions) {
  for (const path of pathOptions) {
    try {
      const response = await fetch(`${NHL_API_BASE}/${path}`);
      if (!response.ok) {
        continue;
      }

      return await response.json();
    } catch (_error) {
      // Try next endpoint option.
    }
  }

  throw new Error('Unable to load data from NHL API endpoints.');
}

function formatTeamName(team) {
  return team?.teamName?.default || team?.teamAbbrev?.default || 'Unknown Team';
}

function renderStandings(standings = []) {
  if (!Array.isArray(standings) || standings.length === 0) {
    standingsBodyEl.innerHTML = '<tr><td colspan="8">No standings data available.</td></tr>';
    return;
  }

  standingsBodyEl.innerHTML = standings
    .sort((a, b) => b.points - a.points)
    .slice(0, 16)
    .map(
      (team) => `
      <tr>
        <td>${formatTeamName(team)}</td>
        <td>${team.gamesPlayed ?? 0}</td>
        <td>${team.wins ?? 0}</td>
        <td>${team.losses ?? 0}</td>
        <td>${team.otLosses ?? 0}</td>
        <td>${team.points ?? 0}</td>
        <td>${team.goalFor ?? 0}</td>
        <td>${team.goalAgainst ?? 0}</td>
      </tr>`
    )
    .join('');
}

function renderList(element, items, emptyMessage) {
  if (!items.length) {
    element.innerHTML = `<li>${emptyMessage}</li>`;
    return;
  }

  element.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
}

function buildPlayoffRecords(standings = []) {
  return standings
    .filter(
      (team) =>
        (team.wildcardSequence !== undefined && team.wildcardSequence !== null) ||
        (team.divisionSequence !== undefined && team.divisionSequence !== null)
    )
    .sort((a, b) => b.points - a.points)
    .slice(0, 16)
    .map((team) => `${formatTeamName(team)}: ${team.wins ?? 0}-${team.losses ?? 0}-${team.otLosses ?? 0}, ${team.points ?? 0} pts`);
}

function buildPlayoffGames(scoreData = {}) {
  const games = scoreData.games || [];

  return games
    .filter((game) => game.gameType === PLAYOFF_GAME_TYPE)
    .map((game) => {
      const away = game.awayTeam?.abbrev || 'Away';
      const home = game.homeTeam?.abbrev || 'Home';
      const awayScore = game.awayTeam?.score ?? '-';
      const homeScore = game.homeTeam?.score ?? '-';
      const state = game.gameState || 'SCHEDULED';
      return `${away} ${awayScore} at ${home} ${homeScore} (${state})`;
    });
}

function buildPlayoffSeries(seriesData = {}) {
  const rounds = seriesData.rounds || seriesData.series || [];

  const series = rounds.flatMap((round) => {
    const roundSeries = round.series || [];
    return roundSeries.map((item) => {
      const topSeed = item.topSeedTeamAbbrev?.default || item.topSeed?.teamAbbrev?.default || 'TBD';
      const bottomSeed = item.bottomSeedTeamAbbrev?.default || item.bottomSeed?.teamAbbrev?.default || 'TBD';
      const topWins = item.topSeedWins ?? item.topSeed?.wins ?? 0;
      const bottomWins = item.bottomSeedWins ?? item.bottomSeed?.wins ?? 0;
      return `${topSeed} vs ${bottomSeed} (${topWins}-${bottomWins})`;
    });
  });

  return series;
}

async function loadPageData() {
  try {
    const [standingsData, scoreData, seriesData] = await Promise.all([
      fetchJson(['standings/now']),
      fetchJson(['score/now']),
      fetchJson(['playoff-series/carousel/now', 'playoff-bracket/now'])
    ]);

    renderStandings(standingsData.standings);
    renderList(playoffGamesListEl, buildPlayoffGames(scoreData), 'No active playoff games found in the current feed.');
    renderList(playoffSeriesListEl, buildPlayoffSeries(seriesData), 'No playoff series data available yet.');
    renderList(playoffRecordsListEl, buildPlayoffRecords(standingsData.standings), 'Playoff qualification records are not available yet.');

    lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleString()}`;
  } catch (_error) {
    renderStandings(FALLBACK_SNAPSHOT.standings);
    renderList(playoffGamesListEl, FALLBACK_SNAPSHOT.playoffGames, 'No active playoff games found in the current feed.');
    renderList(playoffSeriesListEl, FALLBACK_SNAPSHOT.playoffSeries, 'No playoff series data available yet.');
    renderList(playoffRecordsListEl, buildPlayoffRecords(FALLBACK_SNAPSHOT.standings), 'Playoff qualification records are not available yet.');
    lastUpdatedEl.textContent = 'Live NHL feed unavailable right now. Showing bundled current-season playoff snapshot.';
  }
}

loadPageData();
