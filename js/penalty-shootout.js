import {hashSeed,mulberry32} from './engine.js?v=interactive-penalties-20261027';

export const PENALTY_TARGETS=[
  {id:'left',label:'Esquerda',column:'left',high:false,x:19,y:50},
  {id:'right',label:'Direita',column:'right',high:false,x:81,y:50},
];
const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
const rating=(player,key)=>Number(player?.atributos?.[key]??player?.ovr??75);
const order=team=>(team.lineup||[]).slice().sort((a,b)=>
  Number(a.slot.position==='GOL')-Number(b.slot.position==='GOL')||
  rating(b.player,'finalizacao')-rating(a.player,'finalizacao')||String(a.player.id).localeCompare(String(b.player.id)));

export function createPenaltyShootout(home,away,userTeamId,seed){
  const rng=mulberry32(hashSeed(`${seed}:${home.id}:${away.id}:interactive-penalties`));
  return {version:2,seed:hashSeed(`${seed}:penalty-choices`),userTeamId,firstSide:rng()<.5?0:1,kicks:[],scores:[0,0],complete:false,winnerId:null,selection:null};
}

export function penaltyTurn(shootout,home,away){
  if(shootout.complete)return null;
  const side=(shootout.firstSide+shootout.kicks.length)%2,team=side?away:home,defender=side?home:away;
  const number=shootout.kicks.filter(kick=>kick.side===side).length;
  const takers=order(team);
  return {side,team,defender,number:number+1,player:takers[number%takers.length]?.player,
    goalkeeper:defender.lineup.find(entry=>entry.slot.position==='GOL')?.player,
    attacking:team.id===shootout.userTeamId,suddenDeath:number>=5};
}

/** Five kicks each, early clinches, then equal-attempt sudden death. */
export function penaltyWinner(kicks,homeId,awayId){
  const attempts=[0,0],scores=[0,0];
  for(const kick of kicks){attempts[kick.side]++;if(kick.converted)scores[kick.side]++;}
  if(attempts[0]<=5&&attempts[1]<=5){
    if(scores[0]>scores[1]+5-attempts[1])return homeId;
    if(scores[1]>scores[0]+5-attempts[0])return awayId;
  }
  if(attempts[0]>=5&&attempts[0]===attempts[1]&&scores[0]!==scores[1])return scores[0]>scores[1]?homeId:awayId;
  return null;
}

/** The same independent random draws are used for every possible player choice. */
export function takePenalty(shootout,home,away,choice){
  if(shootout.complete)return shootout;
  const turn=penaltyTurn(shootout,home,away);
  if(turn.attacking&&!PENALTY_TARGETS.some(option=>option.id===choice))throw new Error('Escolha um canto válido.');
  if(!turn.attacking&&choice!=null)throw new Error('A cobrança adversária é automática.');
  const rng=mulberry32(hashSeed(`${shootout.seed}:kick:${shootout.kicks.length}`));
  const targetRoll=rng(),diveRoll=rng(),accuracyRoll=rng(),saveRoll=rng();
  const target=turn.attacking?PENALTY_TARGETS.find(target=>target.id===choice):PENALTY_TARGETS[Math.floor(targetRoll*PENALTY_TARGETS.length)];
  const dive=diveRoll<.5?'left':'right';
  const finishing=rating(turn.player,'finalizacao'),reflexes=rating(turn.goalkeeper,'reflexo');
  const accuracy=clamp(.94+(finishing-80)*.0025-(target.high?.10:0),.72,.985);
  const saveChance=dive===target.column
    ?clamp(.48+(reflexes-finishing)*.004,.28,.82)
    :clamp(.035+(reflexes-finishing)*.001,.01,.09);
  const outcome=accuracyRoll>accuracy?'wide':saveRoll<saveChance?'saved':'goal';
  const kick={side:turn.side,player:turn.player,target:target.id,dive,outcome,converted:outcome==='goal'};
  const kicks=[...shootout.kicks,kick],scores=[...shootout.scores];
  if(kick.converted)scores[turn.side]++;
  const winnerId=penaltyWinner(kicks,home.id,away.id);
  return {...shootout,kicks,scores,winnerId,complete:!!winnerId,selection:null};
}
