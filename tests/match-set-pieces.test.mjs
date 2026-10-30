import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {squadTeam,simulateMatch,mulberry32} from '../js/engine.js';
import {createMatchMotion,scoreAt} from '../js/match-motion.js';
const home={...squadTeam(allSquads.find(s=>s.id==='arsenal-2004')),id:'user'},away=squadTeam(allSquads.find(s=>s.id==='barcelona-2011'));
function fixture(seed){return {id:'restart-'+seed,homeId:home.id,awayId:away.id,result:simulateMatch(home,away,mulberry32(seed),{knockout:true})};}

test('repeated corners and fouls are seeded, finite, separate and preserve results',()=>{
 for(const seed of [2,7,14,39,102]){
  const match=fixture(seed),snapshot=JSON.stringify(match),motion=createMatchMotion(home,away,match,{seed});
  assert.deepEqual(motion.setPieces,createMatchMotion(home,away,match,{seed}).setPieces);
  assert.equal(JSON.stringify(match),snapshot);
  assert.ok(motion.setPieces.filter(e=>e.type==='foul').length>=2);
  assert.ok(motion.setPieces.filter(e=>e.type==='corner').length>=2);
  for(const [i,event]of motion.setPieces.entries()){
   if(i)assert.ok(event.at>=motion.setPieces[i-1].end+.44);
   assert.ok(event.end<match.result.duration);
   for(const goal of match.result.events.filter(e=>e.type==='goal'))assert.ok(event.at>=goal.minute+1.3||event.end<=goal.minute-1.8);
   const scene=motion.at(event.at+2);
   assert.equal(scene.setPiece.type,event.type);
   assert.equal(scene.possession,event.side);
   assert.ok(Math.hypot(scene.ball.x-event.spot.x,scene.ball.y-event.spot.y)<.001);
   for(const p of [...scene.players,scene.ball])assert.ok(p.x>=3&&p.x<=97&&p.y>=5&&p.y<=95);
   const shot=motion.at(event.kickAt+.7);
   assert.ok(Math.hypot(shot.ball.x-event.spot.x,shot.ball.y-event.spot.y)>1);
  }
  assert.equal(motion.at(match.result.duration).setPiece,null);
  assert.deepEqual(scoreAt(match.result,match.result.duration),[match.result.homeGoals,match.result.awayGoals]);
 }
});

test('resuming a replay or changing pace uses exactly the same restart at a given minute',()=>{
 const match=fixture(77),normal=createMatchMotion(home,away,match,{seed:77}),resume=createMatchMotion(home,away,match,{seed:77});
 for(const event of normal.setPieces)assert.deepEqual(normal.at(event.at+2),resume.at(event.at+2));
});
