import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMATIONS,calculateTeam,simulateMatch,mulberry32,createTournament,squadTeam,SIMULATION_SETTINGS} from '../js/engine.js';
import {allSquads} from '../data/clubs.js';
import {prepareUserRound,currentMatch,commitUserRound,migrateNeutralSimulation} from '../js/match-session.js';

const team=(id,ovr)=>{
  const lineup=FORMATIONS['4-3-3'].slots.map((slot,index)=>({slot,clubId:id,player:{id:id+'-'+index,nome:id+' '+index,tags:[slot.label],ovr,atributos:{ataque:ovr,meio:ovr,defesa:ovr,finalizacao:ovr,reflexo:ovr,posicionamento:ovr}}}));
  return {id,name:id,lineup,strength:calculateTeam(lineup),isUser:id==='user'};
};

test('without assistance equal teams remain balanced and higher OVR raises the win rate',()=>{
  const opponent=team('opponent',85),rates=[];
  for(const ovr of [70,85,99]){
    let wins=0,draws=0,losses=0;
    for(let seed=0;seed<4000;seed++){
      const result=simulateMatch(team('user',ovr),opponent,mulberry32(seed),{settings:{...SIMULATION_SETTINGS,userAttackMultiplier:1,userDefenseMultiplier:1}});
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

test('legacy biased saves keep finished matches and regenerate only the unfinished round with current difficulty and original ratings',()=>{
  const user={...squadTeam(allSquads[0]),id:'user',clubId:'user',name:'Meu time'};
  let state={...prepareUserRound(createTournament(user,allSquads,{mode:'copa-do-brasil',seed:39})),matchMinute:90};
  commitUserRound(state);
  state.tournament.settings={...state.tournament.settings,modelVersion:1,draftFamiliarity:1.38};
  const oldUser=state.tournament.teams.find(team=>team.id==='user');
  oldUser.strength.attack*=1.38;oldUser.strength.defense*=1.38;
  Object.assign(state,prepareUserRound(state.tournament),{matchMinute:23});
  const before=structuredClone(state),matchId=currentMatch(state).id;
  const migrated={...state,...migrateNeutralSimulation(state)};
  assert.deepEqual(state,before);
  assert.equal(migrated.matchMinute,0);
  assert.equal(currentMatch(migrated).id,matchId);
  assert.deepEqual(migrated.tournament.userMatches,before.tournament.userMatches);
  assert.equal(migrated.tournament.settings.modelVersion,SIMULATION_SETTINGS.modelVersion);
  assert.ok(!Object.hasOwn(migrated.tournament.settings,'draftFamiliarity'));
  assert.deepEqual(migrated.tournament.teams.find(team=>team.id==='user').strength,calculateTeam(user.lineup));
  assert.deepEqual(migrateNeutralSimulation(migrated),{});
  const ended={...before,pendingRound:null,matchMinute:90};
  const completedMigration=migrateNeutralSimulation(ended);
  assert.deepEqual(completedMigration.tournament.userMatches,before.tournament.userMatches);
  assert.ok(!Object.hasOwn(completedMigration,'matchMinute'));
});

test('the small assistance improves wins at home and away while preserving draws, losses and OVR ordering',()=>{
  const neutral={...SIMULATION_SETTINGS,userAttackMultiplier:1,userDefenseMultiplier:1};
  const opponent=team('opponent',85),counts=[];
  for(const ovr of [70,85,99]){
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

test('version-two saves retain completed scores when migrating to the easier difficulty',()=>{
  const user={...squadTeam(allSquads[0]),id:'user',name:'Meu time'};
  const settings={...SIMULATION_SETTINGS,modelVersion:2,userAttackMultiplier:1,userDefenseMultiplier:1};
  let state={...prepareUserRound(createTournament(user,allSquads,{mode:'champions',seed:41,settings})),matchMinute:90};
  commitUserRound(state);
  Object.assign(state,prepareUserRound(state.tournament),{matchMinute:17});
  const before=structuredClone(state);
  const migrated={...state,...migrateNeutralSimulation(state)};
  assert.deepEqual(migrated.tournament.userMatches,before.tournament.userMatches);
  assert.equal(migrated.tournament.settings.userAttackMultiplier,1.12);
  assert.equal(migrated.tournament.settings.userDefenseMultiplier,1.06);
  assert.equal(migrated.matchMinute,0);
  assert.deepEqual(state,before);
});
