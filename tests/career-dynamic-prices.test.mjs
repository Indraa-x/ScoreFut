import test from 'node:test';
import assert from 'node:assert/strict';
import {careerMarketCatalog, careerMarketPage, careerPlayerValuation, MAX_CAREER_PRICE, CAREER_BRL_PRICE_FACTOR} from '../js/career-market.js';
import {createCareer, careerSale, listCareerPlayer, updateCareerTransferOffers, acceptCareerOffer, signCareerPlayer, migrateCareerRoster} from '../js/career.js';
import {playerDevelopment, trainCareerPlayer, developmentThreshold} from '../js/career-development.js';

const offers = careerMarketCatalog().offers;
const haaland = offers.find(offer => offer.player.nome === 'Erling Haaland');
const base = () => ({...createCareer(77, haaland.squad.id), budget: 1_000_000});

test('all valued players appreciate with OVR and respect the ceiling in reais', () => {
  const original = structuredClone(offers);
  assert.ok(MAX_CAREER_PRICE * 1000 * CAREER_BRL_PRICE_FACTOR <= 950_000_000);
  for (const offer of offers.filter(offer => offer.price !== null)) {
    const initial = offer.player.ovr;
    let last = 0;
    for (let ovr = 40; ovr <= 99; ovr++) {
      const value = careerPlayerValuation({...offer.player, marketOfferId: offer.id, ovr});
      assert.ok(value.price >= last, `${offer.player.nome}: price must increase with OVR`);
      assert.ok(value.price <= MAX_CAREER_PRICE);
      assert.equal(value.euros, offer.euros, 'Transfermarkt source value is preserved');
      last = value.price;
    }
    if (initial < 99 && offer.price < MAX_CAREER_PRICE)
      assert.ok(careerPlayerValuation({...offer.player, marketOfferId: offer.id, ovr: initial + 1}).price >= offer.price);
  }
  assert.deepEqual(offers, original);
});

test('actual OVR training updates market cards and sale valuation immediately and survives reload', () => {
  let career = base(), p = career.roster.find(p => p.id === haaland.player.id);
  const before = careerSale(career, p.id).price;
  career = {...career, development: {tick: 1, players: {[p.id]: {...playerDevelopment(career, p), xp: developmentThreshold(p.ovr) - 1}}}};
  career = trainCareerPlayer(career, p.id, 'technique');
  assert.equal(career.roster.find(player => player.id === p.id).ovr, p.ovr + 1);
  const value = careerSale(career, p.id).price;
  assert.ok(value > before);
  assert.equal(careerMarketPage(career, {search:'Erling Haaland'}).entries[0].price, value);
  assert.equal(careerSale(JSON.parse(JSON.stringify(career)), p.id).price, value);
});

test('evolved players receive capped offers, move clubs and retain their valuation when bought back', () => {
  let career = base(), p = {...haaland.player, ovr: 99};
  career = {...career, roster: career.roster.map(player => player.id === p.id ? p : player)};
  career = listCareerPlayer(career, p.id);
  career = updateCareerTransferOffers({...career, round: career.round + 4});
  assert.equal(career.transferOffers.length, 2);
  assert.ok(career.transferOffers.every(offer => offer.price <= MAX_CAREER_PRICE));
  const sale = career.transferOffers[0];
  let sold = acceptCareerOffer(career, sale.id);
  const market = careerMarketPage(sold, {search:'Erling Haaland'}).entries[0];
  assert.equal(market.player.ovr, 99);
  assert.equal(market.price, MAX_CAREER_PRICE);
  const balance = sold.budget;
  const signed = signCareerPlayer(sold, market.id);
  assert.equal(signed.roster.at(-1).ovr, 99);
  assert.equal(signed.budget, balance - market.price);
});

test('new proposals revalue a player listed before growth and old pending offers are capped', () => {
  let c = base(), p = c.roster.find(player => player.id === haaland.player.id);
  c = listCareerPlayer(c, p.id);
  c = {...c, round: c.round + 4, roster:c.roster.map(player => player.id === p.id ? {...player,ovr:99} : player)};
  c = updateCareerTransferOffers(c);
  assert.equal(c.transferListings[0].price, MAX_CAREER_PRICE);
  const legacy = {...c, transferOffers:c.transferOffers.map(offer=>({...offer,price:999_999}))};
  const migrated = migrateCareerRoster(legacy);
  assert.ok(migrated.transferOffers.every(offer=>offer.price===MAX_CAREER_PRICE));
  const sold = acceptCareerOffer(legacy, legacy.transferOffers[0].id);
  assert.equal(sold.budget, legacy.budget + MAX_CAREER_PRICE);
  assert.equal(sold.transferDeals.at(-1).price, MAX_CAREER_PRICE);
});
