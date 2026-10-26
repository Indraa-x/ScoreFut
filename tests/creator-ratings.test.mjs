import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/clubs.js';
import {CREATOR_RATING_REVIEW,CREATOR_RATING_REVIEWS,CREATOR_RATINGS_BY_SQUAD,CREATOR_DIRECT_RATING_REVIEWS} from '../data/creator-ratings.js';
import {applyHistoricalFifaRating} from '../data/ratings.js';
import {FORMATIONS,positionFit,squadTeam,calculateTeam} from '../js/engine.js';
import {refreshDraftRatings} from '../js/draft.js';
import {IMPORTED_OVR_BY_SQUAD} from '../data/imported-ovr-review.js';

const player=(squadId,id)=>allSquads.find(squad=>squad.id===squadId)?.jogadores.find(player=>player.id===id);

test('the direct request locks Kaka 2007 at 92 above FIFA 08 and survives saved draft reloads',()=>{
  const kaka=player('milan-2007','kaka');
  assert.equal(CREATOR_DIRECT_RATING_REVIEWS.length,25);
  assert.equal(kaka.ovr,92);
  assert.equal(kaka.ratingKind,'creator-review');
  assert.deepEqual(kaka.creatorReview,CREATOR_DIRECT_RATING_REVIEWS[0]);
  assert.equal(kaka.releaseRating.ovr,90);
  assert.equal(kaka.releaseRating.edition,'FIFA 08');
  assert.equal(kaka.ratingEdition,undefined);
  const repeated=applyHistoricalFifaRating(kaka,'milan-2007');
  assert.deepEqual(repeated,kaka);
  const slot=FORMATIONS['4-3-3'].slots.find(slot=>positionFit(kaka,slot)!==null);
  const old={...kaka,ovr:90,atributos:Object.fromEntries(Object.entries(kaka.atributos).map(([key,value])=>[key,Math.max(1,value-2)]))};
  const draft={seed:42,rngState:90,rerolls:2,seen:['milan-2007'],currentSquadId:'milan-2007',picks:[{player:old,squadId:'milan-2007',slot}]};
  const refreshed=refreshDraftRatings(draft,allSquads);
  assert.deepEqual(refreshed.picks[0].player,kaka);
  assert.deepEqual({...refreshed,picks:[]},{...draft,picks:[]});
  assert.equal(draft.picks[0].player.ovr,90);
  const unrelated=applyHistoricalFifaRating({id:'kaka',ovr:80,atributos:{ataque:80,meio:80,defesa:40}},'milan-2006');
  assert.equal(unrelated.ovr,80);
});

test('Arsenal 2004 averages exactly 88 while preserving its leading players and refreshing old picks',()=>{
  const squad=allSquads.find(squad=>squad.id==='arsenal-2004'),team=squadTeam(squad);
  const unchanged={'thierry-henry':93,'patrick-vieira':91,'dennis-bergkamp':90,'sol-campbell':90,'ashley-cole':88};
  for(const [id,ovr]of Object.entries(unchanged))assert.equal(player(squad.id,id).ovr,ovr,id);
  assert.equal(squad.jogadores.reduce((sum,p)=>sum+p.ovr,0),88*11);
  assert.equal(team.strength.overall,88);
  const previous={'robert-pires':92,'fredrik-ljungberg':89,'gilberto-silva':89,'kolo-toure':88,'lauren':89,'jens-lehmann':87};
  for(const p of squad.jogadores){
    assert.deepEqual(applyHistoricalFifaRating(p,squad.id),p);
    if(previous[p.id]){
      assert.equal(p.ratingKind,'creator-review');assert.equal(p.releaseRating.ovr,previous[p.id]);
      assert.equal(p.creatorReview.previousOvr,previous[p.id]);
    }
  }
  const draft={seed:42,rngState:90,rerolls:2,seen:[squad.id],currentSquadId:squad.id,picks:team.lineup.map(pick=>({...pick,player:{...pick.player,ovr:previous[pick.player.id]??pick.player.ovr}}))};
  const saved=structuredClone(draft),refreshed=refreshDraftRatings(draft,allSquads);
  assert.equal(calculateTeam(refreshed.picks).overall,88);
  assert.deepEqual({...refreshed,picks:[]},{...saved,picks:[]});assert.deepEqual(draft,saved);
});

test('Brazilian 1960s squads reach the requested overall ratings and refresh saved picks without changing their stars',()=>{
  const cases=[
    {id:'botafogo-1962',overall:85.5,previous:87.2,sum:941,stars:{'manuel-francisco-dos-santos':95,'nilton-santos':92,'waldyr-pereira':92}},
    {id:'santos-1963',overall:86.5,previous:87.5,sum:951,stars:{pele:95,'gilmar-dos-santos-neves':90,'jose-ely-de-miranda':89,'jose-macia':89,'antonio-wilson-vieira-honorio':89,'mauro-ramos':88}},
  ];
  for(const item of cases){
    const squad=allSquads.find(s=>s.id===item.id),team=squadTeam(squad);
    assert.equal(team.strength.overall,item.overall);
    assert.equal(squad.jogadores.reduce((sum,p)=>sum+p.ovr,0),item.sum);
    for(const [id,ovr]of Object.entries(item.stars))assert.equal(player(item.id,id).ovr,ovr,id);
    const draft={seed:42,rngState:90,rerolls:2,seen:[item.id],currentSquadId:item.id,picks:team.lineup.map(pick=>({...pick,player:{...pick.player,ovr:pick.player.creatorReview?.previousOvr??pick.player.ovr}}))};
    const original=structuredClone(draft);
    assert.equal(calculateTeam(draft.picks).overall,item.previous);
    const refreshed=refreshDraftRatings(draft,allSquads);
    assert.equal(calculateTeam(refreshed.picks).overall,item.overall);
    assert.deepEqual({...refreshed,picks:[]},{...draft,picks:[]});
    assert.deepEqual(draft,original);
    for(const p of squad.jogadores)assert.deepEqual(applyHistoricalFifaRating(p,item.id),p);
  }
});

test('all 45 new OVR edits and 22 earlier edits reach their exact player and season',()=>{
  assert.equal(CREATOR_RATING_REVIEWS.length,2);
  assert.equal(CREATOR_RATING_REVIEWS[0].changes.length,22);
  assert.equal(CREATOR_RATING_REVIEW,CREATOR_RATING_REVIEWS[1]);
  assert.equal(CREATOR_RATING_REVIEW.sourceFile,'scorefut-overs-2026-10-22.json');
  assert.equal(CREATOR_RATING_REVIEW.changes.length,45);
  const changes=CREATOR_RATING_REVIEWS.flatMap(review=>review.changes);
  assert.equal(new Set(changes.map(change=>`${change.squadId}/${change.playerId}`)).size,67);
  assert.equal(Object.keys(CREATOR_RATINGS_BY_SQUAD).length,new Set([...changes,...CREATOR_DIRECT_RATING_REVIEWS].map(change=>change.squadId)).size);
  for(const review of CREATOR_RATING_REVIEWS)for(const change of review.changes){
    const found=player(change.squadId,change.playerId);
    assert.ok(found,`${change.squadId}/${change.playerId}`);
    const newer=IMPORTED_OVR_BY_SQUAD[change.squadId]?.[change.playerId];
    if(newer){assert.equal(found.ovr,newer.ovr);assert.deepEqual(found.creatorReview,newer);continue;}
    assert.equal(found.ovr,change.toOvr,`${change.squadId}/${change.playerId} OVR`);
    assert.equal(found.ratingKind,'creator-review');assert.equal(found.ratingEdition,undefined);
    assert.equal(found.creatorReview.previousOvr,change.fromOvr);
    assert.equal(found.creatorReview.exportedAt,review.exportedAt);
    assert.ok(found.ratingReason.includes(review.sourceFile));
    assert.equal(found.ratingSource,'data/creator-ratings.js');
    assert.equal(found.nome,change.nome);
    assert.deepEqual(JSON.parse(JSON.stringify(found)),found,'Imported metadata must survive saving and restoring a match');
    assert.ok(Object.values(found.atributos).every(value=>Number.isInteger(value)&&value>=1&&value<=99));
  }
});

test('new increases and decreases affect only the specified seasons',()=>{
  assert.equal(player('barcelona-2009','lionel-messi').ovr,93);
  assert.equal(player('barcelona-2011','lionel-messi').ovr,96);
  assert.equal(player('barcelona-2015','lionel-messi').ovr,95);
  assert.equal(player('real-madrid-2017','cristiano-ronaldo').ovr,93);
  assert.equal(player('manchester-united-2009','cristiano-ronaldo').ovr,93);
  assert.equal(player('manchester-united-2008','cristiano-ronaldo').ovr,91);
  assert.equal(player('real-madrid-2014','cristiano-ronaldo').ovr,92);
  assert.equal(player('corinthians-2012','cassio').ovr,78);
  assert.equal(player('corinthians-2015','cassio').ovr,78);
  assert.equal(player('fluminense-2023','german-cano').ovr,86);
  assert.equal(player('celtic-2003','henrik-larsson').ovr,85);
  const messi=player('barcelona-2011','lionel-messi');
  assert.equal(messi.priorSeasonReview.ovr,96);
  assert.equal(messi.archivedRating.ovr,90);
});

test('creator adjustments override season reviews while keeping the earlier review and EA archive',()=>{
  const inzaghi=player('milan-2007','filippo-inzaghi'),neymar=player('santos-2011','neymar');
  assert.equal(inzaghi.ovr,88);assert.equal(inzaghi.priorSeasonReview.ovr,87);
  assert.equal(neymar.ovr,89);assert.equal(neymar.priorSeasonReview.ovr,88);
  const drogba=player('chelsea-2012','didier-drogba');
  assert.equal(drogba.ovr,88);assert.equal(drogba.archivedRating.ovr,86);
  assert.ok(drogba.archivedRating.source.startsWith('https://'));
  assert.equal(player('santos-2010','neymar').ovr,78);
  assert.equal(player('barcelona-2015','neymar').ovr,88);
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
  const unrelated=applyHistoricalFifaRating(base,'atletico-mineiro-1999');
  assert.equal(unrelated.ovr,base.ovr);assert.deepEqual(unrelated.atributos,base.atributos);
  assert.equal(unrelated.ratingKind,'editorial-estimate');
});

test('lowered OVRs reduce simulation attributes and remain safe to reapply',()=>{
  const base={id:'kevin-de-bruyne',ovr:91,atributos:{ataque:90,meio:95,defesa:60,finalizacao:82,reflexo:1,posicionamento:89}};
  const original=structuredClone(base),updated=applyHistoricalFifaRating(base,'manchester-city-2024');
  assert.equal(updated.ovr,89);
  assert.deepEqual(updated.atributos,{ataque:88,meio:93,defesa:58,finalizacao:80,reflexo:1,posicionamento:87});
  assert.deepEqual(base,original);
  assert.deepEqual(applyHistoricalFifaRating(updated,'manchester-city-2024'),updated);
});

test('existing draft picks receive every imported rating without losing positions, skips or state',()=>{
  for(const review of CREATOR_RATING_REVIEWS)for(const change of review.changes){
    const latest=player(change.squadId,change.playerId),slot=FORMATIONS['4-3-3'].slots.find(slot=>positionFit(latest,slot)!==null);
    const draft={seed:42,rngState:90,rerolls:2,seen:[change.squadId],currentSquadId:change.squadId,picks:[{player:{...latest,ovr:change.fromOvr},squadId:change.squadId,slot}]};
    const original=structuredClone(draft),refreshed=refreshDraftRatings(draft,allSquads);
    assert.equal(refreshed.picks[0].player.ovr,IMPORTED_OVR_BY_SQUAD[change.squadId]?.[change.playerId]?.ovr??change.toOvr);
    assert.equal(refreshed.picks[0].slot,slot);
    assert.deepEqual({...refreshed,picks:[]},{...draft,picks:[]});
    assert.deepEqual(draft,original);
  }
});
