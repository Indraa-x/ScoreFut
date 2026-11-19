import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {MARKET_VALUES, MARKET_EUR_TO_BRL} from '../data/career-2026/market-values.js';

const PAGE_SIZE = 12;
const MAX_PURCHASE_EUROS = 550_000_000;
// Balances and transfer fees are stored in thousands of euros; retain the game's fixed FX rate.
export const MAX_CAREER_PRICE = Math.floor(950_000_000 / MARKET_EUR_TO_BRL / 1_000);
export const capCareerPrice = price => Math.max(1, Math.min(MAX_CAREER_PRICE, Math.round(price)));
const OVERALL_PREMIUM_THRESHOLD = 78;
const OVERALL_PREMIUM_EUROS = 360_000;
const highestMarketValue = Math.max(...Object.values(MARKET_VALUES).flatMap(squad =>
  Object.values(squad).map(([euros]) => euros)));

const sportingFloor = overall => MAX_CAREER_PRICE * .9 * (Math.max(0, overall - 60) / 39) ** 4;

function purchasePrice(euros, overall) {
  if (!euros) return null;
  const share = euros / highestMarketValue;
  const marketPremium = Math.max(0, MAX_PURCHASE_EUROS - highestMarketValue) * share ** 2;
  const ratingAboveThreshold = Math.max(0, overall - OVERALL_PREMIUM_THRESHOLD);
  const sportingPremium = OVERALL_PREMIUM_EUROS * ratingAboveThreshold ** 2 * (1 - share);
  // Career balances are stored in thousands of euros.
  const ratingCeiling = MAX_CAREER_PRICE * (Math.min(99, overall) / 99) ** 6;
  return capCareerPrice(Math.min(ratingCeiling, Math.max(sportingFloor(overall), (euros + marketPremium + sportingPremium) / 1_000)));
}
const normalize = value => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const byPrice = (a, b, direction) => {
  if (a.price === null) return b.price === null ? 0 : 1;
  if (b.price === null) return -1;
  return (a.price - b.price) * direction;
};
const orders = {
  overall: (a, b) => b.player.ovr - a.player.ovr,
  price: (a, b) => byPrice(a, b, 1),
  expensive: (a, b) => byPrice(a, b, -1),
  name: (a, b) => a.player.nome.localeCompare(b.player.nome, 'pt-BR'),
};

const offers = CAREER_LEAGUES.flatMap(league => league.teams.flatMap(squad => squad.jogadores.map(player => {
  const [euros, source, valuedOn] = MARKET_VALUES[squad.id]?.[player.id] ?? [];
  const sourceUrl = typeof source === 'number'
    ? `https://www.transfermarkt.com.br/-/profil/spieler/${source}`
    : source;
  return {
    id: `${squad.id}/${player.id}`,
    player, squad, league, euros, sourceUrl, valuedOn,
    price: purchasePrice(euros, player.ovr),
    search: normalize(`${player.nome} ${squad.nome} ${league.name} ${league.season}`),
  };
})));
const catalog = {offers, byId: new Map(offers.map(offer => [offer.id, offer]))};
const offersByPlayer = new Map();
for (const offer of offers) {
  const previous = offersByPlayer.get(offer.player.id) ?? [];
  offersByPlayer.set(offer.player.id, [...previous, offer]);
}

function originalValuation(player) {
  if (player.marketOfferId) {
    const offer = catalog.byId.get(player.marketOfferId);
    return offer?.player.id === player.id ? offer : null;
  }
  const matches = offersByPlayer.get(player.id) ?? [];
  if (matches.length === 1) return matches[0];
  const identified = matches.filter(({player: candidate}) =>
    candidate.nome === player.nome && candidate.camisa === player.camisa);
  return identified.length === 1 ? identified[0] : null;
}

// Keep the real market source intact while recalculating the in-game fee from current OVR.
export function careerPlayerValuation(player) {
  const offer = originalValuation(player);
  if (!offer || offer.price === null) return offer;
  if (player.ovr === offer.player.ovr) return offer;
  const overall = Math.max(40, Math.min(99, player.ovr));
  const growth = offer.price * 1.12 ** (overall - offer.player.ovr);
  return {...offer, price: capCareerPrice(Math.max(growth, sportingFloor(overall)))};
}

export function careerMarketOffer(career, id) {
  return campaignOffers(career).find(offer => offer.id === id) ?? null;
}

export function careerMarketCatalog() {
  return catalog;
}

function campaignOffers(career) {
  const deals = new Map((career.transferDeals ?? []).map(deal => [deal.player.id, deal]));
  const players = new Map([...deals.values()].map(deal => [deal.player.id, deal.player]));
  for (const player of career.roster) players.set(player.id, player);
  return offers.map(original => {
    const current = players.get(original.player.id);
    const valuation = current && careerPlayerValuation(current);
    const offer = valuation?.id === original.id && current.ovr !== original.player.ovr
      ? {...original, player: current, price: valuation.price} : original;
    const deal = deals.get(offer.player.id);
    if (!deal) return offer;
    const league = CAREER_LEAGUES.find(league => league.teams.some(team => team.id === deal.clubId));
    const squad = league?.teams.find(team => team.id === deal.clubId);
    return squad ? {...offer, squad, league, search: normalize(`${offer.player.nome} ${squad.nome} ${league.name} ${league.season}`)} : offer;
  });
}

export function careerMarketPage(career, {
  search = '', position = '', leagueId = '', order = 'overall', affordable = false, page = 1,
} = {}) {
  const owned = new Set(career.roster.map(player => player.id));
  const words = normalize(search.trim()).split(/\s+/).filter(Boolean);
  const matches = campaignOffers(career).filter(offer =>
    (!position || offer.player.tags.includes(position)) &&
    (!leagueId || offer.league.id === leagueId) &&
    (!affordable || offer.price !== null && offer.price <= career.budget && !owned.has(offer.player.id)) &&
    words.every(word => offer.search.includes(word))
  ).sort(Object.hasOwn(orders, order) ? orders[order] : orders.overall);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.max(1, Math.min(page, pages));
  const start = (current - 1) * PAGE_SIZE;
  return {entries: matches.slice(start, start + PAGE_SIZE), total: matches.length, owned, page: current, pages};
}
