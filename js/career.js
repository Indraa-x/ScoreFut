import {allSquads} from '../data/game-squads.js';
import {squadsForMode} from '../data/competitions.js';
import {FORMATIONS, calculateTeam, mulberry32, positionFit, simulateMatch, squadTeam} from './engine.js';
import {goalsAt} from './match-goals.js';
import {formatMatchEventMinute} from './match-motion.js';
import {careerMarketCatalog} from './career-market.js';
import {movableSlots} from './draft.js';

export const CAREER_KEY = 'coach-career';
export const CAREER_TEAM = 'career-user';
export const CAREER_CRESTS = ['bola', 'leao', 'aguia', 'montanha', 'estrela', 'listras', 'raio', 'torre'];
export const FACILITIES = {
  training: {name: 'Centro de treinamento', effect: 'Cada melhoria dá +1 de OVR efetivo aos titulares durante as partidas.', cost: 1400},
  academy: {name: 'Academia de base', effect: 'Traz um jogador real do catálogo ao melhorar. A partir do nível 2, traz outro a cada nova temporada.', cost: 1000},
  stadium: {name: 'Estádio', effect: 'Cada melhoria aumenta em R$ 120 mil a receita por jogo em casa.', cost: 1800},
};
export const MAX_FACILITY_LEVEL = 5;
export const MAX_CAREER_ROSTER = 32;
const CAREER_VERSION = 2;
const brazilianSquads = squadsForMode(allSquads, 'copa-do-brasil');
const clubs = new Map();
for (const squad of brazilianSquads) {
  const previous = clubs.get(squad.clubId);
  if (!previous || Number(squad.ano) > Number(previous.ano)) clubs.set(squad.clubId, squad);
}
const opponents = new Map(brazilianSquads.map(squad => [squad.id, squad]));
const opponentTeams = new Map();
const careerPlayerPool = brazilianSquads.flatMap(squad => squad.jogadores);
// The order matches the starter IDs used by saves before the catalog roster.
const startingRoster = [
  ['cruzeiro-1997', 'dida'],
  ['vasco-1997', 'carlos-germano'],
  ['gremio-2001', 'anderson-lima'],
  ['sao-paulo-2006', 'miranda'],
  ['gremio-2001', 'anderson-polga'],
  ['atletico-mineiro-2021', 'guilherme-arana'],
  ['internacional-2008', 'marcao-marcos-alberto-skavinski'],
  ['flamengo-2025', 'danilo-luiz-da-silva'],
  ['flamengo-2022', 'joao-gomes'],
  ['vasco-1997', 'juninho-pernambucano'],
  ['gremio-2017', 'ramiro'],
  ['fluminense-2023', 'andre-trindade-da-costa-neto'],
  ['sao-paulo-2008', 'dagoberto'],
  ['flamengo-2025', 'luiz-araujo'],
  ['flamengo-2009', 'adriano'],
  ['fluminense-2012', 'rafael-sobis'],
].map(([squadId, id]) => opponents.get(squadId).jogadores.find(player => player.id === id));
const isLegacyPlayer = player => /^career-(?:starter|youth)-/.test(player.id);
const ratingGap = (player, target) => Math.abs(player.ovr - target);

function shuffled(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function careerFixtures(career) {
  const teams = [CAREER_TEAM, ...shuffled(career.opponentIds, mulberry32(career.seed + career.season))];
  const firstLeg = [];
  for (let round = 0; round < teams.length - 1; round++) {
    const fixtures = [];
    for (let i = 0; i < teams.length / 2; i++) {
      const left = teams[i], right = teams[teams.length - i - 1];
      fixtures.push(round % 2 ? [right, left] : [left, right]);
    }
    firstLeg.push(fixtures);
    teams.splice(1, 0, teams.pop());
  }
  return [...firstLeg, ...firstLeg.map(round => round.map(([home, away]) => [away, home]))];
}

export function nextCareerMatch(career) {
  return careerFixtures(career)[career.round]?.find(fixture => fixture.includes(CAREER_TEAM)) ?? null;
}

export function careerClub(career, id) {
  if (id === CAREER_TEAM) return {nome: career.name, crest: career.crest};
  return opponents.get(id);
}

// Use an augmenting path so flexible players can move aside for a teammate
// who only fits one role. The final assignment always uses distinct players.
function bestLineup(roster, formation) {
  const assigned = {};
  const slots = FORMATIONS[formation].slots;
  function place(candidate, visited) {
    const options = slots.filter(slot => positionFit(candidate, slot) !== null)
      .sort((a, b) => positionFit(candidate, a) - positionFit(candidate, b));
    for (const slot of options) {
      if (visited.has(slot.id)) continue;
      visited.add(slot.id);
      if (!assigned[slot.id] || place(assigned[slot.id], visited)) {
        assigned[slot.id] = candidate;
        return true;
      }
    }
    return false;
  }
  const ordered = [...roster].sort((a, b) => b.ovr - a.ovr);
  for (const candidate of ordered) {
    place(candidate, new Set());
    if (Object.keys(assigned).length === slots.length) break;
  }
  if (Object.keys(assigned).length !== slots.length) throw Error('O elenco não tem jogadores compatíveis com todas as vagas dessa formação.');
  return Object.fromEntries(Object.entries(assigned).map(([slot, candidate]) => [slot, candidate.id]));
}

export function createCareer(seed) {
  const roster = [...startingRoster];
  const opponentIds = [...clubs.values()].slice(0, 15).map(squad => squad.id);
  if (opponentIds.length % 2 === 0) opponentIds.pop();
  return {
    version: CAREER_VERSION, seed, name: 'Meu time', crest: CAREER_CRESTS[0],
    season: 1, round: 0, budget: 8500, facilities: {training: 1, academy: 1, stadium: 1},
    roster, opponentIds, formation: '4-3-3', lineup: bestLineup(roster, '4-3-3'), results: [], seasons: [],
  };
}

export function migrateCareerRoster(career) {
  if (career.version >= CAREER_VERSION) return career;
  const used = new Set(career.roster.filter(player => !isLegacyPlayer(player)).map(player => player.id));
  const lineup = {...career.lineup};
  const slots = new Map(FORMATIONS[career.formation].slots.map(slot => [lineup[slot.id], slot]));
  const roster = career.roster.map(player => {
    if (!isLegacyPlayer(player)) return player;
    const slot = slots.get(player.id);
    const role = slot ?? player.tags[0];
    const available = candidate => candidate && !used.has(candidate.id) && positionFit(candidate, role) !== null;
    const preferred = startingRoster[Number(player.id.match(/^career-starter-(\d+)$/)?.[1])];
    const missingRoles = candidate => player.tags.filter(tag => positionFit(candidate, tag) === null).length;
    const replacement = available(preferred) ? preferred : careerPlayerPool.filter(available).sort((a, b) =>
      missingRoles(a) - missingRoles(b) || ratingGap(a, player.ovr) - ratingGap(b, player.ovr)
    )[0];
    used.add(replacement.id);
    if (slot) lineup[slot.id] = replacement.id;
    return replacement;
  });
  return {...career, version: CAREER_VERSION, roster, lineup};
}

export function careerPicks(career) {
  return FORMATIONS[career.formation].slots.map(slot => ({
    slot, player: career.roster.find(p => p.id === career.lineup[slot.id]),
  }));
}

export function changeCareerFormation(career, formation) {
  if (!Object.hasOwn(FORMATIONS, formation)) throw Error('Escolha uma formação válida.');
  return {...career, formation, lineup: bestLineup(career.roster, formation)};
}

export function careerDestinations(career, playerId) {
  const candidate = career.roster.find(player => player.id === playerId);
  if (!candidate) return [];
  const picks = careerPicks(career);
  if (picks.some(pick => pick.player.id === playerId)) return movableSlots({picks}, career.formation, playerId);
  return picks.map(({slot}) => slot).filter(slot => positionFit(candidate, slot) !== null);
}

export function changeCareerStarter(career, slotId, playerId) {
  if (!careerDestinations(career, playerId).some(slot => slot.id === slotId)) throw Error('Escolha uma posição compatível destacada no campo.');
  const lineup = {...career.lineup};
  const origin = Object.keys(lineup).find(id => lineup[id] === playerId);
  if (origin) lineup[origin] = lineup[slotId];
  lineup[slotId] = playerId;
  return {...career, lineup};
}

export function signCareerPlayer(career, id) {
  const offer = careerMarketCatalog().byId.get(id);
  if (!offer) throw Error('Jogador não encontrado no mercado.');
  if (career.roster.some(player => player.id === offer.player.id)) throw Error('Esse jogador já está no elenco.');
  if (career.roster.length >= MAX_CAREER_ROSTER) throw Error('O elenco está cheio. Libere um reserva no Elenco.');
  if (career.budget < offer.price) throw Error('Saldo insuficiente para a contratação.');
  return {...career, budget: career.budget - offer.price, roster: [...career.roster, offer.player]};
}

export function releaseCareerPlayer(career, id) {
  if (Object.values(career.lineup).includes(id)) throw Error('Passe o jogador para a reserva antes de liberar.');
  if (!career.roster.some(p => p.id === id)) throw Error('Jogador não encontrado.');
  return {...career, roster: career.roster.filter(p => p.id !== id)};
}

export function renameCareerClub(career, name, crest) {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean || clean.length > 32 || !CAREER_CRESTS.includes(crest)) throw Error('Escolha um escudo e informe um nome de até 32 caracteres.');
  return {...career, name: clean, crest};
}

export function facilityPrice(career, key) {
  return FACILITIES[key].cost * career.facilities[key];
}

function addAcademyPlayer(career) {
  if (career.roster.length >= MAX_CAREER_ROSTER) return career;
  const used = new Set(career.roster.map(player => player.id));
  const target = 69 + career.facilities.academy * 2;
  const eligible = careerPlayerPool.filter(player => !used.has(player.id)).sort((a, b) => ratingGap(a, target) - ratingGap(b, target));
  const closest = eligible[0];
  if (!closest) return career;
  const prospects = [...new Map(eligible.filter(player => ratingGap(player, target) === ratingGap(closest, target))
    .map(player => [player.id, player])).values()];
  const rng = mulberry32(career.seed + career.season * 19 + career.facilities.academy * 47);
  return {...career, roster: [...career.roster, prospects[Math.floor(rng() * prospects.length)]]};
}

export function upgradeCareerFacility(career, key) {
  if (!Object.hasOwn(FACILITIES, key) || career.facilities[key] >= MAX_FACILITY_LEVEL) throw Error('Essa melhoria não está disponível.');
  if (key === 'academy' && career.roster.length >= MAX_CAREER_ROSTER) throw Error('Libere uma vaga no elenco para receber o jogador da base.');
  const price = facilityPrice(career, key);
  if (career.budget < price) throw Error('Saldo insuficiente para a melhoria.');
  const updated = {...career, budget: career.budget - price, facilities: {...career.facilities, [key]: career.facilities[key] + 1}};
  return key === 'academy' ? addAcademyPlayer(updated) : updated;
}

export function careerTable(career) {
  const rows = new Map([CAREER_TEAM, ...career.opponentIds].map(id => [id, {
    id, played: 0, points: 0, wins: 0, goalsFor: 0, goalsAgainst: 0,
  }]));
  for (const round of career.results) for (const match of round) {
    const home = rows.get(match.home), away = rows.get(match.away);
    for (const [row, scored, conceded] of [[home, match.homeGoals, match.awayGoals], [away, match.awayGoals, match.homeGoals]]) {
      row.played++;
      row.goalsFor += scored;
      row.goalsAgainst += conceded;
      row.points += scored > conceded ? 3 : scored === conceded ? 1 : 0;
      row.wins += Number(scored > conceded);
    }
  }
  return [...rows.values()].sort((a, b) =>
    b.points - a.points || b.wins - a.wins ||
    (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
    b.goalsFor - a.goalsFor || careerClub(career, a.id).nome.localeCompare(careerClub(career, b.id).nome, 'pt-BR')
  );
}

function matchTeam(career, id) {
  if (id !== CAREER_TEAM) {
    if (!opponentTeams.has(id)) opponentTeams.set(id, squadTeam(opponents.get(id)));
    return opponentTeams.get(id);
  }
  const bonus = career.facilities.training - 1;
  const lineup = careerPicks(career).map(pick => {
    if (!pick.player || positionFit(pick.player, pick.slot) === null) throw Error('Complete a escalação antes de jogar.');
    return {...pick, player: {...pick.player, ovr: Math.min(99, pick.player.ovr + bonus)}, clubId: CAREER_TEAM, ano: career.season};
  });
  return {id, name: career.name, crest: career.crest, isUser: true, lineup, strength: calculateTeam(lineup), formation: career.formation};
}

export function careerScorers(match) {
  const scorers = new Map();
  for (const goal of goalsAt(match, match.duration)) {
    const key = `${goal.team}:${goal.player.id}`;
    if (!scorers.has(key)) scorers.set(key, {name: goal.player.nome, team: goal.team, goals: 0, minutes: []});
    const scorer = scorers.get(key);
    scorer.goals++;
    scorer.minutes.push(formatMatchEventMinute(match, goal.minute) + '′');
  }
  return [...scorers.values()];
}

export function prepareCareerRound(career) {
  const fixtures = careerFixtures(career)[career.round];
  if (!fixtures) throw Error('A temporada já terminou.');
  const seed = career.seed + career.season * 1009 + career.round * 71;
  const rng = mulberry32(seed);
  const id = `${career.season}:${career.round}`;
  let replay;
  let income = 0;
  const round = fixtures.map(([home, away]) => {
    const teams = [matchTeam(career, home), matchTeam(career, away)];
    const userMatch = home === CAREER_TEAM || away === CAREER_TEAM;
    const match = simulateMatch(...teams, rng, {neutral: false, stoppageTimeAllowed: userMatch});
    const result = {home, away, homeGoals: match.homeGoals, awayGoals: match.awayGoals};
    if (userMatch) {
      income = (home === CAREER_TEAM ? 260 + (career.facilities.stadium - 1) * 120 : 100)
        + (match.winnerId === CAREER_TEAM ? 160 : match.homeGoals === match.awayGoals ? 80 : 0);
      result.income = income;
      result.scorers = careerScorers(match);
      replay = {
        seed, mode: 'career', teams, userTeamId: CAREER_TEAM,
        userMatches: [{
          id, homeId: home, awayId: away, round: career.round + 1, stage: 'league',
          stageLabel: `Campeonato Brasileiro · Rodada ${career.round + 1}`, result: match,
        }],
      };
    }
    return result;
  });
  return {id, round: career.round, season: career.season, tournament: replay, results: round, income, minute: 0};
}

export function commitCareerRound(career) {
  const replay = career.replay;
  if (!replay || career.round !== replay.round || career.season !== replay.season ||
      replay.minute < replay.tournament.userMatches[0].result.duration) return career;
  const match = replay.tournament.userMatches[0];
  const results = replay.results.map(result =>
    result.home === match.homeId && result.away === match.awayId && result.scorers?.some(scorer => !scorer.minutes)
      ? {...result, scorers: careerScorers(match.result)}
      : result
  );
  return {
    ...career, round: career.round + 1, results: [...career.results, results],
    budget: career.budget + replay.income,
  };
}

export function advanceCareerSeason(career) {
  if (career.round < careerFixtures(career).length) throw Error('Termine a temporada antes de avançar.');
  const table = careerTable(career);
  const position = table.findIndex(row => row.id === CAREER_TEAM) + 1;
  const prize = 2500 + (table.length - position) * 200;
  const season = {number: career.season, position, points: table[position - 1].points, prize};
  const next = {...career, season: career.season + 1, round: 0, results: [], replay: null, budget: career.budget + prize, seasons: [...career.seasons, season]};
  return career.facilities.academy > 1 ? addAcademyPlayer(next) : next;
}
