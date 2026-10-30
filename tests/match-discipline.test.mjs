import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {squadTeam,simulateMatch,mulberry32} from '../js/engine.js';
import {renderMatchGoals} from '../js/match-goals.js';
import {playerSentOff,matchIncidentsAt} from '../js/match-discipline.js';
const h=squadTeam(allSquads[0]),a=squadTeam(allSquads[10]);
test('cards have a foul and opposing offender; rare reds never leave future scorers on the field',()=>{
 let red=0,yellow=0,pen=0;
 for(let seed=1;seed<=500;seed++){
  const r=simulateMatch(h,a,mulberry32(seed));
  assert.deepEqual(r,JSON.parse(JSON.stringify(r)));
  for(const e of r.events.filter(e=>['red','yellow'].includes(e.type))){
   const foul=r.events.find(f=>f.type==='foul'&&f.foulId===e.foulId);
   assert.ok(foul);assert.notEqual(foul.team,e.team);assert.equal(foul.offender.id,e.player.id);
   if(e.type==='yellow'){yellow++;continue;}red++;
   assert.ok(!playerSentOff(r,e.team,e.player.id,e.minute-.001));assert.ok(playerSentOff(r,e.team,e.player.id,e.minute));
   assert.ok(!r.events.some(g=>['goal','penalty'].includes(g.type)&&g.team===e.team&&g.player.id===e.player.id&&g.minute>=e.minute));
   assert.ok(renderMatchGoals(r,e.minute).includes('match-red-card'));
  }
  for(const g of r.events.filter(e=>e.type==='goal'&&e.origin==='penalty')){
   pen++;const foul=r.events.find(f=>f.type==='foul'&&f.penaltyAwarded&&f.restartId===g.restartId);assert.ok(foul);
   assert.ok(renderMatchGoals(r,g.minute).includes('(pen)'));
  }
 }
 assert.ok(red>0&&red<60);assert.ok(yellow>red*5);assert.ok(pen>0);
});
test('red-only scoreboards update and escape names without leaking future cards',()=>{
 const result={events:[{type:'red',team:'away',minute:44,player:{id:'d',nome:'Nome <seguro>'}}]};
 assert.equal(renderMatchGoals(result,43),'');assert.equal(matchIncidentsAt(result,44).length,1);
 const html=renderMatchGoals(result,44);assert.ok(html.includes('Nome &lt;seguro&gt;'));assert.ok(html.includes('44′'));
});
