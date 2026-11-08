import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_KEY, createCareer} from '../js/career.js';
import {initCareer} from '../js/career-controller.js';
import * as ui from '../js/ui.js';

function entry(saved = null) {
  const destinations = [];
  let writes = 0;
  const career = initCareer({
    app: {addEventListener() {}},
    navigate: screen => destinations.push(screen),
    storage: {
      read: key => key === CAREER_KEY ? saved : null,
      write: (_key, value) => { saved = value; writes++; return true; },
    },
    ui,
  });
  return {career, destinations, get saved() { return saved; }, get writes() { return writes; }};
}

test('the career intro renders the three coaches and creates a save only when the campaign begins', () => {
  const page = entry();
  const html = page.career.open();
  assert.match(html, /Começar campanha/);
  assert.match(html, /Central da Carreira/);
  assert.doesNotMatch(html, /data-action="career-tab"/);
  for (const asset of ['guardiola', 'ferguson', 'brasileirao-coach']) assert.ok(html.includes(`assets/career/${asset}.webp`));
  assert.equal(page.writes, 0);
  page.career.actions['career-start']();
  assert.match(page.career.open(), /Próxima partida/);
  assert.equal(page.writes, 1);
  assert.equal(page.saved.season, 1);
  assert.deepEqual(page.destinations, ['career']);
});

test('the career intro continues the existing save and returning to it leaves the campaign intact', () => {
  const saved = {...createCareer(42), name: 'Clube salvo', season: 10, budget: 60710};
  const page = entry(saved);
  const intro = page.career.open();
  assert.match(intro, /Continuar campanha/);
  assert.match(intro, /Campanha salva<\/small><strong>Clube salvo/);
  assert.match(intro, /Próxima partida · Rodada 1/);
  assert.equal(intro.match(/class="career-intro-card panel" data-action="career-tab"/g).length, 3);
  page.career.actions['career-start']();
  assert.match(page.career.open(), /Clube salvo/);
  page.career.actions.career();
  assert.match(page.career.open(), /Continuar campanha/);
  assert.equal(page.saved, saved);
  assert.equal(page.writes, 0);
});
