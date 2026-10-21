import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/clubs.js';
import {CREATOR_RATING_REVIEW,CREATOR_RATINGS_BY_SQUAD} from '../data/creator-ratings.js';
import {applyHistoricalFifaRating} from '../data/ratings.js';
import {FORMATIONS,positionFit} from '../js/engine.js';
import {refreshDraftRatings} from '../js/draft.js';

const player=(squadId,id)=>allSquads.find(squad=>squad.id===squadId)?.jogadores.find(player=>player.id===id);

test('all 22 requested OVR edits reach the exact player and season, without an official EA label',()=>{
  assert.equal(CREATOR_RATING_REVIEW.changes.length,22);
  assert.equal(new Set(CREATOR_RATING_REVIEW.changes.map(change=>`${change.squadId}/${change.playerId}`)).size,22);
  assert.equal(Object.keys(CREATOR_RATINGS_BY_SQUAD).length,18);
  for(const change of CREATOR_RATING_REVIEW.changes){
    const found=player(change.squadId,change.playerId);
    assert.ok(found,`${change.squadId}/${change.playerId}`);
    assert.equal(found.ovr,change.toOvr,`${change.squadId}/${change.playerId} OVR`);
    assert.equal(found.ratingKind,'creator-review');assert.equal(found.ratingEdition,undefined);
    assert.equal(found.creatorReview.previousOvr,change.fromOvr);
    assert.equal(found.creatorReview.exportedAt,CREATOR_RATING_REVIEW.exportedAt);
    assert.equal(found.ratingSource,'data/creator-ratings.js');
    assert.equal(found.nome,change.nome);
    assert.deepEqual(JSON.parse(JSON.stringify(found)),found,'Imported metadata must survive saving and restoring a match');
    assert.ok(Object.values(found.atributos).every(value=>Number.isInteger(value)&&value>=1&&value<=99));
  }
});

test('creator adjustments override season reviews while keeping the earlier review and EA archive',()=>{
  const inzaghi=player('milan-2007','filippo-inzaghi'),neymar=player('santos-2011','neymar');
  assert.equal(inzaghi.ovr,88);assert.equal(inzaghi.priorSeasonReview.ovr,87);
  assert.equal(neymar.ovr,89);assert.equal(neymar.priorSeasonReview.ovr,88);
  const drogba=player('chelsea-2012','didier-drogba');
  assert.equal(drogba.ovr,88);assert.equal(drogba.archivedRating.ovr,86);
  assert.ok(drogba.archivedRating.source.startsWith('https://'));
  assert.equal(player('santos-2010','neymar').ovr,86);
  assert.equal(player('barcelona-2015','neymar').ovr,92);
  assert.equal(player('juventus-1998','zinedine-zidane').ovr,93);
  assert.equal(player('real-madrid-2002','zinedine-zidane').ovr,92);
});

test('an imported OVR updates simulation attributes immutably and is safe to reapply',()=>{
  const base={id:'hulk',ovr:78,atributos:{ataque:83,meio:72,defesa:50,finalizacao:83,reflexo:13,posicionamento:72}};
  const original=structuredClone(base),updated=applyHistoricalFifaRating(base,'atletico-mineiro-2024');
  assert.equal(updated.ovr,87);
  assert.deepEqual(updated.atributos,{ataque:92,meio:81,defesa:59,finalizacao:92,reflexo:22,posicionamento:81});
  assert.deepEqual(base,original);
  assert.deepEqual(applyHistoricalFifaRating(updated,'atletico-mineiro-2024'),updated);
  assert.equal(applyHistoricalFifaRating(base,'atletico-mineiro-1999'),base);
});

test('existing draft picks receive every imported rating without losing positions, skips or state',()=>{
  for(const change of CREATOR_RATING_REVIEW.changes){
    const latest=player(change.squadId,change.playerId),slot=FORMATIONS['4-3-3'].slots.find(slot=>positionFit(latest,slot)!==null);
    const draft={seed:42,rngState:90,rerolls:2,seen:[change.squadId],currentSquadId:change.squadId,picks:[{player:{...latest,ovr:change.fromOvr},squadId:change.squadId,slot}]};
    const original=structuredClone(draft),refreshed=refreshDraftRatings(draft,allSquads);
    assert.equal(refreshed.picks[0].player.ovr,change.toOvr);
    assert.equal(refreshed.picks[0].slot,slot);
    assert.deepEqual({...refreshed,picks:[]},{...draft,picks:[]});
    assert.deepEqual(draft,original);
  }
});
