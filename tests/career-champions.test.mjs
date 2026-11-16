import test from 'node:test';
import assert from 'node:assert/strict';
import {careerLeague, careerSeasonTeam} from '../data/career-leagues.js';
import {
  CAREER_TEAM, advanceCareerSeason, careerChampionsFixture, careerFixtures, careerTable, changeCareerStyle,
  commitCareerChampionsMatch, commitCareerRound, createCareer, prepareCareerChampionsMatch, prepareCareerRound,
} from '../js/career.js';
import {initCareer} from '../js/career-controller.js';
import {renderCareer} from '../js/career-view.js';
import {penaltyEvents} from '../js/match-penalties.js';
import * as ui from '../js/ui.js';

function finishLeague(career) {
  for (const _ of careerFixtures(career)) {
    const replay = prepareCareerRound(career);
    career = commitCareerRound({...career, replay: {...replay, minute: replay.tournament.userMatches[0].result.duration}});
  }
  return career;
}

const bayern = careerLeague('bundesliga').teams.find(team => team.nome === 'Bayern Munich');
const seasonOne = finishLeague(createCareer(42, bayern.id));
const seasonTwo = advanceCareerSeason(seasonOne);

test('the next Champions takes the actual domestic top four and four from each other European league', () => {
  const {tournament} = seasonTwo.champions;
  const leagueId = id => id === CAREER_TEAM ? seasonOne.leagueId : careerSeasonTeam(id).leagueId;
  assert.deepEqual(tournament, advanceCareerSeason(seasonOne).champions.tournament);
  assert.equal(tournament.teams.length, 16);
  assert.equal(new Set(tournament.teams.map(team => team.id)).size, 16);
  assert.deepEqual(new Set(tournament.teams.filter(team => leagueId(team.id) === 'bundesliga').map(team => team.id)),
    new Set(careerTable(seasonOne).slice(0, 4).map(row => row.id)));
  assert.equal(tournament.groups.length, 4);
  for (const group of tournament.groups) {
    assert.deepEqual(new Set(group.teamIds.map(leagueId)), new Set(['bundesliga', 'premier', 'laliga', 'seriea']));
    for (const id of group.teamIds) {
      const fixtures = tournament.matches.filter(match => [match.homeId, match.awayId].includes(id));
      assert.equal(fixtures.length, 3);
      assert.ok(fixtures.some(match => match.homeId === id) && fixtures.some(match => match.awayId === id));
    }
  }
  assert.match(renderCareer(seasonOne, 'overview', ui), /garantiu vaga na próxima Champions League/);
  assert.equal(renderCareer(seasonOne, 'standings', ui).match(/career-champions-zone/g).length, 4);
});

test('Champions excludes Brazil and runs in the background when the European club misses the cut', () => {
  const brazil = createCareer(42, careerLeague('brasileirao').teams[0].id);
  assert.equal(advanceCareerSeason({...brazil, round: careerFixtures(brazil).length}).champions, undefined);
  assert.doesNotMatch(renderCareer(brazil, 'standings', ui), /career-champions-zone|data-value="champions"/);

  const career = {...seasonOne, results: seasonOne.results.map(round => round.map(game =>
    game.home === CAREER_TEAM ? {...game, homeGoals: 0, awayGoals: 3}
      : game.away === CAREER_TEAM ? {...game, homeGoals: 3, awayGoals: 0} : game))};
  assert.ok(careerTable(career).findIndex(row => row.id === CAREER_TEAM) >= 4);
  const next = advanceCareerSeason(career);
  assert.ok(next.champions.tournament.complete);
  assert.ok(next.champions.tournament.championId);
  assert.equal(careerChampionsFixture(next), undefined);
  assert.equal(next.champions.tournament.bracket.at(-1).matches.length, 1);
  assert.match(renderCareer(next, 'champions', ui), /ficou fora dos quatro primeiros/);
});

test('Champions results stay private until full time and advance independently of the league', () => {
  const initial = seasonTwo;
  const replay = prepareCareerChampionsMatch(initial);
  const changed = prepareCareerChampionsMatch(changeCareerStyle(initial, 'attacking'));
  const otherGames = tournament => tournament.matches.filter(game => ![game.homeId, game.awayId].includes(CAREER_TEAM));
  assert.deepEqual(otherGames(replay.pending), otherGames(changed.pending));
  let saved = {...initial, champions: {...initial.champions, replay: {...replay, minute: 15}}};
  const restore = () => initCareer({
    app: {addEventListener() {}, querySelector: () => null},
    storage: {read: () => JSON.parse(JSON.stringify(saved)), write: (_key, next) => { saved = next; return true; }},
    ui, render() {}, toast: message => assert.fail(message),
  });
  assert.equal(commitCareerChampionsMatch(saved), saved);
  assert.doesNotMatch(renderCareer(saved, 'champions', ui), /data-action="career-champions-tie"/);
  const controller = restore();
  controller.setTab('champions');
  assert.match(controller.open(), /Continuar partida/);
  controller.actions['career-champions-play'](`${saved.season}:${replay.id}`);
  assert.match(controller.open(), /data-live-pitch/);
  controller.attachMatch(true);
  controller.actions['career-match-finish']();
  assert.equal(saved.champions.tournament.progressRound, 1);
  assert.equal(saved.champions.replay, null);
  assert.equal(saved.round, 0);
  assert.deepEqual(saved.results, initial.results);
  assert.ok(saved.budget > initial.budget);
  assert.match(controller.open(), /data-action="career-match-return"/);
  const written = saved;
  controller.actions['career-match-finish']();
  assert.equal(saved, written);
});

test('the Career knockout begins at the quarters and waits for the deciding shootout', () => {
  let career = seasonTwo;
  assert.throws(() => advanceCareerSeason({...career, round: careerFixtures(career).length}), /Conclua a Champions League/);
  const played = [];
  while (careerChampionsFixture(career)) {
    const replay = prepareCareerChampionsMatch(career);
    played.push(replay.match);
    career = {...career, champions: {...career.champions, replay: {...replay, minute: replay.match.result.duration}}};
    const events = penaltyEvents(replay.match.result);
    if (events.length) {
      const key = `${replay.pending.seed}:${replay.id}`;
      const duringShootout = {...career, champions: {...career.champions, replay: {...career.champions.replay, penaltyReplay: {key, revealed: 0}}}};
      assert.equal(commitCareerChampionsMatch(duringShootout), duringShootout);
    }
    career = commitCareerChampionsMatch(career);
  }
  assert.deepEqual(played.slice(0, 5).map(match => match.stage), ['group', 'group', 'group', 'quarter', 'quarter']);
  assert.ok(played.some(match => match.result.penalties));
  const tournament = career.champions.tournament;
  assert.ok(tournament.complete);
  assert.deepEqual(tournament.bracket.map(stage => stage.ties.length), [4, 2, 1]);
  assert.equal(tournament.bracket.at(-1).matches.length, 1);
  assert.ok(tournament.bracket.at(-1).matches[0].neutral);
  const html = renderCareer(career, 'champions', ui, null, undefined, undefined, undefined, {championsView: 'knockout'});
  assert.match(html, /career-champions-tie/);
  assert.doesNotMatch(html, /Oitavas de final/);
});
