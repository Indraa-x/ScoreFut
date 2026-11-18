import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREER_TEAM, createCareer, careerSale, listCareerPlayer, updateCareerTransferOffers, acceptCareerOffer,
  rejectCareerOffer, cancelCareerListing, prepareCareerRound, commitCareerRound, careerClub, advanceCareerSeason, careerFixtures} from '../js/career.js';
import {CAREER_LEAGUES, careerLeague} from '../data/career-leagues.js';
import {careerMarketPage} from '../js/career-market.js';
import {renderCareer} from '../js/career-view.js';
import * as ui from '../js/ui.js';

function played(career) {
  const replay = prepareCareerRound(career);
  return updateCareerTransferOffers(commitCareerRound({...career, replay: {...replay, minute: replay.tournament.userMatches[0].result.duration}}));
}
function ready() {
  const club = careerLeague('brasileirao').teams.find(team => team.nome === 'Palmeiras');
  const base = createCareer(42, club.id);
  const player = base.roster.find(player => { try {return careerSale(base, player.id).price > 0;} catch {return false;} });
  let career = listCareerPlayer(base, player.id);
  const listed = structuredClone(career);
  for (let i = 0; i < 3; i++) career = played(career);
  return {base, career, player, listed};
}

test('listing waits for played games, persists without rerolling and never pays or removes the player early', () => {
  const {base, career, player, listed} = ready();
  assert.equal(listed.budget, base.budget);
  assert.ok(listed.roster.some(p => p.id === player.id));
  assert.equal(updateCareerTransferOffers(listed), listed);
  assert.equal(listed.transferOffers, undefined);
  assert.equal(career.transferOffers.length, 2);
  assert.deepEqual(updateCareerTransferOffers(JSON.parse(JSON.stringify(career))).transferOffers, career.transferOffers);
  assert.equal(career.roster.length, base.roster.length);
  assert.throws(() => listCareerPlayer(career, player.id));
  assert.match(renderCareer(career, 'transfers', ui), /Propostas recebidas/);
  assert.match(renderCareer(career, 'transfers', ui), /Analisar proposta/);
});

test('accepted offer transfers ownership, credits its exact fee once and updates buyer squad and market', () => {
  const {career, player} = ready(), before = structuredClone(career), offer = career.transferOffers[0];
  const sold = acceptCareerOffer(career, offer.id);
  assert.deepEqual(career, before);
  assert.equal(sold.budget, career.budget + offer.price);
  assert.ok(!sold.roster.some(p => p.id === player.id));
  assert.ok(!Object.values(sold.lineup).includes(player.id));
  assert.equal(sold.transferListings.length, 0);
  assert.equal(sold.transferOffers.length, 0);
  assert.throws(() => acceptCareerOffer(sold, offer.id));
  assert.equal(careerClub(sold, offer.clubId).jogadores.filter(p => p.id === player.id).length, 1);
  for (const league of CAREER_LEAGUES) for (const club of league.teams) {
    if ([offer.clubId, sold.clubId].includes(club.id)) continue;
    assert.ok(!careerClub(sold, club.id).jogadores.some(p => p.id === player.id));
  }
  const market = careerMarketPage(sold, {search: player.nome});
  assert.ok(market.entries.some(entry => entry.player.id === player.id && entry.squad.id === offer.clubId));
  // The transferred player is in the receiving club's actual next-match lineup or bench.
  const buyer = CAREER_LEAGUES.flatMap(l => l.teams).find(club => club.id === offer.clubId);
  const buyerCareer = {...createCareer(99, buyer.id), clubId: sold.clubId,
    roster: sold.roster, lineup: sold.lineup, formation: sold.formation, opponentIds: [buyer.id], transferDeals: sold.transferDeals};
  const replay = prepareCareerRound(buyerCareer);
  const team = replay.tournament.teams.find(team => team.id === buyer.id);
  assert.ok([...team.lineup, ...team.reserves].some(entry => entry.player.id === player.id));
  assert.deepEqual(JSON.parse(JSON.stringify(sold)).transferDeals, sold.transferDeals);
  const nextSeason = advanceCareerSeason({...sold, round: careerFixtures(sold).length});
  assert.deepEqual(nextSeason.transferDeals, sold.transferDeals);
  assert.ok(careerClub(nextSeason, offer.clubId).jogadores.some(p => p.id === player.id));
});

test('rejecting, withdrawing and unfinished replay cannot silently complete a sale', () => {
  const {career, player} = ready(), offer = career.transferOffers[0];
  const rejected = rejectCareerOffer(career, offer.id);
  assert.equal(rejected.transferOffers.length, 1);
  assert.equal(rejected.budget, career.budget);
  const cancelled = cancelCareerListing(career, player.id);
  assert.equal(cancelled.transferOffers.length, 0);
  assert.equal(cancelled.transferListings.length, 0);
  assert.equal(cancelled.roster.length, career.roster.length);
  assert.throws(() => acceptCareerOffer({...career, replay: {round: career.round, season: career.season}}, offer.id), /andamento/);
  assert.throws(() => acceptCareerOffer(cancelled, offer.id));
  assert.equal(careerClub(career, CAREER_TEAM).jogadores.length, career.roster.length);
});
