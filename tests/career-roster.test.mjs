import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {
  advanceCareerSeason, careerFixtures, careerPicks, changeCareerFormation, createCareer,
  migrateCareerRoster, prepareCareerRound, signCareerPlayer, upgradeCareerFacility,
} from '../js/career.js';
import {FORMATIONS, positionFit} from '../js/engine.js';

const catalogPlayers = new Set(allSquads.flatMap(squad => squad.jogadores));

test('the starting roster uses real catalog players and can fill every formation', () => {
  const career = createCareer(42);
  assert.equal(career.roster.length, 16);
  assert.equal(new Set(career.roster.map(player => player.id)).size, 16);
  assert.ok(career.roster.every(player => catalogPlayers.has(player)));
  for (const formation of Object.keys(FORMATIONS)) {
    const picks = careerPicks(changeCareerFormation(career, formation));
    assert.equal(new Set(picks.map(({player}) => player.id)).size, 11);
    assert.ok(picks.every(({player, slot}) => positionFit(player, slot) !== null));
  }
});

test('the academy adds an unused catalog player on upgrade and on season rollover', () => {
  const initial = createCareer(42);
  const upgraded = upgradeCareerFacility(initial, 'academy');
  const recruit = upgraded.roster.at(-1);
  assert.equal(upgraded.roster.length, initial.roster.length + 1);
  assert.ok(catalogPlayers.has(recruit));
  assert.ok(initial.roster.every(player => player.id !== recruit.id));
  const fixtures = careerFixtures(upgraded);
  const results = fixtures.map(round => round.map(([home, away]) => ({home, away, homeGoals: 0, awayGoals: 0})));
  const next = advanceCareerSeason({...upgraded, round: fixtures.length, results});
  assert.equal(next.roster.length, upgraded.roster.length + 1);
  assert.ok(catalogPlayers.has(next.roster.at(-1)));
  assert.equal(new Set(next.roster.map(player => player.id)).size, next.roster.length);
});

test('old saves replace fictitious players, avoid existing signings and retain progress and the pending replay', () => {
  const career = signCareerPlayer(createCareer(42), 'nation-brazil-1958/pele');
  const formerStarter = {id: 'career-starter-0', nome: 'Caio Reis', tags: ['GOL'], ovr: 77};
  const formerYouth = {id: 'career-youth-2-season', nome: 'Alex da Base', tags: ['VOL'], ovr: 73};
  const old = {
    ...career, version: 1, name: 'Time salvo', season: 2, budget: 12345,
    roster: [...career.roster, formerStarter, formerYouth],
    lineup: {...career.lineup, gol: formerStarter.id},
  };
  const saved = {...old, replay: prepareCareerRound(old)};
  const migrated = migrateCareerRoster(saved);
  assert.equal(migrated.roster.length, saved.roster.length);
  assert.equal(new Set(migrated.roster.map(player => player.id)).size, migrated.roster.length);
  assert.ok(migrated.roster.every(player => catalogPlayers.has(player)));
  assert.ok(careerPicks(migrated).every(({player, slot}) => positionFit(player, slot) !== null));
  assert.notEqual(migrated.lineup.gol, 'dida');
  assert.equal(migrated.lineup.ca, saved.lineup.ca);
  for (const field of ['name', 'season', 'formation', 'budget', 'results', 'seasons', 'replay']) {
    assert.equal(migrated[field], saved[field]);
  }
  assert.equal(migrated.roster.find(player => player.id === 'pele'), career.roster.at(-1));
  assert.equal(migrateCareerRoster(migrated), migrated);
});
