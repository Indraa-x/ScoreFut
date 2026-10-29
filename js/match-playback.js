import { currentMatch } from './match-session.js?v=ovr-gap-20261029';
import { createMatchMotion, advanceMatchMinute, formatMatchClock, formatMatchEventMinute, matchAddedMinutes, matchPhase, scoreAt, normalizeMatchSpeed } from './match-motion.js?v=ovr-gap-20261029';
import {goalsAt,renderMatchGoals} from './match-goals.js?v=ovr-gap-20261029';
import {penaltyProgress,advancePenaltyReplay,matchHasEnded,renderPenaltyMarks} from './match-penalties.js?v=single-penalty-title-20261028';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function initMatchPlayback({ app, state, onFinish, onSave }) {
  let frame = null, previousTime = null, observer = null, nodes = null, motion = null, motionKey = '', width = 0, height = 0, savedAt = 0;
  const stop = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; previousTime = null; };
  const position = (element, point) => {
    element.style.transform = `translate3d(${(point.x * width / 100).toFixed(2)}px,${(point.y * height / 100).toFixed(2)}px,0) translate(-50%,-50%)`;
  };
  function paint() {
    const match = currentMatch(state);
    if (!nodes || !match || !motion) return;
    const scene = motion.at(state.matchMinute);
    nodes.players.forEach((element, index) => { if (scene.players[index]) position(element, scene.players[index]); });
    if (scene.owner !== nodes.activeOwner) {
      nodes.players[nodes.activeOwner]?.classList.toggle('on-ball', false);
      nodes.players[scene.owner]?.classList.toggle('on-ball', true);
      nodes.activeOwner = scene.owner;
    }
    position(nodes.ball, scene.ball);
    const score = scoreAt(match.result, state.matchMinute);
    nodes.scores.forEach((element, index) => { const value = String(score[index]); if (element.textContent !== value) element.textContent = value; });
    if(nodes.goals){
      const count=goalsAt(match.result,state.matchMinute).length;
      if(count!==nodes.goalCount){
        const data=nodes.goals.dataset||{};
        nodes.goals.innerHTML=renderMatchGoals(match.result,state.matchMinute,{home:data.homeName,away:data.awayName});nodes.goalCount=count;
      }
    }
    if (nodes.aggregate) nodes.aggregate.textContent = `${Number(nodes.aggregate.dataset.home)+score[0]} – ${Number(nodes.aggregate.dataset.away)+score[1]}`;
    const clock = formatMatchClock(state.matchMinute,match.result);
    if (nodes.clock.textContent !== clock) nodes.clock.textContent = clock;
    if (nodes.addedTime) {
      const added = matchAddedMinutes(match.result, state.matchMinute), label = `+${added}`;
      nodes.addedTime.hidden = !added;
      if (nodes.addedTime.textContent !== label) {
        nodes.addedTime.textContent = label;
        nodes.addedTime.setAttribute('aria-label', `${added} minutos de acréscimo`);
      }
    }
    const progress=penaltyProgress(state,match);
    if(nodes.penalties){
      nodes.penalties.hidden=state.matchMinute<match.result.duration;
      if(nodes.penaltyCount!==progress.revealed){
        const data=nodes.penalties.dataset;
        nodes.penalties.innerHTML=renderPenaltyMarks(state,match,{home:data.homeName,away:data.awayName},escapeHtml);
        nodes.penaltyCount=progress.revealed;
        for(const row of nodes.penalties.querySelectorAll('.shootout-dots'))row.scrollLeft=row.scrollWidth;
      }
    }
    const phase = progress.playing?'':matchPhase(match.result,state.matchMinute);
    if (nodes.phase.textContent !== phase) nodes.phase.textContent = phase;
    const goal = match.result.events.filter(event => event.type === 'goal' && event.minute <= state.matchMinute).at(-1);
    const showGoal = goal && state.matchMinute - goal.minute < 1.4 * normalizeMatchSpeed(state.matchSpeed) && state.matchMinute < match.result.duration;
    nodes.goal.classList.toggle('visible', !!showGoal);
    if (showGoal) {
      const text = `${formatMatchEventMinute(match.result,goal.minute)}′ · ${goal.player.nome}`;
      if (nodes.goalName.textContent !== text) nodes.goalName.textContent = text;
    }
  }
  function attach() {
    stop(); observer?.disconnect(); nodes = null;
    state.matchSpeed=normalizeMatchSpeed(state.matchSpeed);
    state.matchPlaying=false;
    if (state.screen !== 'match') return;
    const match = currentMatch(state), pitch = app.querySelector('[data-live-pitch]');
    if (!match || !pitch) return;
    state.matchPlaying=!document.hidden && !matchHasEnded(state,match);
    const home = state.tournament.teams.find(team => team.id === match.homeId), away = state.tournament.teams.find(team => team.id === match.awayId);
    const key = `${state.tournament.seed}:${match.id}:${home.id}:${away.id}`;
    if (key !== motionKey) { motion = createMatchMotion(home, away, match, {seed:state.tournament.seed}); motionKey = key; }
    nodes = {
      players: [...pitch.querySelectorAll('[data-match-player]')], ball: pitch.querySelector('[data-match-ball]'),
      scores: [...app.querySelectorAll('.score-numbers>span')], clock: app.querySelector('.score-clock'),
      goal: app.querySelector('[data-goal-notice]'), goalName: app.querySelector('[data-goal-name]'),
      phase: app.querySelector('[data-match-phase]'),
      addedTime: app.querySelector('[data-match-added-time]'),
      aggregate: app.querySelector('[data-match-aggregate]'),
      goals: app.querySelector('[data-match-goals]'), goalCount:-1,
      penalties:app.querySelector('[data-penalty-marks]'),penaltyCount:-1,
      activeOwner: -1,
    };
    [...nodes.players, nodes.ball].forEach(element => { element.style.left = '0'; element.style.top = '0'; });
    const measure = () => { width = pitch.clientWidth; height = pitch.clientHeight; paint(); };
    observer = new ResizeObserver(measure); observer.observe(pitch); measure();
  }
  function tick(timestamp) {
    frame = null;
    if (!state.matchPlaying || state.screen !== 'match') return;
    const match = currentMatch(state);
    if (!match) return;
    if (previousTime !== null){
      const elapsed=Math.min(250,timestamp-previousTime);
      if(state.matchMinute<match.result.duration)state.matchMinute=advanceMatchMinute(state.matchMinute,elapsed,state.matchSpeed,match.result.duration);
      else advancePenaltyReplay(state,match,elapsed);
    }
    previousTime = timestamp; paint();
    if (matchHasEnded(state,match)) { stop(); state.matchPlaying = false; onFinish(); return; }
    if (timestamp - savedAt >= 5000) { savedAt = timestamp; onSave(); }
    frame = requestAnimationFrame(tick);
  }
  function start() { stop(); if (nodes && state.matchPlaying) frame = requestAnimationFrame(tick); }
  return { attach, start, stop, paint };
}
