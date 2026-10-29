import test from 'node:test';
import assert from 'node:assert/strict';
import {worldCupNations,worldCupSquads,allSquads} from '../data/game-squads.js';
import {squadTeam,FORMATIONS,positionFit} from '../js/engine.js';
import {createDraft,drawSquad,refreshDraftRatings} from '../js/draft.js';
const replacements=[
 ['nation-spain-1950','nation-spain-2006',[[49369,86],[113422,88]]],
 ['nation-sweden-1950','nation-sweden-2006',[[41236,86],[6975,83]]],
 ['nation-uruguay-1930','nation-uruguay-2014',[[176580,89],[179813,85]]],
 ['nation-uruguay-1950','nation-uruguay-2018',[[176580,91],[179813,89],[182493,90]]],
 ['nation-united-states-1930','nation-united-states-2022',[[227796,82],[233267,77],[229348,74]]],
];
test('five retired eras are replaced without changing the 32 countries and 155-era catalog',()=>{
 assert.equal(worldCupNations.length,32);assert.equal(worldCupSquads.length,155);
 for(const [oldId,newId,stars] of replacements){
  assert.equal(worldCupSquads.find(s=>s.id===oldId),undefined);
  const s=worldCupSquads.find(s=>s.id===newId);assert.ok(s,newId);
  const nation=worldCupNations.find(n=>n.id===s.clubId),eras=worldCupSquads.filter(t=>t.clubId===s.clubId);
  assert.equal(eras.length,5);assert.equal(new Set(eras.map(t=>t.ano)).size,5);
  assert.deepEqual([...nation.eras].sort((a,b)=>a-b),eras.map(t=>t.ano).sort((a,b)=>a-b));
  const team=squadTeam(s);assert.equal(team.lineup.length,11);assert.equal(new Set(team.lineup.map(p=>p.player.id)).size,11);
  for(const pick of team.lineup)assert.notEqual(positionFit(pick.player,pick.slot),null);
  for(const [eaId,ovr]of stars)assert.equal(s.jogadores.find(p=>p.eaId===eaId)?.ovr,ovr,`${newId}/${eaId}`);
 }
});
test('all 55 replacements carry era-specific FIFA ratings and traceable player identities',()=>{
 for(const [,newId]of replacements){
  const s=worldCupSquads.find(s=>s.id===newId);assert.equal(s.jogadores.length,11);
  for(const p of s.jogadores){
   assert.equal(p.ratingKind,'release-rating');assert.equal(p.releaseRating.releaseYear,s.ano);
   assert.equal(p.releaseRating.edition,'FIFA '+String(s.ano+1).slice(-2));assert.equal(p.releaseRating.ovr,p.ovr);
   assert.equal(p.releaseRating.eaId,p.eaId);assert.match(p.worldCupPlayerId,/^P-/);assert.match(p.birthDate,/^\d{4}-\d{2}-\d{2}$/);
   assert.ok(Object.values(p.atributos).every(v=>Number.isInteger(v)&&v>=1&&v<=99));
   for(const existing of allSquads.flatMap(t=>t.jogadores).filter(t=>t.worldCupPlayerId===p.worldCupPlayerId))assert.equal(existing.id,p.id);
  }
 }
});
test('new draws omit retired eras while already saved picks remain readable',()=>{
 for(let seed=0;seed<100;seed++){
  const draft=drawSquad(createDraft(seed,'2026-10-29','world-cup'),worldCupSquads,'4-3-3');
  assert.ok(!replacements.some(([old])=>old===draft.currentSquadId));
 }
 const oldDraft={...createDraft(4,'2026-10-28','world-cup'),picks:[{squadId:'nation-united-states-1930',player:{id:'bert-patenaude',nome:'Bert Patenaude',ovr:88,tags:['CA']},slot:FORMATIONS['4-3-3'].slots.find(s=>s.label==='CA')}]};
 assert.deepEqual(refreshDraftRatings(oldDraft,allSquads),oldDraft);
});
