import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {MARKET_VALUES} from '../data/career-2026/market-values.js';

const PAGE_SIZE = 12;
const MAX_PURCHASE_EUROS = 550_000_000;
const OVERALL_PREMIUM_THRESHOLD = 78;
const OVERALL_PREMIUM_EUROS = 360_000;
const highestMarketValue = Math.max(...Object.values(MARKET_VALUES).flatMap(squad =>
  Object.values(squad).map(([euros]) => euros)));

function purchasePrice(euros, overall) {
  if (!euros) return null;
  const share = euros / highestMarketValue;
  const marketPremium = Math.max(0, MAX_PURCHASE_EUROS - highestMarketValue) * share ** 2;
  const ratingAboveThreshold = Math.max(0, overall - OVERALL_PREMIUM_THRESHOLD);
  const sportingPremium = OVERALL_PREMIUM_EUROS * ratingAboveThreshold ** 2 * (1 - share);
  // Career balances are stored in thousands of euros.
  return Math.round(Math.min(MAX_PURCHASE_EUROS, euros + marketPremium + sportingPremium) / 1_000);
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

export function careerPlayerValuation(player) {
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

export function careerMarketCatalog() {
  return catalog;
}

export function careerMarketPage(career, {
  search = '', position = '', leagueId = '', order = 'overall', affordable = false, page = 1,
} = {}) {
  const owned = new Set(career.roster.map(player => player.id));
  const words = normalize(search.trim()).split(/\s+/).filter(Boolean);
  const matches = offers.filter(offer =>
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
