import {movementRole,movementProfile,chooseMovement,sampleMovement} from './match-movement-library.js?v=position-movement-20261027';
import { hashSeed, mulberry32 } from './engine.js?v=simulation-gap-20261026';

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const mix = (a, b, progress) => a + (b - a) * progress;
const smooth = value => value * value * (3 - 2 * value);
export const MATCH_SPEEDS = [4, 8];
export const normalizeMatchSpeed = speed => speed === 8 ? 8 : 4;

// Normal represents four football minutes per second; fast represents eight.
// Legacy 1× saves and invalid values adopt the new normal pace.
export function advanceMatchMinute(minute, milliseconds, speed, duration) {
  return Math.min(duration, minute + Math.max(0, milliseconds) / 1000 * normalizeMatchSpeed(speed));
}

export function formatMatchClock(minute) {
  const seconds = Math.floor(Math.max(0, minute) * 60 + .00001);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function matchAddedMinutes(result, minute) {
  const regulationAdded = Math.max(0, Number(result.regulationStoppageTime) || 0);
  if (result.extraTime) {
    const extraStart = Number.isFinite(result.extraTimeStart) ? result.extraTimeStart : 90 + regulationAdded;
    const extraEnd = Number.isFinite(result.extraTimeEnd) ? result.extraTimeEnd : extraStart + 30;
    if (minute >= extraEnd) return Math.max(0, Number(result.extraTimeStoppageTime) || 0);
    if (minute >= extraStart) return 0;
  }
  return minute >= 90 ? regulationAdded : 0;
}

export function formatMatchEventMinute(result, minute) {
  const value = Math.max(0, Number(minute) || 0);
  if (result?.extraTime) {
    const extraStart = Number.isFinite(result.extraTimeStart) ? result.extraTimeStart : 90;
    const extraEnd = Number.isFinite(result.extraTimeEnd) ? result.extraTimeEnd : 120;
    if (value > extraEnd) return `120+${Math.ceil(value - extraEnd)}`;
    if (value > extraStart) return String(90 + Math.floor(value - extraStart));
    if (value > 90) return `90+${Math.ceil(value - 90)}`;
  } else if (value > 90) return `90+${Math.ceil(value - 90)}`;
  return String(Math.floor(value));
}

export function matchPhase(result, minute) {
  if (minute >= result.duration) return 'Fim de jogo';
  if (result.extraTime) {
    const extraStart = Number.isFinite(result.extraTimeStart) ? result.extraTimeStart : 90;
    const extraEnd = Number.isFinite(result.extraTimeEnd) ? result.extraTimeEnd : 120;
    if (minute > extraEnd) return 'Acréscimos da prorrogação';
    if (minute > extraStart) return 'Prorrogação';
    if (minute > 90) return 'Acréscimos';
  } else if (minute > 90) return 'Acréscimos';
  return minute >= 45 ? '2º tempo' : '1º tempo';
}

export function matchEndLabel(result) {
  const base = result.extraTime ? 120 : 90;
  const added = result.extraTime ? result.extraTimeStoppageTime : result.regulationStoppageTime;
  return added ? `${base}+${added}′` : `${base}′`;
}

export function scoreAt(result, minute) {
  if (minute >= result.duration) return [result.homeGoals, result.awayGoals];
  return ['home', 'away'].map(side => result.events.filter(event => event.type === 'goal' && event.team === side && event.minute <= minute).length);
}

export function lineupAnchors(home, away) {
  return [home, away].flatMap((team, side) => (team.lineup || []).map((entry, index) => ({
    side: side ? 'away' : 'home', index, id: entry.player.id, role: movementRole(entry),
    x: side ? 96 - (100 - entry.slot.y) * .46 : 4 + (100 - entry.slot.y) * .46,
    y: clamp(entry.slot.x, 10, 90),
  })));
}

/** Seeded football choreography. Calculated once; playback only interpolates 22 paths. */
export function createMatchMotion(home,away,match,options={}){
  const anchors=lineupAnchors(home,away),duration=match.result.duration;
  const entries=[...(home.lineup||[]),...(away.lineup||[])];
  const profiles=entries.map(movementProfile);
  const seed=hashSeed(`${options.seed??match.seed??''}:${match.id}:${home.id}:${away.id}:${entries.map(e=>e.player.id||e.player.nome).join('|')}:${match.result.events.filter(e=>e.type==='goal'&&!e.shootout).map(e=>e.minute+e.team).join('|')}:movement-v2`);
  const rng=mulberry32(seed);
  const goals=match.result.events.filter(e=>e.type==='goal'&&!e.shootout).slice().sort((a,b)=>a.minute-b.minute);
  const plays={
    patient:[[27,50,'pass'],[38,42,'pass'],[33,65,'pass'],[47,60,'pass'],[60,43,'carry'],[74,50,'shot']],
    counter:[[31,50,'carry'],[47,35,'pass'],[65,30,'carry'],[80,43,'pass'],[86,51,'shot']],
    wide:[[32,52,'pass'],[49,28,'pass'],[65,15,'carry'],[81,17,'cross'],[83,49,'shot']],
    direct:[[27,50,'pass'],[60,45,'pass'],[70,59,'carry'],[83,53,'shot']],
    overlap:[[32,50,'pass'],[48,24,'pass'],[56,31,'carry'],[73,12,'pass'],[85,18,'cross'],[83,47,'shot']],
    underlap:[[31,50,'pass'],[52,18,'pass'],[62,31,'carry'],[75,37,'pass'],[85,48,'shot']],
    central:[[33,50,'pass'],[48,45,'pass'],[43,59,'pass'],[65,53,'pass'],[78,42,'carry'],[86,50,'shot']],
    cutback:[[37,48,'pass'],[59,19,'carry'],[79,12,'pass'],[88,23,'carry'],[77,44,'cross'],[84,50,'shot']],
    switchback:[[29,35,'pass'],[43,17,'carry'],[49,78,'switch'],[64,84,'pass'],[78,67,'carry'],[85,50,'shot']],
    pressbreak:[[18,52,'pass'],[29,72,'pass'],[24,39,'pass'],[47,57,'pass'],[65,31,'carry'],[79,49,'pass']],
    recycle:[[34,28,'carry'],[46,36,'pass'],[32,58,'pass'],[24,52,'pass'],[47,75,'switch'],[65,66,'carry']],
    thirdman:[[30,50,'pass'],[49,35,'pass'],[42,53,'pass'],[67,33,'pass'],[79,46,'carry'],[86,54,'shot']],
  };
  const styles=Object.keys(plays),lastStyle={},lastRun=Array(anchors.length).fill(null);
  const teamStyle=side=>{
    const team=profiles.filter((_,i)=>anchors[i].side===side&&anchors[i].role!=='GOL');
    const creativity=team.reduce((sum,p)=>sum+p.mid-p.attack,0)/Math.max(1,team.length);
    const weights=styles.map(name=>name===lastStyle[side] ? .15 : 1+(creativity>3&&['patient','central','thirdman','pressbreak'].includes(name)?1.4:0));
    let pick=rng()*weights.reduce((sum,w)=>sum+w,0);
    const style=styles[weights.findIndex(w=>(pick-=w)<0)]||'wide';lastStyle[side]=style;return style;
  };
  const actions=[{at:0,x:50,y:50,side:'home',kind:'kickoff',owner:-1,cycle:-1}];
  let time=.55,cycle=0,side=rng()<.5?'home':'away',priorOwner=-1;
  while(time<duration){
    const start=time,style=teamStyle(side),flip=rng()<.5,sequence=plays[style];
    const tempo=(style==='counter'?.66:style==='patient'?1.22:.95)*( .85+rng()*.35);
    const runs=profiles.map((profile,index)=>{
      const random=mulberry32(hashSeed(`${seed}:${index}:${cycle}:run`));
      const name=chooseMovement(profile,anchors[index].side===side,style,random,lastRun[index]);lastRun[index]=name;return name;
    });
    for(let step=0;step<sequence.length&&time<duration;step++){
      const [depth,lateral,plannedKind]=sequence[step];
      const x=clamp((side==='home'?depth:100-depth)+(rng()-.5)*5,10,90);
      const y=clamp((flip?100-lateral:lateral)+(rng()-.5)*7,10,90);
      const kind=step>0&&plannedKind==='shot'&&rng()<.4?'pass':plannedKind;
      const direction=side==='home'?1:-1;
      const candidates=anchors.map((player,index)=>({player,index,jitter:rng()*4}))
        .filter(({player,index})=>player.side===side&&(player.role!=='GOL'||depth<25)&&(!(kind!=='carry'&&index===priorOwner)));
      const forwardRole=role=>['CA','SA','PE','PD'].includes(role)?21:['MC','MEI','ME','MD','VOL'].includes(role)?12:5;
      candidates.sort((a,b)=>{
        const distance=c=>Math.hypot(c.player.x+direction*forwardRole(c.player.role)-x,c.player.y-y)+c.jitter-(kind==='pass'?profiles[c.index].mid*.025:0);
        return distance(a)-distance(b);
      });
      const prior=anchors[priorOwner];
      const owner=kind==='carry'&&prior?.side===side&&prior.role!=='GOL'&&rng()<.78?priorOwner:(candidates[Math.floor(rng()*Math.min(3,candidates.length))]?.index??-1);
      if(!goals.some(goal=>time>=goal.minute-1.7&&time<=goal.minute+1.2))actions.push({at:time,x,y,side,owner,kind,style,cycle,start,runs});
      priorOwner=owner;time+=(.72+rng()*.5)*tempo;
    }
    cycle++;if(rng()<.82)side=side==='home'?'away':'home';
    if(time===start)break;
  }
  goals.forEach((goal,index)=>{
    const direction=goal.team==='home'?1:-1;
    const owner=anchors.findIndex(p=>p.side===goal.team&&p.id===goal.player.id);
    const lateral=Number.isFinite(goal.x)?goal.x:.5;
    const context=actions.filter(action=>action.at<goal.minute&&action.side===goal.team).at(-1)||actions[0];
    const base={...context,side:goal.team,owner,style:context.style||'central'};
    actions.push({...base,at:Math.max(.05,goal.minute-1.3),x:50+direction*24,y:32+lateral*34,kind:'pass'});
    actions.push({...base,at:Math.max(.1,goal.minute-.45),x:50+direction*35,y:40+lateral*20,kind:'shot'});
    actions.push({...base,at:goal.minute,x:50+direction*47,y:50,owner:-1,kind:'goal'});
    const kickoffAt=Math.min(goal.minute+1.2,(goals[index+1]?.minute??Infinity)-.7,duration);
    if(kickoffAt>goal.minute+.15){
      actions.push({...base,at:Math.min(goal.minute+.4,kickoffAt-.1),x:50+direction*47,y:50,owner:-1,kind:'celebrate'});
      actions.push({at:kickoffAt,x:50,y:50,side:goal.team==='home'?'away':'home',owner:-1,kind:'kickoff'});
    }
  });
  if(!goals.some(goal=>goal.minute===duration))actions.push({at:duration,x:50,y:50,side:'home',owner:-1,kind:'end'});
  const ordered=[...new Map(actions.filter(a=>a.at<=duration).sort((a,b)=>a.at-b.at).map(a=>[a.at,a])).values()];
  const frames=[];
  for(const action of ordered){
    const restart=['kickoff','end'].includes(action.kind);
    const previous=frames.at(-1);
    const players=anchors.map((player,index)=>{
      if(restart)return {x:player.x,y:player.y};
      const profile=profiles[index],direction=player.side==='home'?1:-1,possession=player.side===action.side;
      const wing=player.y===50?(profile.phase<.5?-1:1):Math.sign(player.y-50);
      const phase=((action.at-(action.start||0))/profile.period+profile.phase)%1;
      const name=action.runs?.[index]||(player.role==='GOL'?'keeperSet':possession?'offerShort':'screen');
      const path=sampleMovement(name,phase);
      let x,y;
      if(player.role==='GOL'){
        x=player.x+direction*(possession?2:0)+direction*path.forward*.5;
        y=50+(action.y-50)*.19+path.lateral*.65;
        x=clamp(x,player.side==='home'?5:83,player.side==='home'?17:95);y=clamp(y,37,63);
      }else{
        const runner=['CA','SA','PE','PD'].includes(player.role),mid=['VOL','MC','MEI','MD','ME'].includes(player.role);
        const depth=possession?(runner?20:mid?12:6)*profile.mobility:(runner?-9:mid?-6:-2);
        x=player.x+direction*(depth+path.forward*profile.amplitude)+(action.x-50)*(possession?.15:.22);
        y=mix(player.y,action.y,possession?.12:.19)+path.lateral*wing*profile.amplitude;
        if(!possession)y=mix(y,50,.13);
        if(['wide','overlap'].includes(action.style)&&['LD','LE','PE','PD'].includes(player.role)&&possession)y+=wing*3;
        if(action.style==='counter'&&runner&&possession)x+=direction*5;
        // Separate timing, route and effort for every player, rather than a shared sine wave.
        x+=Math.sin(action.at*.35+profile.phase*6.28)*.7;
        if(index===action.owner){x=mix(x,action.x,.91);y=mix(y,action.y,.91);}
        x=clamp(x,7,93);y=clamp(y,7,93);
      }
      // Limit sudden changes when a run is interrupted by a turnover or restart.
      if(previous&&action.at>previous.at){
        const old=previous.players[index],distance=Math.hypot(x-old.x,y-old.y);
        const limit=(player.role==='GOL'?9:15)*profile.mobility*(action.at-previous.at);
        if(distance>limit){x=mix(old.x,x,limit/distance);y=mix(old.y,y,limit/distance);}
      }
      return {x,y};
    });
    if(!restart){
      const pressers=anchors.map((player,index)=>({player,index})).filter(p=>p.player.side!==action.side&&p.player.role!=='GOL')
        .sort((a,b)=>Math.hypot(players[a.index].x-action.x,players[a.index].y-action.y)-Math.hypot(players[b.index].x-action.x,players[b.index].y-action.y));
      for(const [rank,presser]of pressers.slice(0,2).entries()){
        const p=players[presser.index],profile=profiles[presser.index];
        const pressure=rank===0?.18+profile.pressure*.15:.05+profile.pressure*.07;
        p.x=clamp(mix(p.x,action.x,pressure),7,93);p.y=clamp(mix(p.y,action.y,pressure),7,93);
      }
      // Preserve breathing room for shirts even during central combinations and pressing.
      for(let pass=0;pass<2;pass++)for(let a=0;a<players.length;a++)for(let b=a+1;b<players.length;b++){
        const p=players[a],q=players[b],dx=q.x-p.x,dy=q.y-p.y,distance=Math.hypot(dx,dy);
        if(distance>=2.7)continue;
        const angle=distance>.001?Math.atan2(dy,dx):(a+b)*2.4;
        const force=(2.7-distance)*.5;
        if(a!==action.owner&&anchors[a].role!=='GOL'){p.x=clamp(p.x-Math.cos(angle)*force,7,93);p.y=clamp(p.y-Math.sin(angle)*force,7,93);}
        if(b!==action.owner&&anchors[b].role!=='GOL'){q.x=clamp(q.x+Math.cos(angle)*force,7,93);q.y=clamp(q.y+Math.sin(angle)*force,7,93);}
      }
    }
    const receiver=players[action.owner];
    const controlled=['pass','carry','cross','switch'].includes(action.kind);
    const ball=receiver&&controlled?{x:receiver.x+(action.side==='home'?1.2:-1.2),y:receiver.y+1.1}:{x:action.x,y:action.y};
    frames.push({...action,players,ball,movements:action.runs||anchors.map(p=>p.role==='GOL'?'keeperSet':'hold')});
  }
  return {anchors,profiles,frames,at(minute){
    const time=clamp(minute,0,duration);
    let low=0,high=frames.length-1;
    while(low<high){const mid=Math.ceil((low+high)/2);if(frames[mid].at<=time)low=mid;else high=mid-1;}
    const first=frames[low],second=frames[Math.min(low+1,frames.length-1)];
    const fraction=second.at>first.at?clamp((time-first.at)/(second.at-first.at),0,1):0;
    const movement=smooth(fraction);
    const players=first.players.map((p,index)=>{
      const q=second.players[index],dx=q.x-p.x,dy=q.y-p.y,distance=Math.hypot(dx,dy);
      const bend=Math.sin(Math.PI*fraction)*profiles[index].bend*Math.min(distance*.09,1.6);
      return {x:clamp(mix(p.x,q.x,movement)-(distance?dy/distance:0)*bend,5,95),y:clamp(mix(p.y,q.y,movement)+(distance?dx/distance:0)*bend,7,93)};
    });
    const carry=first.owner>=0&&first.owner===second.owner&&first.side===second.side&&second.kind==='carry';
    const travel=clamp(fraction/(second.kind==='goal'?1:.78),0,1);
    const receiver=players[second.owner];
    const target=receiver&&['pass','carry','cross','switch'].includes(second.kind)?{x:receiver.x+(second.side==='home'?1.2:-1.2),y:receiver.y+1.1}:second.ball;
    const bend=[first.kind,second.kind].some(kind=>['cross','switch'].includes(kind))?Math.sin(travel*Math.PI)*3.5:0;
    const carrier=players[first.owner];
    const ball=carry?{x:carrier.x+(first.side==='home'?1.2:-1.2),y:carrier.y+1.1+Math.sin(time*9)*.45}:
      {x:mix(first.ball.x,target.x,travel),y:mix(first.ball.y,target.y,travel)+bend};
    ball.x=clamp(ball.x,3,97);ball.y=clamp(ball.y,5,95);
    return {players,ball,possession:fraction<.5?first.side:second.side,owner:carry?first.owner:fraction<.78?first.owner:second.owner,style:second.style,kind:second.kind};
  }};
}
