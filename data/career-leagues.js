import bundesliga from './career-2026/bundesliga.js';
import premier from './career-2026/premier.js';
import laliga from './career-2026/laliga.js';
import brasileirao from './career-2026/brasileirao.js';
import seriea from './career-2026/seriea.js';

export const CAREER_LEAGUES = [bundesliga, premier, laliga, brasileirao, seriea].map(league => ({
  ...league,
  teams: league.teams.map(([code, nome, roster], index) => {
    const id = `career26-${league.id}-${code}`;
    return {
      id, clubId: id, nome, ano: 2026, leagueId: league.id, crestIndex: index + 1,
      jogadores: roster.map(([id, nome, ovr, positions, source, camisa]) => ({
        id, nome, ovr, tags: positions.split('/'), camisa,
        ratingKind: source === 'estimate' ? 'career-estimate' : 'career-fc27',
      })),
    };
  }),
}));

const leagues = new Map(CAREER_LEAGUES.map(league => [league.id, league]));
const teams = new Map(CAREER_LEAGUES.flatMap(league => league.teams.map(team => [team.id, team])));

export const careerLeague = id => leagues.get(id);
export const careerSeasonTeam = id => teams.get(id);
