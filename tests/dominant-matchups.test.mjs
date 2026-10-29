import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {FORMATIONS,calculateTeam,expectedGoals,simulateMatch,mulberry32,createTournament,playNextRound,SIMULATION_SETTINGS} from '../js/engine.js';
import {prepareUserRound,currentMatch,migrateNeutralSimulation} from '../js/match-session.js';
const team=(id,ovr,isUser=false)=>{
 const lineup=FORMATIONS['4-3-3'].slots.map((slot,i)=>({slot,player:{id:id+'-'+i,nome:id+' '+i,tags:[slot.label],ovr,
 atributos:Object.fromEntries(['ataque','meio','defesa','finalizacao','reflexo','posicionamento'].map(key=>[key,ovr]))}}));
 return {id,name:id,lineup,strength:calculateTeam(lineup),isUser};
};
const baseline={...SIMULATION_SETTINGS,dominanceAttackMultiplier:1,dominanceDefenseMultiplier:1};
const weakPool=allSquads.map(squad=>({...squad,jogadores:squad.jogadores.map(p=>({...p,ovr:78,
 atributos:Object.fromEntries(Object.keys(p.atributos).map(key=>[key,78]))}))}));

test('the actual OVR gap drives the edge at every rating level, leaving close matchups unchanged',()=>{
 for(const [a,b,active]of [[89,78,true],[89,79,true],[89,70,true],[82,71,true],[76,65,true],[85,71,true],[86,72,true],[89,89,false],[89,87,false],[89,84,false],[84,89,false],[78,89,false],[85.1,80.1,false]]){
  const user=team('user',a,true),opponent=team('opponent',b),original=structuredClone([user,opponent]);
  if(active){assert.ok(expectedGoals(user,opponent)>expectedGoals(user,opponent,baseline));assert.ok(expectedGoals(opponent,user)<expectedGoals(opponent,user,baseline));}
  else {assert.equal(expectedGoals(user,opponent),expectedGoals(user,opponent,baseline));assert.equal(expectedGoals(opponent,user),expectedGoals(opponent,user,baseline));}
  assert.deepEqual([user,opponent],original);
 }
 const a=team('ai-strong',89),b=team('ai-weak',78);
 for(const [one,two]of [[a,b],[b,a],[a,{...b,isUser:true}],[{...a,isUser:true},{...b,isUser:true}]])assert.equal(expectedGoals(one,two),expectedGoals(one,two,baseline));
 const user=team('user',89,true),opponent=team('opponent',78);
 assert.equal(expectedGoals({...user,strength:undefined},{...opponent,strength:undefined}),expectedGoals(user,opponent));
 // No discontinuity at the former fixed thresholds or the five-point boundary.
 for(const rating of [84,78,72]){
  const before=expectedGoals(user,team('opponent',rating-0.01));
  const after=expectedGoals(user,team('opponent',rating+0.01));
  assert.ok(Math.abs(before-after)<0.02);
 }
});

test('89 vs 78 becomes a clear favorite at home and away, and weaker opposition increases the edge',t=>{
 const runs=3000,totals=[];
 for(const ovr of [84,78,75,70]){
  const user=team('user',89,true),opponent=team('opponent',ovr);
  let beforeWins=0,wins=0,draws=0,losses=0;
  for(let seed=0;seed<runs;seed++){
   const [home,away]=seed%2?[user,opponent]:[opponent,user];
   const old=simulateMatch(home,away,mulberry32(seed),{settings:baseline}),now=simulateMatch(home,away,mulberry32(seed));
   beforeWins+=Number(old.winnerId==='user');
   if(now.winnerId==='user')wins++;else if(now.winnerId)losses++;else draws++;
  }
  if(ovr===84)assert.equal(wins,beforeWins);
  if(ovr===78){assert.ok(wins>runs*.75&&wins<runs*.88);assert.ok(wins-beforeWins>runs*.2);}
  assert.ok(draws>0&&losses>0);
  totals.push(wins);t.diagnostic(JSON.stringify({user:89,opponent:ovr,runs,beforeWins,wins,draws,losses}));
 }
 assert.ok(totals.every((n,i)=>!i||n>totals[i-1]));
 const user=team('user',89,true),opponent=team('opponent',78);
 for(const home of [true,false]){
  let wins=0;
  for(let seed=0;seed<1500;seed++)wins+=Number(simulateMatch(home?user:opponent,home?opponent:user,mulberry32(seed)).winnerId==='user');
  assert.ok(wins>1500*.75);
 }
});

test('World Cup, Champions, Copa do Brasil and quick simulation use the same OVR-gap advantage',()=>{
 for(const mode of ['world-cup','champions','copa-do-brasil','quick']){
  const tournament=createTournament(team('user',89),weakPool,{mode,seed:121}),result=playNextRound(tournament),match=result.userMatches[0];
  const user=result.teams.find(t=>t.id==='user'),opponent=result.teams.find(t=>t.id===(match.homeId==='user'?match.awayId:match.homeId));
  assert.equal(user.isUser,true);assert.equal(opponent.strength.overall,78);
  assert.ok(expectedGoals(user,opponent,result.settings)>expectedGoals(user,opponent,baseline));
  assert.equal(match.result.xG[match.homeId==='user'?0:1],Math.round(expectedGoals(user,opponent)*10)/10);
  assert.equal(match.result.xG[match.homeId==='user'?1:0],Math.round(expectedGoals(opponent,user)*10)/10);
 }
});

test('version-four saves adopt the gap rule for future games and keep finished scores and started replays',()=>{
 const settings={...baseline,modelVersion:4};
 const committed=playNextRound(createTournament(team('user',89),weakPool,{mode:'world-cup',seed:121,settings}));
 for(const minute of [0,27,120]){
  const state={...prepareUserRound(committed),matchMinute:minute},original=structuredClone(state),previous=currentMatch(state);
  const updated={...state,...migrateNeutralSimulation(state)};
  assert.deepEqual(state,original);assert.deepEqual(updated.tournament.userMatches,original.tournament.userMatches);
  assert.equal(updated.tournament.settings.modelVersion,SIMULATION_SETTINGS.modelVersion);
  assert.equal(updated.pendingRound.settings.dominanceAttackMultiplier,SIMULATION_SETTINGS.dominanceAttackMultiplier);
  assert.equal(currentMatch(updated).id,previous.id);
  if(minute>0){assert.equal(updated.matchMinute,minute);assert.deepEqual(currentMatch(updated),previous);}
  else {const game=currentMatch(updated),index=game.homeId==='user'?0:1;assert.ok(game.result.xG[index]>previous.result.xG[index]);}
  assert.deepEqual(migrateNeutralSimulation(updated),{});
 }
});
