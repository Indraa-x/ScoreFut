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
