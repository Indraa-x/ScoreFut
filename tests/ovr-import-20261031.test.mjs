import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {OVR_REVIEW_20261031 as review} from '../data/ovr-review-20261031.js';
import {applyHistoricalFifaRating} from '../data/ratings.js';
import {applyWorldCupRatingReview} from '../data/world-cup-ratings.js';
import {refreshDraftRatings} from '../js/draft.js';
test('all sixteen October 31 changes reach their exact eras, preserve provenance and refresh saved picks',()=>{
 assert.equal(review.changes.length,16);
 for(const c of review.changes){
  const squad=allSquads.find(s=>s.id===c.squadId),p=squad.jogadores.find(p=>p.id===c.playerId);
  assert.equal(p.ovr,c.toOvr,c.squadId+'/'+c.playerId);
  assert.equal(p.creatorReview.sourceFile,review.sourceFile);assert.equal(p.creatorReview.exportedAt,review.exportedAt);
  const apply=c.competition==='world-cup'?applyWorldCupRatingReview:applyHistoricalFifaRating;
  const base={...p,ovr:c.fromOvr,atributos:{ataque:98,meio:70,defesa:40,finalizacao:95,reflexo:1,posicionamento:88}};
  const snapshot=structuredClone(base),updated=apply(base,c.squadId);
  for(const [key,value]of Object.entries(base.atributos))assert.equal(updated.atributos[key],Math.max(1,Math.min(99,value+c.toOvr-c.fromOvr)));
  assert.deepEqual(base,snapshot);assert.deepEqual(apply(updated,c.squadId),updated);
  const draft={picks:[{squadId:c.squadId,player:base,slot:{id:'saved'}}],rerolls:2};
  assert.deepEqual(refreshDraftRatings(draft,allSquads).picks[0].player,p);
 }
});
