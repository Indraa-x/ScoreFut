import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {careerSale, createCareer, MAX_CAREER_ROSTER, sellCareerPlayer, signCareerPlayer} from '../js/career.js';
import {careerMarketCatalog, careerMarketPage, MAX_CAREER_PRICE} from '../js/career-market.js';
import {renderCareer} from '../js/career-view.js';
import * as ui from '../js/ui.js';

const {offers, byId} = careerMarketCatalog();
const mbappe = byId.get('career26-laliga-243/kylian-mbappe');

test('the market uses only the current career leagues and pages filtered results', () => {
  const squads = CAREER_LEAGUES.flatMap(league => league.teams);
  assert.equal(byId.size, squads.reduce((total, squad) => total + squad.jogadores.length, 0));
  assert.ok(offers.every(offer => squads.includes(offer.squad) && offer.squad.ano === 2026));
  for (const league of CAREER_LEAGUES) {
    assert.ok(offers.some(offer => offer.league === league && offer.price > 0));
  }
  for (const career of [createCareer(42), createCareer(42, squads[0].id)]) {
    const first = careerMarketPage(career);
    const second = careerMarketPage(career, {page: 2});
    assert.equal(first.total, byId.size);
    assert.equal(first.entries.length, 12);
    assert.ok(second.entries.every(entry => !first.entries.includes(entry)));
    assert.equal(careerMarketPage(career, {search: 'Pelé'}).total, 0);
    assert.deepEqual(careerMarketPage(career, {search: 'mbappe madrid', leagueId: 'laliga', position: 'CA'}).entries, [mbappe]);
    assert.equal(careerMarketPage(career, {search: 'mbappe madrid', leagueId: 'premier'}).total, 0);
  }
});

test('buying and selling use the same capped in-game euro valuation', () => {
  const career = {...createCareer(42), budget: 2_000_000};
  const unknown = offers.find(offer => offer.price === null);
  assert.equal(mbappe.euros, 200_000_000);
  assert.ok(mbappe.price > 80_000);
  assert.ok(Math.max(...offers.map(offer => offer.price ?? 0)) < MAX_CAREER_PRICE);
  const vini = byId.get('career26-laliga-243/vinicius-junior');
  assert.equal(vini.euros, 130_000_000);
  assert.ok(vini.price > 60_000 && vini.price < mbappe.price);
  const courtois = offers.find(offer => offer.player.nome === 'Thibaut Courtois');
  assert.equal(courtois.euros, 15_000_000);
  assert.equal(courtois.price, 64_840);
  assert.ok(courtois.price < offers.find(offer => offer.player.nome === 'Gianluigi Donnarumma').price);
  assert.equal(byId.get('career26-brasileirao-20008/neymar').euros, 8_000_000);
  const signed = signCareerPlayer(career, mbappe.id);
  assert.deepEqual(signed.roster.at(-1), mbappe.player);
  assert.equal(signed.budget, career.budget - mbappe.price);
  assert.equal(careerSale(signed, mbappe.player.id).price, mbappe.price);
  assert.equal(sellCareerPlayer(signed, mbappe.player.id).budget, signed.budget + mbappe.price);
  assert.deepEqual(signed.lineup, career.lineup);
  assert.throws(() => signCareerPlayer(JSON.parse(JSON.stringify(signed)), mbappe.id), /já está no elenco/);
  assert.throws(() => signCareerPlayer({...career, budget: mbappe.price - 1}, mbappe.id), /Saldo insuficiente/);
  assert.throws(() => signCareerPlayer(career, 'nation-brazil-1958/pele'), /Jogador não encontrado/);
  assert.throws(() => signCareerPlayer({...career, roster: []}, unknown.id), /sem valor de mercado confirmado/);
  const roster = Array.from({length: MAX_CAREER_ROSTER}, (_, index) => ({id: `reserve-${index}`}));
  assert.throws(() => signCareerPlayer({...career, roster}, mbappe.id), /elenco está cheio/);
  assert.ok(careerMarketPage(career, {affordable: true, order: 'price'}).entries.every(
    offer => offer.price !== null && offer.price <= career.budget,
  ));
});

test('market cards show the club crest below the name, OVR, price in euros and purchase action', () => {
  const career = {...createCareer(42), budget: 2_000_000};
  const html = renderCareer(career, 'market', ui, null, {search: 'mbappe madrid'});
  assert.match(html, /class="career-market-token" aria-hidden="true"><span class="career-season-crest"[^>]+league-laliga\.webp[^>]+><\/span><img[^>]+width="68" height="68"[^>]*><\/span>/);
  assert.match(html, /<h3>Kylian Mbappé<\/h3>\s*<div class="career-market-club">\s*<strong class="career-market-rating" aria-label="\d+ OVR">\d+<\/strong>\s*<span role="img" aria-label="Real Madrid"/);
  assert.doesNotMatch(html, /career-market-watermark/);
  assert.match(html, /<small>Preço de compra<\/small>\s*<strong>€ 93,25 mi<\/strong>/);
  assert.doesNotMatch(html, /R\$|<time\b/);
  assert.match(html, /data-action="career-sign" data-value="career26-laliga-243\/kylian-mbappe">Contratar/);
});
