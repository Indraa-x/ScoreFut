import test from 'node:test';
import assert from 'node:assert/strict';
import {createCareer, careerClubStats, CAREER_TEAM} from '../js/career.js';
import {careerLeague} from '../data/career-leagues.js';
import {renderCareer} from '../js/career-view.js';
import * as ui from '../js/ui.js';

test('club records count committed user games and goals across competitions and retain historic titles', () => {
  const base = createCareer(42, careerLeague('premier').teams[0].id);
  const career = {...base, season: 3, round: 1,
    seasons: [{number: 1, position: 1, championsWinner: 'other'}, {number: 2, position: 4, championsWinner: CAREER_TEAM}],
    results: [[{home: CAREER_TEAM, away: 'other', homeGoals: 3, awayGoals: 1},
      {home: 'other', away: 'third', homeGoals: 8, awayGoals: 0}]],
    champions: {tournament: {complete: false, championId: null, matches: [
      {homeId: 'other', awayId: CAREER_TEAM, result: {homeGoals: 1, awayGoals: 2}},
      {homeId: CAREER_TEAM, awayId: 'other'},
    ]}, replay: {pending: {complete: true, championId: CAREER_TEAM}}},
  };
  const before = structuredClone(career);
  assert.deepEqual(careerClubStats(career), {played: 2, goals: 5, titles: [
    {season: 1, competition: 'league'}, {season: 2, competition: 'champions'},
  ]});
  const html = renderCareer({...career, results: []}, 'club', ui);
  assert.match(html, /28\/29/);
  assert.match(html, /Campeão · 26\/27/);
  assert.match(html, /Campeão · 27\/28/);
  assert.doesNotMatch(html, /Força dos titulares|Ver elenco|Jogadores no elenco|Personalizar clube/);
  assert.deepEqual(career, before);
  const completed = {...career, champions: {tournament: {...career.champions.tournament, complete: true, championId: CAREER_TEAM}}};
  assert.equal(careerClubStats(completed).titles.length, 3);
  const archived = {...completed, seasons: [...career.seasons, {number: 3, position: 2, championsWinner: CAREER_TEAM}]};
  assert.equal(careerClubStats(archived).titles.length, 3);
});
