import test from 'node:test';
import assert from 'node:assert/strict';
import { allSquads } from '../data/clubs.js';
import { squadTeam, createTournament, simulateTournament } from '../js/engine.js';
import { currentMatch, prepareUserRound, commitUserRound, canContinueTournament, upcomingFixtures, migrateMatchSession } from '../js/match-session.js';

const user = { ...squadTeam(allSquads[0]), id:'user', clubId:'user', name:'Meu time' };

test('a pending round cannot expose results or knockout opponents before the final whistle',()=>{
  const initial=createTournament(user,allSquads,{seed:39,mode:'champions'}), before=structuredClone(initial);
  const state={...prepareUserRound(initial),matchMinute:0};
  assert.deepEqual(initial,before);
  assert.equal(state.tournament.progressRound,0);
  assert.equal(state.pendingRound.progressRound,1);
  assert.equal(state.tournament.userMatches.length,0);
  assert.ok(state.tournament.matches.every(match=>match.result===null));
  assert.equal(state.tournament.bracket.length,0);
  assert.equal(state.pendingRound.bracket.length,0);
  assert.equal(upcomingFixtures(state.tournament,currentMatch(state)).length,2);
  assert.equal(commitUserRound(state),false);
  state.matchMinute=currentMatch(state).result.duration;
  assert.equal(commitUserRound(state),true);
  assert.equal(commitUserRound(state),false);
  assert.equal(state.pendingRound,null);
  assert.equal(state.tournament.progressRound,1);
  assert.ok(state.tournament.matches.filter(match=>match.round>1).every(match=>match.result===null));
  const resumed=JSON.parse(JSON.stringify({...prepareUserRound(state.tournament),matchMinute:23.75}));
  assert.deepEqual(currentMatch(resumed).result,currentMatch(prepareUserRound(state.tournament)).result);
  assert.equal(resumed.matchMinute,23.75);
});

test('every knockout opponent is an actual qualifier or previous winner; future rounds remain unplayed',()=>{
  let state={...prepareUserRound(createTournament(user,allSquads,{seed:83,mode:'champions'})),matchMinute:0};
  while(state.pendingRound){
    const match=currentMatch(state);
    assert.ok(state.tournament.matches.filter(fixture=>fixture.round>match.round).every(fixture=>fixture.result===null));
    assert.ok(!state.pendingRound.matches.some(fixture=>fixture.round>match.round&&fixture.result));
    state.matchMinute=match.result.duration;commitUserRound(state);
    const t=state.tournament;
    for(let index=1;index<t.bracket.length;index++){
      const expected=t.bracket[index-1].matches.map(fixture=>fixture.result.winnerId).sort();
      const actual=t.bracket[index].matches.flatMap(fixture=>[fixture.homeId,fixture.awayId]).sort();
      assert.deepEqual(actual,expected);
    }
    if(!canContinueTournament(t))break;
    Object.assign(state,prepareUserRound(t),{matchMinute:0});
  }
  assert.ok(state.tournament.complete||state.tournament.campaign.eliminated);
});

test('league bye rounds are handled without inventing matches and the resumed season has identical standings',()=>{
  const initial=createTournament(user,allSquads,{seed:11,mode:'brasileirao',excludeSquadIds:allSquads.filter(s=>s.clubId==='flamengo').map(s=>s.id)});
  let state={...prepareUserRound(initial),matchMinute:0};
  while(state.pendingRound){
    state.matchMinute=currentMatch(state).result.duration;commitUserRound(state);
    if(!canContinueTournament(state.tournament))break;
    Object.assign(state,prepareUserRound(state.tournament),{matchMinute:0});
  }
  assert.equal(state.tournament.userMatches.length,28);
  assert.ok(state.tournament.complete);
  assert.deepEqual(state.tournament,simulateTournament(initial));
});

test('an old full-campaign save keeps the viewed match and removes precomputed future results',()=>{
  const initial=createTournament(user,allSquads,{seed:39,mode:'cup'}), full=simulateTournament(initial), before=structuredClone(full);
  const saved={tournament:full,userMatchIndex:1,matchMinute:32.5,draft:{picks:user.lineup}};
  const restored=migrateMatchSession(saved,allSquads);
  assert.equal(restored.tournament.progressRound,1);
  assert.equal(restored.pendingRound.progressRound,2);
  assert.deepEqual(currentMatch(restored).result,full.userMatches[1].result);
  assert.equal(restored.matchMinute,32.5);
  assert.equal(restored.tournament.bracket.length,0);
  assert.ok(restored.tournament.matches.filter(m=>m.round>1).every(m=>m.result===null));
  assert.deepEqual(full,before);
  const ended=migrateMatchSession({...saved,matchMinute:90},allSquads);
  assert.equal(ended.tournament.progressRound,2);
  assert.equal(ended.pendingRound,null);
});

test('competition draws vary with the random seed while retaining the proper club pool',()=>{
  for(const mode of ['cup','champions','copa-do-brasil','brasileirao']){
    const a=createTournament(user,allSquads,{mode,seed:12}), b=createTournament(user,allSquads,{mode,seed:987});
    assert.notDeepEqual(a.matches.filter(m=>[m.homeId,m.awayId].includes('user')).map(m=>[m.homeId,m.awayId]),b.matches.filter(m=>[m.homeId,m.awayId].includes('user')).map(m=>[m.homeId,m.awayId]));
    assert.ok(a.matches.every(m=>m.result===null));
  }
});
