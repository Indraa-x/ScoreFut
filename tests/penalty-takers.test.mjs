import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMATIONS, calculateTeam, penaltyTakers, simulateMatch, mulberry32, simulationSettings} from '../js/engine.js';
const team = id => {
  const lineup = FORMATIONS['4-3-3'].slots.map((slot, i) => ({slot,
    player: {id: id + i, nome: id + i, ovr: 75 + i, tags: [slot.label]}}));
  return {id, name: id, lineup, strength: calculateTeam(lineup)};
};

test('penalty hierarchy follows ability through transfers and excludes players outside the lineup', () => {
  const home = team('a'), away = team('b');
  const specialist = {...home.lineup.at(-1).player, ovr: 90, atributos: {penaltis: 98, finalizacao: 88}};
  home.lineup.at(-1).player = specialist;
  assert.equal(penaltyTakers(home)[0].id, specialist.id);
  away.lineup[2].player = structuredClone(specialist);
  assert.equal(penaltyTakers(away)[0].id, specialist.id);
  assert.ok(!penaltyTakers({...away, lineup: away.lineup.filter(e => e.player.id !== specialist.id)}).some(p => p.id === specialist.id));
  assert.ok(!penaltyTakers(home).some(p => p.id === home.lineup[0].player.id));
  assert.equal(penaltyTakers(home, true).at(-1).id, home.lineup[0].player.id);
});

test('regular penalties use the available specialist; shootouts follow the ordered squad without repeating early', () => {
  const home = team('a'), away = team('b');
  const settings = simulationSettings('Normal', {redCardChance: 0});
  let regular = 0, shootouts = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const result = simulateMatch(home, away, mulberry32(seed), {knockout: true, settings});
    for (const [side, squad] of [['home', home], ['away', away]]) {
      const ordered = penaltyTakers(squad, true);
      for (const event of result.events.filter(e => e.type === 'penalty' && !e.shootout && e.team === side)) {
        regular++;
        assert.equal(event.player.id, penaltyTakers(squad)[0].id);
      }
      const kicks = result.events.filter(e => e.type === 'penalty' && e.shootout && e.team === side);
      if (kicks.length) shootouts++;
      kicks.forEach((kick, index) => assert.equal(kick.player.id, ordered[index % ordered.length].id));
    }
  }
  assert.ok(regular > 10);
  assert.ok(shootouts > 10);
});
