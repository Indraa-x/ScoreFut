import test from 'node:test';
import assert from 'node:assert/strict';
import {careerDestinations, careerPicks, changeCareerStarter, createCareer} from '../js/career.js';
import {renderCareer} from '../js/career-view.js';
import {positionFit} from '../js/engine.js';
import * as ui from '../js/ui.js';

test('a reserve replaces a starter only in a compatible slot and sends the starter to the bench', () => {
  const career = createCareer(42);
  const keeper = career.lineup.gol;
  const reserve = career.roster.find(player => player.tags.includes('GOL') && player.id !== keeper);
  assert.deepEqual(careerDestinations(career, reserve.id).map(slot => slot.id), ['gol']);
  assert.throws(() => changeCareerStarter(career, 'ca', reserve.id), /posição compatível/);
  const next = changeCareerStarter(career, 'gol', reserve.id);
  assert.equal(next.lineup.gol, reserve.id);
  assert.ok(!Object.values(next.lineup).includes(keeper));
  assert.equal(next.roster, career.roster);
  assert.equal(career.lineup.gol, keeper);
});

test('a starter swaps with another only when both players fit their new slots', () => {
  const career = createCareer(42);
  const first = career.lineup['zag-1'];
  const second = career.lineup['zag-2'];
  assert.ok(careerDestinations(career, first).some(slot => slot.id === 'zag-2'));
  assert.throws(() => changeCareerStarter(career, 'ca', first), /posição compatível/);
  const next = changeCareerStarter(career, 'zag-2', first);
  assert.equal(next.lineup['zag-1'], second);
  assert.equal(next.lineup['zag-2'], first);
  const picks = careerPicks(next);
  assert.equal(new Set(picks.map(({player}) => player.id)).size, 11);
  assert.ok(picks.every(({player, slot}) => positionFit(player, slot) !== null));
});

test('the roster renders the selected reserve and highlights only its compatible destination', () => {
  const career = createCareer(42);
  const html = renderCareer(career, 'squad', ui, null, undefined, {group: 'reserves', selectedId: 'carlos-germano'});
  assert.match(html, /data-action="career-select-player" data-value="carlos-germano" aria-pressed="true"/);
  const targets = [...html.matchAll(/class="career-squad-slot is-target"[^>]*data-value="([^"]+)"/g)];
  assert.deepEqual(targets.map(match => match[1]), ['gol']);
  assert.equal(html.match(/data-action="career-pick-slot"[^>]* disabled/g).length, 10);
  assert.equal(html.match(/class="career-squad-token"/g).length, 11);
});
