import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {IMPORTED_OVR_REVIEW,IMPORTED_OVR_BY_SQUAD} from '../data/imported-ovr-review.js';
import {applyHistoricalFifaRating} from '../data/ratings.js';
import {applyWorldCupRatingReview} from '../data/world-cup-ratings.js';
import {refreshDraftRatings} from '../js/draft.js';
import {squadTeam} from '../js/engine.js';

test('all eighteen local-editor changes reach their exact player and era, with signed attributes and durable provenance',()=>{
 assert.equal(IMPORTED_OVR_REVIEW.changes.length,18);
 assert.deepEqual(Object.values(IMPORTED_OVR_REVIEW.changes.reduce((counts,c)=>(counts[c.competition]=(counts[c.competition]||0)+1,counts),{})),[15,2,1]);
 for(const change of IMPORTED_OVR_REVIEW.changes){
  const squad=allSquads.find(s=>s.id===change.squadId),player=squad.jogadores.find(p=>p.id===change.playerId);
  const review=IMPORTED_OVR_BY_SQUAD[squad.id][player.id];
  assert.equal(player.ovr,change.toOvr);assert.equal(player.ratingKind,'creator-review');assert.deepEqual(player.creatorReview,review);
  assert.equal(review.previousOvr,change.fromOvr);assert.equal(review.exportedAt,IMPORTED_OVR_REVIEW.exportedAt);
  const apply=squad.kind==='national'?applyWorldCupRatingReview:applyHistoricalFifaRating;
  const previous={...player,ovr:change.fromOvr,atributos:{ataque:97,meio:85,defesa:50,finalizacao:80,reflexo:1,posicionamento:90}};
  const copy=structuredClone(previous),next=apply(previous,squad.id);
  const delta=change.toOvr-change.fromOvr;
  for(const [key,value]of Object.entries(previous.atributos))assert.equal(next.atributos[key],Math.max(1,Math.min(99,value+delta)));
  assert.deepEqual(previous,copy);assert.deepEqual(apply(next,squad.id),next);
  const slot=squadTeam(squad).lineup.find(pick=>pick.player.id===player.id).slot;
  const draft={picks:[{squadId:squad.id,slot,player:previous}],seed:42,rerolls:3};
  assert.deepEqual(refreshDraftRatings(draft,allSquads).picks[0].player,player);
  assert.deepEqual(JSON.parse(JSON.stringify(player)),player);
 }
 assert.equal(allSquads.find(s=>s.id==='barcelona-2009').jogadores.find(p=>p.id==='lionel-messi').ovr,93);
 assert.equal(allSquads.find(s=>s.id==='nation-brazil-1958').jogadores.find(p=>p.id==='pele').ovr,96);
});
