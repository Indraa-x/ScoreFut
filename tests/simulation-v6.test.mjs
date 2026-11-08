import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {allSquads} from '../data/game-squads.js';
import {FORMATIONS,squadTeam,calculateTeam,expectedGoals,simulateMatch,mulberry32,simulationSettings,LEGACY_SIMULATION_SETTINGS,createTournament,playNextRound} from '../js/engine.js';
import {migrateNeutralSimulation,prepareUserRound} from '../js/match-session.js';
const team=(id,ovr,formation='4-3-3')=>{const lineup=FORMATIONS[formation].slots.map((slot,i)=>({slot,clubId:id+i,squadId:id+i,player:{id:id+i,nome:id+i,ovr,tags:[slot.label],atributos:Object.fromEntries(['ataque','meio','defesa','finalizacao','reflexo','posicionamento'].map(k=>[k,ovr]))}}));return{id,name:id,lineup,strength:calculateTeam(lineup),formation};};

test('model 5 keeps exact pre-change seeded matches, including events, shootouts and timing',()=>{
 const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/model5.json',import.meta.url)));
 const home=squadTeam(allSquads.find(s=>s.id===golden.homeId)),away=squadTeam(allSquads.find(s=>s.id===golden.awayId));
 for(const {seed,hash} of golden.cases){const result=simulateMatch(home,away,mulberry32(seed),{knockout:true,stoppageTimeAllowed:true,settings:golden.settings});assert.equal(crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex'),hash);}
});
test('saved v5 campaigns, RNG and pending replay remain byte-identical; only new campaigns use v6',()=>{
 const user=team('user',86),t=createTournament(user,allSquads,{mode:'copa-do-brasil',seed:7,settings:LEGACY_SIMULATION_SETTINGS});
 const state={...prepareUserRound(t),matchMinute:35},before=structuredClone(state);
 assert.deepEqual(migrateNeutralSimulation(state),{});assert.deepEqual(state,before);
 const unversioned={...state,tournament:{...t,settings:undefined},pendingRound:null};
 const migrated=migrateNeutralSimulation(unversioned);
 assert.equal(migrated.tournament.settings.modelVersion,5);
 assert.deepEqual(playNextRound(migrated.tournament),playNextRound(t));
 assert.equal(createTournament(user,allSquads,{mode:'copa-do-brasil',seed:7}).settings.modelVersion,6);
});
test('smooth v6 rates are symmetric without assistance, continuous and have a bounded total',()=>{
 const settings=simulationSettings('Realista');
 for(let gap=-20;gap<=20;gap+=.25){const a=team('a',85+gap/2),b=team('b',85-gap/2);assert.ok(Math.abs(expectedGoals(a,b,settings)+expectedGoals(b,a,settings)-2*settings.baseXG)<1e-10);assert.equal(expectedGoals({...a,isUser:true},b,settings),expectedGoals(a,b,settings));}
 for(const boundary of [0,5,10,15,20]){const a=team('a',85+boundary),b=team('b',85);assert.ok(Math.abs(expectedGoals(a,b,settings)-expectedGoals(team('a',85+boundary+.001),b,settings))<.001);}
 const a=team('a',85),b=team('b',85),user={...a,isUser:true};
 assert.ok(expectedGoals(user,b,simulationSettings('Casual'))>expectedGoals(user,b,simulationSettings('Normal')));
 assert.ok(expectedGoals(user,b,simulationSettings('Normal'))>expectedGoals(user,b,settings));
});
test('v6 neutral equal teams retain realistic scoring; the Normal gap curve has no goal inflation',()=>{
 const runs=8000;
 for(const gap of [0,5,10,15,20]){
  const a={...team('a',85+gap/2),isUser:true},b=team('b',85-gap/2);let wins=0,draws=0,goals=0,large=0,zero=0;
  for(let seed=1;seed<=runs;seed++){
   const r=simulateMatch(seed%2?a:b,seed%2?b:a,mulberry32(seed));wins+=r.winnerId==='a';draws+=!r.winnerId;const n=r.homeGoals+r.awayGoals;goals+=n;large+=n>=5;zero+=n===0;
  }
  const target={0:.42,5:.58,10:.70,15:.78,20:.82}[gap];
  assert.ok(Math.abs(wins/runs-target)<.045,`gap ${gap}: ${wins/runs}`);
  assert.ok(large/runs<.25);assert.ok(goals/runs>2.4&&goals/runs<2.8);
  if(!gap){assert.ok(draws/runs>.235&&draws/runs<.29);assert.ok(zero/runs>.06&&zero/runs<.09);}
 }
});
test('v6 uses midfield, primary-position fit and capped era chemistry internally without changing display ratings',()=>{
 const settings=simulationSettings('Realista'),a=team('a',85),b=team('b',85);
 const midfield={...a,lineup:a.lineup.map(e=>({...e,player:{...e.player,atributos:{...e.player.atributos,meio:99}}}))};
 assert.ok(expectedGoals(midfield,b,settings)>expectedGoals(a,b,settings));
 assert.ok(expectedGoals(b,midfield,settings)<expectedGoals(b,a,settings));
 const alternate=a.lineup.map(e=>e.slot.label==='LE'?{...e,player:{...e.player,tags:['LD','LE']}}:e);
 assert.equal(calculateTeam(alternate).overall,85,'display remains the unchanged player average');
 assert.ok(calculateTeam(alternate,settings).overall<calculateTeam(a.lineup,settings).overall);
 const shared=a.lineup.map(e=>({...e,clubId:'same',squadId:'same-2010',ano:2010}));
 assert.equal(calculateTeam(shared,settings).chemistry,2);
 assert.equal(calculateTeam(shared,settings).overall,87);
 assert.equal(calculateTeam(shared).chemistry,0);
 assert.equal(calculateTeam(shared).overall,85);
});
test('no formation exceeds 52% decisive wins against the other equal-quality formations',()=>{
 const settings=simulationSettings('Realista'),names=Object.keys(FORMATIONS);
 for(const formation of names){let wins=0,total=0;
  const a=team('a',85,formation);
  for(const other of names.filter(n=>n!==formation)){
   const b=team('b',85,other);
   for(let seed=1;seed<=1600;seed++){
    const r=simulateMatch(seed%2?a:b,seed%2?b:a,mulberry32(seed),{knockout:true,settings});wins+=r.winnerId==='a';total++;
   }
  }
  assert.ok(wins/total<.52,`${formation}: ${wins/total}`);
 }
});
test('v6 cards, substitutions, venue and stoppage time affect only the remaining exposure',()=>{
 const a=team('a',85),b=team('b',85),base=simulationSettings('Realista',{redCardChance:0,penaltyFoulChance:0,overdispersion:0,latePressure:0,counterExposure:0,substitutionChance:0});
 const constant=()=>.2;
 const normal=simulateMatch(a,b,constant,{settings:base});
 const dismissed=simulateMatch(a,b,constant,{settings:{...base,redCardChance:1}});
 assert.ok(dismissed.events.some(e=>e.type==='red'));
 assert.ok(dismissed.xG[0]<normal.xG[0]*.8 && dismissed.xG[1]<normal.xG[1]*.8);
 const rested=simulateMatch(a,b,constant,{settings:{...base,substitutionChance:1,substitutionRecovery:.2}});
 assert.ok(rested.xG[0]>normal.xG[0]);
 const home=simulateMatch(a,b,constant,{settings:base,neutral:false,mode:'champions'});
 assert.ok(home.xG[0]>normal.xG[0]);assert.equal(home.xG[1],normal.xG[1]);
 assert.deepEqual(simulateMatch(a,b,constant,{settings:base,neutral:false,mode:'world-cup'}),normal);
 const added=simulateMatch(a,b,()=>.8,{settings:base,stoppageTimeAllowed:true});assert.ok(added.duration>90 && added.xG[0]>normal.xG[0]);
});
test('v6 output has the v5 schema, is resumably deterministic and never uses dismissed penalty takers',()=>{
 const a={...team('a',86),isUser:true},b=team('b',83),settings=simulationSettings('Normal');
 const keys=Object.keys(simulateMatch(a,b,mulberry32(1),{settings:LEGACY_SIMULATION_SETTINGS})).sort();
 for(let seed=1;seed<=250;seed++){
  const rng=mulberry32(seed),r=simulateMatch(a,b,rng,{knockout:true,settings,stoppageTimeAllowed:true});
  assert.deepEqual(Object.keys(r).sort(),keys);assert.deepEqual(r,simulateMatch(a,b,mulberry32(seed),{knockout:true,settings,stoppageTimeAllowed:true}));
  assert.deepEqual(r,JSON.parse(JSON.stringify(r)));assert.equal(r.scorers.reduce((s,p)=>s+p.goals,0),r.homeGoals+r.awayGoals);
  for(const e of r.events.filter(e=>e.type==='red'))assert.ok(!r.events.some(g=>['goal','penalty'].includes(g.type)&&g.team===e.team&&g.player.id===e.player.id&&g.minute>=e.minute));
  const checkpoint=rng.getState();assert.equal(rng(),mulberry32(checkpoint)(),'RNG resumes after exactly the consumed draws');
 }
});
