import {allSquads} from '../data/game-squads.js';
import {squadsForMode} from '../data/competitions.js';
import {CAREER_LEAGUES, careerLeague, careerSeasonTeam} from '../data/career-leagues.js';
import {FIRST_CHAMPIONS_FIELD, startsInChampions} from '../data/career-2026/champions-qualifiers.js';
import {MARKET_EUR_TO_BRL} from '../data/career-2026/market-values.js';
import {
  FORMATIONS, calculateTeam, createCareerChampionsTournament, hashSeed, mulberry32, playNextRound,
  positionFit, simulateMatch, simulateTournament, squadTeam, teamForNextMatch, upgradeCareerChampionsBracket,
} from './engine.js';
import {goalsAt} from './match-goals.js';
import {matchExpulsions} from './match-discipline.js';
import {formatMatchEventMinute} from './match-motion.js';
import {matchHasEnded} from './match-penalties.js';
import {careerMarketCatalog, careerPlayerValuation} from './career-market.js';
import {movableSlots} from './draft.js';

export const CAREER_KEY = 'coach-career';
export const CAREER_TEAM = 'career-user';
export const CHAMPIONS_PLACES = 4;
const championsLeagues = CAREER_LEAGUES.filter(league => league.id !== 'brasileirao');
export const careerHasChampions = career => championsLeagues.some(league => league.id === career.leagueId);
export const CAREER_STYLES = {
  balanced: {name: 'Equilibrado', description: 'Equilíbrio entre atacar e defender.'},
  attacking: {
    name: 'Ofensivo', description: 'Acelera o jogo e cria mais chances, mas deixa espaços na defesa.',
    profile: {attack: 1.12, midfield: 1, defense: 0.94, tempo: 0.18},
  },
  defensive: {
    name: 'Defensivo', description: 'Protege a defesa e diminui o ritmo, com menos chegada ao ataque.',
    profile: {attack: 0.92, midfield: 1, defense: 1.12, tempo: -0.18},
  },
  counter: {
    name: 'Contra-ataque', description: 'Reforça a defesa e sai rápido quando recupera a bola, cedendo espaço no meio.',
    profile: {attack: 1.04, midfield: 0.88, defense: 1.07, tempo: -0.04},
  },
};
export const careerStyle = career => Object.hasOwn(CAREER_STYLES, career.playStyle) ? career.playStyle : 'balanced';

export function changeCareerStyle(career, style) {
  if (!Object.hasOwn(CAREER_STYLES, style)) throw Error('Escolha um estilo de jogo válido.');
  return {...career, playStyle: style};
}

export const CAREER_CRESTS = ['bola', 'leao', 'aguia', 'montanha', 'estrela', 'listras', 'raio', 'torre'];
export const MAX_CAREER_ROSTER = 32;
export const careerRosterLimit = career => Math.max(MAX_CAREER_ROSTER, (careerSeasonTeam(career.clubId)?.jogadores.length ?? 0) + 3);
const CAREER_VERSION = 2;
const STARTING_BUDGET = 1_383;
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
  return leagueFixtures(CAREER_TEAM, career.opponentIds, career.seed + career.season);
}

function leagueFixtures(firstTeam, opponents, seed) {
  const teams = [firstTeam, ...shuffled(opponents, mulberry32(seed))];
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
  if (id === CAREER_TEAM) return {...(careerSeasonTeam(career.clubId) ?? {nome: career.name, crest: career.crest}), jogadores: career.roster};
  const club = careerSeasonTeam(id) ?? opponents.get(id);
  if (!club || !careerSeasonTeam(id)) return club;
  const deals = new Map((career.transferDeals ?? []).map(deal => [deal.player.id, deal]));
  const owned = new Set(career.roster.map(player => player.id));
  const jogadores = club.jogadores.filter(player => !deals.has(player.id));
  for (const deal of deals.values()) if (deal.clubId === id && !owned.has(deal.player.id)) jogadores.push(deal.player);
  return {...club, jogadores};
}

export const careerCompetitionName = career => careerLeague(career.leagueId)?.name ?? 'Campeonato Brasileiro';

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
  if (Object.keys(assigned).length !== slots.length) return null;
  return Object.fromEntries(Object.entries(assigned).map(([slot, candidate]) => [slot, candidate.id]));
}

function startingLineup(roster) {
  for (const formation of Object.keys(FORMATIONS)) {
    const lineup = bestLineup(roster, formation);
    if (lineup) return {formation, lineup};
  }
  throw Error('O elenco não tem onze jogadores compatíveis.');
}

export function createCareer(seed, clubId) {
  if (clubId) {
    const club = careerSeasonTeam(clubId);
    if (!club) throw Error('Escolha um clube válido.');
    const league = careerLeague(club.leagueId);
    const roster = [...club.jogadores];
    return migrateCareerChampions({
      version: CAREER_VERSION, seed, clubId, leagueId: league.id, name: club.nome,
      season: 1, round: 0, currency: 'EUR', budget: STARTING_BUDGET,
      roster, opponentIds: league.teams.filter(team => team.id !== clubId).map(team => team.id),
      ...startingLineup(roster), results: [], seasons: [],
    });
  }
  const roster = [...startingRoster];
  const opponentIds = [...clubs.values()].slice(0, 15).map(squad => squad.id);
  if (opponentIds.length % 2 === 0) opponentIds.pop();
  return {
    version: CAREER_VERSION, seed, name: 'Meu time', crest: CAREER_CRESTS[0],
    season: 1, round: 0, currency: 'EUR', budget: STARTING_BUDGET,
    roster, opponentIds, formation: '4-3-3', lineup: bestLineup(roster, '4-3-3'), results: [], seasons: [],
  };
}

export function migrateCareerCurrency(career) {
  if (career.currency === 'EUR') return career;
  const fromReais = amount => Math.round(amount / MARKET_EUR_TO_BRL);
  const convertResults = round => round.map(match => match.income === undefined
    ? match : {...match, income: fromReais(match.income)});
  const {replay} = career;
  return {
    ...career,
    currency: 'EUR',
    budget: fromReais(career.budget),
    results: career.results.map(convertResults),
    seasons: career.seasons.map(season => ({...season, prize: fromReais(season.prize)})),
    replay: replay ? {...replay, income: fromReais(replay.income), results: convertResults(replay.results)} : replay,
  };
}

function updateEstimatedBrazilRatings(career) {
  let changed = false;
  const roster = career.roster.map(player => {
    if (player.ratingKind !== 'career-estimate') return player;
    const offer = careerPlayerValuation(player);
    if (offer?.league.id !== 'brasileirao' || offer.player.ratingKind !== 'career-estimate' || offer.player.ovr === player.ovr) return player;
    changed = true;
    return {...player, ovr: offer.player.ovr};
  });
  return changed ? {...career, roster} : career;
}

export function migrateCareerRoster(career) {
  if (Object.hasOwn(career, 'facilities')) {
    career = {...career};
    delete career.facilities;
  }
  if (career.version >= CAREER_VERSION) return updateEstimatedBrazilRatings(career);
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
  return updateEstimatedBrazilRatings({...career, version: CAREER_VERSION, roster, lineup});
}

export function careerPicks(career) {
  return FORMATIONS[career.formation].slots.map(slot => ({
    slot, player: career.roster.find(p => p.id === career.lineup[slot.id]),
  }));
}

export function changeCareerFormation(career, formation) {
  if (!Object.hasOwn(FORMATIONS, formation)) throw Error('Escolha uma formação válida.');
  const lineup = bestLineup(career.roster, formation);
  if (!lineup) throw Error('O elenco não tem jogadores compatíveis com todas as vagas dessa formação.');
  return {...career, formation, lineup};
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
  if (career.roster.length >= careerRosterLimit(career)) throw Error('O elenco está cheio. Conclua uma venda em Negociações para abrir vaga.');
  if (offer.price === null) throw Error('Jogador sem valor de mercado confirmado.');
  if (career.budget < offer.price) throw Error('Saldo insuficiente para a contratação.');
  const player = careerPlayerValuation(offer.player)?.id === offer.id
    ? offer.player : {...offer.player, marketOfferId: offer.id};
  return {...career, budget: career.budget - offer.price, roster: [...career.roster, player]};
}

export function careerReserveReplacements(career, slotId) {
  const slot = FORMATIONS[career.formation].slots.find(candidate => candidate.id === slotId);
  if (!slot) return [];
  const starters = new Set(Object.values(career.lineup));
  return career.roster.filter(player => !starters.has(player.id) && positionFit(player, slot) !== null)
    .sort((a, b) => positionFit(a, slot) - positionFit(b, slot) || b.ovr - a.ovr);
}

export function careerSale(career, id) {
  const player = career.roster.find(candidate => candidate.id === id);
  if (!player) throw Error('Jogador não encontrado no elenco.');
  const valuation = careerPlayerValuation(player);
  if (!valuation?.euros) throw Error('Jogador sem valor de mercado confirmado no Transfermarkt.');
  const price = Math.round(valuation.euros / 1_000);

  const roster = career.roster.filter(candidate => candidate.id !== id);
  const slot = FORMATIONS[career.formation].slots.find(slot => career.lineup[slot.id] === id);
  let lineup = career.lineup;
  if (slot) {
    const [replacement] = careerReserveReplacements(career, slot.id);
    lineup = replacement ? {...lineup, [slot.id]: replacement.id} : bestLineup(roster, career.formation);
    if (!lineup) throw Error('A venda deixaria o time sem onze titulares compatíveis com a formação atual.');
  }
  return {player, valuation, price, roster, lineup, changesLineup: Boolean(slot)};
}

export function sellCareerPlayer(career, id) {
  const {price, roster, lineup} = careerSale(career, id);
  return {...career, budget: career.budget + price, roster, lineup};
}

const transferClock = career => career.season * 10000 + career.round +
  (career.champions?.tournament?.matches ?? []).filter(match => match.result && [match.homeId, match.awayId].includes(CAREER_TEAM)).length;

export function listCareerPlayer(career, id) {
  if ((career.transferListings ?? []).some(entry => entry.playerId === id)) throw Error('Jogador já está à venda.');
  const {price} = careerSale(career, id);
  return {...career, transferListings: [...(career.transferListings ?? []),
    {playerId: id, price, due: transferClock(career) + 1 + hashSeed(id) % 3, wave: 0}]};
}

export function cancelCareerListing(career, id) {
  return {...career, transferListings: (career.transferListings ?? []).filter(entry => entry.playerId !== id),
    transferOffers: (career.transferOffers ?? []).filter(offer => offer.playerId !== id)};
}

export function updateCareerTransferOffers(career) {
  const now = transferClock(career), offers = [...(career.transferOffers ?? [])];
  let changed = false;
  const listings = (career.transferListings ?? []).filter(entry => career.roster.some(player => player.id === entry.playerId)).map(entry => {
    if (now < entry.due || offers.some(offer => offer.playerId === entry.playerId)) return entry;
    const player = career.roster.find(player => player.id === entry.playerId);
    const candidates = CAREER_LEAGUES.flatMap(league => league.teams)
      .filter(club => club.id !== career.clubId && !careerClub(career, club.id).jogadores.some(candidate => candidate.id === player.id)
        && Math.max(...club.jogadores.map(candidate => candidate.ovr)) >= player.ovr - 7)
      .sort((a, b) => hashSeed(`${career.seed}:${entry.playerId}:${entry.wave}:${a.id}`) - hashSeed(`${career.seed}:${entry.playerId}:${entry.wave}:${b.id}`));
    for (const club of candidates.slice(0, 2)) {
      const id = `${career.season}:${entry.playerId}:${entry.wave}:${club.id}`;
      const factor = .9 + (hashSeed(id) % 26) / 100;
      offers.push({id, playerId: player.id, clubId: club.id, price: Math.max(1, Math.round(entry.price * factor)), season: career.season});
    }
    changed = true;
    return {...entry, wave: entry.wave + 1, due: now + 3};
  });
  return changed || listings.length !== (career.transferListings ?? []).length
    ? {...career, transferListings: listings, transferOffers: offers} : career;
}

export function rejectCareerOffer(career, id) {
  if (!(career.transferOffers ?? []).some(offer => offer.id === id)) throw Error('Proposta não encontrada.');
  return {...career, transferOffers: career.transferOffers.filter(offer => offer.id !== id),
    transferListings: (career.transferListings ?? []).map(entry => ({...entry, due: Math.max(entry.due, transferClock(career) + 2)}))};
}

export function acceptCareerOffer(career, id) {
  if (career.replay?.round === career.round && career.replay?.season === career.season || career.champions?.replay)
    throw Error('Conclua a partida em andamento antes de negociar.');
  const offer = (career.transferOffers ?? []).find(candidate => candidate.id === id);
  if (!offer || !(career.transferListings ?? []).some(entry => entry.playerId === offer.playerId)) throw Error('Proposta indisponível.');
  const {player, roster, lineup} = careerSale(career, offer.playerId);
  const next = cancelCareerListing(career, player.id);
  return {...next, roster, lineup, budget: career.budget + offer.price,
    transferDeals: [...(career.transferDeals ?? []), {...offer, player}]};
}

export function releaseCareerPlayer(career, id) {
  if (Object.values(career.lineup).includes(id)) throw Error('Passe o jogador para a reserva antes de liberar.');
  if (!career.roster.some(p => p.id === id)) throw Error('Jogador não encontrado.');
  return {...career, roster: career.roster.filter(p => p.id !== id)};
}

export function renameCareerClub(career, name, crest) {
  if (career.clubId) throw Error('Esta campanha usa a identidade oficial do clube.');
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean || clean.length > 32 || !CAREER_CRESTS.includes(crest)) throw Error('Escolha um escudo e informe um nome de até 32 caracteres.');
  return {...career, name: clean, crest};
}

export function careerTable(career) {
  return leagueTable(career, [CAREER_TEAM, ...career.opponentIds], career.results);
}

function leagueTable(career, teamIds, results) {
  const rows = new Map(teamIds.map(id => [id, {
    id, played: 0, points: 0, wins: 0, goalsFor: 0, goalsAgainst: 0,
  }]));
  for (const round of results) for (const match of round) {
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

export function careerTopScorers(career) {
  const goals = [];
  const identities = new Map();
  let incomplete = false;
  for (const round of career.results) for (const match of round) {
    for (const side of ['home', 'away']) {
      const clubId = match[side];
      const scorers = (match.scorers ?? []).filter(scorer => scorer.team === side);
      if (scorers.reduce((total, scorer) => total + scorer.goals, 0) < match[`${side}Goals`]) incomplete = true;
      for (const scorer of scorers) {
        const legacyKey = JSON.stringify([clubId, scorer.name]);
        goals.push({...scorer, clubId, legacyKey});
        if (!scorer.playerId) continue;
        if (!identities.has(legacyKey)) identities.set(legacyKey, new Set());
        identities.get(legacyKey).add(scorer.playerId);
      }
    }
  }

  const players = new Map();
  for (const {playerId, name, goals: count, clubId, legacyKey} of goals) {
    const knownIds = identities.get(legacyKey);
    const id = playerId || (knownIds?.size === 1 ? knownIds.values().next().value : null);
    const key = JSON.stringify([clubId, id, id ? null : name]);
    if (!players.has(key)) players.set(key, {name, goals: 0, clubId, playerId: id});
    const player = players.get(key);
    player.goals += count;
  }
  return {
    players: [...players.values()].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, 'pt-BR')),
    incomplete,
  };
}

// Season awards combine committed domestic and European games, never a pending replay.
export function careerSeasonScorers(career) {
  const european = (career.champions?.tournament?.matches ?? [])
    .filter(match => match.result)
    .map(({homeId, awayId, result}) => ({
      home: homeId, away: awayId, homeGoals: result.homeGoals, awayGoals: result.awayGoals,
      scorers: result.scorers,
    }));
  const results = [...career.results, european].map(round => round
    .filter(match => match.home === CAREER_TEAM || match.away === CAREER_TEAM)
    .map(match => {
      const side = match.home === CAREER_TEAM ? 'home' : 'away';
      return {home: CAREER_TEAM, away: null, homeGoals: match[`${side}Goals`], awayGoals: 0,
        scorers: (match.scorers ?? []).filter(scorer => scorer.team === side)
          .map(scorer => ({...scorer, team: 'home'}))};
    }));
  const ranking = careerTopScorers({...career, results});
  return {...ranking, players: ranking.players.filter(player => player.clubId === CAREER_TEAM)};
}

export function careerClubStats(career) {
  const european = (career.champions?.tournament?.matches ?? []).filter(match => match.result)
    .map(({homeId, awayId, result}) => ({home: homeId, away: awayId, ...result}));
  const matches = [...career.results.flat(), ...european]
    .filter(match => match.home === CAREER_TEAM || match.away === CAREER_TEAM);
  const goals = matches.reduce((sum, match) => sum + (match.home === CAREER_TEAM ? match.homeGoals : match.awayGoals), 0);
  const titles = [];
  for (const season of career.seasons) {
    if (season.position === 1) titles.push({season: season.number, competition: 'league'});
    if (season.championsWinner === CAREER_TEAM) titles.push({season: season.number, competition: 'champions'});
  }
  if (!career.seasons.some(season => season.number === career.season)) {
    if (career.round >= careerFixtures(career).length && careerTable(career)[0]?.id === CAREER_TEAM)
      titles.push({season: career.season, competition: 'league'});
    if (career.champions?.tournament?.complete && career.champions.tournament.championId === CAREER_TEAM)
      titles.push({season: career.season, competition: 'champions'});
  }
  return {played: matches.length, goals, titles};
}

function matchTeam(career, id) {
  if (id !== CAREER_TEAM) {
    const cacheKey = `${id}:${career.roster.map(player => player.id).join(',')}:${(career.transferDeals ?? []).map(deal => deal.id).join(',')}`;
    if (!opponentTeams.has(cacheKey)) {
      const club = careerSeasonTeam(id) ? careerClub(career, id) : null;
      if (club) {
        const {formation, lineup: assignments} = startingLineup(club.jogadores);
        const lineup = FORMATIONS[formation].slots.map(slot => ({
          slot, player: club.jogadores.find(player => player.id === assignments[slot.id]), clubId: id, ano: club.ano,
        }));
        const starters = new Set(Object.values(assignments));
        const reserves = club.jogadores.filter(player => !starters.has(player.id)).map(player => ({player, clubId: id, ano: club.ano}));
        opponentTeams.set(cacheKey, {id, name: club.nome, clubId: id, lineup, reserves, strength: calculateTeam(lineup), formation});
      } else opponentTeams.set(cacheKey, squadTeam(opponents.get(id)));
    }
    return opponentTeams.get(cacheKey);
  }
  const entryFor = player => ({player, clubId: CAREER_TEAM, ano: career.season});
  const lineup = careerPicks(career).map(pick => {
    if (!pick.player || positionFit(pick.player, pick.slot) === null) throw Error('Complete a escalação antes de jogar.');
    return {...pick, ...entryFor(pick.player)};
  });
  const starters = new Set(Object.values(career.lineup));
  const reserves = career.roster.filter(player => !starters.has(player.id)).map(entryFor);
  const style = CAREER_STYLES[careerStyle(career)].profile;
  // Explicit null clears old Champions bonuses and survives JSON save/restore.
  return {id, name: career.name, crest: career.crest, isUser: true, lineup, reserves, strength: calculateTeam(lineup), formation: career.formation, tacticalProfile: style ?? null};
}

export function careerScorers(match) {
  const scorers = new Map();
  for (const goal of goalsAt(match, match.duration)) {
    const key = `${goal.team}:${goal.player.id}`;
    if (!scorers.has(key)) scorers.set(key, {playerId: goal.player.id, name: goal.player.nome, team: goal.team, goals: 0, minutes: []});
    const scorer = scorers.get(key);
    scorer.goals++;
    scorer.minutes.push(formatMatchEventMinute(match, goal.minute) + '′');
  }
  return [...scorers.values()];
}

function simulateCareerLeagueMatch(home, away, seed) {
  return simulateMatch(home, away, mulberry32(seed), {neutral: false, stoppageTimeAllowed: true});
}

// Career budgets and receipts are in thousands of euros.
const matchBaseIncome = {league: 5_200, group: 7_500, round16: 12_000, quarter: 12_000, semi: 12_000, final: 85_000};

function careerMatchIncome(isHome, result, stage = 'league') {
  const base = matchBaseIncome[stage];
  if (stage === 'final') return base;
  return base + (isHome ? 42 : 16)
    + (result.winnerId === CAREER_TEAM ? 26 : result.homeGoals === result.awayGoals ? 13 : 0);
}

function previousLeagueMatch(results, id) {
  return results?.find(match => [match.home, match.away].includes(id));
}

export function prepareCareerRound(career) {
  const fixtures = careerFixtures(career)[career.round];
  if (!fixtures) throw Error('A temporada já terminou.');
  const seed = career.seed + career.season * 1009 + career.round * 71;
  const id = `${career.season}:${career.round}`;
  let replay;
  let income = 0;
  const lastRound = career.results.at(-1) ?? career.leagueCarryover;
  const oldReplay = career.replay?.round === career.round - 1 && career.replay.season === career.season
    ? career.replay.tournament.userMatches[0] : null;
  const round = fixtures.map(([home, away], index) => {
    const teams = [home, away].map(id => teamForNextMatch(matchTeam(career, id),
      id === CAREER_TEAM && oldReplay ? oldReplay : previousLeagueMatch(lastRound, id)));
    const userMatch = home === CAREER_TEAM || away === CAREER_TEAM;
    // A change to one team's lineup or tactics must not reroll the other fixtures.
    const match = simulateCareerLeagueMatch(...teams, seed + index * 0x9e3779b9);
    const scorers = userMatch ? careerScorers(match)
      : match.scorers.map(({playerId, name, team, goals}) => ({playerId, name, team, goals}));
    const expulsions = matchExpulsions(match);
    const result = {home, away, homeGoals: match.homeGoals, awayGoals: match.awayGoals, scorers, ...(expulsions && {expulsions})};
    if (userMatch) {
      income = careerMatchIncome(home === CAREER_TEAM, match);
      result.income = income;
      replay = {
        seed, mode: 'career', teams, userTeamId: CAREER_TEAM,
        userMatches: [{
          id, homeId: home, awayId: away, round: career.round + 1, stage: 'league',
          stageLabel: `${careerCompetitionName(career)} · Rodada ${career.round + 1}`, result: match,
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
  const expulsions = matchExpulsions(match.result);
  const results = replay.results.map(result =>
    result.home === match.homeId && result.away === match.awayId
      ? {...result, homeGoals: match.result.homeGoals, awayGoals: match.result.awayGoals, scorers: careerScorers(match.result), ...(expulsions && {expulsions})}
      : result
  );
  return {
    ...career, round: career.round + 1, results: [...career.results, results],
    budget: career.budget + replay.income,
  };
}

function simulatedLeagueQualifiers(career, league) {
  const ids = league.teams.map(team => team.id);
  const seed = hashSeed(`${career.seed}:${career.season}:${league.id}`);
  const fixtures = leagueFixtures(ids[0], ids.slice(1), seed);
  const results = [];
  for (const [round, games] of fixtures.entries()) {
    const lastRound = results.at(-1);
    results.push(games.map(([home, away], index) => {
      const teams = [home, away].map(id => teamForNextMatch(matchTeam(career, id), previousLeagueMatch(lastRound, id)));
      const match = simulateCareerLeagueMatch(...teams, seed + round * 71 + index * 0x9e3779b9);
      return {home, away, homeGoals: match.homeGoals, awayGoals: match.awayGoals, expulsions: matchExpulsions(match)};
    }));
  }
  return leagueTable(career, ids, results).slice(0, CHAMPIONS_PLACES).map(row => row.id);
}

function compactChampionsTournament(tournament, replayMatch) {
  // The current replay keeps its event log. Completed games need only their scores and scorers.
  const matches = tournament.matches.map(stored => {
    const match = stored.id === replayMatch?.id ? replayMatch : stored;
    if (!match.result) return match;
    const {suspensions, ...fixture} = match;
    const {homeGoals, awayGoals, winnerId, penalties, scorers} = match.result;
    const expulsions = matchExpulsions(match.result);
    return {...fixture, result: {homeGoals, awayGoals, winnerId, ...(penalties && {penalties}), scorers, ...(expulsions && {expulsions})}};
  });
  const byId = new Map(matches.map(match => [match.id, match]));
  return {...tournament, matches, userMatches: tournament.userMatches.map(match => byId.get(match.id)),
    bracket: tournament.bracket.map(stage => ({...stage, matches: stage.matches.map(match => byId.get(match.id))}))};
}

function createChampionsEdition(career, field, seed) {
  const rng = mulberry32(seed);
  const qualifiers = field.map(ids => shuffled(ids.map(id => id === career.clubId ? CAREER_TEAM : id), rng));
  const groups = qualifiers[0].map((_, index) => shuffled(qualifiers.map(ids => ids[index]), rng));
  const teams = groups.flat().map(id => {
    const team = matchTeam(career, id);
    return {...team, monograma: team.name.replaceAll(' ', '').slice(0, 3).toUpperCase()};
  });
  const tournament = createCareerChampionsTournament(teams, groups, CAREER_TEAM, seed);
  return {tournament: teams.some(team => team.id === CAREER_TEAM) ? tournament
    : compactChampionsTournament(simulateTournament(tournament)), replay: null};
}

export function migrateCareerChampions(career) {
  if (career.champions) {
    const {tournament, replay} = career.champions;
    if (replay && replay.match.stage !== 'group') return career;
    const upgraded = upgradeCareerChampionsBracket(tournament);
    if (upgraded === tournament) return career;
    // Results simulated past an unfinished group replay have never been shown.
    const pendingGroups = replay?.pending.complete ? {...replay.pending, complete: false, championId: null,
      progressRound: replay.match.round, matches: replay.pending.matches.filter(match => match.stage === 'group')} : replay?.pending;
    const pending = upgradeCareerChampionsBracket(pendingGroups);
    return {...career, champions: {tournament: upgraded, replay: replay ? {...replay, pending} : null}};
  }
  if (career.season !== 1 || !startsInChampions(career.clubId)) return career;
  const seed = hashSeed(`${career.seed}:2026-27:champions`);
  return {...career, champions: createChampionsEdition(career, FIRST_CHAMPIONS_FIELD, seed)};
}

function nextCareerChampions(career, domesticTable) {
  const field = championsLeagues.map(league => league.id === career.leagueId
    ? domesticTable.slice(0, CHAMPIONS_PLACES).map(row => row.id) : simulatedLeagueQualifiers(career, league));
  return createChampionsEdition(career, field, hashSeed(`${career.seed}:${career.season}:champions`));
}

export function careerChampionsFixture(career) {
  const tournament = career.champions?.tournament;
  return tournament?.matches.find(match => !match.result && match.round === tournament.progressRound + 1
    && [match.homeId, match.awayId].includes(CAREER_TEAM));
}

const championsMatchdays = [4, 8, 12, 14, 16, 19, 21, 24, 26, 30];

export function careerNextCompetition(career) {
  const league = nextCareerMatch(career);
  if (league && career.replay?.round === career.round && career.replay.season === career.season) return 'league';
  const champions = careerChampionsFixture(career);
  if (champions && (career.champions.replay?.id === champions.id ||
    !league || career.round >= championsMatchdays[champions.round - 1])) return 'champions';
  return league ? 'league' : null;
}

export function prepareCareerChampionsMatch(career) {
  const fixture = careerChampionsFixture(career);
  if (!fixture) throw Error('Não há partida da Champions League disponível.');
  const {tournament} = career.champions;
  const teams = tournament.teams.map(team => {
    if (team.id === CAREER_TEAM) return {...team, ...matchTeam(career, team.id)};
    return {...team, ...matchTeam(career, team.id)};
  });
  const next = playNextRound({...tournament, teams});
  const match = next.userMatches.at(-1);
  const pending = compactChampionsTournament(next.campaign.eliminated && !next.complete ? simulateTournament(next) : next);
  return {id: fixture.id, season: career.season, match, pending, minute: 0, penaltyReplay: null};
}

export function commitCareerChampionsMatch(career) {
  const champions = career.champions;
  const replay = champions?.replay;
  if (!replay || replay.season !== career.season || replay.id !== careerChampionsFixture(career)?.id
    || !matchHasEnded({tournament: replay.pending, matchMinute: replay.minute, penaltyReplay: replay.penaltyReplay}, replay.match)) return career;
  const income = careerMatchIncome(!replay.match.neutral && replay.match.homeId === CAREER_TEAM, replay.match.result, replay.match.stage);
  const {pending, match} = replay;
  const recorded = pending.matches.find(fixture => fixture.id === match.id)?.result;
  const tournament = matchExpulsions(match.result) && !recorded?.expulsions
    ? compactChampionsTournament(pending, match) : pending;
  return {...career, budget: career.budget + income, champions: {tournament, replay: null}};
}

const relegationStarts = {bundesliga: 17, premier: 18, laliga: 18, brasileirao: 17, seriea: 18};

export function careerRelegation(career) {
  const firstRelegation = relegationStarts[career.leagueId] ?? relegationStarts.brasileirao;
  return {firstRelegation, playoffPosition: career.leagueId === 'bundesliga' ? firstRelegation - 1 : null};
}

export function advanceCareerSeason(career) {
  if (career.round < careerFixtures(career).length) throw Error('Termine a temporada antes de avançar.');
  const champions = career.champions?.tournament;
  if (champions && !champions.complete) throw Error('Conclua a Champions League antes de iniciar a próxima temporada.');
  const table = careerTable(career);
  const position = table.findIndex(row => row.id === CAREER_TEAM) + 1;
  const prize = 407 + (table.length - position) * 33;
  const {firstRelegation} = careerRelegation(career);
  const relegated = table.slice(firstRelegation - 1).map(row => row.id);
  const season = {number: career.season, position, points: table[position - 1].points, prize, relegated};
  if (champions?.championId) season.championsWinner = champions.championId;
  const next = {...career, season: career.season + 1, round: 0, results: [], replay: null, budget: career.budget + prize, seasons: [...career.seasons, season]};
  const carryover = career.results.at(-1)?.filter(match => match.expulsions)
    .map(({home, away, expulsions}) => ({home, away, expulsions}));
  if (carryover?.length) next.leagueCarryover = carryover;
  else delete next.leagueCarryover;
  if (careerHasChampions(career)) next.champions = nextCareerChampions(career, table);
  return next;
}
