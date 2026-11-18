import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {EA_PORTRAIT_IDS, EA_PORTRAIT_UNAVAILABLE} from '../data/career-2026/ea-portraits.js';
import {BRAZIL_PORTRAITS} from '../data/career-2026/brasileirao-portraits.js';
import {careerPortraitUrl} from '../data/career-2026/player-portraits.js';
const europe = CAREER_LEAGUES.filter(league => league.id !== 'brasileirao').flatMap(league => league.teams.flatMap(team => team.jogadores));
const brazil = CAREER_LEAGUES.find(league => league.id === 'brasileirao').teams;

test('European portraits come exclusively from the official FC 27 card component', () => {
  assert.equal(europe.length, 2286);
  assert.equal(EA_PORTRAIT_IDS.size, 2305);
  for (const player of europe) {
    assert.ok(EA_PORTRAIT_IDS.has(player.id), player.nome);
    const url = careerPortraitUrl(player);
    if (EA_PORTRAIT_UNAVAILABLE.has(player.id)) assert.equal(url, null);
    else assert.match(url, /^https:\/\/ratings-images-prod\.pulse\.ea\.com\/FC27\/components\/players\/p\d+\.webp$/);
    if (player.id.startsWith('ea-')) assert.equal(EA_PORTRAIT_IDS.get(player.id), Number(player.id.slice(3)));
  }
  assert.equal(europe.filter(player => careerPortraitUrl(player)).length, 2269);
});

test('players without a face in the official EA card do not fall back to unrelated photo sources', () => {
  assert.equal(EA_PORTRAIT_UNAVAILABLE.size, 17);
  for (const id of EA_PORTRAIT_UNAVAILABLE) {
    assert.ok(europe.some(player => player.id === id));
    assert.equal(careerPortraitUrl({id}), null);
  }
  assert.equal(careerPortraitUrl({id:'unknown-player'}), null);
});

test('Bahia uses its 19 matched EA portraits while the other Brazilian clubs keep their photos', () => {
  const bahia = brazil.find(team => team.nome === 'Bahia');
  const matched = bahia.jogadores.filter(player => EA_PORTRAIT_IDS.has(player.id));
  assert.equal(matched.length, 19);
  assert.ok(matched.every(player => careerPortraitUrl(player).includes('/FC27/components/players/')));
  for (const team of brazil.filter(team => team !== bahia)) {
    for (const player of team.jogadores) {
      assert.equal(EA_PORTRAIT_IDS.has(player.id), false, player.nome);
      const portrait = BRAZIL_PORTRAITS.get(`${player.id}/${player.camisa}`) ?? BRAZIL_PORTRAITS.get(player.id);
      if (portrait) assert.equal(careerPortraitUrl(player), `https://img.a.transfermarkt.technology/portrait/medium/${portrait}?lm=4711`);
    }
  }
});
