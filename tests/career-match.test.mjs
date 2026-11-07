import test from 'node:test';
import assert from 'node:assert/strict';
import {commitCareerRound, createCareer, prepareCareerRound} from '../js/career.js';
import * as ui from '../js/ui.js';
import {renderCareer} from '../js/career-view.js';
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
  assert.match(kickoff, /Mandante<\/small><\/div>\s*<div class="score-numbers"[\s\S]*?Visitante/);
  assert.match(kickoff, /career-live-field[\s\S]*?data-live-pitch[\s\S]*?aria-label="Velocidade da partida"/);
  assert.doesNotMatch(kickoff, /career-pitch-marker|data-action="career-match-return"/);
  assert.equal(kickoff.match(/data-match-player/g).length, 22);
  assert.match(kickoff, /data-action="career-match-speed" data-value="4"[^>]*aria-pressed="true"/);
  assert.match(kickoff, /data-action="career-match-speed" data-value="8"/);
  assert.deepEqual(scoreAt(result, 0), [0, 0]);
  assert.deepEqual(scoreAt(result, result.duration), [result.homeGoals, result.awayGoals]);
  assert.match(renderCareer({...career, replay}, 'overview', ui, {...state, matchMinute: result.duration}), /data-action="career-match-return"[^>]*>Avançar/);
});
