import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMATIONS,calculateTeam,simulateMatch as engineMatch,mulberry32,createTournament as engineTournament,squadTeam,LEGACY_SIMULATION_SETTINGS as SIMULATION_SETTINGS} from '../js/engine.js';
import {allSquads} from '../data/clubs.js';
import {prepareUserRound,currentMatch,commitUserRound,migrateNeutralSimulation} from '../js/match-session.js';

// These cases describe the legacy assistance, not the new campaign defaults.
const simulateMatch=(a,b,rng,options={})=>engineMatch(a,b,rng,{settings:SIMULATION_SETTINGS,...options});
const createTournament=(a,b,options={})=>engineTournament(a,b,{settings:SIMULATION_SETTINGS,...options});
const team=(id,ovr)=>{
  const lineup=FORMATIONS['4-3-3'].slots.map((slot,index)=>({slot,clubId:id,player:{id:id+'-'+index,nome:id+' '+index,tags:[slot.label],ovr,atributos:{ataque:ovr,meio:ovr,defesa:ovr,finalizacao:ovr,reflexo:ovr,posicionamento:ovr}}}));
  return {id,name:id,lineup,strength:calculateTeam(lineup),isUser:id==='user'};
};

test('without assistance equal teams remain balanced and higher OVR raises the win rate',()=>{
  const opponent=team('opponent',85),rates=[];
  for(const ovr of [70,85,99]){
    let wins=0,draws=0,losses=0;
    for(let seed=0;seed<4000;seed++){
      const result=simulateMatch(team('user',ovr),opponent,mulberry32(seed),{settings:{...SIMULATION_SETTINGS,userAttackMultiplier:1,userDefenseMultiplier:1,dominanceAttackMultiplier:1,dominanceDefenseMultiplier:1}});
      if(result.winnerId==='user')wins++;else if(result.winnerId)losses++;else draws++;
    }
    rates.push({ovr,wins,draws,losses});
    assert.ok(wins>0&&draws>0&&losses>0);
  }
  const [weak,equal,strong]=rates;
  assert.ok(Math.abs(equal.wins-equal.losses)<4000*.06);
  assert.ok(equal.draws>4000*.15);
  assert.ok(strong.wins>equal.wins&&equal.wins>weak.wins);
  assert.ok(strong.wins-weak.wins>4000*.15);
  assert.ok(strong.losses>4000*.1);
});

test('legacy biased saves and pending replays retain their existing settings and results',()=>{
 const user={...squadTeam(allSquads[0]),id:'user',clubId:'user',name:'Meu time'};
 const settings={...SIMULATION_SETTINGS,modelVersion:1,draftFamiliarity:1.38};
 const state={...prepareUserRound(createTournament(user,allSquads,{mode:'copa-do-brasil',seed:39,settings})),matchMinute:23};
 const before=structuredClone(state);
 assert.deepEqual(migrateNeutralSimulation(state),{});
 assert.deepEqual(state,before);
});

test('the small assistance in close matchups improves wins at home and away while preserving draws and losses',()=>{
  const neutral={...SIMULATION_SETTINGS,userAttackMultiplier:1,userDefenseMultiplier:1};
  const opponent=team('opponent',85),counts=[];
  for(const ovr of [70,85,90]){
    const user=team('user',ovr),before=structuredClone(user);
    let assistedWins=0,neutralWins=0,draws=0,losses=0;
    for(let seed=0;seed<4000;seed++){
      const home=seed%2?opponent:user,away=seed%2?user:opponent;
      const assisted=simulateMatch(home,away,mulberry32(seed));
      const baseline=simulateMatch(home,away,mulberry32(seed),{settings:neutral});
      if(assisted.winnerId==='user')assistedWins++;else if(assisted.winnerId)losses++;else draws++;
      if(baseline.winnerId==='user')neutralWins++;
    }
    assert.ok(assistedWins>neutralWins);
    assert.ok(assistedWins-neutralWins<4000*.15,'the adjustment stays modest');
    assert.ok(draws>0&&losses>4000*.1,'no guaranteed wins, even with a strong team');
    assert.deepEqual(user,before,'assistance must not change any rating or attribute');
    counts.push(assistedWins);
  }
  assert.ok(counts[2]>counts[1]&&counts[1]>counts[0]);
});

test('version-two saves retain their original assistance and unfinished match',()=>{
 const user={...squadTeam(allSquads[0]),id:'user',name:'Meu time'};
 const settings={...SIMULATION_SETTINGS,modelVersion:2,userAttackMultiplier:1,userDefenseMultiplier:1};
 const state={...prepareUserRound(createTournament(user,allSquads,{mode:'champions',seed:41,settings})),matchMinute:17};
 const before=structuredClone(state);
 assert.deepEqual(migrateNeutralSimulation(state),{});
 assert.deepEqual(state,before);
});
