import test from 'node:test';
import assert from 'node:assert/strict';
import { clubs, allSquads } from '../data/clubs.js';
import { createManagerCareer, managerMarket, managerSquadStrength, playerValue, sellManagerPlayer, signManagerPlayer, simulateManagerSeason, squadForClub } from '../js/manager-career.js';

function newCareer(budget = 100) {
  const selected = squadForClub(clubs, allSquads, clubs[0].id);
  return createManagerCareer(selected.club, selected.squad, budget, 'test-career');
}

test('career starts with a club roster and the user-selected transfer budget', () => {
  const career = newCareer(250);
  assert.equal(career.budget, 250);
  assert.equal(career.roster.length, 11);
  assert.equal(career.clubId, clubs[0].id);
  assert.ok(managerSquadStrength(career.roster) >= 50);
});

test('market values rise with OVR, hides owned players, and signs within the budget', () => {
  assert.ok(playerValue({ ovr: 95 }) > playerValue({ ovr: 80 }));
  let career = newCareer(250);
  const market = managerMarket(allSquads, career);
  assert.equal(new Set(market.map(player => player.id)).size, market.length);
  const target = market.find(player => player.value <= career.budget);
  assert.ok(target);
  const startingBudget = career.budget;
  const signing = signManagerPlayer(career, target);
  assert.equal(signing.ok, true);
  career = signing.career;
  assert.equal(career.roster.length, 12);
  assert.equal(career.budget, Math.round((startingBudget - playerValue(target)) * 10) / 10);
  assert.ok(!managerMarket(allSquads, career).some(player => player.id === target.id));
  assert.equal(signManagerPlayer(career, target).ok, false);
});

test('selling preserves an eleven-player squad and returns a discounted transfer fee', () => {
  const career = newCareer(250);
  const initialSale = sellManagerPlayer(career, career.roster[0].entryId);
  assert.equal(initialSale.ok, false);
  const signed = signManagerPlayer(career, managerMarket(allSquads, career).find(player => player.value <= career.budget));
  const sale = sellManagerPlayer(signed.career, signed.career.roster.at(-1).entryId);
  assert.equal(sale.ok, true);
  assert.equal(sale.career.roster.length, 11);
  assert.equal(sale.career.budget, Math.round((signed.career.budget + sale.fee) * 10) / 10);
});

test('season simulation is seeded, progresses the career, and awards the right final place', () => {
  const career = newCareer(100);
  const first = simulateManagerSeason(career, allSquads, 12345);
  const second = simulateManagerSeason(career, allSquads, 12345);
  assert.deepEqual(first, second);
  assert.equal(first.ok, true);
  assert.equal(first.record.standings.length, career.region === 'brasil' ? 15 : 21);
  assert.equal(first.record.place, first.record.standings.findIndex(team => team.id === career.clubId) + 1);
  assert.equal(first.career.season, career.season + 1);
  assert.equal(first.record.points, first.record.wins * 3 + first.record.draws);
  assert.equal(first.career.seasons.length, 1);
});
