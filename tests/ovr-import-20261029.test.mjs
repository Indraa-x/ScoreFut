import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {OVR_REVIEW_20261029 as review} from '../data/ovr-review-20261029.js';
import {IMPORTED_OVR_BY_SQUAD} from '../data/imported-ovr-review.js';
import {applyHistoricalFifaRating} from '../data/ratings.js';
import {applyWorldCupRatingReview} from '../data/world-cup-ratings.js';
import {refreshDraftRatings} from '../js/draft.js';
const find=(squadId,playerId)=>allSquads.find(s=>s.id===squadId)?.jogadores.find(p=>p.id===playerId);
test('approved October 29 edits reach active eras while retired-era edits remain in the archive',()=>{
 assert.equal(review.changes.length,35);
 for(const c of review.changes){
  const p=find(c.squadId,c.playerId);
  if(!p){assert.equal(c.squadId,'nation-uruguay-1950');assert.equal(IMPORTED_OVR_BY_SQUAD[c.squadId][c.playerId].ovr,c.toOvr);continue;}
  assert.ok(p,`${c.squadId}/${c.playerId}`);
  assert.equal(p.ovr,c.toOvr,`${c.squadId}/${c.playerId}`);
  assert.equal(p.creatorReview.sourceFile,review.sourceFile);
  assert.equal(p.creatorReview.previousOvr,c.fromOvr);
  assert.deepEqual(p.creatorReview,IMPORTED_OVR_BY_SQUAD[c.squadId][c.playerId]);
  assert.ok(Object.values(p.atributos).every(n=>Number.isInteger(n)&&n>=1&&n<=99));
  const apply=c.competition==='world-cup'?applyWorldCupRatingReview:applyHistoricalFifaRating;
  assert.deepEqual(apply(p,c.squadId),p,'Applying a review twice must not change attributes twice');
  const old={seed:42,rerolls:1,seen:[c.squadId],picks:[{squadId:c.squadId,player:{...p,ovr:c.fromOvr},slot:{id:'saved-slot'}}]};
  const baseline=structuredClone(old),updated=refreshDraftRatings(old,allSquads);
  assert.deepEqual(updated.picks[0].player,p);
  assert.deepEqual({...updated,picks:[]},{...old,picks:[]});
  assert.deepEqual(updated.picks[0].slot,old.picks[0].slot);
  assert.deepEqual(old,baseline);
 }
});
test('other eras and preceding historical rebalances retain their existing ratings',()=>{
 assert.equal(find('barcelona-2015','lionel-messi').ovr,95);
 assert.equal(find('real-madrid-2017','cristiano-ronaldo').ovr,93);
 assert.equal(find('nation-brazil-1958','pele').ovr,96);
 assert.equal(find('nation-hungary-1938','gyula-zsengeller').ovr,88);
});
