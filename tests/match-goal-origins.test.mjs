import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {squadTeam,simulateMatch,mulberry32} from '../js/engine.js';
import {assignSetPieceGoals,goalOriginLabel} from '../js/match-goal-origins.js';
import {createMatchMotion} from '../js/match-motion.js';
const home={...squadTeam(allSquads.find(s=>s.id==='arsenal-2004')),id:'user'},away=squadTeam(allSquads.find(s=>s.id==='barcelona-2011'));

test('all four scoring restarts link taker, scorer and the ball entering the goal',()=>{
 for(const [roll,origin]of [[.001,'olympic'],[.04,'free-kick'],[.12,'corner-header'],[.18,'free-kick-header']]){
  for(const side of ['home','away']){
   const team=side==='home'?home:away;
   const goal={type:'goal',team:side,minute:30,player:team.lineup[1].player,x:.5,y:.5};
   const events=[goal];assignSetPieceGoals(events,home,away,()=>roll);
   assert.equal(goal.origin,origin);assert.ok(goalOriginLabel(origin));
   const restart=events.find(e=>e.restartId===goal.restartId&&e.type!=='goal');
   assert.ok(restart);assert.equal(restart.goalMinute,30);
   if(origin.endsWith('header'))assert.notEqual(restart.player.id,goal.player.id);
   else assert.equal(restart.player.id,goal.player.id);
   const result={duration:90,homeGoals:side==='home'?1:0,awayGoals:side==='away'?1:0,events};
   const motion=createMatchMotion(home,away,{id:origin+side,result},{seed:42});
   const kick=motion.setPieces.find(e=>e.origin===origin);assert.ok(kick);
   const start=motion.at(kick.kickAt),end=motion.at(30);
   assert.ok(Math.hypot(start.ball.x-kick.spot.x,start.ball.y-kick.spot.y)<.01);
   assert.ok(Math.abs(end.ball.x-(side==='home'?97:3))<.001);assert.ok(Math.abs(end.ball.y-50)<.001);
  }
 }
});

test('penalty goals and closely spaced goals keep their original origin and scorer',()=>{
 const player=home.lineup[1].player;
 const events=[{type:'penalty',team:'home',minute:20,player},{type:'goal',team:'home',minute:20,player},{type:'goal',team:'away',minute:22,player}];
 const before=structuredClone(events);assignSetPieceGoals(events,home,away,()=>.001);assert.deepEqual(events,before);
});

test('seeded matches reconcile scores and show all origins with Olympic goals rarer',()=>{
 const counts={};
 for(let seed=1;seed<=500;seed++){
  const result=simulateMatch(home,away,mulberry32(seed),{knockout:true});
  assert.deepEqual(result,simulateMatch(home,away,mulberry32(seed),{knockout:true}));
  const goals=result.events.filter(e=>e.type==='goal');
  assert.equal(goals.filter(e=>e.team==='home').length,result.homeGoals);
  assert.equal(goals.filter(e=>e.team==='away').length,result.awayGoals);
  assert.equal(result.scorers.reduce((n,p)=>n+p.goals,0),goals.length);
  for(const goal of goals.filter(g=>g.origin)){
   counts[goal.origin]=(counts[goal.origin]||0)+1;
   const team=goal.team==='home'?home:away;
   assert.ok(team.lineup.some(e=>e.slot.position!=='GOL'&&e.player.id===goal.player.id));
   assert.equal(result.events.filter(e=>e.type!=='goal'&&!e.penaltyAwarded&&e.restartId===goal.restartId).length,1);
  }
 }
 for(const origin of ['olympic','free-kick','corner-header','free-kick-header'])assert.ok(counts[origin]>0,origin);
 assert.ok(counts.olympic<counts['corner-header']&&counts.olympic<counts['free-kick']);
});
