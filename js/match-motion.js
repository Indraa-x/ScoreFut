import { hashSeed, mulberry32 } from './engine.js?v=champions-two-legs-20261020';

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const mix = (a, b, progress) => a + (b - a) * progress;
const smooth = value => value * value * (3 - 2 * value);
export const MATCH_SPEEDS = [1, 4, 8];

// At 1×, one second of playback represents one minute of football.
export function advanceMatchMinute(minute, milliseconds, speed, duration) {
  return Math.min(duration, minute + Math.max(0, milliseconds) / 1000 * (MATCH_SPEEDS.includes(speed) ? speed : 1));
}

export function formatMatchClock(minute) {
  const seconds = Math.floor(Math.max(0, minute) * 60 + .00001);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function scoreAt(result, minute) {
  if (minute >= result.duration) return [result.homeGoals, result.awayGoals];
  return ['home', 'away'].map(side => result.events.filter(event => event.type === 'goal' && event.team === side && event.minute <= minute).length);
}

export function lineupAnchors(home, away) {
  return [home, away].flatMap((team, side) => (team.lineup || []).map((entry, index) => ({
    side: side ? 'away' : 'home', index, id: entry.player.id, role: entry.slot.position,
    x: side ? 96 - (100 - entry.slot.y) * .46 : 4 + (100 - entry.slot.y) * .46,
    y: clamp(entry.slot.x, 10, 90),
  })));
}

/** Seeded passing sequences and coordinated team shapes; no per-frame random jitter. */
export function createMatchMotion(home, away, match) {
  const anchors = lineupAnchors(home, away), duration = match.result.duration;
  const rng = mulberry32(hashSeed(`${match.id}:${home.id}:${away.id}:${match.result.events.filter(e => e.type === 'goal').map(e => e.minute + e.team).join('|')}`));
  const goals = [...new Map(match.result.events.filter(event => event.type === 'goal').map(event => [event.minute, event])).values()];
  const actions = [{ at: 0, x: 50, y: 50, side: 'home', kind: 'kickoff', owner: -1 }];
  let at = .65, cycleStart = 0, cycleLength = 5 + rng() * 3, side = rng() < .5 ? 'home' : 'away', priorOwner = -1;
  while (at < duration) {
    if (at - cycleStart > cycleLength) {
      side = side === 'home' ? 'away' : 'home'; cycleStart = at; cycleLength = 5 + rng() * 3;
    }
    const progress = clamp((at - cycleStart) / cycleLength, 0, 1), direction = side === 'home' ? 1 : -1;
    const x = 50 + direction * (-13 + progress * 45), y = 24 + rng() * 52;
    const candidates = anchors.map((player, index) => ({ player, index })).filter(({player, index}) => player.side === side && player.role !== 'GOL' && index !== priorOwner);
    candidates.sort((a, b) => Math.abs(a.player.x + direction * 18 - x) - Math.abs(b.player.x + direction * 18 - x));
    const owner = candidates[Math.floor(rng() * Math.min(4, candidates.length))]?.index ?? -1;
    if (!goals.some(goal => at >= goal.minute - 1.7 && at <= goal.minute + 1.2)) actions.push({ at, x, y, side, owner, kind: 'pass' });
    priorOwner = owner;
    at += .65 + rng() * .45;
  }
  goals.forEach((goal, index) => {
    const direction = goal.team === 'home' ? 1 : -1;
    const owner = anchors.findIndex(player => player.side === goal.team && player.id === goal.player.id);
    actions.push({ at: Math.max(.05, goal.minute - 1.3), x: 50 + direction * 24, y: 32 + goal.x * 34, side: goal.team, owner, kind: 'pass' });
    actions.push({ at: Math.max(.1, goal.minute - .45), x: 50 + direction * 35, y: 40 + goal.x * 20, side: goal.team, owner, kind: 'shot' });
    actions.push({ at: goal.minute, x: 50 + direction * 47, y: 50, side: goal.team, owner: -1, kind: 'goal' });
    const kickoffAt = Math.min(goal.minute + 1.2, (goals[index + 1]?.minute ?? Infinity) - .7, duration);
    if (kickoffAt > goal.minute + .15) {
      actions.push({ at: Math.min(goal.minute + .4, kickoffAt - .1), x: 50 + direction * 47, y: 50, side: goal.team, owner: -1, kind: 'celebrate' });
      actions.push({ at: kickoffAt, x: 50, y: 50, side: goal.team === 'home' ? 'away' : 'home', owner: -1, kind: 'kickoff' });
    }
  });
  if (!goals.some(goal => goal.minute === duration)) actions.push({ at: duration, x: 50, y: 50, side: 'home', owner: -1, kind: 'end' });
  const ordered = [...new Map(actions.filter(action => action.at <= duration).sort((a, b) => a.at - b.at).map(action => [action.at, action])).values()];
  const frames = ordered.map(action => {
    const players = anchors.map((player, index) => {
      const direction = player.side === 'home' ? 1 : -1, possession = player.side === action.side;
      if (action.kind === 'kickoff' || action.kind === 'end') return { x: player.x, y: player.y };
      if (player.role === 'GOL') return { x: player.x + direction * 1.5, y: clamp(50 + (action.y - 50) * .25, 37, 63) };
      const support = possession ? (player.role === 'DEF' || ['ZAG', 'LD', 'LE'].includes(player.role) ? 8 : 17) : -4;
      let x = player.x + direction * support + (action.x - 50) * .28;
      let y = player.y + (action.y - 50) * .2 + Math.sin(action.at * .6 + index * 2.4) * 3;
      x += Math.sin(action.at * .5 + index * 1.7) * 2.5;
      if (index === action.owner) { x = mix(x, action.x, .75); y = mix(y, action.y, .7); }
      return { x: clamp(x, 10, 90), y: clamp(y, 10, 90) };
    });
    // One nearby defender presses the receiver while the remaining team holds its shape.
    const defender = anchors.map((player, index) => ({player, index})).filter(({player}) => player.side !== action.side && player.role !== 'GOL')
      .sort((a, b) => Math.hypot(players[a.index].x - action.x, players[a.index].y - action.y) - Math.hypot(players[b.index].x - action.x, players[b.index].y - action.y))[0];
    if (defender && ['pass', 'shot'].includes(action.kind)) {
      const p = players[defender.index];
      p.x = clamp(mix(p.x, action.x, .38), 10, 90); p.y = clamp(mix(p.y, action.y, .38), 10, 90);
    }
    const receiver = players[action.owner];
    const ball = receiver && ['pass', 'shot'].includes(action.kind)
      ? { x: receiver.x + (action.side === 'home' ? 1.2 : -1.2), y: receiver.y + 1.3 }
      : { x: action.x, y: action.y };
    return { ...action, players, ball };
  });

  return { anchors, frames, at(minute) {
    const time = clamp(minute, 0, duration);
    let low = 0, high = frames.length - 1;
    while (low < high) { const mid = Math.ceil((low + high) / 2); if (frames[mid].at <= time) low = mid; else high = mid - 1; }
    const first = frames[low], second = frames[Math.min(low + 1, frames.length - 1)];
    const fraction = second.at > first.at ? clamp((time - first.at) / (second.at - first.at), 0, 1) : 0;
    const movement = smooth(fraction);
    const players = first.players.map((player, index) => ({ x: mix(player.x, second.players[index].x, movement), y: mix(player.y, second.players[index].y, movement) }));
    const travel = clamp(fraction / (second.kind === 'goal' ? 1 : .78), 0, 1);
    const receiver = players[second.owner];
    const target = receiver && ['pass', 'shot'].includes(second.kind)
      ? { x: receiver.x + (second.side === 'home' ? 1.2 : -1.2), y: receiver.y + 1.3 } : second.ball;
    const ball = { x: mix(first.ball.x, target.x, travel), y: mix(first.ball.y, target.y, travel) };
    return { players, ball, possession: fraction < .5 ? first.side : second.side, owner: fraction < .78 ? first.owner : second.owner };
  } };
}
