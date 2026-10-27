import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {FORMATIONS,squadTeam,simulateMatch,mulberry32} from '../js/engine.js';
import {lineupAnchors,createMatchMotion} from '../js/match-motion.js';
import {movementRole,movementProfile,MOVEMENT_PATHS,sampleMovement} from '../js/match-movement-library.js';

const home=squadTeam(allSquads[0]),away=squadTeam(allSquads[4]);
const fixture={id:'movement-repertoire',result:simulateMatch(home,away,mulberry32(39))};

test('formation labels preserve exact duties instead of treating fullbacks, centrebacks and forwards alike',()=>{
  for(const formation of Object.values(FORMATIONS)){
    const team={...home,lineup:home.lineup.map((entry,i)=>({...entry,slot:formation.slots[i]}))};
    assert.deepEqual(lineupAnchors(team,team).slice(0,11).map(p=>p.role),formation.slots.map(slot=>slot.label));
  }
  const entry={slot:{position:'DEF'},player:{tags:['LE']}};
  assert.equal(movementRole(entry),'LE');
  assert.equal(movementRole({...entry,slot:{label:'RB',position:'DEF'}}),'LD');
  assert.equal(movementRole({slot:{position:'MEI'},player:{tags:['VOL']}}),'VOL');
  assert.equal(movementRole({slot:{position:'ATA'},player:{tags:[]}}),'CA');
});

test('existing attributes change the movement archetype while individual timing stays reproducible',()=>{
  const base={slot:{label:'MC',position:'MEI'},player:{id:'same-player',ovr:80,atributos:{ataque:65,meio:95,defesa:70,finalizacao:60,posicionamento:80}}};
  assert.equal(movementProfile(base).style,'creator');
  assert.equal(movementProfile({...base,player:{...base.player,atributos:{...base.player.atributos,ataque:92}}}).style,'boxToBox');
  assert.deepEqual(movementProfile(base),movementProfile(base));
  assert.notEqual(movementProfile(base).phase,movementProfile({...base,player:{...base.player,id:'another-player'}}).phase);
  assert.equal(movementProfile({...base,slot:{label:'CA'},player:{...base.player,atributos:{meio:95,finalizacao:70}}}).style,'falseNine');
});

test('both teams have varied, role-appropriate runs in attack and defense without mutating a result',()=>{
  const before=structuredClone({home,away,fixture});
  const motion=createMatchMotion(home,away,fixture,{seed:27});
  for(const side of ['home','away']){
    assert.ok(new Set(motion.frames.filter(f=>f.side===side).map(f=>f.style).filter(Boolean)).size>=4);
  }
  for(const [index,anchor]of motion.anchors.entries()){
    const attacking=new Set(),defending=new Set();
    for(const frame of motion.frames.filter(f=>f.runs)){
      (frame.side===anchor.side?attacking:defending).add(frame.movements[index]);
      if(anchor.role==='GOL')assert.ok(frame.movements[index].startsWith('keeper'));
    }
    assert.ok(attacking.size>=2,`${anchor.side} ${anchor.role}: attacking variety`);
    assert.ok(defending.size>=2,`${anchor.side} ${anchor.role}: defending variety`);
    if(anchor.role==='ZAG')assert.ok(!attacking.has('nearPost')&&!attacking.has('cutInside'));
  }
  assert.ok(Object.keys(MOVEMENT_PATHS).length>=30);
  assert.deepEqual({home,away,fixture},before);
});

test('different campaigns vary even in a goalless match and replaying or seeking preserves the same paths',()=>{
  const draw={...fixture,result:{...fixture.result,events:[],homeGoals:0,awayGoals:0}};
  const a=createMatchMotion(home,away,draw,{seed:1}),b=createMatchMotion(home,away,draw,{seed:2});
  assert.notDeepEqual(a.frames,b.frames);
  assert.deepEqual(a.frames,createMatchMotion(home,away,draw,{seed:1}).frames);
  const snapshot=a.at(42.52);a.at(90);a.at(2);assert.deepEqual(a.at(42.52),snapshot);
  for(const [index,anchor]of a.anchors.entries())if(anchor.role==='GOL'){
    for(const frame of a.frames){assert.ok(frame.players[index].x>=5&&frame.players[index].x<=95);assert.ok(frame.players[index].y>=35&&frame.players[index].y<=65);}
  }
});

test('curved runs stay finite and a carried ball stays beside its carrier',()=>{
  for(const name of Object.keys(MOVEMENT_PATHS))for(let phase=0;phase<=1;phase+=.01){
    const p=sampleMovement(name,phase);assert.ok(Number.isFinite(p.forward)&&Number.isFinite(p.lateral));
  }
  const motion=createMatchMotion(home,away,fixture,{seed:27});let carries=0;
  for(let i=0;i<motion.frames.length-1;i++){
    const first=motion.frames[i],second=motion.frames[i+1];
    if(first.owner<0||first.owner!==second.owner||first.side!==second.side||second.kind!=='carry')continue;
    const scene=motion.at((first.at+second.at)/2),p=scene.players[scene.owner];
    assert.ok(Math.hypot(scene.ball.x-p.x,scene.ball.y-p.y)<2.1);carries++;
  }
  assert.ok(carries>0);
});
