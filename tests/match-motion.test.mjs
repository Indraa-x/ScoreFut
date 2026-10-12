import test from 'node:test';
import assert from 'node:assert/strict';
import { allSquads } from '../data/clubs.js';
import { FORMATIONS, squadTeam, simulateMatch, mulberry32 } from '../js/engine.js';
import { createMatchMotion, advanceMatchMinute, formatMatchClock, scoreAt } from '../js/match-motion.js';
import { initMatchPlayback } from '../js/match-playback.js';
import {renderMatch} from '../js/ui.js';

const home={...squadTeam(allSquads[0]),id:'user'},away=squadTeam(allSquads[4]);
const match={id:'motion-test',homeId:home.id,awayId:away.id,result:simulateMatch(home,away,mulberry32(39),{knockout:true})};

test('continuous clock supports 1x, 4x and 8x without jumping by minutes',()=>{
  assert.equal(advanceMatchMinute(0,1000,1,90),1);
  assert.equal(advanceMatchMinute(0,1000,4,90),4);
  assert.equal(advanceMatchMinute(0,1000,8,90),8);
  assert.equal(advanceMatchMinute(89.99,16,8,90),90);
  assert.equal(advanceMatchMinute(15,16,1,90),15.016);
  assert.equal(formatMatchClock(15.5),'15:30');
  assert.equal(formatMatchClock(120),'120:00');
  assert.deepEqual(scoreAt(match.result,match.result.duration),[match.result.homeGoals,match.result.awayGoals]);
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
    assert.notDeepEqual(motion.at(15.1).players,motion.at(15.12).players);
    assert.notDeepEqual(motion.at(15.1).ball,motion.at(15.12).ball);
    for(const frame of motion.frames.filter(frame=>frame.kind==='goal')){
      assert.equal(motion.at(frame.at).ball.x,frame.side==='home'?97:3);
      assert.equal(motion.at(frame.at).ball.y,50);
    }
  }
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
  const node=()=>({style:{setProperty(){}},textContent:'',classList:{toggle(){}},value:0});
  const players=Array.from({length:22},node),ball=node(),clock=node(),scores=[node(),node()];
  const pitch={clientWidth:900,clientHeight:486,querySelectorAll:()=>players,querySelector:()=>ball};
  const elements={'[data-live-pitch]':pitch,'.score-clock':clock,'#match-timeline':node(),'[data-goal-notice]':node(),'[data-goal-name]':node(),'[data-match-phase]':node(),'[data-match-end-time]':node()};
  const scorers=node();elements['[data-match-goals]']=scorers;
  const app={querySelector:selector=>elements[selector],querySelectorAll:()=>scores};
  const liveMatch={...match,result:{...match.result,homeGoals:1,awayGoals:0,events:[{type:'goal',minute:.5,team:'home',player:home.lineup[10].player,x:.5,y:.2}]}};
  const state={screen:'match',mode:'champions',formation:home.formation,matchMinute:0,matchSpeed:1,matchPlaying:false,userMatchIndex:0,tournament:{seed:39,mode:'champions',userTeamId:'user',teams:[home,away],userMatches:[liveMatch],matches:[liveMatch],bracket:[]}};
  // DOMStringMap removes a dash only when it precedes a lowercase letter.
  const attributes=renderMatch(state).match(/<div class="match-goals"[^>]*>/)[0];
  scorers.dataset=Object.fromEntries([...attributes.matchAll(/data-([\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase()),value]));
  const tick=time=>{const [id,callback]=callbacks.entries().next().value;callbacks.delete(id);callback(time);};
  try{
    const playback=initMatchPlayback({app,state,onFinish:()=>finish++,onSave:()=>saves++});
    playback.attach();assert.equal(state.matchPlaying,true);playback.start();tick(0);tick(100);
    assert.equal(state.matchMinute,.1);assert.equal(clock.textContent,'00:06');
    assert.ok(scorers.innerHTML.includes('Nenhum gol marcado'));
    const before=players[5].style.transform;
    tick(200);assert.notEqual(players[5].style.transform,before);
    globalThis.document.hidden=true;playback.attach();assert.equal(state.matchPlaying,false);assert.equal(callbacks.size,0);assert.equal(state.matchMinute,.2);
    globalThis.document.hidden=false;state.matchSpeed=8;playback.attach();assert.equal(state.matchPlaying,true);playback.start();tick(300);tick(400);
    assert.equal(state.matchMinute,1);assert.equal(callbacks.size,1);
    assert.ok(scorers.innerHTML.includes(home.lineup[10].player.nome));
    assert.ok(scorers.innerHTML.includes('--team-color-1:#2bb777;--team-color-2:#174b2e'));
    assert.ok(scorers.innerHTML.includes(`--team-color-1:${away.cores[0]};--team-color-2:${away.cores[1]}`));
    state.matchMinute=match.result.duration-.1;tick(500);
    assert.equal(state.matchMinute,match.result.duration);assert.equal(finish,1);assert.equal(callbacks.size,0);
    assert.equal(state.matchPlaying,false);assert.equal(saves,0);
    assert.ok(scorers.innerHTML.includes(`--team-color-1:${away.cores[0]};--team-color-2:${away.cores[1]}`));
    playback.attach();assert.equal(state.matchPlaying,false);playback.start();assert.equal(callbacks.size,0);
  }finally{for(const [key,value] of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
