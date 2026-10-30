const value=(player,key)=>Number(player.atributos?.[key]??player.ovr??70);
function pick(team,rng,kind,exclude){
 const pool=team.lineup.filter(e=>e.slot.position!=='GOL'&&e.player.id!==exclude);
 if(!pool.length)return null;
 const weights=pool.map(({player,slot})=>{
  const header=kind==='header',role=slot.position;
  const skill=header?(value(player,'ataque')+value(player,'finalizacao'))/2:(value(player,'meio')+value(player,'finalizacao'))/2;
  const roleWeight=header?(['CA','ZAG','SA'].includes(role)?2.2:.65):(['MC','MEI','MD','ME','PE','PD'].includes(role)?2:1);
  return Math.max(1,skill-40)**2*roleWeight;
 });
 let choice=rng()*weights.reduce((sum,w)=>sum+w,0);
 return pool[weights.findIndex(w=>(choice-=w)<0)]?.player??pool.at(-1).player;
}

/** Assign goal origins without changing the score distribution or the match RNG. */
export function assignSetPieceGoals(events,home,away,rng){
 const goals=events.filter(e=>e.type==='goal'&&!e.shootout);
 for(const [index,goal]of goals.entries()){
  if(goal.minute<5||goals.some(other=>other!==goal&&Math.abs(other.minute-goal.minute)<5))continue;
  if(events.some(e=>e.type==='penalty'&&!e.shootout&&e.team===goal.team&&e.minute===goal.minute))continue;
  const team=goal.team==='home'?home:away,roll=rng();
  const origin=roll<.008?'olympic':roll<.078?'free-kick':roll<.158?'corner-header':roll<.198?'free-kick-header':null;
  if(!origin)continue;
  const header=origin.endsWith('header'),scorer=pick(team,rng,header?'header':'kick');
  if(!scorer)continue;
  const taker=header?pick(team,rng,'kick',scorer.id):scorer;
  if(!taker)continue;
  const restartId=`goal-restart-${goal.team}-${index}`;
  Object.assign(goal,{player:scorer,origin,restartId,...(header?{assist:taker}:{})});
  events.push({type:origin==='olympic'||origin==='corner-header'?'corner':'foul',team:goal.team,
   minute:goal.minute-3.9,x:.5,y:goal.team==='home'?.2:.8,player:taker,restartId,goalMinute:goal.minute,origin,scorerId:scorer.id});
 }
}

export const goalOriginLabel=origin=>({
 'penalty':'Gol de pênalti','olympic':'Gol olímpico','free-kick':'Gol de falta',
 'corner-header':'Gol de cabeça · escanteio','free-kick-header':'Gol de cabeça · falta',
})[origin]||'';
