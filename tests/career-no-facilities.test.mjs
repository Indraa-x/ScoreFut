import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceCareerSeason, careerFixtures, CAREER_TEAM, createCareer, migrateCareerRoster, prepareCareerRound, prepareCareerChampionsMatch} from '../js/career.js';

const retiredLevels = {training:5, academy:5, stadium:5, gym:5, shop:5, recovery:5, analysis:5, hospitality:5};

test('retired installation data is removed without changing the saved campaign or its pending replay', () => {
  for (const clubId of [undefined, 'career26-bundesliga-21']) assert.equal(Object.hasOwn(createCareer(42, clubId), 'facilities'), false);
  const initial = createCareer(42);
  const replay = prepareCareerRound(initial);
  const saved = Object.freeze({...initial, facilities:retiredLevels, replay, budget:123456});
  const migrated = migrateCareerRoster(saved);
  assert.equal(Object.hasOwn(migrated, 'facilities'), false);
  assert.equal(saved.facilities, retiredLevels);
  assert.equal(migrated.budget, saved.budget);
  for (const field of ['roster','lineup','results','seasons','replay']) assert.equal(migrated[field], saved[field]);
  assert.equal(migrateCareerRoster(migrated), migrated);
});

test('old installation levels no longer boost league strength, goals or match income', () => {
  const initial = createCareer(42, 'career26-bundesliga-21');
  assert.deepEqual(prepareCareerRound({...initial,facilities:retiredLevels}), prepareCareerRound(initial));
});

test('Champions matches replace stored installation bonuses with the current squad and playing style', () => {
  const initial = createCareer(42, 'career26-bundesliga-21');
  const old = {...initial, facilities:retiredLevels, champions:{...initial.champions,
    tournament:{...initial.champions.tournament,teams:initial.champions.tournament.teams.map(team=>team.id===CAREER_TEAM
      ? {...team,tacticalProfile:{attack:1.08,midfield:1.08,defense:1.08,tempo:0},strength:{...team.strength,overall:99},
        lineup:team.lineup.map(pick=>({...pick,player:{...pick.player,ovr:99}}))}
      : team)}}};
  assert.deepEqual(prepareCareerChampionsMatch(old), prepareCareerChampionsMatch(initial));
});

test('season rollover keeps the roster without automatic academy recruits', () => {
  const initial = createCareer(42);
  const fixtures = careerFixtures(initial);
  const results = fixtures.map(round=>round.map(([home,away])=>({home,away,homeGoals:0,awayGoals:0})));
  const saved = migrateCareerRoster({...initial,facilities:retiredLevels,round:fixtures.length,results});
  const next = advanceCareerSeason(saved);
  assert.equal(next.season, saved.season+1);
  assert.equal(next.roster, saved.roster);
  assert.equal(Object.hasOwn(next,'facilities'), false);
});
