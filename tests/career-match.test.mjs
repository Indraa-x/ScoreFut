import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_TEAM, careerScorers, commitCareerRound, createCareer, prepareCareerRound} from '../js/career.js';
import * as ui from '../js/ui.js';
import {renderCareer} from '../js/career-view.js';
import {initCareer} from '../js/career-controller.js';
import {scoreAt} from '../js/match-motion.js';

test('a prepared career match resumes from storage and credits the round only at full time', () => {
  const career = createCareer(42);
  const replay = prepareCareerRound(career);
  const saved = JSON.parse(JSON.stringify({...career, replay: {...replay, minute: 36}}));
  const {result} = saved.replay.tournament.userMatches[0];
  assert.equal(saved.round, 0);
  assert.equal(saved.budget, career.budget);
  assert.deepEqual(saved.replay.tournament, replay.tournament);
  assert.equal(commitCareerRound(saved), saved);

  const final = commitCareerRound({...saved, replay: {...saved.replay, minute: result.duration}});
  assert.equal(final.round, 1);
  assert.equal(final.budget, career.budget + replay.income);
  assert.deepEqual(final.results, [replay.results]);
  assert.equal(commitCareerRound(final), final);
});

test('career plays in the overview lineup panel with score between the crests and speed below the field', () => {
  const career = createCareer(32);
  const replay = prepareCareerRound(career);
  const state = {mode: 'career', tournament: replay.tournament, userMatchIndex: 0, matchMinute: 0, matchSpeed: 4};
  const {result} = replay.tournament.userMatches[0];
  const before = renderCareer(career, 'overview', ui);
  assert.match(before, /career-pitch-marker/);
  assert.doesNotMatch(before, /data-live-pitch/);
  const kickoff = renderCareer({...career, replay}, 'overview', ui, state);
  assert.match(kickoff, /aria-current="page">Visão geral/);
  assert.match(kickoff, /Mandante<\/small><\/div>\s*<div class="score-center">\s*<div class="score-numbers"[\s\S]*?class="match-clock-row"[\s\S]*?Visitante/);
  assert.match(kickoff, /class="score-clock">00:00<\/span>/);
  assert.match(kickoff, /career-live-field[\s\S]*?data-live-pitch[\s\S]*?aria-label="Velocidade da partida"/);
  assert.doesNotMatch(kickoff, /career-pitch-marker|data-action="career-match-return"/);
  assert.equal(kickoff.match(/data-match-player/g).length, 22);
  assert.match(kickoff, /data-action="career-match-speed" data-value="4"[^>]*aria-pressed="true"/);
  assert.match(kickoff, /data-action="career-match-speed" data-value="8"/);
  assert.match(kickoff, /aria-label="Velocidade da partida"[\s\S]*?data-action="career-match-finish" data-value="">Simular até o fim/);
  assert.deepEqual(scoreAt(result, 0), [0, 0]);
  assert.deepEqual(scoreAt(result, result.duration), [result.homeGoals, result.awayGoals]);
  const final = renderCareer({...career, replay}, 'overview', ui, {...state, matchMinute: result.duration});
  assert.match(final, /data-action="career-match-return"[^>]*>Avançar/);
  assert.match(final, /data-action="career-match-finish"[^>]* disabled/);
});

test('simulating to the end uses the prepared result and credits only one round', () => {
  const career = createCareer(23);
  const replay = prepareCareerRound(career);
  let saved = {...career, replay: {...replay, minute: 15}};
  const controller = initCareer({
    app: {addEventListener() {}, querySelector: () => null},
    storage: {read: () => saved, write: (_key, next) => { saved = next; return true; }},
    ui, render() {}, toast: message => assert.fail(message),
  });
  assert.ok(controller.loadMatch());
  controller.attachMatch(true);
  controller.actions['career-match-finish']();
  assert.equal(saved.replay.minute, replay.tournament.userMatches[0].result.duration);
  assert.equal(saved.round, 1);
  assert.equal(saved.budget, career.budget + replay.income);
  assert.deepEqual(saved.results, [replay.results]);

  const final = saved;
  controller.actions['career-match-finish']();
  assert.equal(saved, final);
});

test('the last result puts names and minutes in home and away columns, including old replays', () => {
  const career = createCareer(42);
  const away = career.opponentIds[0];
  const result = {duration: 94, events: [
    {type: 'goal', minute: 19, team: 'home', player: {id: 'a', nome: 'Pedro Leal'}},
    {type: 'goal', minute: 54, team: 'away', player: {id: 'b', nome: 'Jogador Visitante'}},
    {type: 'goal', minute: 92, team: 'home', player: {id: 'a', nome: 'Pedro Leal'}},
  ]};
  const scorers = careerScorers(result);
  const last = {home: CAREER_TEAM, away, homeGoals: 2, awayGoals: 1, scorers};
  const completed = {...career, round: 1, results: [[last]]};
  const html = renderCareer(completed, 'overview', ui);
  const homeColumn = html.match(/career-last-scorers home[^>]*>([\s\S]*?)<\/ul>/)[1];
  const awayColumn = html.match(/career-last-scorers away[^>]*>([\s\S]*?)<\/ul>/)[1];
  assert.match(homeColumn, /Pedro Leal[\s\S]*?19′, 90\+2′/);
  assert.doesNotMatch(homeColumn, /Jogador Visitante/);
  assert.match(awayColumn, /Jogador Visitante[\s\S]*?54′/);
  assert.doesNotMatch(awayColumn, /Pedro Leal/);

  const oldLast = {...last, scorers: scorers.map(({name, team, goals}) => ({name, team, goals}))};
  const replay = {season: career.season, round: 0, minute: 94, income: 400, results: [oldLast],
    tournament: {userMatches: [{homeId: CAREER_TEAM, awayId: away, result}]}};
  assert.match(renderCareer({...completed, results: [[oldLast]], replay}, 'overview', ui), /19′, 90\+2′/);
  assert.deepEqual(commitCareerRound({...career, replay}).results[0][0].scorers, scorers);
  assert.match(renderCareer({...completed, results: [[oldLast]]}, 'overview', ui), /Pedro Leal/);
});
