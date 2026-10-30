import test from 'node:test';
import assert from 'node:assert/strict';
import { allSquads } from '../data/clubs.js';
import { FORMATIONS, squadTeam, simulateMatch, mulberry32 } from '../js/engine.js';
import { createMatchMotion, advanceMatchMinute, formatMatchClock, matchAddedMinutes, scoreAt, MATCH_SPEEDS, normalizeMatchSpeed } from '../js/match-motion.js';
import { initMatchPlayback } from '../js/match-playback.js';
import {renderMatch} from '../js/ui.js';

const home={...squadTeam(allSquads[0]),id:'user'},away=squadTeam(allSquads[4]);
const match={id:'motion-test',homeId:home.id,awayId:away.id,result:simulateMatch(home,away,mulberry32(39),{knockout:true})};

test('normal plays at 4x, fast at 8x and legacy speeds adopt normal without clock jumps',()=>{
  assert.deepEqual(MATCH_SPEEDS,[4,8]);
  for(const legacy of [undefined,null,1,2,0,-1,NaN]){
    assert.equal(normalizeMatchSpeed(legacy),4);
    assert.equal(advanceMatchMinute(0,1000,legacy,90),4);
  }
  assert.equal(advanceMatchMinute(0,1000,4,90),4);
  assert.equal(advanceMatchMinute(0,1000,8,90),8);
  assert.equal(advanceMatchMinute(89.99,16,8,90),90);
  assert.equal(advanceMatchMinute(15,16,4,90),15.064);
  assert.equal(formatMatchClock(15.5),'15:30');
  assert.equal(formatMatchClock(120),'120:00');
  assert.deepEqual(scoreAt(match.result,match.result.duration),[match.result.homeGoals,match.result.awayGoals]);
});

test('added minutes appear for the active period and remain at the final whistle',()=>{
  const regular={duration:95,regulationStoppageTime:5,extraTime:false};
  for(const [minute,expected] of [[89.99,0],[90,5],[94,5],[95,5]])assert.equal(matchAddedMinutes(regular,minute),expected);
  const extra={...regular,extraTime:true,extraTimeStart:95,extraTimeEnd:125,extraTimeStoppageTime:7,duration:132};
  for(const [minute,expected] of [[89,0],[90,5],[94.99,5],[95,0],[120,0],[124.99,0],[125,7],[132,7]])assert.equal(matchAddedMinutes(extra,minute),expected);
  assert.equal(matchAddedMinutes({duration:90},90),0);
  assert.equal(matchAddedMinutes({duration:120,extraTime:true},120),0);
});

test('the displayed extra-time clock ends at 120 plus its own added time, without carrying regulation stoppage',()=>{
  const result={extraTime:true,regulationStoppageTime:6,extraTimeStart:96,extraTimeEnd:126,extraTimeStoppageTime:4,duration:130};
  for(const [minute,clock,added] of [[89.5,'89:30',0],[95,'90:00',6],[96,'90:00',0],[111,'105:00',0],[125.5,'119:30',0],[126,'120:00',4],[130,'120:00',4]]){
    assert.equal(formatMatchClock(minute,result),clock);
    assert.equal(matchAddedMinutes(result,minute),added);
  }
  assert.equal(formatMatchClock(130,{extraTime:true,duration:130}),'120:00');
  assert.equal(formatMatchClock(95,{duration:95,regulationStoppageTime:5}),'90:00');
  assert.equal(result.duration,130);
});

test('all formations retain 22 distinct shirts in bounds and move smoothly between pass keyframes',()=>{
  for(const formation of Object.keys(FORMATIONS)){
    const team={...home,lineup:home.lineup.map((entry,index)=>({...entry,slot:FORMATIONS[formation].slots[index]}))};
    const motion=createMatchMotion(team,away,match), repeat=createMatchMotion(team,away,match);
    assert.equal(motion.anchors.length,22);
    assert.deepEqual(motion.frames,repeat.frames);
    for(let minute=0;minute<=match.result.duration;minute+=.17){
      const scene=motion.at(minute), next=motion.at(minute+.001);
      assert.equal(scene.players.length,22);
      for(const point of [...scene.players,scene.ball]){
        assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
        assert.ok(point.x>=3&&point.x<=97&&point.y>=5&&point.y<=95);
      }
      scene.players.forEach((point,index)=>assert.ok(Math.hypot(point.x-next.players[index].x,point.y-next.players[index].y)<.5));
      assert.ok(Math.hypot(scene.ball.x-next.ball.x,scene.ball.y-next.ball.y)<1);
    }
    // A restart may deliberately hold the ball; sample open play for continuous movement.
    const openPlay=Array.from({length:400},(_,i)=>5+i*.17).find(t=>!motion.at(t).setPiece&&!motion.at(t+.02).setPiece&&['pass','carry','cross','switch'].includes(motion.at(t).kind));
    assert.ok(Number.isFinite(openPlay));
    assert.notDeepEqual(motion.at(openPlay).players,motion.at(openPlay+.02).players);
    assert.notDeepEqual(motion.at(openPlay).ball,motion.at(openPlay+.02).ball);
    for(const frame of motion.frames.filter(frame=>frame.kind==='goal')){
      assert.equal(motion.at(frame.at).ball.x,frame.side==='home'?97:3);
      assert.equal(motion.at(frame.at).ball.y,50);
    }
  }
});

test('possessions vary their style and each player follows a distinct run path',()=>{
  const motion=createMatchMotion(home,away,match);
  const styles=new Set(motion.frames.map(frame=>frame.style).filter(Boolean));
  const actions=new Set(motion.frames.map(frame=>frame.kind));
  assert.ok(styles.size>=3,`Expected varied possession styles, got ${[...styles]}`);
  assert.ok(actions.size>=4,`Expected varied actions, got ${[...actions]}`);
  const paths=motion.anchors.map((_,index)=>motion.frames.map(frame=>`${Math.round(frame.players[index].x)},${Math.round(frame.players[index].y)}`).join('|'));
  assert.ok(new Set(paths).size>=20,'Most players should follow distinct paths instead of repeating the same movement');
});

test('a goal at the final whistle still reaches the goal mouth',()=>{
  const lastGoal={minute:90,type:'goal',team:'home',player:home.lineup[10].player,x:.5,y:.2};
  const final={...match,result:{...match.result,duration:90,events:[lastGoal],homeGoals:1,awayGoals:0}};
  const motion=createMatchMotion(home,away,final);
  assert.equal(motion.at(90).ball.x,97);
  assert.equal(motion.at(90).ball.y,50);
  assert.deepEqual(scoreAt(final.result,90),[1,0]);
});

test('matches start automatically, stop in a hidden tab, resume without a play button, retain speed and finish once',()=>{
  const originals={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,ResizeObserver:globalThis.ResizeObserver,document:globalThis.document};
  let nextId=0,finish=0,saves=0;const callbacks=new Map();
  globalThis.requestAnimationFrame=callback=>{callbacks.set(++nextId,callback);return nextId;};
  globalThis.cancelAnimationFrame=id=>callbacks.delete(id);
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  globalThis.document={activeElement:null};
  const node=()=>({style:{setProperty(){}},textContent:'',classList:{toggle(){}},value:0,setAttribute(name,value){this[name]=value;}});
  const players=Array.from({length:22},node),ball=node(),clock=node(),scores=[node(),node()];
  const pitch={clientWidth:900,clientHeight:486,querySelectorAll:()=>players,querySelector:()=>ball};
  const elements={'[data-live-pitch]':pitch,'.score-clock':clock,'[data-goal-notice]':node(),'[data-goal-name]':node(),'[data-match-phase]':node()};
  const scorers=node();elements['[data-match-goals]']=scorers;
  const addedTime=node();elements['[data-match-added-time]']=addedTime;
  const app={querySelector:selector=>elements[selector],querySelectorAll:()=>scores};
  const liveMatch={...match,result:{...match.result,homeGoals:1,awayGoals:0,events:[{type:'goal',minute:.5,team:'home',player:home.lineup[10].player,x:.5,y:.2}]}};
  const state={screen:'match',mode:'champions',formation:home.formation,matchMinute:0,matchSpeed:1,matchPlaying:false,userMatchIndex:0,tournament:{seed:39,mode:'champions',userTeamId:'user',teams:[home,away],userMatches:[liveMatch],matches:[liveMatch],bracket:[]}};
  // DOMStringMap removes a dash only when it precedes a lowercase letter.
  const attributes=renderMatch(state).match(/<div class="match-score-goals"[^>]*>/)[0];
  scorers.dataset=Object.fromEntries([...attributes.matchAll(/data-([\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase()),value]));
  const tick=time=>{const [id,callback]=callbacks.entries().next().value;callbacks.delete(id);callback(time);};
  try{
    const playback=initMatchPlayback({app,state,onFinish:()=>finish++,onSave:()=>saves++});
    playback.attach();assert.equal(state.matchPlaying,true);playback.start();tick(0);tick(100);
    assert.equal(state.matchSpeed,4);assert.equal(state.matchMinute,.4);assert.equal(clock.textContent,'00:24');
    assert.equal(addedTime.hidden,true);
    assert.equal(scorers.innerHTML,'');
    const before=players[5].style.transform;
    tick(200);assert.notEqual(players[5].style.transform,before);
    globalThis.document.hidden=true;playback.attach();assert.equal(state.matchPlaying,false);assert.equal(callbacks.size,0);assert.equal(state.matchMinute,.8);
    globalThis.document.hidden=false;state.matchSpeed=8;playback.attach();assert.equal(state.matchPlaying,true);playback.start();tick(300);tick(400);
    assert.equal(state.matchMinute,1.6);assert.equal(callbacks.size,1);
    assert.ok(scorers.innerHTML.includes(home.lineup[10].player.nome));
    assert.ok(scorers.innerHTML.includes('class="match-scorers home"'));
    assert.ok(scorers.innerHTML.includes('class="match-scorers away"'));
    Object.assign(liveMatch.result,{duration:95,extraTime:false,regulationStoppageTime:5});
    state.matchMinute=90;tick(500);
    assert.equal(addedTime.hidden,false);assert.equal(addedTime.textContent,'+5');
    assert.equal(addedTime['aria-label'],'5 minutos de acréscimo');
    state.matchMinute=94.9;tick(600);
    assert.equal(state.matchMinute,95);assert.equal(finish,1);assert.equal(callbacks.size,0);
    assert.equal(addedTime.hidden,false);assert.equal(addedTime.textContent,'+5');
    assert.equal(state.matchPlaying,false);assert.equal(saves,0);
    assert.ok(scorers.innerHTML.includes('class="match-scorers away"'));
    playback.attach();assert.equal(state.matchPlaying,false);playback.start();assert.equal(callbacks.size,0);
  }finally{for(const [key,value] of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
