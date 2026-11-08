import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {CAREER_TEAM, careerFixtures, careerPicks, createCareer, prepareCareerRound} from '../js/career.js';
import {positionFit} from '../js/engine.js';

test('all modern clubs have eleven compatible starters and a full double round robin', () => {
  assert.deepEqual(CAREER_LEAGUES.map(league => league.teams.length), [18, 20, 20, 20, 20]);
  for (const league of CAREER_LEAGUES) {
    const teams = new Set(league.teams.map(team => team.id));
    for (const team of league.teams) {
      const career = createCareer(17, team.id);
      assert.equal(career.opponentIds.length, teams.size - 1);
      assert.ok(career.opponentIds.every(id => id !== team.id && teams.has(id)));
      assert.equal(new Set(team.jogadores.map(player => player.id)).size, team.jogadores.length);
      assert.ok(team.jogadores.every(player => Number.isInteger(player.ovr) && player.ovr >= 40 && player.ovr <= 99));
      assert.ok(careerPicks(career).every(({player, slot}) => positionFit(player, slot) !== null));
      const fixtures = careerFixtures(career);
      assert.equal(fixtures.length, 2 * (teams.size - 1));
      assert.ok(fixtures.every(round => round.length === teams.size / 2));
      assert.equal(new Set(fixtures.flat().map(fixture => fixture.join(':'))).size, teams.size * (teams.size - 1));
    }
    const replay = prepareCareerRound(createCareer(17, league.teams[0].id));
    assert.equal(replay.tournament.userTeamId, CAREER_TEAM);
    assert.equal(replay.results.length, league.teams.length / 2);
    assert.match(replay.tournament.userMatches[0].stageLabel, /Rodada 1/);
    assert.ok(replay.tournament.userMatches[0].stageLabel.startsWith(league.name));
  }
});

test('European OVRs come from EA and Brazilian estimates are explicitly flagged', () => {
  const league = id => CAREER_LEAGUES.find(item => item.id === id);
  const players = id => league(id).teams.flatMap(team => team.jogadores);
  assert.equal(players('laliga').find(player => player.nome === 'Kylian Mbappé').ovr, 91);
  assert.equal(players('premier').find(player => player.nome === 'Erling Haaland').ovr, 91);
  assert.equal(players('bundesliga').find(player => player.nome === 'Harry Kane').ovr, 90);
  assert.ok(CAREER_LEAGUES.filter(item => item.id !== 'brasileirao').every(item => players(item.id).every(player => player.ratingKind === 'career-fc27')));
  assert.ok(players('brasileirao').some(player => player.ratingKind === 'career-fc27'));
  assert.ok(players('brasileirao').some(player => player.ratingKind === 'career-estimate'));
});
