/**
 * ScoreFut: pure, seeded eleven-player match and tournament simulation.
 * Ratings are editorial estimates, not a prediction about real football.
 * OVR and attributes drive the bounded Poisson equation, with modest player assistance.
 */

import {assignSetPieceGoals} from './match-goal-origins.js?v=set-piece-goals-20261030';
import { squadsForMode } from '../data/competitions.js?v=leverkusen-20261029';
import {worldCupGroupOrder,worldCupRound16Pairings} from './world-cup.js?v=world-cup-20261026';

export const POSITION_MAP = Object.freeze({
  GOL: 'GOL', ZAG: 'DEF', LD: 'DEF', LE: 'DEF', DEF: 'DEF',
  VOL: 'MEI', MC: 'MEI', MEI: 'MEI', MD: 'MEI', ME: 'MEI',
  PE: 'ATA', PD: 'ATA', SA: 'ATA', CA: 'ATA', ATA: 'ATA',
});

export const TEAM_SIZE = 11;
const ROLE_ALIASES = Object.freeze({ GK: 'GOL', CB: 'ZAG', RB: 'LD', LB: 'LE', DM: 'VOL', CDM: 'VOL', CM: 'MC', AM: 'MEI', CAM: 'MEI', RM: 'MD', LM: 'ME', LW: 'PE', RW: 'PD', SS: 'SA', ST: 'CA' });
const normalizeRole = role => ROLE_ALIASES[String(role).toUpperCase()] || String(role).toUpperCase();

/** Exact pitch roles; secondary tags add destinations without inventing roles. */
export const ROLE_COMPATIBILITY = Object.freeze({
  GOL: Object.freeze({ GOL: 0 }),
  ZAG: Object.freeze({ ZAG: 0 }),
  LD: Object.freeze({ LD: 0, LE: 1, MD: 1 }),
  LE: Object.freeze({ LE: 0, LD: 1, ME: 1 }),
  VOL: Object.freeze({ VOL: 0, MC: 1, ZAG: 1 }),
  MC: Object.freeze({ MC: 0, VOL: 1, MEI: 1, MD: 1, ME: 1 }),
  MEI: Object.freeze({ MEI: 0, MC: 1, MD: 1, ME: 1, SA: 1, PE: 1, PD: 1 }),
  MD: Object.freeze({ MD: 0, ME: 1, MC: 1, PD: 1 }),
  ME: Object.freeze({ ME: 0, MD: 1, MC: 1, PE: 1 }),
  PE: Object.freeze({ PE: 0, PD: 1, ME: 1, SA: 1 }),
  PD: Object.freeze({ PD: 0, PE: 1, MD: 1, SA: 1 }),
  SA: Object.freeze({ SA: 0, CA: 1, MEI: 1, PE: 1, PD: 1 }),
  CA: Object.freeze({ CA: 0 }),
});

/**
 * Natural (0) or similar (1) destinations; these values only rank placement, by the player's tags.
 * This is intentionally narrower than an automatic DEF–MEI–ATA chain: a
 * centre-back is not a midfielder, and a pure centre-forward is not a defender
 * or a midfielder. Secondary tags grant their own natural/similar positions.
 */
export const POSITION_COMPATIBILITY = Object.freeze({
  GOL: Object.freeze({ GOL: 0 }),
  ZAG: Object.freeze({ DEF: 0 }),
  LD: Object.freeze({ DEF: 0, MEI: 1 }),
  LE: Object.freeze({ DEF: 0, MEI: 1 }),
  VOL: Object.freeze({ MEI: 0, DEF: 1 }),
  MC: Object.freeze({ MEI: 0 }),
  MEI: Object.freeze({ MEI: 0, ATA: 1 }),
  MD: Object.freeze({ MEI: 0, ATA: 1 }),
  ME: Object.freeze({ MEI: 0, ATA: 1 }),
  PE: Object.freeze({ ATA: 0, MEI: 1 }),
  PD: Object.freeze({ ATA: 0, MEI: 1 }),
  SA: Object.freeze({ ATA: 0, MEI: 1 }),
  CA: Object.freeze({ ATA: 0 }),
  DEF: Object.freeze({ DEF: 0 }),
  ATA: Object.freeze({ ATA: 0 }),
});

const slot = (id, label, x, y) => ({ id, label, position: POSITION_MAP[label], x, y });
export const FORMATIONS = Object.freeze({
  '4-3-3': { name: '4–3–3', description: 'Amplitude e ataque', slots: [slot('gol', 'GOL', 50, 92), slot('ld', 'LD', 85, 72), slot('zag-1', 'ZAG', 37, 77), slot('zag-2', 'ZAG', 63, 77), slot('le', 'LE', 15, 72), slot('vol', 'VOL', 50, 59), slot('mc-1', 'MC', 31, 43), slot('mc-2', 'MC', 69, 43), slot('pe', 'PE', 16, 24), slot('pd', 'PD', 84, 24), slot('ca', 'CA', 50, 16)] },
  '4-4-2': { name: '4–4–2', description: 'Equilíbrio em duas linhas', slots: [slot('gol', 'GOL', 50, 92), slot('ld', 'LD', 85, 74), slot('zag-1', 'ZAG', 37, 78), slot('zag-2', 'ZAG', 63, 78), slot('le', 'LE', 15, 74), slot('md', 'MD', 85, 46), slot('mc-1', 'MC', 37, 54), slot('mc-2', 'MC', 63, 54), slot('me', 'ME', 15, 46), slot('ca-1', 'CA', 36, 20), slot('ca-2', 'CA', 64, 20)] },
  '4-2-3-1': { name: '4–2–3–1', description: 'Dois volantes e um meia central', slots: [slot('gol', 'GOL', 50, 92), slot('ld', 'LD', 85, 74), slot('zag-1', 'ZAG', 37, 78), slot('zag-2', 'ZAG', 63, 78), slot('le', 'LE', 15, 74), slot('vol-1', 'VOL', 34, 59), slot('vol-2', 'VOL', 66, 59), slot('me', 'ME', 18, 35), slot('mei', 'MEI', 50, 36), slot('md', 'MD', 82, 35), slot('ca', 'CA', 50, 16)] },
  '4-2-4': { name: '4–2–4', description: 'Pontas abertos e dois atacantes', slots: [slot('gol', 'GOL', 50, 92), slot('ld', 'LD', 85, 72), slot('zag-1', 'ZAG', 37, 77), slot('zag-2', 'ZAG', 63, 77), slot('le', 'LE', 15, 72), slot('mc-1', 'MC', 34, 51), slot('mc-2', 'MC', 66, 51), slot('pe', 'PE', 14, 28), slot('pd', 'PD', 86, 28), slot('ca-1', 'CA', 36, 16), slot('ca-2', 'CA', 64, 16)] },
  '3-5-2': { name: '3–5–2', description: 'Controle do meio-campo', slots: [slot('gol', 'GOL', 50, 92), slot('zag-1', 'ZAG', 25, 77), slot('zag-2', 'ZAG', 50, 76), slot('zag-3', 'ZAG', 75, 77), slot('md', 'MD', 88, 50), slot('vol', 'VOL', 50, 60), slot('mc-1', 'MC', 33, 40), slot('mc-2', 'MC', 67, 40), slot('me', 'ME', 12, 50), slot('ca-1', 'CA', 37, 19), slot('ca-2', 'CA', 63, 19)] },
  '5-3-2': { name: '5–3–2', description: 'Três zagueiros e dois laterais', slots: [slot('gol', 'GOL', 50, 92), slot('ld', 'LD', 88, 64), slot('zag-1', 'ZAG', 25, 78), slot('zag-2', 'ZAG', 50, 77), slot('zag-3', 'ZAG', 75, 78), slot('le', 'LE', 12, 64), slot('vol', 'VOL', 50, 57), slot('mc-1', 'MC', 30, 40), slot('mc-2', 'MC', 70, 40), slot('ca-1', 'CA', 37, 19), slot('ca-2', 'CA', 63, 19)] },
  '4-5-1': { name: '4–5–1', description: 'Cinco no meio e um centroavante', slots: [slot('gol', 'GOL', 50, 92), slot('ld', 'LD', 85, 74), slot('zag-1', 'ZAG', 37, 78), slot('zag-2', 'ZAG', 63, 78), slot('le', 'LE', 15, 74), slot('vol', 'VOL', 50, 62), slot('mc-1', 'MC', 35, 46), slot('mc-2', 'MC', 65, 46), slot('me', 'ME', 15, 42), slot('md', 'MD', 85, 42), slot('ca', 'CA', 50, 17)] },
  '3-4-3': { name: '3–4–3', description: 'Três zagueiros, alas e pontas', slots: [slot('gol', 'GOL', 50, 92), slot('zag-1', 'ZAG', 25, 78), slot('zag-2', 'ZAG', 50, 77), slot('zag-3', 'ZAG', 75, 78), slot('me', 'ME', 12, 49), slot('mc-1', 'MC', 37, 54), slot('mc-2', 'MC', 63, 54), slot('md', 'MD', 88, 49), slot('pe', 'PE', 16, 24), slot('pd', 'PD', 84, 24), slot('ca', 'CA', 50, 16)] },
});

export const SIMULATION_SETTINGS = Object.freeze({
  modelVersion: 5,
  baseXG: 1.3,
  xGExponent: 1.6,
  minXG: 0.2,
  maxXG: 4.5,
  userAttackMultiplier: 1.12,
  userDefenseMultiplier: 1.06,
  dominanceStartGap: 5,
  dominanceFullGap: 15,
  dominanceAttackMultiplier: 1.9,
  dominanceDefenseMultiplier: 1.7,
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rounded = value => Math.round(value * 10) / 10;
const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const attribute = (player, name) => Number(player.atributos?.[name] ?? player.ovr ?? 50);
const naturalPositions = player => [...new Set((player.tags || []).map(tag => POSITION_MAP[normalizeRole(tag)]).filter(Boolean))];

/** Stable 32-bit seed for a date, share code, or other string. */
export function hashSeed(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value >>> 0;
  const input = String(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Callable random generator with explicit state for resumable pure rounds. */
export function mulberry32(seed) {
  let state = hashSeed(seed);
  const rng = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  rng.getState = () => state;
  return rng;
}

/** Placement priority: 0 = natural, 1 = nearby, null = incompatible. No rating loss. */
export function positionFit(player, targetSlot) {
  const targetRole = normalizeRole(typeof targetSlot === 'string' ? targetSlot : targetSlot.label || '');
  const target = typeof targetSlot === 'object' ? targetSlot.position || POSITION_MAP[targetRole] : POSITION_MAP[targetRole];
  const positions = naturalPositions(player);
  if (!target || !positions.length) return null;
  if (positions.includes('GOL')) return target === 'GOL' ? 0 : null;
  if (target === 'GOL') return null;
  const exact = Object.hasOwn(ROLE_COMPATIBILITY, targetRole);
  const fits = (player.tags || []).map(tag => exact ? ROLE_COMPATIBILITY[normalizeRole(tag)]?.[targetRole] : POSITION_COMPATIBILITY[normalizeRole(tag)]?.[target]).filter(value => typeof value === 'number');
  return fits.length ? Math.min(...fits) : null;
}

/** OVR and player attributes determine strength equally for every team. */
export function calculateTeam(lineup = []) {
  const entries = lineup.filter(entry => entry?.player && entry?.slot).map(entry => {
    const fit = positionFit(entry.player, entry.slot);
    return { ...entry, factor: fit === null ? 0 : 1 };
  });
  const effective = (entry, name) => attribute(entry.player, name) * entry.factor;
  const field = entries.filter(entry => entry.slot.position !== 'GOL');
  const keeper = entries.find(entry => entry.slot.position === 'GOL');
  const fieldOVR = average(field.map(entry => entry.player.ovr * entry.factor));
  const goalkeeper = keeper ? (effective(keeper, 'reflexo') + effective(keeper, 'posicionamento')) / 2 : 0;
  const weightedField = (name, focus) => {
    const weights = field.map(entry => entry.slot.position === focus ? 1.4 : 1);
    const denominator = weights.reduce((sum, value) => sum + value, 0);
    return denominator ? field.reduce((sum, entry, index) => sum + effective(entry, name) * weights[index], 0) / denominator : 0;
  };
  // OVR supplies the shared baseline, attributes and assigned roles
  // supply the profile. This also supports unusual historical compositions.
  const attack = field.length ? 0.55 * fieldOVR + 0.30 * weightedField('ataque', 'ATA') + 0.15 * weightedField('finalizacao', 'ATA') : 0;
  const midfield = field.length ? 0.55 * fieldOVR + 0.45 * weightedField('meio', 'MEI') : 0;
  const fieldDefense = field.length ? 0.55 * fieldOVR + 0.45 * weightedField('defesa', 'DEF') : 0;
  const defense = entries.length ? (keeper ? field.length ? fieldDefense * 0.75 + goalkeeper * 0.25 : goalkeeper : fieldDefense) : 0;
  const overall = average(entries.map(entry => entry.player.ovr * entry.factor));
  const grade = value => rounded(clamp(value, 0, 99));
  return {
    overall: rounded(clamp(overall, 0, 99)),
    attack: grade(attack), midfield: grade(midfield), defense: grade(defense),
    goalkeeper: grade(goalkeeper), chemistry: 0,
    level: overall >= 90 ? 'Lendário' : overall >= 80 ? 'Profissional' : 'Amador',
  };
}

/** Match eleven distinct players to a valid formation with bounded bitmask DP. */
export function squadTeam(squad, requestedFormation = null) {
  if(requestedFormation&&!FORMATIONS[requestedFormation])throw new Error('Escolha uma formação disponível.');
  const candidates = squad.jogadores.filter((player, index, players) => players.findIndex(other => other.id === player.id) === index);
  const keepers = candidates.filter(player => naturalPositions(player).includes('GOL'));
  const field = candidates.filter(player => !naturalPositions(player).includes('GOL'));
  if (!keepers.length || field.length < TEAM_SIZE - 1) throw new Error(`O elenco ${squad.nome} ${squad.ano} precisa de um goleiro e dez jogadores de linha únicos.`);
  const goalkeeper = [...keepers].sort((a, b) => (b.ovr * 0.6 + attribute(b, 'reflexo') * 0.2 + attribute(b, 'posicionamento') * 0.2) - (a.ovr * 0.6 + attribute(a, 'reflexo') * 0.2 + attribute(a, 'posicionamento') * 0.2))[0];
  let best = null;
  // State = used-player mask. Prefer fewer similar-role assignments, then
  // higher quality. No factorial search, fake player, or duplication.
  const better = (candidate, previous) => !previous || candidate.similarRoles < previous.similarRoles || candidate.similarRoles === previous.similarRoles && candidate.quality > previous.quality;
  for (const [key, formation] of Object.entries(FORMATIONS)) {
    if(requestedFormation&&key!==requestedFormation)continue;
    const fieldSlots = formation.slots.filter(target => target.position !== 'GOL');
    let states = new Map([[0, { similarRoles: 0, quality: 0, picks: [] }]]);
    for (const target of fieldSlots) {
      const next = new Map();
      const attributeName = { DEF: 'defesa', MEI: 'meio', ATA: 'ataque' }[target.position];
      states.forEach((state, mask) => {
        field.forEach((player, candidateIndex) => {
          if (mask & (1 << candidateIndex)) return;
          const fit = positionFit(player, target);
          if (fit === null) return;
          const candidate = { similarRoles: state.similarRoles + Number(fit > 0), quality: state.quality + player.ovr * 0.9 + attribute(player, attributeName) * 0.1, picks: [...state.picks, { player, slot: target }] };
          const nextMask = mask | (1 << candidateIndex);
          if (better(candidate, next.get(nextMask))) next.set(nextMask, candidate);
        });
      });
      states = next;
      if (!states.size) break;
    }
    states.forEach(state => {
      if (state.picks.length === TEAM_SIZE - 1 && better(state, best)) best = { ...state, key };
    });
  }
  if (!best) throw new Error(`O elenco ${squad.nome} ${squad.ano} não possui uma escalação válida de 11 jogadores ${requestedFormation?'em '+requestedFormation:'nas formações disponíveis'}. Confira as posições reais e tags secundárias.`);
  const source = { squadId: squad.id, clubId: squad.clubId, clubName: squad.nome, ano: squad.ano };
  const lineup = [{ player: goalkeeper, slot: FORMATIONS[best.key].slots[0], ...source }, ...best.picks.map(pick => ({ ...pick, ...source }))];
  const strength = calculateTeam(lineup);
  return { id: squad.id, name: `${squad.nome} ${squad.ano}`, nome: squad.nome, clubId: squad.clubId, ano: squad.ano, cores: squad.cores, monograma: squad.monograma, lineup, strength, formation: best.key, isUser: false };
}

export function poisson(lambda, rng) {
  const threshold = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do { count += 1; product *= rng(); } while (product > threshold);
  return count - 1;
}

const choose = (items, rng) => items[Math.floor(rng() * items.length)];
const weightedPlayer = (team, rng) => {
  const lineup = team.lineup.filter(entry => entry.slot.position !== 'GOL');
  if (!lineup.length) return team.lineup[0]?.player || { id: team.id, nome: team.name };
  const weights = lineup.map(entry => Math.max(1, attribute(entry.player, 'finalizacao') - 25) * (entry.slot.position === 'ATA' ? 1.8 : entry.slot.position === 'MEI' ? 1 : 0.55));
  let draw = rng() * weights.reduce((sum, value) => sum + value, 0);
  const index = weights.findIndex(weight => (draw -= weight) <= 0);
  return lineup[index === -1 ? lineup.length - 1 : index].player;
};

export function expectedGoals(team, opponent, settings = SIMULATION_SETTINGS) {
  const metrics = team.strength || calculateTeam(team.lineup);
  const opposition = opponent.strength || calculateTeam(opponent.lineup);
  const attack = metrics.attack;
  const defense = opposition.defense;
  const assistance=team.isUser&&!opponent.isUser ? (settings.userAttackMultiplier??1)
    : opponent.isUser&&!team.isUser ? 1/(settings.userDefenseMultiplier??1) : 1;
  // Use the actual OVR difference, regardless of either side's absolute rating.
  // Close matchups (up to five points) retain the standard equation; the
  // additional edge grows continuously, reaching its cap at fifteen points.
  const dominance=(strong,weak)=>clamp(
    (strong.overall-weak.overall-(settings.dominanceStartGap??5))
      /Math.max(1,(settings.dominanceFullGap??15)-(settings.dominanceStartGap??5)),0,1);
  const mismatch=team.isUser&&!opponent.isUser
    ? 1+dominance(metrics,opposition)*((settings.dominanceAttackMultiplier??1)-1)
    : opponent.isUser&&!team.isUser
      ? 1/(1+dominance(opposition,metrics)*((settings.dominanceDefenseMultiplier??1)-1)) : 1;
  return clamp(settings.baseXG * (Math.max(1, attack) / Math.max(1, defense)) ** settings.xGExponent * assistance * mismatch, settings.minXG, settings.maxXG);
}

function shootout(home, away, rng) {
  const chance = (team, opponent) => {
    const finishing = average(team.lineup.filter(entry => entry.slot.position !== 'GOL').map(entry => attribute(entry.player, 'finalizacao')));
    const keeper = (opponent.strength || calculateTeam(opponent.lineup)).goalkeeper;
    return clamp(0.73 * (Math.max(finishing, 1) / Math.max(keeper, 1)) ** 0.25, 0.55, 0.88);
  };
  const homeChance = chance(home, away);
  const awayChance = chance(away, home);
  const score = [0, 0];
  const events = [];
  for (let kick = 0; kick < 10; kick += 1) {
    const side = kick % 2;
    const converted = rng() < (side === 0 ? homeChance : awayChance);
    if (converted) score[side] += 1;
    events.push({ minute: 120, type: 'penalty', team: side ? 'away' : 'home', player: weightedPlayer(side ? away : home, rng), x: 0.5, y: side ? 0.85 : 0.15, converted, shootout: true });
    const taken = [Math.ceil((kick + 1) / 2), Math.floor((kick + 1) / 2)];
    if (score[0] > score[1] + 5 - taken[1] || score[1] > score[0] + 5 - taken[0]) return { score, events };
  }
  // Sudden death: pairs are always completed before deciding the winner.
  let suddenDeathPairs = 0;
  while (score[0] === score[1] && suddenDeathPairs < 20) {
    suddenDeathPairs += 1;
    for (let side = 0; side < 2; side += 1) {
      const converted = rng() < (side === 0 ? homeChance : awayChance);
      if (converted) score[side] += 1;
      events.push({ minute: 120, type: 'penalty', team: side ? 'away' : 'home', player: weightedPlayer(side ? away : home, rng), x: 0.5, y: side ? 0.85 : 0.15, converted, shootout: true });
    }
  }
  if (score[0] === score[1]) {
    // Numerical guard for pathological/mock generators: sample a decisive
    // pair conditionally from the same shooting probabilities. Neither team
    // receives a predetermined win, and a constant test RNG cannot hang.
    const homeDecisive = homeChance * (1 - awayChance);
    const awayDecisive = awayChance * (1 - homeChance);
    const homeWins = rng() < homeDecisive / (homeDecisive + awayDecisive);
    score[homeWins ? 0 : 1] += 1;
    [home, away].forEach((team, side) => {
      events.push({ minute: 120, type: 'penalty', team: side ? 'away' : 'home', player: weightedPlayer(team, rng), x: 0.5, y: side ? 0.85 : 0.15, converted: side === (homeWins ? 0 : 1), shootout: true });
    });
  }
  return { score, events };
}

/** No RNG or team mutation. All events needed for the live replay are returned. */
export function simulateMatch(home, away, rng, { knockout = false, extraTimeAllowed = true, stoppageTimeAllowed = false, extraTimeTrigger = null, settings = SIMULATION_SETTINGS } = {}) {
  const xG = [expectedGoals(home, away, settings), expectedGoals(away, home, settings)];
  const regulationGoals = [poisson(xG[0], rng), poisson(xG[1], rng)];
  const extraGoals = [0, 0];
  const regulationDrawNeedsExtraTime = typeof extraTimeTrigger === 'function'
    ? extraTimeTrigger(regulationGoals)
    : knockout && regulationGoals[0] === regulationGoals[1];
  const extraTime = extraTimeAllowed && regulationDrawNeedsExtraTime;
  if (extraTime) {
    extraGoals[0] = poisson(xG[0] / 3, rng);
    extraGoals[1] = poisson(xG[1] / 3, rng);
  }
  const regulationStoppageTime = stoppageTimeAllowed ? 1 + Math.floor(rng() * 9) : 0;
  const extraTimeStoppageTime = extraTime && stoppageTimeAllowed ? 1 + Math.floor(rng() * 9) : 0;
  const regulationEnd = 90 + regulationStoppageTime;
  const extraTimeStart = extraTime ? regulationEnd : null;
  const extraTimeEnd = extraTime ? regulationEnd + 30 : null;
  const duration = extraTime ? extraTimeEnd + extraTimeStoppageTime : regulationEnd;
  const homeGoals = regulationGoals[0] + extraGoals[0];
  const awayGoals = regulationGoals[1] + extraGoals[1];
  const events = [];
  const point = (side, nearGoal = false) => ({ x: rounded(0.12 + rng() * 0.76), y: side === 'home' ? (nearGoal ? 0.09 + rng() * 0.32 : 0.15 + rng() * 0.62) : (nearGoal ? 0.59 + rng() * 0.32 : 0.23 + rng() * 0.62) });
  [home, away].forEach((team, index) => {
    const side = index ? 'away' : 'home';
    for (let goal = 0; goal < regulationGoals[index] + extraGoals[index]; goal += 1) {
      const minute = goal < regulationGoals[index]
        ? 1 + Math.floor(rng() * regulationEnd)
        : extraTimeStart + 1 + Math.floor(rng() * (30 + extraTimeStoppageTime));
      const player = weightedPlayer(team, rng);
      const coordinates = point(side, true);
      if (rng() < 0.12) events.push({ minute, type: 'penalty', team: side, player, ...coordinates, converted: true, shootout: false });
      events.push({ minute, type: 'goal', team: side, player, ...coordinates });
    }
    const incident = (type, count) => {
      const outfieldOnly = type === 'corner' || type === 'substitution';
      const eligible = outfieldOnly ? team.lineup.filter(entry => entry.slot.position !== 'GOL') : team.lineup;
      const pool = eligible.length ? eligible : team.lineup;
      for (let event = 0; event < count; event += 1) {
        // A different eligible pool preserves exactly one selection draw, so
        // event assignment fixes do not change seeded scores or calibration.
        const player = type === 'save' ? team.lineup.find(entry => entry.slot.position === 'GOL')?.player : choose(pool, rng)?.player;
        events.push({ minute: 1 + Math.floor(rng() * duration), type, team: side, player: player || weightedPlayer(team, rng), ...point(side) });
      }
    };
    incident('save', 2 + Math.floor(rng() * 4));
    incident('corner', 1 + Math.floor(rng() * 4));
    incident('yellow', Math.floor(rng() * 3));
    incident('red', rng() < 0.055 ? 1 : 0);
    incident('substitution', rng() < 0.72 ? 1 : 0);
  });
  let penalties = null;
  let winnerId = homeGoals > awayGoals ? home.id : awayGoals > homeGoals ? away.id : null;
  if (knockout && homeGoals === awayGoals) {
    const result = shootout(home, away, rng);
    penalties = result.score;
    events.push(...result.events.map(event => ({ ...event, minute: duration })));
    winnerId = penalties[0] > penalties[1] ? home.id : away.id;
  }
  assignSetPieceGoals(events,home,away,mulberry32(hashSeed(`${home.id}:${away.id}:${events.filter(e=>e.type==='goal').map(e=>e.minute+e.team).join('|')}:goal-origins-v1`)));
  events.sort((a, b) => a.minute - b.minute);
  const scorerMap = new Map();
  events.filter(event => event.type === 'goal').forEach(event => {
    const key = `${event.team}:${event.player.id}`;
    const existing = scorerMap.get(key) || { playerId: event.player.id, nome: event.player.nome, name: event.player.nome, team: event.team, goals: 0 };
    existing.goals += 1;
    scorerMap.set(key, existing);
  });
  return { homeGoals, awayGoals, winnerId, extraTime, penalties, regulationGoals,
    regulationStoppageTime, extraTimeStoppageTime, extraTimeStart, extraTimeEnd, duration,
    events, scorers: [...scorerMap.values()], xG: xG.map(rounded) };
}

const shuffle = (items, rng) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

const STAGE_LABELS = { league: 'Pontos corridos', group: 'Fase de grupos', round16: 'Oitavas de final', quarter: 'Quartas de final', semi: 'Semifinal', final: 'Final' };
const stageFixture = (stage, homeId, awayId, index, round) => ({ id: `${stage}-${index + 1}`, stage, stageLabel: STAGE_LABELS[stage], homeId, awayId, round, result: null });

export function createTournament(userTeam, allSquads, { mode = 'cup', seed = 1, excludeSquadIds = [], settings = SIMULATION_SETTINGS, candidateTeams = null } = {}) {
  allSquads = squadsForMode(allSquads, mode);
  const isQuick = ['quick', 'knockout', 'rapido', 'mata-mata'].includes(mode);
  const rng = mulberry32(seed);
  const user = { ...userTeam, id: userTeam.id || 'user', name: userTeam.name || 'Meu time', clubId: userTeam.clubId || 'user', strength: calculateTeam(userTeam.lineup), isUser: true };
  const excluded = new Set([...excludeSquadIds, ...user.lineup.map(entry => entry.squadId).filter(Boolean)]);
  // A caller-local, read-only Map can reuse deterministic roster selections
  // during a large audit. No module cache or input mutation is involved.
  const opponentTeam = squad => candidateTeams?.get(squad.id) || squadTeam(squad);
  const eligible = shuffle(allSquads.filter(squad => !excluded.has(squad.id) && squad.id !== user.id), rng);
  if (mode === 'world-cup') return createWorldCup(user, allSquads, excluded, rng, seed, settings, opponentTeam);
  if (mode === 'brasileirao') return createLeague(user, eligible, rng, seed, settings, opponentTeam);
  if (mode === 'copa-do-brasil') return createBrazilCup(user, eligible, rng, seed, settings, opponentTeam);
  const needed = isQuick ? 15 : 31;
  if (eligible.length < needed) throw new Error(`A Copa precisa de ${needed} elencos adversários disponíveis. Há ${eligible.length}.`);
  const teams = [user];
  const groups = [];
  const matches = [];
  const bracket = [];
  if (isQuick) {
    teams.push(...eligible.slice(0, 15).map(opponentTeam));
    const order = shuffle(teams, rng);
    const fixtures = Array.from({ length: 8 }, (_, index) => stageFixture('round16', order[index * 2].id, order[index * 2 + 1].id, index, 1));
    matches.push(...fixtures);
    bracket.push({ stage: 'round16', label: STAGE_LABELS.round16, matches: fixtures });
  } else {
    // One club per group. A club may enter separate groups in distinct years.
    for (let index = 0; index < 8; index += 1) {
      const teamIds = index === 0 ? [user.id] : [];
      const clubs = new Set(index === 0 ? [user.clubId] : []);
      while (teamIds.length < 4) {
        const candidateIndex = eligible.findIndex(squad => !clubs.has(squad.clubId));
        if (candidateIndex === -1) throw new Error('A base precisa de mais clubes diferentes para formar grupos sem repetição.');
        const squad = eligible.splice(candidateIndex, 1)[0];
        const team = opponentTeam(squad);
        teams.push(team);
        teamIds.push(team.id);
        clubs.add(team.clubId);
      }
      groups.push({ id: String.fromCharCode(65 + index), name: `Grupo ${String.fromCharCode(65 + index)}`, teamIds, standings: [] });
    }
    const schedule = [[[0, 1], [2, 3]], [[0, 2], [3, 1]], [[0, 3], [1, 2]]];
    for (let round = 0; round < 3; round += 1) {
      groups.forEach(group => schedule[round].forEach(([home, away], index) => {
        matches.push({ id: `group-${group.id}-${round + 1}-${index + 1}`, stage: 'group', stageLabel: `Grupo ${group.id} · rodada ${round + 1}`, groupId: group.id, round: round + 1, homeId: group.teamIds[home], awayId: group.teamIds[away], result: null });
      }));
    }
  }
  const tournament = { mode: isQuick ? 'quick' : mode, seed: hashSeed(seed), rngState: rng.getState(), settings: { ...settings }, userTeamId: user.id, teams, groups, matches, bracket, progressRound: 0, userMatches: [], championId: null, complete: false };
  if (mode === 'champions') Object.assign(tournament, {knockoutFormat:'two-legged', cupStages:[...KNOCKOUT_STAGES]});
  tournament.groups = standingsFor(tournament);
  tournament.campaign = campaignFor(tournament);
  return tournament;
}


const KNOCKOUT_STAGES = ['round16', 'quarter', 'semi', 'final'];

function createWorldCup(user, squads, excluded, rng, seed, settings, opponentTeam) {
  const countries=[...new Set(squads.map(squad=>squad.clubId))].filter(id=>id!==user.clubId);
  if(countries.length<31)throw new Error('A Copa do Mundo precisa de 31 seleções adversárias diferentes.');
  const opponents=shuffle(countries,rng).slice(0,31).map(id=>{
    const eras=squads.filter(squad=>squad.clubId===id),unused=eras.filter(squad=>!excluded.has(squad.id));
    // A sole real edition remains available even when a draft pick came from it.
    return opponentTeam(choose(unused.length?unused:eras,rng));
  });
  const teams=[user,...opponents],order=shuffle(teams.map(team=>team.id),rng),groups=[],matches=[];
  const schedule=[[[0,1],[2,3]],[[0,2],[3,1]],[[0,3],[1,2]]];
  for(let index=0;index<8;index++){
    const id=String.fromCharCode(65+index),teamIds=order.slice(index*4,index*4+4);
    groups.push({id,name:`Grupo ${id}`,teamIds,standings:[]});
    schedule.forEach((pairs,round)=>pairs.forEach(([home,away],game)=>matches.push({
      id:`group-${id}-${round+1}-${game+1}`,stage:'group',stageLabel:`Grupo ${id} · rodada ${round+1}`,
      groupId:id,round:round+1,homeId:teamIds[home],awayId:teamIds[away],neutral:true,result:null,
    })));
  }
  const tournament={mode:'world-cup',seed:hashSeed(seed),rngState:rng.getState(),settings:{...settings},
    userTeamId:user.id,teams,groups,matches,bracket:[],groupRounds:3,knockoutFormat:'single-legged',
    progressRound:0,userMatches:[],championId:null,complete:false};
  tournament.groups=standingsFor(tournament);tournament.campaign=campaignFor(tournament);
  return tournament;
}

function createBrazilCup(user, eligible, rng, seed, settings, opponentTeam) {
  const clubs = new Map();
  for (const squad of eligible) if (!clubs.has(squad.clubId)) clubs.set(squad.clubId, squad);
  const teams = [user, ...[...clubs.values()].slice(0, 15).map(opponentTeam)];
  if (teams.length < 2) throw new Error('Não há clubes disponíveis para disputar a Copa do Brasil.');
  const size = 2 ** Math.ceil(Math.log2(teams.length));
  const stages = KNOCKOUT_STAGES.slice(4 - Math.log2(size));
  const tournament = { mode:'copa-do-brasil', seed:hashSeed(seed), settings:{...settings},
    userTeamId:user.id, teams, groups:[], matches:[], bracket:[], cupStages:stages,
    progressRound:0, userMatches:[], championId:null, complete:false };
  appendCupStage(tournament, stages[0], teams.map(team => team.id), rng, size);
  tournament.rngState = rng.getState();
  tournament.campaign = campaignFor(tournament);
  return tournament;
}

function appendCupStage(tournament, stage, teamIds, rng, size = teamIds.length, pairings = null) {
  // Brazil redraws the first two stages. Champions preserves the seeded halves.
  const redraw = tournament.mode === 'copa-do-brasil' && ['round16', 'quarter'].includes(stage);
  const order = redraw ? shuffle(teamIds, rng) : [...teamIds];
  const pairs = pairings ? pairings.map(pair => [...pair]) : [];
  if (!pairings) {
    const byes = size - order.length;
    for (let index = 0; index < byes; index += 1) pairs.push([order.shift(), null]);
    while (order.length) pairs.push([order.shift(), order.shift()]);
  }
  const firstRound = tournament.progressRound + 1;
  const ties = pairs.map(([a, b], index) => {
    if (b && !pairings && rng() < 0.5) [a, b] = [b, a];
    const id = `${stage}-tie-${index + 1}`;
    const fixtures = b ? Array.from({length:stage === 'final' ? 1 : 2}, (_, leg) => ({
      id:`${id}-${leg + 1}`, tieId:id, stage, leg:leg + 1,
      stageLabel:`${STAGE_LABELS[stage]} · ${stage === 'final' ? 'Jogo único' : leg ? 'Volta' : 'Ida'}`,
      homeId:leg ? b : a, awayId:leg ? a : b, round:firstRound + leg,
      neutral:stage === 'final', result:null,
    })) : [];
    tournament.matches.push(...fixtures);
    return {id, teamIds:[a,b].filter(Boolean), matchIds:fixtures.map(match => match.id),
      winnerId:b ? null : a, aggregate:null, bye:!b};
  });
  tournament.bracket.push({stage, label:STAGE_LABELS[stage], ties,
    matches:tournament.matches.filter(match => match.stage === stage)});
}

/** Resolve the return leg by total goals, never by away goals or its score alone.
 * Returned score and shootout events use the return leg's home/away orientation.
 * Inputs are immutable, so saves and a pending live replay remain independent. */
export function resolveKnockoutTie(first, second, home, away, rng) {
  const aggregate = [first.result.awayGoals + second.result.homeGoals,
    first.result.homeGoals + second.result.awayGoals];
  let winnerId = aggregate[0] > aggregate[1] ? home.id : aggregate[1] > aggregate[0] ? away.id : null;
  let result = {...second.result};
  if (!winnerId) {
    const penalties = shootout(home, away, rng);
    winnerId = penalties.score[0] > penalties.score[1] ? home.id : away.id;
    result = {...result, winnerId, penalties:penalties.score,
      events:[...result.events, ...penalties.events.map(event => ({...event, minute:result.duration}))]};
  }
  return {aggregate, winnerId, result};
}

// Retained for older callers; both competitions use the same aggregate rules.
export const resolveBrazilCupTie = resolveKnockoutTie;

/** Upgrade only future knockout fixtures; completed scores and seeded opponents stay intact. */
export function upgradeChampionsTournament(tournament) {
  if (tournament.mode !== 'champions' || tournament.complete || tournament.knockoutFormat === 'two-legged') return tournament;
  const next = {...tournament, knockoutFormat:'two-legged', cupStages:[...KNOCKOUT_STAGES],
    matches:tournament.matches.filter(match => match.stage === 'group' || match.result), bracket:[]};
  const rng = mulberry32(tournament.rngState);
  for (const stage of tournament.bracket) {
    const games = stage.matches.map(match => tournament.matches.find(fixture => fixture.id === match.id));
    if (games.every(match => match.result)) {
      next.bracket.push({...stage, matches:games, ties:games.map(match => ({
        id:`legacy-${match.id}`, teamIds:[match.homeId,match.awayId], matchIds:[match.id],
        winnerId:match.result.winnerId, aggregate:[match.result.homeGoals,match.result.awayGoals], bye:false,
      }))});
    } else {
      const pairs = games.map(match => stage.stage === 'round16'
        ? [match.awayId,match.homeId] : [match.homeId,match.awayId]);
      appendCupStage(next, stage.stage, [], rng, 0, pairs);
      break;
    }
  }
  next.rngState = rng.getState();
  next.campaign = campaignFor(next);
  return next;
}

function playCupRound(tournament) {
  const next = {...tournament, matches:tournament.matches.map(match => ({...match})),
    bracket:tournament.bracket.map(stage => ({...stage, ties:stage.ties.map(tie => ({...tie}))}))};
  const rng = mulberry32(next.rngState);
  const stage = next.bracket.at(-1);
  const selected = next.matches.filter(match => !match.result && match.round === next.progressRound + 1);
  if (!selected.length) throw new Error('A rodada do mata-mata não possui partidas.');
  for (const match of selected) {
    const home = next.teams.find(team => team.id === match.homeId);
    const away = next.teams.find(team => team.id === match.awayId);
    const tie = stage.ties.find(tie => tie.id === match.tieId);
    const first = match.leg === 2 ? next.matches.find(fixture => fixture.id === tie?.matchIds[0]) : null;
    const aggregateDrawNeedsExtraTime = first
      ? scores => first.result.awayGoals + scores[0] === first.result.homeGoals + scores[1]
      : null;
    match.result = simulateMatch(home, away, rng, {knockout:match.stage === 'final',
      extraTimeAllowed:match.stage === 'final' || match.leg === 2,
      stoppageTimeAllowed:true, extraTimeTrigger:aggregateDrawNeedsExtraTime, settings:next.settings});
    if (match.stage === 'final') {
      tie.winnerId = match.result.winnerId;
      tie.aggregate = [match.result.homeGoals, match.result.awayGoals];
    } else if (match.leg === 2) {
      const resolved = resolveKnockoutTie(first, match, home, away, rng);
      match.result = resolved.result;
      tie.winnerId = resolved.winnerId;
      tie.aggregate = [...resolved.aggregate].reverse(); // tie.teamIds follow the first leg
    }
  }
  next.progressRound += 1;
  if (stage.ties.every(tie => tie.winnerId)) {
    if (stage.stage === 'final') {
      next.championId = stage.ties[0].winnerId;
      next.complete = true;
    } else {
      const following = next.cupStages[next.cupStages.indexOf(stage.stage) + 1];
      appendCupStage(next, following, stage.ties.map(tie => tie.winnerId), rng);
    }
  }
  next.bracket = next.bracket.map(item => ({...item, matches:next.matches.filter(match => match.stage === item.stage)}));
  next.rngState = rng.getState();
  next.userMatches = next.matches.filter(match => match.result && [match.homeId,match.awayId].includes(next.userTeamId));
  next.campaign = campaignFor(next);
  return next;
}

function createLeague(user, eligible, rng, seed, settings, opponentTeam) {
  // One historical season per Brazilian club; all drafted seasons stay excluded.
  const clubs = new Map();
  for (const squad of eligible) if (!clubs.has(squad.clubId)) clubs.set(squad.clubId, squad);
  const teams = [user, ...[...clubs.values()].map(opponentTeam)];
  if (teams.length < 2) throw new Error('Não há clubes brasileiros disponíveis para disputar a liga.');
  let order = shuffle(teams.map(team => team.id), rng);
  if (order.length % 2) order.push(null);
  const firstLeg = [], halfRounds = order.length - 1;
  for (let round = 0; round < halfRounds; round += 1) {
    for (let index = 0; index < order.length / 2; index += 1) {
      let homeId = order[index], awayId = order[order.length - 1 - index];
      if (!homeId || !awayId) continue;
      if (round % 2) [homeId, awayId] = [awayId, homeId];
      firstLeg.push({id:`league-${round+1}-${index+1}`,stage:'league',stageLabel:`Brasileirão · rodada ${round+1}`,groupId:'league',round:round+1,homeId,awayId,result:null});
    }
    order = [order[0], order.at(-1), ...order.slice(1, -1)];
  }
  const returnLeg = firstLeg.map(match => ({...match,id:`return-${match.id}`,round:match.round+halfRounds,stageLabel:`Brasileirão · rodada ${match.round+halfRounds}`,homeId:match.awayId,awayId:match.homeId}));
  const tournament = {mode:'brasileirao',seed:hashSeed(seed),rngState:rng.getState(),settings:{...settings},userTeamId:user.id,teams,groups:[{id:'league',name:'Classificação',teamIds:teams.map(team=>team.id),standings:[]}],matches:[...firstLeg,...returnLeg],bracket:[],totalRounds:halfRounds*2,progressRound:0,userMatches:[],championId:null,complete:false};
  tournament.groups = standingsFor(tournament);
  tournament.campaign = campaignFor(tournament);
  return tournament;
}

function standingsFor(tournament) {
  const groups = tournament.groups.map(group => {
    const rows = group.teamIds.map(teamId => ({ teamId, id: teamId, name: tournament.teams.find(team => team.id === teamId)?.name, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, qualified: false }));
    tournament.matches.filter(match => match.groupId === group.id && match.result).forEach(match => {
      [match.homeId, match.awayId].forEach((teamId, side) => {
        const row = rows.find(item => item.teamId === teamId);
        const goals = side ? match.result.awayGoals : match.result.homeGoals;
        const conceded = side ? match.result.homeGoals : match.result.awayGoals;
        row.played += 1;
        row.goalsFor += goals;
        row.goalsAgainst += conceded;
        if (goals > conceded) { row.wins += 1; row.points += 3; }
        else if (goals === conceded) { row.draws += 1; row.points += 1; }
        else row.losses += 1;
        row.goalDifference = row.goalsFor - row.goalsAgainst;
      });
    });
    // After points, goal difference, and goals scored, seeded drawing of lots
    // breaks a perfect tie. Club spelling and editorial strength give no edge.
    if(tournament.mode==='world-cup')rows.splice(0,rows.length,...worldCupGroupOrder(rows,tournament.matches.filter(match=>match.groupId===group.id),id=>hashSeed(`${tournament.seed}:${id}`)));
    else rows.sort((a, b) => b.points - a.points || (tournament.mode==='brasileirao'?b.wins-a.wins:0) || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || hashSeed(`${tournament.seed}:${a.teamId}`) - hashSeed(`${tournament.seed}:${b.teamId}`));
    if (tournament.mode!=='brasileirao' && rows.every(row => row.played === group.teamIds.length-1)) rows.forEach((row, index) => { row.qualified = index < 2; });
    return { ...group, standings: rows };
  });
  return groups;
}

function campaignFor(tournament) {
  const league = tournament.mode === 'brasileirao';
  const twoLegged = tournament.mode === 'copa-do-brasil' || tournament.knockoutFormat === 'two-legged';
  const campaign = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, champion: tournament.championId === tournament.userTeamId, eliminated: false, stage: 'group', topScorer: null };
  const scorers = new Map();
  tournament.matches.filter(match => match.result && [match.homeId, match.awayId].includes(tournament.userTeamId)).forEach(match => {
    const home = match.homeId === tournament.userTeamId;
    const goals = home ? match.result.homeGoals : match.result.awayGoals;
    const conceded = home ? match.result.awayGoals : match.result.homeGoals;
    campaign.played += 1;
    campaign.goalsFor += goals;
    campaign.goalsAgainst += conceded;
    campaign.stage = match.stage;
    if (goals > conceded || (!league && !twoLegged && match.stage !== 'group' && match.result.winnerId === tournament.userTeamId)) { campaign.wins += 1; campaign.points += 3; }
    else if (goals === conceded && (league || twoLegged || match.stage === 'group')) { campaign.draws += 1; campaign.points += 1; }
    else campaign.losses += 1;
    if (!league && !twoLegged && match.stage !== 'group' && match.result.winnerId !== tournament.userTeamId) campaign.eliminated = true;
    match.result.scorers.filter(scorer => scorer.team === (home ? 'home' : 'away')).forEach(scorer => {
      const row = scorers.get(scorer.playerId) || { ...scorer, goals: 0 };
      row.goals += scorer.goals;
      scorers.set(scorer.playerId, row);
    });
  });
  const group = tournament.groups.find(group => group.teamIds.includes(tournament.userTeamId));
  if (!league && group && group.standings.every(row => row.played === group.teamIds.length-1) && !group.standings.find(row => row.teamId === tournament.userTeamId).qualified) campaign.eliminated = true;
  campaign.topScorer = [...scorers.values()].sort((a, b) => b.goals - a.goals || a.nome.localeCompare(b.nome))[0] || null;
  campaign.stageLabel = STAGE_LABELS[campaign.stage];
  if (twoLegged) {
    campaign.eliminated ||= tournament.bracket.some(stage => stage.ties.some(tie =>
      tie.teamIds.includes(tournament.userTeamId) && tie.winnerId && tie.winnerId !== tournament.userTeamId));
    if (!campaign.played && !tournament.groups.length) { campaign.stage = tournament.cupStages[0]; campaign.stageLabel = STAGE_LABELS[campaign.stage]; }
  }
  if(league){campaign.stage='league';campaign.position=group.standings.findIndex(row=>row.teamId===tournament.userTeamId)+1;campaign.stageLabel=tournament.complete?`${campaign.position}º lugar`:'Pontos corridos';}
  return campaign;
}

/** Play one group round or one knockout stage; input remains untouched. */
export function playNextRound(tournament) {
  if (tournament.complete) return tournament;
  tournament = upgradeChampionsTournament(tournament);
  if (tournament.mode === 'copa-do-brasil' || tournament.knockoutFormat === 'two-legged' && tournament.progressRound >= (tournament.groupRounds || 3)) return playCupRound(tournament);
  const next = { ...tournament, teams: [...tournament.teams], matches: tournament.matches.map(match => ({ ...match })), groups: tournament.groups.map(group => ({ ...group, teamIds: [...group.teamIds], standings: group.standings.map(row => ({ ...row })) })), bracket: tournament.bracket.map(stage => ({ ...stage, matches: [...stage.matches] })) };
  const rng = mulberry32(next.rngState);
  const league = next.mode === 'brasileirao';
  const quick = next.mode === 'quick';
  const groupRounds=next.groupRounds||3;
  const groupRound = !league && !quick && next.progressRound < groupRounds;
  const knockoutStages = KNOCKOUT_STAGES;
  const knockoutIndex = next.progressRound - (quick ? 0 : groupRounds);
  const stage = league ? 'league' : groupRound ? 'group' : knockoutStages[knockoutIndex];
  const selected = next.matches.filter(match => !match.result && (league ? match.round === next.progressRound+1 : groupRound ? match.stage === 'group' && match.round === next.progressRound + 1 : match.stage === stage));
  if (!selected.length) throw new Error(`A rodada ${next.progressRound + 1} não possui partidas.`);
  selected.forEach(match => {
    const home = next.teams.find(team => team.id === match.homeId);
    const away = next.teams.find(team => team.id === match.awayId);
    match.result = simulateMatch(home, away, rng, { knockout: !league && !groupRound,
      stoppageTimeAllowed:['champions','world-cup'].includes(next.mode), settings: next.settings });
  });
  next.progressRound += 1;
  next.rngState = rng.getState();
  next.groups = standingsFor(next);
  if (league) {
    if(next.progressRound===next.totalRounds){next.championId=next.groups[0].standings[0].teamId;next.complete=true;}
  } else if (groupRound && next.progressRound === groupRounds) {
    const fixtures = [];
    // Group winner and runner-up enter opposite bracket halves; a group
    // rematch can only happen in the final.
    if(next.mode==='world-cup')fixtures.push(...worldCupRound16Pairings(next)
      .map(([home,away],index)=>({...stageFixture('round16',home,away,index,groupRounds+1),neutral:true})));
    else for (let half = 0; half < 2; half += 1) {
      for (let index = 0; index < next.groups.length; index += 2) {
        const first = next.groups[index].standings;
        const second = next.groups[index + 1].standings;
        fixtures.push(stageFixture(knockoutStages[0], (half ? second : first)[0].teamId, (half ? first : second)[1].teamId, fixtures.length, groupRounds+1));
      }
    }
    if (next.knockoutFormat === 'two-legged') {
      // Group winners host the return; the existing opposite-half pairing stays fixed.
      appendCupStage(next, knockoutStages[0], [], rng, 0, fixtures.map(match => [match.awayId,match.homeId]));
      next.rngState = rng.getState();
    } else {
      next.matches.push(...fixtures);
      next.bracket.push({ stage: knockoutStages[0], label: STAGE_LABELS[knockoutStages[0]], matches: fixtures });
    }
  } else if (!groupRound) {
    next.bracket = next.bracket.map(item => item.stage === stage ? { ...item, matches: selected } : item);
    if (stage === 'final') {
      next.championId = selected[0].result.winnerId;
      next.complete = true;
    } else {
      const nextStage = knockoutStages[knockoutIndex + 1];
      const fixtures = Array.from({ length: selected.length / 2 }, (_, index) => ({...stageFixture(nextStage, selected[index * 2].result.winnerId, selected[index * 2 + 1].result.winnerId, index, next.progressRound + 1),...(next.mode==='world-cup'?{neutral:true}:{})}));
      next.matches.push(...fixtures);
      next.bracket.push({ stage: nextStage, label: STAGE_LABELS[nextStage], matches: fixtures });
    }
  }
  next.userMatches = next.matches.filter(match => match.result && [match.homeId, match.awayId].includes(next.userTeamId));
  next.campaign = campaignFor(next);
  return next;
}

export function simulateTournament(tournament) {
  let result = tournament;
  while (!result.complete) result = playNextRound(result);
  return result;
}

/**
 * Reproducible balancing audit. Synthetic user players retain a natural
 * 4–3–3 profile, distinct clubs, and no chemistry, at the requested OVR.
 * Role attribute deltas are averaged from the supplied historical dataset.
 * Call with the actual dataset: calibrateChampionship(allSquads, { runs: 1000 }).
 * Returning confidence margins makes the sampled rate's uncertainty visible.
 */
export function calibrateChampionship(allSquads, { runs = 1000, strengths = [76, 82, 88, 94], seed = 20261010, settings = SIMULATION_SETTINGS } = {}) {
  const candidateTeams = new Map(allSquads.map(squad => [squad.id, squadTeam(squad)]));
  const attributeNames = ['ataque', 'meio', 'defesa', 'finalizacao', 'reflexo', 'posicionamento'];
  const profiles = Object.fromEntries(['GOL', 'ZAG', 'LD', 'LE', 'VOL', 'MC', 'PE', 'PD', 'CA'].map(tag => {
    const players = allSquads.flatMap(squad => squad.jogadores).filter(player => player.tags[0] === tag);
    return [tag, Object.fromEntries(attributeNames.map(name => [name, average(players.map(player => attribute(player, name) - player.ovr))]))];
  }));
  return strengths.map(ovr => {
    const positions = FORMATIONS['4-3-3'].slots.map(slot => slot.label);
    const lineup = FORMATIONS['4-3-3'].slots.map((targetSlot, index) => ({
      slot: targetSlot, clubId: `audit-club-${index}`, squadId: `audit-${index}`,
      player: { id: `audit-player-${index}`, nome: `Teste ${index + 1}`, tags: [positions[index]], ovr, atributos: Object.fromEntries(attributeNames.map(name => [name, rounded(clamp(ovr + profiles[positions[index]][name], 1, 99))])) },
    }));
    const team = { id: 'audit-user', name: `Teste OVR ${ovr}`, lineup, strength: calculateTeam(lineup) };
    let titles = 0;
    for (let run = 0; run < runs; run += 1) {
      const tournament = simulateTournament(createTournament(team, allSquads, { seed: hashSeed(`${seed}:${run}`), settings, candidateTeams }));
      if (tournament.championId === team.id) titles += 1;
    }
    const probability = titles / runs;
    return { strength: ovr, overall: team.strength.overall, runs, titles, titleRate: rounded(probability * 100), margin95: rounded(1.96 * Math.sqrt(probability * (1 - probability) / runs) * 100), modelVersion: SIMULATION_SETTINGS.modelVersion };
  });
}
