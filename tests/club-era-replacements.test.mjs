import test from 'node:test';
import assert from 'node:assert/strict';
import {clubs,allSquads} from '../data/game-squads.js';
import {RECENT_CLUB_ERAS,RECENT_CLUB_RELEASE_RATINGS,replaceClubEras} from '../data/club-era-replacements.js';
import {squadsForMode} from '../data/competitions.js';
import {squadTeam,positionFit} from '../js/engine.js';
import {createDraft,drawSquad,refreshDraftRatings} from '../js/draft.js';
test('three club eras are replaced while every club retains five distinct eras',()=>{
 assert.equal(clubs.length,43);assert.equal(allSquads.length,370);
 for(const era of RECENT_CLUB_ERAS){
  const id=era.clubId+'-'+era.ano,old=era.clubId+'-'+era.replaceYear;
  assert.equal(allSquads.find(s=>s.id===old),undefined);
  const s=allSquads.find(s=>s.id===id);assert.ok(s,id);assert.equal(s.jogadores.length,11);
  const c=clubs.find(c=>c.id===era.clubId);assert.equal(c.temporadas.length,5);assert.equal(new Set(c.temporadas.map(s=>s.ano)).size,5);
  const team=squadTeam(s);assert.equal(new Set(team.lineup.map(p=>p.player.id)).size,11);
  for(const pick of team.lineup)assert.notEqual(positionFit(pick.player,pick.slot),null);
  const mode=era.clubId==='bahia'?'copa-do-brasil':'champions',pool=squadsForMode(allSquads,mode);
  const draw=drawSquad(createDraft(2,'date',mode),pool.filter(s=>s.id===id),team.formation);
  assert.equal(draw.currentSquadId,id);
  const draft={...createDraft(3,'date',mode),picks:team.lineup.map(p=>({...p,player:{...p.player,ovr:40}}))};
  assert.deepEqual(refreshDraftRatings(draft,allSquads).picks,team.lineup);
 }
 assert.ok(allSquads.find(s=>s.id==='celtic-1970'));
});
test('22 verified player-edition ratings and 11 editorial Bahia ratings retain their correct provenance',()=>{
 assert.equal(Object.values(RECENT_CLUB_RELEASE_RATINGS).reduce((n,rows)=>n+Object.keys(rows).length,0),22);
 for(const era of RECENT_CLUB_ERAS){
  const squad=allSquads.find(s=>s.id===era.clubId+'-'+era.ano);
  for(const p of squad.jogadores){
   if(era.clubId==='bahia'){assert.equal(p.ratingKind,'editorial-estimate');assert.equal(p.releaseRating,undefined);assert.equal(p.ratingEdition,undefined);}
   else {assert.equal(p.ratingKind,'release-rating');assert.equal(p.releaseRating.releaseYear,era.ano);assert.equal(p.releaseRating.edition,'FIFA '+String(era.ano+1).slice(-2));assert.equal(p.releaseRating.ovr,p.ovr);assert.equal(p.releaseRating.eaId,p.eaId);}
  }
 }
 const everaldo=allSquads.find(s=>s.id==='bahia-2024').jogadores.find(p=>p.nome==='Everaldo'),old=allSquads.find(s=>s.id==='nation-brazil-1970').jogadores.find(p=>p.nome==='Everaldo');
 assert.notEqual(everaldo.id,old.id);assert.ok(everaldo.tags.includes('CA'));assert.ok(old.tags.includes('LE'));
});
test('replacing eras does not mutate source clubs or share mutable player tags',()=>{
 const source=[{id:'bahia',temporadas:[{ano:1959,jogadores:[]},{ano:1988,jogadores:[{id:'keep'}]}]}],before=structuredClone(source);
 const result=replaceClubEras(source);assert.deepEqual(source,before);assert.equal(result[0].temporadas[1],source[0].temporadas[1]);
 result[0].temporadas[0].jogadores[0].tags.push('MC');assert.equal(RECENT_CLUB_ERAS.find(e=>e.clubId==='bahia').jogadores[0].tags.includes('MC'),false);
});
