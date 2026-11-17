import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_TEAM, careerFixtures, careerSeasonScorers, careerTopScorers, createCareer} from '../js/career.js';
import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {renderCareer} from '../js/career-view.js';
import * as ui from '../js/ui.js';
import fs from 'node:fs';

test('season scorer combines only committed goals for the user club across both competitions', () => {
  const career = {
    results: [[
      {home: 'rival', away: CAREER_TEAM, homeGoals: 5, awayGoals: 2,
        scorers: [{name: 'A', playerId: 'a', goals: 2, team: 'away'}]},
      {home: 'rival', away: 'other', homeGoals: 8, awayGoals: 0,
        scorers: [{name: 'A', playerId: 'a', goals: 8, team: 'home'}]},
    ]],
    champions: {tournament: {matches: [
      {homeId: CAREER_TEAM, awayId: 'rival', result: {homeGoals: 3, awayGoals: 0,
        scorers: [{name: 'A', playerId: 'a', goals: 1, team: 'home'}, {name: 'B', playerId: 'b', goals: 2, team: 'home'}]}},
      {homeId: CAREER_TEAM, awayId: 'rival'},
    ]}, replay: {match: {result: {homeGoals: 9}}}},
  };
  const original = structuredClone(career);
  const ranking = careerSeasonScorers(career);
  assert.deepEqual(ranking.players.map(({name, goals}) => [name, goals]), [['A', 3], ['B', 2]]);
  assert.equal(ranking.incomplete, false);
  assert.equal(careerTopScorers(career).players.find(player => player.clubId === CAREER_TEAM).goals, 2);
  assert.deepEqual(career, original);
  assert.equal(careerSeasonScorers({...career, champions: null}).players[0].goals, 2);
  assert.equal(careerSeasonScorers({...career, results: [], champions: null}).players.length, 0);
  assert.equal(careerSeasonScorers({...career, champions: null, results: [[{home: CAREER_TEAM, away: 'rival', homeGoals: 1, awayGoals: 0}]]}).incomplete, true);
});

for (const league of CAREER_LEAGUES) {
  test(`end-of-season award uses the ${league.id} PNG and keeps the next season action below awards`, () => {
    const base = createCareer(42, league.teams[0].id);
    const scorer = base.roster[0];
    const career = {...base, champions: null, round: careerFixtures(base).length,
      results: [[{home: CAREER_TEAM, away: league.teams[1].id, homeGoals: 2, awayGoals: 0,
        scorers: [{name: scorer.nome, playerId: scorer.id, goals: 2, team: 'home'}]}]]};
    const html = renderCareer(career, 'overview', ui);
    assert.match(html, /É campeão!/);
    assert.match(html, new RegExp(`assets/trophies/${league.id}.png`));
    assert.match(html, /champion-confetti/);
    assert.match(html, /Artilheiro do time/);
    assert.match(html, /data-career-portrait/);
    assert.match(html, /2 gols/);
    assert.ok(html.indexOf('career-next-season') > html.indexOf('career-season-scorer'));
    assert.doesNotMatch(html, /career-lineup-preview/);
    const png = fs.readFileSync(new URL(`../assets/trophies/${league.id}.png`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png[25], 6, 'PNG includes an alpha channel');
    const loss = {...career, results: [[{home: CAREER_TEAM, away: league.teams[1].id, homeGoals: 0, awayGoals: 2}]]};
    const lossHtml = renderCareer(loss, 'overview', ui);
    assert.match(lossHtml, /Temporada encerrada/);
    assert.doesNotMatch(lossHtml, /champion-confetti|career-season-trophy/);
    assert.match(lossHtml, /Nenhum gol registrado/);
  });
}
