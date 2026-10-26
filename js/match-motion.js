import { hashSeed, mulberry32 } from './engine.js?v=simulation-gap-20261026';

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const mix = (a, b, progress) => a + (b - a) * progress;
const smooth = value => value * value * (3 - 2 * value);
export const MATCH_SPEEDS = [4, 8];
export const normalizeMatchSpeed = speed => speed === 8 ? 8 : 4;

// Normal represents four football minutes per second; fast represents eight.
// Legacy 1× saves and invalid values adopt the new normal pace.
export function advanceMatchMinute(minute, milliseconds, speed, duration) {
  return Math.min(duration, minute + Math.max(0, milliseconds) / 1000 * normalizeMatchSpeed(speed));
}

export function formatMatchClock(minute) {
  const seconds = Math.floor(Math.max(0, minute) * 60 + .00001);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function matchAddedMinutes(result, minute) {
  const regulationAdded = Math.max(0, Number(result.regulationStoppageTime) || 0);
  if (result.extraTime) {
    const extraStart = Number.isFinite(result.extraTimeStart) ? result.extraTimeStart : 90 + regulationAdded;
    const extraEnd = Number.isFinite(result.extraTimeEnd) ? result.extraTimeEnd : extraStart + 30;
    if (minute >= extraEnd) return Math.max(0, Number(result.extraTimeStoppageTime) || 0);
    if (minute >= extraStart) return 0;
  }
  return minute >= 90 ? regulationAdded : 0;
}

export function formatMatchEventMinute(result, minute) {
  const value = Math.max(0, Number(minute) || 0);
  if (result?.extraTime) {
    const extraStart = Number.isFinite(result.extraTimeStart) ? result.extraTimeStart : 90;
    const extraEnd = Number.isFinite(result.extraTimeEnd) ? result.extraTimeEnd : 120;
    if (value > extraEnd) return `120+${Math.ceil(value - extraEnd)}`;
    if (value > extraStart) return String(90 + Math.floor(value - extraStart));
    if (value > 90) return `90+${Math.ceil(value - 90)}`;
  } else if (value > 90) return `90+${Math.ceil(value - 90)}`;
  return String(Math.floor(value));
}

export function matchPhase(result, minute) {
  if (minute >= result.duration) return 'Fim de jogo';
  if (result.extraTime) {
    const extraStart = Number.isFinite(result.extraTimeStart) ? result.extraTimeStart : 90;
    const extraEnd = Number.isFinite(result.extraTimeEnd) ? result.extraTimeEnd : 120;
    if (minute > extraEnd) return 'Acréscimos da prorrogação';
    if (minute > extraStart) return 'Prorrogação';
    if (minute > 90) return 'Acréscimos';
  } else if (minute > 90) return 'Acréscimos';
  return minute >= 45 ? '2º tempo' : '1º tempo';
}

export function matchEndLabel(result) {
  const base = result.extraTime ? 120 : 90;
  const added = result.extraTime ? result.extraTimeStoppageTime : result.regulationStoppageTime;
  return added ? `${base}+${added}′` : `${base}′`;
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

/** Seeded match choreography with different possession styles and off-ball runs. */
export function createMatchMotion(home, away, match) {
  const anchors = lineupAnchors(home, away), duration = match.result.duration;
  const rng = mulberry32(hashSeed(`${match.id}:${home.id}:${away.id}:${match.result.events.filter(e => e.type === 'goal').map(e => e.minute + e.team).join('|')}`));
  const goals = [...new Map(match.result.events.filter(event => event.type === 'goal').map(event => [event.minute, event])).values()];
  const profiles = anchors.map(player => {
    const personal = mulberry32(hashSeed(`${player.id}:${player.side}:run-profile`));
    return { mobility: .78 + personal() * .48, width: (personal() - .5) * 12, timing: personal() * Math.PI * 2 };
  });
  const actions = [{ at: 0, x: 50, y: 50, side: 'home', kind: 'kickoff', owner: -1 }];
  const styles = ['patient', 'counter', 'wide', 'direct'];
  let at = .55, cycleStart = 0, cycleLength = 3.5 + rng() * 6.5;
  let side = rng() < .5 ? 'home' : 'away', priorOwner = -1;
  let style = styles[Math.floor(rng() * styles.length)], lane = [20, 50, 80][Math.floor(rng() * 3)];
  while (at < duration) {
    if (at - cycleStart > cycleLength) {
      side = side === 'home' ? 'away' : 'home';
      cycleStart = at; cycleLength = 3.5 + rng() * 6.5;
      style = styles[Math.floor(rng() * styles.length)];
      lane = [20, 50, 80][Math.floor(rng() * 3)];
    }
    const progress = clamp((at - cycleStart) / cycleLength, 0, 1), direction = side === 'home' ? 1 : -1;
    const shapedProgress = style === 'counter' ? Math.pow(progress, .68) : style === 'patient' ? progress * .76 : smooth(progress);
    const x = clamp(50 + direction * (-18 + shapedProgress * 47) + (rng() - .5) * (style === 'counter' ? 12 : 8), 13, 87);
    const laneDrift = style === 'wide' ? Math.sin(progress * Math.PI) * 11 : (rng() - .5) * 15;
    const y = clamp(lane + laneDrift + (rng() - .5) * 17, 14, 86);
    const nearGoal = direction * (x - 50) > 25;
    const roll = rng();
    const kind = nearGoal && roll < .14 ? 'shot'
      : style === 'wide' && roll < .31 ? 'cross'
      : style === 'direct' && roll < .27 ? 'carry'
      : roll < .17 ? 'switch'
      : roll < .56 ? 'pass' : 'carry';
    const candidates = anchors.map((player, index) => ({player, index, profile:profiles[index], sortJitter:rng()*8}))
      .filter(({player, index}) => player.side === side && player.role !== 'GOL' && index !== priorOwner);
    candidates.sort((a, b) => {
      const depth = player => ['CA', 'SA', 'PE', 'PD'].includes(player.role) ? 25 : ['MEI', 'MC', 'MD', 'ME', 'VOL'].includes(player.role) ? 16 : 8;
      const score = ({player, profile}) => Math.hypot(
        player.x + direction * depth(player) * profile.mobility - x,
        player.y + (y - 50) * .14 + profile.width * .25 - y
      );
      return score(a) + a.sortJitter - score(b) - b.sortJitter;
    });
    const receiverPool = candidates.slice(0, Math.min(5, candidates.length));
    const owner = receiverPool[Math.floor(rng() * receiverPool.length)]?.index ?? -1;
    if (!goals.some(goal => at >= goal.minute - 1.7 && at <= goal.minute + 1.2)) {
      actions.push({at, x, y, side, owner, kind, style, lane:y});
    }
    priorOwner = owner;
    at += .55 + rng() * .82;
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
      const profile = profiles[index];
      if (player.role === 'GOL') {
        return {x:player.x + direction * clamp(direction * (action.x - 50) * .045, -3, 3), y:clamp(50 + (action.y - 50) * .18, 39, 61)};
      }
      const defender = ['ZAG', 'LD', 'LE'].includes(player.role);
      const midfielder = ['VOL', 'MC', 'MEI', 'MD', 'ME'].includes(player.role);
      const winger = ['PE', 'PD', 'ME', 'MD', 'LE', 'LD'].includes(player.role);
      const runner = ['CA', 'SA', 'PE', 'PD'].includes(player.role);
      const depth = possession
        ? (runner ? 25 : midfielder ? 16 : defender ? 8 : 12) * profile.mobility
        : (runner ? -7 : midfielder ? -5 : defender ? -2 : -4);
      let x = player.x + direction * depth + (action.x - 50) * (possession ? .15 : .19);
      let y = mix(player.y, action.y, possession ? .16 : .11);
      if (winger) y += profile.width * (possession ? .48 : .2);
      if (action.style === 'counter' && runner && possession) x += direction * 7;
      if (action.kind === 'switch') y = mix(y, 50 + (player.y < 50 ? -26 : 26), .25);
      if (action.kind === 'cross' && runner) x += direction * 5;
      const rhythm = Math.sin(action.at * (.21 + profile.mobility * .06) + profile.timing);
      x += rhythm * (runner ? 2.8 : 1.5) + (rng() - .5) * 2.6;
      y += Math.cos(action.at * (.18 + profile.mobility * .05) + profile.timing) * (winger ? 3.6 : 2.1) + (rng() - .5) * 4;
      if (index === action.owner) { x = mix(x, action.x, .72); y = mix(y, action.y, .72); }
      return {x:clamp(x, 7, 93), y:clamp(y, 7, 93)};
    });
    // Pressure and cover vary with the receiver and the lane of attack.
    const pressers = anchors.map((player, index) => ({player,index,profile:profiles[index]}))
      .filter(({player}) => player.side !== action.side && player.role !== 'GOL')
      .sort((a,b) => {
        const distance = ({player,index,profile}) => Math.hypot(players[index].x-action.x,players[index].y-action.y) - profile.mobility * 2;
        return distance(a)-distance(b);
      });
    if (pressers[0] && ['pass','carry','cross','shot','switch'].includes(action.kind)) {
      const p=players[pressers[0].index], pressure=action.kind==='carry'?.32:.24;
      p.x=clamp(mix(p.x,action.x,pressure),7,93);p.y=clamp(mix(p.y,action.y,pressure),7,93);
      if (pressers[1] && action.kind !== 'switch' && rng() < .48) {
        const cover=players[pressers[1].index];
        cover.x=clamp(mix(cover.x,action.x,.12),7,93);cover.y=clamp(mix(cover.y,action.y,.12),7,93);
      }
    }
    const receiver = players[action.owner];
    const ball = receiver && ['pass','carry','cross','switch'].includes(action.kind)
      ? {x:receiver.x+(action.side==='home'?1.2:-1.2),y:receiver.y+1.3}
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
    const target = receiver && ['pass','carry','cross','switch'].includes(second.kind)
      ? { x: receiver.x + (second.side === 'home' ? 1.2 : -1.2), y: receiver.y + 1.3 } : second.ball;
    const ball = { x: mix(first.ball.x, target.x, travel), y: mix(first.ball.y, target.y, travel) };
    return { players, ball, possession: fraction < .5 ? first.side : second.side, owner: fraction < .78 ? first.owner : second.owner };
  } };
}
