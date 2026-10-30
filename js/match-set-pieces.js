import {hashSeed,mulberry32} from './engine.js?v=leverkusen-20261029';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const WINDOW=4.4;

/** Replay-only restarts: independent RNG preserves the simulated score and winner. */
export function createSetPieceMotion(anchors,profiles,match,seed){
  const result=match.result,rng=mulberry32(hashSeed(`${seed}:${match.id}:set-pieces-v1`));
  const goals=result.events.filter(e=>e.type==='goal'&&!e.shootout),candidates=result.events.filter(e=>e.type==='corner'||e.type==='foul').map(e=>({...e}));
  for(const side of ['home','away']){
    if(candidates.some(e=>e.type==='foul'&&e.team===side))continue;
    for(let i=0;i<3;i++)candidates.push({type:'foul',team:side,minute:4+rng()*Math.max(1,result.duration-12)});
  }
  const events=[];
  for(const candidate of candidates.sort((a,b)=>a.minute-b.minute)){
    let at=null;
    for(let offset=0;offset<result.duration;offset+=5){
      for(const delta of offset?[offset,-offset]:[0]){
        const start=candidate.minute+delta,end=start+WINDOW;
        if(start<2||end>result.duration-.5)continue;
        if(goals.some(g=>start<g.minute+1.3&&end>g.minute-1.8))continue;
        if(events.some(e=>start<e.end+.45&&end>e.at-.45))continue;
        at=start;break;
      }
      if(at!==null)break;
    }
    if(at===null)continue;
    const side=candidate.team,direction=side==='home'?1:-1,flank=rng()<.5?7:93;
    const own=anchors.map((p,i)=>({...p,i})).filter(p=>p.side===side&&p.role!=='GOL');
    const taker=own.find(p=>p.id===candidate.player?.id)?.i??own.slice().sort((a,b)=>profiles[b.i].mid-profiles[a.i].mid)[0]?.i;
    if(taker===undefined)continue;
    const spot=candidate.type==='corner'?{x:side==='home'?95:5,y:flank}:{x:50+direction*(17+rng()*9),y:28+rng()*44};
    let attack=0,defend=0;
    const targets=anchors.map((p,index)=>{
      if(index===taker)return {x:spot.x-direction*1.3,y:spot.y};
      const possession=p.side===side;
      if(p.role==='GOL')return {x:possession?(side==='home'?10:90):(side==='home'?94:6),y:possession?50:clamp(50+(spot.y-50)*.12,44,56)};
      if(possession){const n=attack++;return {x:50+direction*(n<5?27+(n%3)*4:n<7?13:1),y:n<5?29+n*9:24+(n-5)*14};}
      const n=defend++;
      if(candidate.type==='foul'&&n<3)return {x:spot.x+direction*9,y:clamp(spot.y+(n-1)*10.5,10,90)};
      return {x:50+direction*(n<8?32+(n%3)*3:9),y:22+(n%8)*8};
    }).map(p=>({x:clamp(p.x,5,95),y:clamp(p.y,7,93)}));
    // Keep the 22 markers readable while attackers and defenders gather in the box.
    for(let pass=0;pass<4;pass++)for(let a=0;a<targets.length;a++)for(let b=a+1;b<targets.length;b++){
      const p=targets[a],q=targets[b],dx=(q.x-p.x)*1.7,dy=q.y-p.y,distance=Math.hypot(dx,dy);
      if(distance>=9.5)continue;
      const angle=distance>.001?Math.atan2(dy,dx):(a+b)*2.4,force=(9.5-distance)*.5;
      for(const [index,sign] of [[a,-1],[b,1]])if(index!==taker&&anchors[index].role!=='GOL'){
        targets[index].x=clamp(targets[index].x+sign*Math.cos(angle)*force/1.7,5,95);
        targets[index].y=clamp(targets[index].y+sign*Math.sin(angle)*force,7,93);
      }
    }
    events.push({type:candidate.type,side,at,end:at+WINDOW,kickAt:at+2.8,taker,spot,targets,target:{x:50+direction*(rng()<.5?36:8),y:35+rng()*30}});
  }
  events.sort((a,b)=>a.at-b.at);
  return {events,apply(scene,time){
    const event=events.find(e=>time>=e.at&&time<e.end);
    if(!event)return {...scene,setPiece:null};
    const weight=Math.min(smooth((time-event.at)/1.4),smooth((event.end-time)/.9));
    const players=scene.players.map((p,i)=>({x:mix(p.x,event.targets[i].x,weight),y:mix(p.y,event.targets[i].y,weight)}));
    const flight=smooth((time-event.kickAt)/1.1);
    const destination=time<event.kickAt?event.spot:{x:mix(event.spot.x,event.target.x,flight),y:mix(event.spot.y,event.target.y,flight)+(event.type==='corner'?Math.sin(flight*Math.PI)*(event.spot.y<50?5:-5):0)};
    const ball={x:mix(scene.ball.x,destination.x,weight),y:mix(scene.ball.y,destination.y,weight)};
    return {...scene,players,ball,owner:weight>.5?(time<event.kickAt?event.taker:-1):scene.owner,possession:event.side,kind:event.type,setPiece:weight>.2?event:null};
  }};
}
