/** Seeded foul/card relationships; keeps the calibrated score and shootout intact. */
export function assignMatchDiscipline(events,home,away,duration,rng){
 for(let i=events.length-1;i>=0;i--)if(['yellow','red'].includes(events[i].type))events.splice(i,1);
 for(const side of ['home','away']){
  const team=side==='home'?home:away,pool=team.lineup.filter(e=>e.slot.position!=='GOL');
  for(let n=0;n<3;n++)events.push({type:'foul',team:side,minute:3+rng()*Math.max(1,duration-9),player:pool[Math.floor(rng()*pool.length)].player,x:.5,y:side==='home'?.25:.75});
 }
 for(const [index,penalty]of events.filter(e=>e.type==='penalty'&&!e.shootout).entries()){
  const goal=events.find(e=>e.type==='goal'&&e.team===penalty.team&&e.minute===penalty.minute&&e.player.id===penalty.player.id);
  if(!goal)continue;
  const restartId=`penalty-${penalty.team}-${index}`;
  goal.origin='penalty';goal.restartId=restartId;
  Object.assign(penalty,{restartId,goalMinute:goal.minute,origin:'penalty',minute:Math.max(1,goal.minute-2.5)});
  events.push({type:'foul',team:penalty.team,minute:penalty.minute,player:penalty.player,x:penalty.x,y:penalty.y,penaltyAwarded:true,restartId});
 }
 const booked=new Set(),sentOff=new Set();
 for(const [index,foul]of events.filter(e=>e.type==='foul').sort((a,b)=>a.minute-b.minute).entries()){
  const defending=foul.team==='home'?'away':'home',team=defending==='home'?home:away;
  const pool=team.lineup.filter(e=>e.slot.position!=='GOL'&&!sentOff.has(defending+e.player.id));
  if(!pool.length)continue;
  const offender=pool[Math.floor(rng()*pool.length)].player,key=defending+offender.id;
  foul.foulId=`foul-${index}`;foul.offender=offender;foul.offendingTeam=defending;
  const futureInvolvement=events.some(e=>e.minute>=foul.minute&&(e.team===defending&&e.player?.id===offender.id&&['goal','penalty','corner','foul'].includes(e.type)||e.assist?.id===offender.id));
  const roll=rng();let card=roll<.006&&!futureInvolvement?'red':roll<.3&&!booked.has(key)?'yellow':null;
  if(!card)continue;
  if(card==='red')sentOff.add(key);else booked.add(key);
  events.push({type:card,team:defending,minute:foul.minute,player:offender,x:foul.x,y:foul.y,foulId:foul.foulId,penaltyAwarded:!!foul.penaltyAwarded});
 }
}

export const matchIncidentsAt=(result,minute)=>result.events.filter(e=>!e.shootout&&['goal','red'].includes(e.type)&&e.minute<=minute);
export const playerSentOff=(result,side,id,minute)=>result.events.some(e=>e.type==='red'&&e.team===side&&e.player.id===id&&e.minute<=minute);
