import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {allSquads} from '../data/clubs.js';
import {RATINGS_VERSION,MAX_OVR,RELEASE_RATINGS_BY_SQUAD,SEASON_RATINGS_BY_SQUAD,applyHistoricalFifaRating,FIFA_OVR_BY_SQUAD,FIFA_RATING_SOURCES} from '../data/ratings.js';
import {ARCHIVED_RATINGS_BY_SQUAD} from '../data/fifa-archive-ratings.js';
import {MODERN_RATINGS_BY_SQUAD} from '../data/modern-ratings.js';
import {CREATOR_RATINGS_BY_SQUAD} from '../data/creator-ratings.js';
import {RELEASE_RATING_POLICY} from '../data/release-ratings.js';
import {FORMATIONS,positionFit} from '../js/engine.js';
import {refreshDraftRatings} from '../js/draft.js';

const player=(squad,id)=>allSquads.find(s=>s.id===squad)?.jogadores.find(p=>p.id===id);
const players=allSquads.flatMap(s=>s.jogadores);
const edition=year=>`${year<=2023?'FIFA':'FC'} ${String(year).slice(-2)}`;

test('ratings retain a varied scale and valid simulation attributes',()=>{
 const mean=players.reduce((sum,p)=>sum+p.ovr,0)/players.length;
 assert.ok(mean>=77&&mean<=83,`Mean OVR ${mean}`);
 assert.ok(players.filter(p=>p.ovr<80).length>players.length*.2);
 assert.ok(players.filter(p=>p.ovr>=94).length<players.length*.02);
 for(const p of players){
  assert.ok(Number.isInteger(p.ovr)&&p.ovr>=40&&p.ovr<=MAX_OVR,p.id);
  assert.ok(Object.values(p.atributos).every(a=>Number.isInteger(a)&&a>=1&&a<=99),p.id);
  assert.deepEqual(JSON.parse(JSON.stringify(p)),p);
 }
 assert.equal(RATINGS_VERSION,16);
});

test('each verified rating identifies its exact player, source and following edition',()=>{
 let count=0;
 for(const [squadId,ratings]of Object.entries(RELEASE_RATINGS_BY_SQUAD)){
  const year=Number(squadId.slice(-4));
  for(const [id,record]of Object.entries(ratings)){
   count++;const found=player(squadId,id);assert.ok(found,`${squadId}/${id}`);
   assert.equal(record.edition,edition(year+1));assert.equal(record.releaseYear,year);
   assert.ok(Number.isInteger(record.ovr)&&record.ovr>=40&&record.ovr<=99);
   assert.match(record.source,/^https:\/\//);
   assert.deepEqual(found.releaseRating,record);
   const creator=CREATOR_RATINGS_BY_SQUAD[squadId]?.[id];
   assert.equal(found.ovr,creator?.ovr??record.ovr,`${squadId}/${id}`);
   assert.equal(found.ratingKind,creator?'creator-review':'release-rating');
   assert.equal(found.ratingEdition,creator?undefined:record.edition);
   if(!creator)assert.equal(found.ratingSource,record.source);
  }
 }
 assert.equal(count,RELEASE_RATING_POLICY.verifiedRecords);assert.ok(count>1000);
 assert.equal(RELEASE_RATING_POLICY.editionOffset,1);
});

test('2015 uses FIFA 16, recent seasons use FC 26, and transfers keep the same player identity',()=>{
 for(const [squad,id,ovr,game]of [
  ['barcelona-2015','luis-suarez',90,'FIFA 16'],
  ['bayern-2013','philipp-lahm',87,'FIFA 14'],
  ['psg-2025','ousmane-dembele',90,'FC 26'],
  ['psg-2025','gianluigi-donnarumma',89,'FC 26'],
  ['tottenham-2025','son-heung-min',84,'FC 26'],
 ]){
  const found=player(squad,id);assert.equal(found.ovr,ovr,`${squad}/${id}`);
  assert.equal(found.ratingEdition,game);assert.equal(found.ratingKind,'release-rating');
 }
 assert.equal(player('barcelona-2015','lionel-messi').ovr,94);
 assert.equal(player('barcelona-2015','lionel-messi').ratingKind,'creator-review');
});

test('all old archive entries remain traceable without overriding the following edition',()=>{
 for(const squad of allSquads)for(const p of squad.jogadores){
  const old=MODERN_RATINGS_BY_SQUAD[squad.id]?.[p.id]??ARCHIVED_RATINGS_BY_SQUAD[squad.id]?.[p.id];
  const oldOvr=old?.ovr??FIFA_OVR_BY_SQUAD[squad.id]?.[p.id];
  if(oldOvr!==undefined){
   assert.equal(p.archivedRating.ovr,oldOvr);
   assert.equal(p.archivedRating.source,old?.source??FIFA_RATING_SOURCES[squad.id]);
   assert.equal(p.archivedRating.edition,edition(squad.ano));
  }
 }
 const henry=player('arsenal-2006','thierry-henry');
 assert.equal(henry.archivedRating.ovr,92);assert.equal(henry.ovr,90);
 assert.equal(henry.ratingEdition,'FIFA 07');
});

test('similar names cannot reuse another person’s EA identity',()=>{
 const identities={'pedro-rodriguez':189505,'bruno-henrique':230885,'luiz-adriano':180826,'marcelo-moreno':181375};
 for(const ratings of Object.values(RELEASE_RATINGS_BY_SQUAD))for(const [id,rating]of Object.entries(ratings)){
  if(identities[id]&&rating.eaId)assert.equal(rating.eaId,identities[id],id);
 }
 assert.equal(player('barcelona-2011','pedro-rodriguez').releaseRating.eaId,189505);
});

test('unverified eras are explicitly editorial and never borrow an OVR from a different edition',()=>{
 for(const squad of allSquads)for(const p of squad.jogadores){
  if(CREATOR_RATINGS_BY_SQUAD[squad.id]?.[p.id]||RELEASE_RATINGS_BY_SQUAD[squad.id]?.[p.id])continue;
  const review=SEASON_RATINGS_BY_SQUAD[squad.id]?.[p.id];
  assert.equal(p.ratingKind,review?'season-review':'editorial-estimate');
  assert.equal(p.ratingEdition,undefined);
  assert.equal(p.ratingExpectedEdition,edition(squad.ano+1));
  if(review)assert.equal(p.ovr,review.ovr);else assert.match(p.ratingReason,/sem OVR verificável/);
 }
 const vintage=player('bayern-1974','gerd-muller');assert.equal(vintage.ratingKind,'season-review');
 const absent={id:'unknown',ovr:78,atributos:{ataque:80,meio:70,defesa:50}};
 const updated=applyHistoricalFifaRating(absent,'missing-2015');
 assert.equal(updated.ovr,78);assert.deepEqual(updated.atributos,absent.atributos);
 assert.equal(updated.ratingEdition,undefined);
});

test('rating changes adjust attributes by their signed delta, clamp limits and are immutable and idempotent',()=>{
 for(const [squadId,id,expected]of [['milan-2007','kaka',92],['manchester-city-2024','kevin-de-bruyne',89]]){
  const base={id,ovr:80,atributos:{ataque:98,meio:82,defesa:49,finalizacao:74,reflexo:1,posicionamento:77}};
  const before=structuredClone(base),updated=applyHistoricalFifaRating(base,squadId);
  assert.equal(updated.ovr,expected);
  for(const [key,value]of Object.entries(base.atributos))assert.equal(updated.atributos[key],Math.max(1,Math.min(99,value+expected-80)));
  assert.deepEqual(base,before);assert.deepEqual(applyHistoricalFifaRating(updated,squadId),updated);
 }
});

test('saved draft selections adopt the new edition while retaining skips, positions and progress',()=>{
 for(const [squad,id]of [['milan-2007','kaka'],['santos-2010','neymar'],['barcelona-2015','lionel-messi'],['inter-2024','lautaro-martinez']]){
  const latest=player(squad,id),slot=FORMATIONS['4-3-3'].slots.find(s=>positionFit(latest,s)!==null);
  const draft={seed:42,rngState:70,rerolls:2,seen:[squad],currentSquadId:squad,picks:[{player:{...latest,ovr:65},slot,squadId:squad}]};
  const before=structuredClone(draft),updated=refreshDraftRatings(draft,allSquads);
  assert.deepEqual(updated.picks[0].player,latest);assert.equal(updated.picks[0].slot,slot);
  assert.deepEqual({...updated,picks:[]},{...draft,picks:[]});assert.deepEqual(draft,before);
 }
});

test('the audit accounts for every player and the 72 creator overrides',()=>{
 const audit=JSON.parse(fs.readFileSync(new URL('../data/release-rating-audit.json',import.meta.url),'utf8'));
 assert.equal(audit.rows.length,players.length);assert.equal(audit.creatorOverrides,72);
 assert.equal(audit.verifiedReleaseRecords,RELEASE_RATING_POLICY.verifiedRecords);
 assert.equal(new Set(audit.rows.map(row=>row.squadId+'/'+row.playerId)).size,2365);
 for(const row of audit.rows){const p=player(row.squadId,row.playerId);assert.ok(p);
  assert.equal(row.expectedEdition,edition(row.year+1));
  assert.equal(row.status,p.ratingKind==='creator-review'?'creator':p.ratingKind==='release-rating'?'verified-release':'editorial');
 }
});
