import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {createCareer, MAX_CAREER_ROSTER, signCareerPlayer} from '../js/career.js';
import {careerMarketCatalog, careerMarketPage} from '../js/career-market.js';
import {renderCareer} from '../js/career-view.js';
import * as ui from '../js/ui.js';

test('career market indexes all club and national squad versions and pages the results', () => {
  const career = createCareer(42);
  const {byId} = careerMarketCatalog();
  assert.equal(byId.size, allSquads.reduce((total, squad) => total + squad.jogadores.length, 0));
  for (const squad of allSquads) {
    assert.ok(squad.jogadores.every(player => byId.get(`${squad.id}/${player.id}`)?.player === player));
  }
  const first = careerMarketPage(career);
  const second = careerMarketPage(career, {page: 2});
  assert.equal(first.total, byId.size);
  assert.equal(first.entries.length, 12);
  assert.equal(second.page, 2);
  assert.ok(second.entries.every(entry => !first.entries.includes(entry)));
  const found = careerMarketPage(career, {search: 'pele brasil', decade: '1950', position: 'SA'});
  assert.deepEqual(found.entries.map(offer => offer.id), ['nation-brazil-1958/pele']);
});

test('hiring retains the selected historical version and enforces budget, space and identity', () => {
  const career = createCareer(42);
  const nationalId = 'nation-brazil-1958/pele';
  const clubId = 'santos-1963/pele';
  const national = careerMarketCatalog().byId.get(nationalId);
  const club = careerMarketCatalog().byId.get(clubId);
  assert.notEqual(national.player.ovr, club.player.ovr);
  const signed = signCareerPlayer(career, nationalId);
  assert.deepEqual(signed.roster.at(-1), national.player);
  assert.equal(signed.budget, career.budget - national.price);
  assert.deepEqual(signed.lineup, career.lineup);
  const restored = JSON.parse(JSON.stringify(signed));
  assert.throws(() => signCareerPlayer(restored, clubId), /já está no elenco/);
  assert.throws(() => signCareerPlayer({...career, budget: national.price - 1}, nationalId), /Saldo insuficiente/);
  const roster = Array.from({length: MAX_CAREER_ROSTER}, (_, index) => ({id: `reserve-${index}`}));
  assert.throws(() => signCareerPlayer({...career, roster}, nationalId), /elenco está cheio/);
  assert.ok(careerMarketPage(restored, {search: 'pelé', affordable: true}).entries.every(
    offer => offer.player.id !== national.player.id && offer.price <= restored.budget,
  ));
});

test('a market card shows the selected source crest, OVR and purchase action', () => {
  const filters = {search: 'pele brasil 1958'};
  const html = renderCareer(createCareer(42), 'market', ui, null, {status: 'ready', filters});
  assert.match(html, /career-market-token[^>]+aria-label="\d+ OVR"[\s\S]*?nation-brazil\.png/);
  assert.match(html, /<h3>Pelé<\/h3>[\s\S]*?Brasil[\s\S]*?1958/);
  assert.match(html, /data-action="career-sign" data-value="nation-brazil-1958\/pele">Contratar/);
});
