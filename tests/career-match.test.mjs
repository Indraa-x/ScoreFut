import test from 'node:test';
import assert from 'node:assert/strict';
import {commitCareerRound, createCareer, prepareCareerRound} from '../js/career.js';
import {renderMatch} from '../js/ui.js';
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

test('career uses the shared field and reveals the score only as the replay progresses', () => {
  const replay = prepareCareerRound(createCareer(32));
  const state = {mode: 'career', tournament: replay.tournament, userMatchIndex: 0, matchMinute: 0, matchSpeed: 4};
  const {result} = replay.tournament.userMatches[0];
  const kickoff = renderMatch(state, {career: true});
  assert.match(kickoff, /data-action="career-match-return"[^>]*disabled/);
  assert.match(kickoff, /data-live-pitch/);
  assert.equal(kickoff.match(/data-match-player/g).length, 22);
  assert.match(kickoff, /data-action="career-match-speed" data-value="4"[^>]*aria-pressed="true"/);
  assert.match(kickoff, /data-action="career-match-speed" data-value="8"/);
  assert.deepEqual(scoreAt(result, 0), [0, 0]);
  assert.deepEqual(scoreAt(result, result.duration), [result.homeGoals, result.awayGoals]);
  assert.doesNotMatch(renderMatch({...state, matchMinute: result.duration}, {career: true}), /data-action="career-match-return"[^>]*disabled/);
});
