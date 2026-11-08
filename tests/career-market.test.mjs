import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {createCareer, MAX_CAREER_ROSTER, signCareerPlayer} from '../js/career.js';
import {careerMarketCatalog, careerMarketPage} from '../js/career-market.js';
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

test('hiring debits the verified market value in reais and requires a listed price', () => {
  const career = {...createCareer(42), budget: 2_000_000};
  const unknown = offers.find(offer => offer.price === null);
  assert.equal(mbappe.euros, 180_000_000);
  assert.equal(mbappe.price, 1_106_082);
  assert.equal(byId.get('career26-brasileirao-20008/neymar').euros, 8_000_000);
  const signed = signCareerPlayer(career, mbappe.id);
  assert.deepEqual(signed.roster.at(-1), mbappe.player);
  assert.equal(signed.budget, career.budget - mbappe.price);
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

test('market cards show the season, crest, OVR, source price and purchase action', () => {
  const career = {...createCareer(42), budget: 2_000_000};
  const html = renderCareer(career, 'market', ui, null, {search: 'mbappe madrid'});
  assert.match(html, /career-market-token[^>]+aria-label="\d+ OVR"[\s\S]*?league-laliga\.webp/);
  assert.match(html, /<h3>Kylian Mbappé<\/h3>[\s\S]*?Real Madrid[\s\S]*?2026\/27/);
  assert.match(html, /<small>Valor de mercado<\/small>\s*<strong>R\$ 1,11 Bi<\/strong>/);
  assert.match(html, /transfermarkt\.com\.br[^"]+"[^>]*>€ 180\.000\.000<\/a>/);
  assert.match(html, /data-action="career-sign" data-value="career26-laliga-243\/kylian-mbappe">Contratar/);
});
