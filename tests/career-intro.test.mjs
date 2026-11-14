import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_KEY, createCareer} from '../js/career.js';
import {initCareer} from '../js/career-controller.js';
import * as ui from '../js/ui.js';

function entry(saved = null) {
  const destinations = [];
  const slots = new Map(saved ? [[CAREER_KEY, saved]] : []);
  let writes = 0;
  const app = {addEventListener() {}, querySelector() { return null; }};
  const career = initCareer({
    app,
    navigate: screen => destinations.push(screen),
    render() {},
    toast(message) { assert.fail(message); },
    storage: {
      read: key => slots.get(key) ?? null,
      write: (key, value) => { slots.set(key, value); writes++; return true; },
    },
    ui,
  });
  return {app, career, destinations, slots, get writes() { return writes; }};
}

test('the career intro lets a new player start a campaign', () => {
  const page = entry();
  const html = page.career.open();
  assert.match(html, /Começar campanha/);
  assert.match(html, /data-action="career-start">/);
  assert.match(html, /Central da Carreira/);
  assert.doesNotMatch(html, /data-action="career-tab"/);
  for (const asset of ['guardiola', 'ferguson', 'brasileirao-coach']) assert.ok(html.includes(`assets/career/${asset}.webp`));
  assert.equal(page.writes, 0);
  assert.deepEqual(page.destinations, []);
});

test('the saved career can be continued and the intro offers a new campaign', () => {
  const saved = {...createCareer(42), name: 'Clube salvo', season: 10, budget: 60710};
  const page = entry(saved);
  const intro = page.career.open();
  assert.match(intro, /Continuar campanha/);
  assert.match(intro, /data-action="career-start">/);
  assert.match(intro, /Campanha salva<\/small><strong>Clube salvo/);
  assert.match(intro, /Próxima partida · Rodada 1/);
  assert.equal(intro.match(/class="career-intro-card panel" data-action="career-tab"/g)?.length, 3);
  assert.match(intro, /data-action="career-new" data-value="">Nova campanha/);
  assert.equal(page.slots.get(CAREER_KEY), saved);
  assert.equal(page.writes, 0);
  page.career.actions['career-new']();
  page.career.actions['career-select-league']('bundesliga');
  page.career.actions['career-select-club']('career26-bundesliga-21');
  page.career.actions['career-create']();
  assert.match(page.career.open(), /Bayern Munich/);
  page.career.actions['career-new']();
  page.career.actions['career-load']('');
  assert.match(page.career.open(), /Clube salvo/);
  assert.equal(page.slots.get(CAREER_KEY), saved);
});

test('career navigation animates on entry and on a tab change', () => {
  const {app, career} = entry(createCareer(42));
  career.setTab('overview');
  assert.match(career.open(), /class="career-tabs is-entering"/);

  const content = {dataset: {careerTab: 'overview'}};
  app.querySelector = selector => selector === '.career-content' ? content : null;
  assert.match(career.open(), /class="career-tabs"/);

  career.actions['career-tab']('standings');
  const html = career.open();
  assert.match(html, /class="career-tabs is-switching"/);
  assert.match(html, /data-value="standings" aria-current="page"/);

  content.dataset.careerTab = 'standings';
  assert.match(career.open(), /class="career-tabs"/);
});
