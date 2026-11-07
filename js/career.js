import {allSquads} from '../data/game-squads.js';
import {squadsForMode} from '../data/competitions.js';
import {FORMATIONS, calculateTeam, mulberry32, positionFit, simulateMatch, squadTeam} from './engine.js';

export const CAREER_KEY = 'coach-career';
export const CAREER_TEAM = 'career-user';
export const CAREER_CRESTS = ['bola', 'leao', 'aguia', 'montanha', 'estrela', 'listras', 'raio', 'torre'];
export const FACILITIES = {
  training: {name: 'Centro de treinamento', effect: 'Cada melhoria dá +1 de OVR efetivo aos titulares durante as partidas.', cost: 1400},
  academy: {name: 'Academia de base', effect: 'Revela um jogador ao melhorar. A partir do nível 2, revela outro a cada nova temporada.', cost: 1000},
  stadium: {name: 'Estádio', effect: 'Cada melhoria aumenta em R$ 120 mil a receita por jogo em casa.', cost: 1800},
};
export const MAX_FACILITY_LEVEL = 5;
export const MAX_CAREER_ROSTER = 32;
const STARTERS = [
  ['Caio Reis', 77, 'GOL'], ['André Matos', 74, 'GOL'],
  ['Igor Tavares', 77, 'LD/MD'], ['Rafael Moura', 79, 'ZAG'], ['Bruno Dias', 78, 'ZAG/VOL'],
  ['Daniel Luz', 76, 'LE/ME'], ['João Prado', 75, 'ZAG/LE'], ['Felipe Nunes', 74, 'LD/ZAG'],
  ['Lucas Melo', 79, 'VOL/MC'], ['Pedro Leal', 78, 'MC/MEI'], ['Vítor Costa', 77, 'MC/MD'],
  ['Rui Castro', 75, 'VOL/MC'], ['Gustavo Lima', 79, 'PE/ME/SA'],
  ['Mateus Rocha', 78, 'PD/MD'], ['Diego Campos', 80, 'CA'], ['Renan Alves', 76, 'CA/SA'],
];
const player = (id, nome, ovr, tags) => ({id, nome, ovr, tags});
const brazilianSquads = squadsForMode(allSquads, 'copa-do-brasil');
const clubs = new Map();
for (const squad of brazilianSquads) {
  const previous = clubs.get(squad.clubId);
  if (!previous || Number(squad.ano) > Number(previous.ano)) clubs.set(squad.clubId, squad);
}
const opponents = new Map(brazilianSquads.map(squad => [squad.id, squad]));
const opponentTeams = new Map();
const activeLeaguePlayers = new Set([...clubs.values()].flatMap(squad => squad.jogadores.map(p => p.id)));
const marketPlayers = [...new Map(
  brazilianSquads.flatMap(squad => squad.jogadores)
    .filter(p => !activeLeaguePlayers.has(p.id) && p.ovr >= 75 && p.ovr <= 88)
    .map(p => [p.id, p])
).values()];

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
  const roster = STARTERS.map(([name, ovr, roles], index) => player('career-starter-' + index, name, ovr, roles.split('/')));
  const opponentIds = [...clubs.values()].slice(0, 15).map(squad => squad.id);
  if (opponentIds.length % 2 === 0) opponentIds.pop();
  return {
    version: 1, seed, name: 'Meu time', crest: CAREER_CRESTS[0],
    season: 1, round: 0, budget: 8500, facilities: {training: 1, academy: 1, stadium: 1},
    roster, opponentIds, formation: '4-3-3', lineup: bestLineup(roster, '4-3-3'), results: [], seasons: [],
  };
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

export function careerSlotOptions(career, slot) {
  const picks = careerPicks(career);
  const current = picks.find(pick => pick.slot.id === slot.id)?.player;
  return career.roster.filter(candidate => {
    if (positionFit(candidate, slot) === null) return false;
    const origin = picks.find(pick => pick.player?.id === candidate.id);
    return !origin || origin.slot.id === slot.id || (current && positionFit(current, origin.slot) !== null);
  }).sort((a, b) => b.ovr - a.ovr);
}

export function changeCareerStarter(career, slotId, playerId) {
  const slot = FORMATIONS[career.formation].slots.find(slot => slot.id === slotId);
  if (!slot || !careerSlotOptions(career, slot).some(p => p.id === playerId)) throw Error('Escolha um jogador compatível com a vaga.');
  const lineup = {...career.lineup};
  const origin = Object.keys(lineup).find(id => lineup[id] === playerId);
  if (origin) lineup[origin] = lineup[slotId];
  lineup[slotId] = playerId;
  return {...career, lineup};
}

export function careerOffers(career) {
  return shuffled(marketPlayers, mulberry32(career.seed + career.season * 997 + Math.floor(career.round / 5) * 103))
    .slice(0, 8)
    .filter(candidate => !career.roster.some(p => p.id === candidate.id))
    .map(candidate => ({player: candidate, price: 450 + (candidate.ovr - 72) * 170}));
}

export function signCareerPlayer(career, id) {
  const offer = careerOffers(career).find(({player}) => player.id === id);
  if (!offer) throw Error('Essa oferta não está mais disponível.');
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

function addAcademyPlayer(career, suffix) {
  if (career.roster.length >= MAX_CAREER_ROSTER) return career;
  const id = `career-youth-${career.season}-${suffix}`;
  const rng = mulberry32(career.seed + career.season * 19 + career.facilities.academy * 47);
  const roles = ['ZAG/VOL', 'MC/MEI', 'LE/ME', 'PD/SA', 'CA/SA', 'LD/MD', 'GOL'];
  const names = ['Davi', 'Henrique', 'Breno', 'Iago', 'Nicolas', 'Luan', 'Alex'];
  const index = Math.floor(rng() * roles.length);
  const prospect = player(id, `${names[index]} da Base`, 69 + career.facilities.academy * 2, roles[index].split('/'));
  return {...career, roster: [...career.roster, prospect]};
}

export function upgradeCareerFacility(career, key) {
  if (!Object.hasOwn(FACILITIES, key) || career.facilities[key] >= MAX_FACILITY_LEVEL) throw Error('Essa melhoria não está disponível.');
  if (key === 'academy' && career.roster.length >= MAX_CAREER_ROSTER) throw Error('Libere uma vaga no elenco para receber o jogador da base.');
  const price = facilityPrice(career, key);
  if (career.budget < price) throw Error('Saldo insuficiente para a melhoria.');
  const updated = {...career, budget: career.budget - price, facilities: {...career.facilities, [key]: career.facilities[key] + 1}};
  return key === 'academy' ? addAcademyPlayer(updated, 'upgrade-' + updated.facilities.academy) : updated;
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
      result.scorers = match.scorers.map(({nome, team, goals}) => ({name: nome, team, goals}));
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
  return {
    ...career, round: career.round + 1, results: [...career.results, replay.results],
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
  return career.facilities.academy > 1 ? addAcademyPlayer(next, 'season') : next;
}
