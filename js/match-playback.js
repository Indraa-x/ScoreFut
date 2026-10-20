import { currentMatch } from './match-session.js?v=club-only-cleanup-20261020';
import { createMatchMotion, advanceMatchMinute, formatMatchClock, scoreAt } from './match-motion.js?v=club-only-cleanup-20261020';
import {goalsAt,renderMatchGoals} from './match-goals.js?v=club-only-cleanup-20261020';

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
        nodes.goals.innerHTML=renderMatchGoals(match.result,state.matchMinute,{home:data.homeName,away:data.awayName},{home:[data.homeColor1,data.homeColor2],away:[data.awayColor1,data.awayColor2]});nodes.goalCount=count;
      }
    }
    if (nodes.aggregate) nodes.aggregate.textContent = `${Number(nodes.aggregate.dataset.home)+score[0]} – ${Number(nodes.aggregate.dataset.away)+score[1]}`;
    const clock = formatMatchClock(state.matchMinute);
    if (nodes.clock.textContent !== clock) nodes.clock.textContent = clock;
    const phase = state.matchMinute >= match.result.duration ? 'Fim de jogo' : state.matchMinute >= 90 ? 'Prorrogação' : state.matchMinute >= 45 ? '2º tempo' : '1º tempo';
    if (nodes.phase.textContent !== phase) nodes.phase.textContent = phase;
    nodes.endTime.textContent = state.matchMinute >= 90 && match.result.duration > 90 ? '120′' : '90′';
    if (nodes.progress && document.activeElement !== nodes.progress) nodes.progress.value = state.matchMinute;
    nodes.progress?.style.setProperty('--progress', `${state.matchMinute / match.result.duration * 100}%`);
    const goal = match.result.events.filter(event => event.type === 'goal' && event.minute <= state.matchMinute).at(-1);
    const showGoal = goal && state.matchMinute - goal.minute < 1.4 * (state.matchSpeed || 1) && state.matchMinute < match.result.duration;
    nodes.goal.classList.toggle('visible', !!showGoal);
    if (showGoal) {
      const text = `${goal.minute}′ · ${goal.player.nome}`;
      if (nodes.goalName.textContent !== text) nodes.goalName.textContent = text;
    }
  }
  function attach() {
    stop(); observer?.disconnect(); nodes = null;
    state.matchPlaying=false;
    if (state.screen !== 'match') return;
    const match = currentMatch(state), pitch = app.querySelector('[data-live-pitch]');
    if (!match || !pitch) return;
    state.matchPlaying=!document.hidden && state.matchMinute < match.result.duration;
    const home = state.tournament.teams.find(team => team.id === match.homeId), away = state.tournament.teams.find(team => team.id === match.awayId);
    const key = `${state.tournament.seed}:${match.id}:${home.id}:${away.id}`;
    if (key !== motionKey) { motion = createMatchMotion(home, away, match); motionKey = key; }
    nodes = {
      players: [...pitch.querySelectorAll('[data-match-player]')], ball: pitch.querySelector('[data-match-ball]'),
      scores: [...app.querySelectorAll('.score-numbers>span')], clock: app.querySelector('.score-clock'),
      progress: app.querySelector('#match-timeline'), goal: app.querySelector('[data-goal-notice]'), goalName: app.querySelector('[data-goal-name]'),
      phase: app.querySelector('[data-match-phase]'), endTime: app.querySelector('[data-match-end-time]'),
      aggregate: app.querySelector('[data-match-aggregate]'),
      goals: app.querySelector('[data-match-goals]'), goalCount:-1,
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
    if (previousTime !== null) state.matchMinute = advanceMatchMinute(state.matchMinute, Math.min(250, timestamp - previousTime), state.matchSpeed, match.result.duration);
    previousTime = timestamp; paint();
    if (state.matchMinute >= match.result.duration) { stop(); state.matchPlaying = false; onFinish(); return; }
    if (timestamp - savedAt >= 5000) { savedAt = timestamp; onSave(); }
    frame = requestAnimationFrame(tick);
  }
  function start() { stop(); if (nodes && state.matchPlaying) frame = requestAnimationFrame(tick); }
  return { attach, start, stop, paint };
}
