import {allSquads} from '../data/game-squads.js';
const PAGE_SIZE = 12;
const normalize = value => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const orders = {
  overall: (a, b) => b.player.ovr - a.player.ovr || b.squad.ano - a.squad.ano,
  price: (a, b) => a.price - b.price,
  recent: (a, b) => b.squad.ano - a.squad.ano || b.player.ovr - a.player.ovr,
  name: (a, b) => a.player.nome.localeCompare(b.player.nome, 'pt-BR'),
};
let source;
let catalog;

export function careerMarketCatalog() {
  if (source === allSquads) return catalog;
  const offers = allSquads.flatMap(squad => squad.jogadores.map(player => ({
    id: `${squad.id}/${player.id}`,
    player,
    squad,
    decade: Math.floor(squad.ano / 10) * 10,
    price: Math.max(350, 450 + (player.ovr - 72) * 170),
    search: normalize(`${player.nome} ${squad.nome} ${squad.ano}`),
  })));
  const decades = [...new Set(offers.map(offer => offer.decade))].sort((a, b) => b - a);
  catalog = {offers, decades, byId: new Map(offers.map(offer => [offer.id, offer]))};
  source = allSquads;
  return catalog;
}

export function careerMarketPage(career, {
  search = '', position = '', decade = '', order = 'overall', affordable = false, page = 1,
} = {}) {
  const {offers} = careerMarketCatalog();
  const owned = new Set(career.roster.map(player => player.id));
  const words = normalize(search.trim()).split(/\s+/).filter(Boolean);
  const matches = offers.filter(offer =>
    (!position || offer.player.tags.includes(position)) &&
    (!decade || offer.decade === Number(decade)) &&
    (!affordable || offer.price <= career.budget && !owned.has(offer.player.id)) &&
    words.every(word => offer.search.includes(word))
  ).sort(Object.hasOwn(orders, order) ? orders[order] : orders.overall);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.max(1, Math.min(page, pages));
  const start = (current - 1) * PAGE_SIZE;
  return {entries: matches.slice(start, start + PAGE_SIZE), total: matches.length, owned, page: current, pages};
}
