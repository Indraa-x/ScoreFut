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
const weakPool=allSquads.map(squad=>({...squad,jogadores:squad.jogadores.map(p=>({...p,ovr:71,
 atributos:Object.fromEntries(Object.keys(p.atributos).map(key=>[key,71]))}))}));

test('the additional advantage requires user OVR strictly above 85 and opponent strictly below 72',()=>{
 for(const [strongOvr,weakOvr,active]of [[86,71,true],[85.1,71.9,true],[85,71,false],[84.9,71,false],[86,72,false],[86,72.1,false],[85,72,false],[88,88,false]]){
  const strong=team('user',strongOvr,true),weak=team('opponent',weakOvr),original=structuredClone([strong,weak]);
  if(active){
   assert.ok(expectedGoals(strong,weak)>expectedGoals(strong,weak,baseline));
   assert.ok(expectedGoals(weak,strong)<expectedGoals(weak,strong,baseline));
  }else{
   assert.equal(expectedGoals(strong,weak),expectedGoals(strong,weak,baseline));
   assert.equal(expectedGoals(weak,strong),expectedGoals(weak,strong,baseline));
  }
  assert.deepEqual([strong,weak],original);
 }
 const strong=team('ai-strong',86),weak=team('ai-weak',71);
 for(const [a,b]of [[strong,weak],[weak,strong],[strong,{...weak,isUser:true}],[{...strong,isUser:true},{...weak,isUser:true}]]){
  assert.equal(expectedGoals(a,b),expectedGoals(a,b,baseline));
 }
 const user=team('user',86,true),opponent=team('opponent',71);
 assert.equal(expectedGoals({...user,strength:undefined},{...opponent,strength:undefined}),expectedGoals(user,opponent));
});

test('86 vs 71 wins substantially more often at home and away, with draws and upsets still possible',t=>{
 const user=team('user',86,true),opponent=team('opponent',71),runs=3000;
 for(const userAtHome of [true,false]){
  const [home,away]=userAtHome?[user,opponent]:[opponent,user];
  let beforeWins=0,wins=0,draws=0,losses=0;
  for(let seed=0;seed<runs;seed++){
   const previous=simulateMatch(home,away,mulberry32(seed),{settings:baseline});
   const current=simulateMatch(home,away,mulberry32(seed));
   beforeWins+=Number(previous.winnerId==='user');
   if(current.winnerId==='user')wins++;else if(current.winnerId)losses++;else draws++;
  }
  assert.ok(wins-beforeWins>runs*.1);assert.ok(wins>runs*.7&&wins<runs*.95);
  assert.ok(draws>0&&losses>0);
  t.diagnostic(JSON.stringify({userAtHome,runs,beforeWins,wins,draws,losses}));
 }
});

test('World Cup, Champions, Copa do Brasil and quick simulation all use the same matchup advantage',()=>{
 for(const mode of ['world-cup','champions','copa-do-brasil','quick']){
  const tournament=createTournament(team('user',86),weakPool,{mode,seed:121});
  const result=playNextRound(tournament),match=result.userMatches[0];
  const user=result.teams.find(t=>t.id==='user');
  const opponent=result.teams.find(t=>t.id===(match.homeId==='user'?match.awayId:match.homeId));
  assert.equal(user.isUser,true);assert.equal(opponent.strength.overall,71);
  assert.ok(expectedGoals(user,opponent,result.settings)>expectedGoals(user,opponent,baseline));
  const actual=match.result.xG[match.homeId==='user'?0:1];
  assert.equal(actual,Math.round(expectedGoals(user,opponent)*10)/10);
 }
});

test('version-three saves adopt the rule for future games and keep finished scores and started replays',()=>{
 const settings={...baseline,modelVersion:3};
 const committed=playNextRound(createTournament(team('user',86),weakPool,{mode:'world-cup',seed:121,settings}));
 for(const minute of [0,27,120]){
  const state={...prepareUserRound(committed),matchMinute:minute};
  const original=structuredClone(state),previous=currentMatch(state);
  const updated={...state,...migrateNeutralSimulation(state)};
  assert.deepEqual(state,original);assert.deepEqual(updated.tournament.userMatches,original.tournament.userMatches);
  assert.equal(updated.tournament.settings.modelVersion,SIMULATION_SETTINGS.modelVersion);
  assert.equal(updated.pendingRound.settings.dominanceAttackMultiplier,SIMULATION_SETTINGS.dominanceAttackMultiplier);
  assert.equal(currentMatch(updated).id,previous.id);
  if(minute>0){assert.equal(updated.matchMinute,minute);assert.deepEqual(currentMatch(updated),previous);}
  else{
   const game=currentMatch(updated),index=game.homeId==='user'?0:1;
   assert.ok(game.result.xG[index]>previous.result.xG[index]);
  }
  assert.deepEqual(migrateNeutralSimulation(updated),{});
 }
});
