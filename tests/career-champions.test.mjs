import test from 'node:test';
import assert from 'node:assert/strict';
import {careerLeague, careerSeasonTeam} from '../data/career-leagues.js';
import {
  CAREER_TEAM, advanceCareerSeason, careerChampionsFixture, careerFixtures, careerNextCompetition, careerTable, changeCareerStyle,
  commitCareerChampionsMatch, commitCareerRound, createCareer, migrateCareerChampions, nextCareerMatch,
  prepareCareerChampionsMatch, prepareCareerRound,
} from '../js/career.js';
import {initCareer} from '../js/career-controller.js';
import {renderCareer} from '../js/career-view.js';
import {renderCareerSetup} from '../js/career-setup-view.js';
import * as ui from '../js/ui.js';

function finishLeague(career) {
  for (const _ of careerFixtures(career)) {
    const replay = prepareCareerRound(career);
    career = commitCareerRound({...career, replay: {...replay, minute: replay.tournament.userMatches[0].result.duration}});
  }
  return career;
}

function finishChampions(career) {
  while (careerChampionsFixture(career)) {
    const replay = prepareCareerChampionsMatch(career);
    career = commitCareerChampionsMatch({...career, champions: {...career.champions,
      replay: {...replay, minute: replay.match.result.duration}}});
  }
  return career;
}

const bayern = careerLeague('bundesliga').teams.find(team => team.nome === 'Bayern Munich');
const seasonOne = finishChampions(finishLeague(createCareer(42, bayern.id)));
const seasonTwo = advanceCareerSeason(seasonOne);

test('the 2026/27 European top four start with domestic and Champions fixtures', () => {
  const expected = {
    bundesliga: ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'VfB Stuttgart'],
    premier: ['Arsenal', 'Manchester City', 'Manchester United', 'Aston Villa'],
    laliga: ['Barcelona', 'Real Madrid', 'Villarreal', 'Atlético Madrid'],
    seriea: ['Internazionale', 'Napoli', 'AS Roma', 'Como'],
    brasileirao: [],
  };
  const field = Object.values(expected).flat().sort();
  for (const [leagueId, qualifiers] of Object.entries(expected)) {
    const league = careerLeague(leagueId);
    const setup = renderCareerSetup(leagueId, null, [], ui);
    assert.equal((setup.match(/career-club-champions/g) ?? []).length, qualifiers.length);
    for (const club of league.teams) {
      const career = createCareer(42, club.id);
      assert.ok(nextCareerMatch(career));
      assert.equal(Boolean(careerChampionsFixture(career)), qualifiers.includes(club.nome), club.nome);
      if (career.champions) {
        assert.deepEqual(career.champions.tournament.teams.map(team => team.name).sort(), field);
        assert.equal(career.champions.tournament.progressRound, 0);
      }
    }
  }
});

test('opening a previously saved first season adds Champions without resetting domestic progress', () => {
  const {champions, ...newSave} = createCareer(42, bayern.id);
  const replay = prepareCareerRound(newSave);
  const played = commitCareerRound({...newSave, replay: {...replay, minute: replay.tournament.userMatches[0].result.duration}});
  const continued = migrateCareerChampions(played);
  assert.deepEqual(continued, {...played, champions});
  assert.equal(migrateCareerChampions(continued), continued);
  const laterSave = {...played, season: 2};
  assert.equal(migrateCareerChampions(laterSave), laterSave);
});

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
  assert.match(renderCareer(next, 'standings', ui), /ficou fora dos quatro primeiros/);
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
  assert.doesNotMatch(renderCareer(saved, 'standings', ui), /data-action="career-champions-tie"/);
  const controller = restore();
  controller.setTab('overview');
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

test('the same overview alternates between domestic and European fixtures', () => {
  let career = createCareer(42, bayern.id);
  assert.equal(careerNextCompetition(career), 'league');
  for (let round = 0; round < 4; round++) {
    const replay = prepareCareerRound(career);
    career = commitCareerRound({...career, replay: {...replay, minute: replay.tournament.userMatches[0].result.duration}});
  }
  assert.equal(careerNextCompetition(career), 'champions');
  const html = renderCareer(career, 'overview', ui);
  assert.match(html, /Próxima partida[\s\S]*Champions League[\s\S]*data-action="career-champions-play"/);
  assert.doesNotMatch(html, /data-value="champions"|data-action="career-play"/);
  const replay = prepareCareerChampionsMatch(career);
  career = commitCareerChampionsMatch({...career, champions: {...career.champions, replay: {...replay, minute: replay.match.result.duration}}});
  assert.equal(career.round, 4);
  assert.equal(careerNextCompetition(career), 'league');
  assert.match(renderCareer(career, 'overview', ui), /Rodada 5 de 34[\s\S]*data-action="career-play"/);
});

test('the Career knockout begins at the quarters and waits for the deciding shootout', () => {
  let career = seasonTwo;
  assert.throws(() => advanceCareerSeason({...career, round: careerFixtures(career).length}), /Conclua a Champions League/);
  const played = [];
  while (careerChampionsFixture(career)) {
    const replay = prepareCareerChampionsMatch(career);
    played.push(replay.match);
    career = {...career, champions: {...career.champions, replay: {...replay, minute: replay.match.result.duration}}};
    if (replay.match.stage === 'quarter' && replay.match.leg === 2) {
      const {result} = replay.match;
      const match = {...replay.match, result: {...result, penalties: [1, 0], events: [
        {type: 'penalty', shootout: true, team: 'home', converted: true, minute: result.duration},
      ]}};
      const key = `${replay.pending.seed}:${replay.id}`;
      const unfinished = {...career.champions.replay, match, penaltyReplay: {key, revealed: 0}};
      const duringShootout = {...career, champions: {...career.champions, replay: unfinished}};
      assert.equal(commitCareerChampionsMatch(duringShootout), duringShootout);
    }
    career = commitCareerChampionsMatch(career);
  }
  assert.deepEqual(played.slice(0, 5).map(match => match.stage), ['group', 'group', 'group', 'quarter', 'quarter']);
  const tournament = career.champions.tournament;
  assert.ok(tournament.complete);
  assert.deepEqual(tournament.bracket.map(stage => stage.ties.length), [4, 2, 1]);
  assert.equal(tournament.bracket.at(-1).matches.length, 1);
  assert.ok(tournament.bracket.at(-1).matches[0].neutral);
  const html = renderCareer(career, 'standings', ui, null, undefined, undefined, undefined, {championsView: 'knockout'});
  assert.match(html, /career-champions-tie/);
  assert.doesNotMatch(html, /Oitavas de final/);
});
