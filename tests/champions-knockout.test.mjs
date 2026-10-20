import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/clubs.js';
import {squadsForMode} from '../data/competitions.js';
import {squadTeam,createTournament,playNextRound,simulateTournament,upgradeChampionsTournament} from '../js/engine.js';
import {prepareUserRound,currentMatch,commitUserRound,upcomingFixtures,migrateChampionsFormat} from '../js/match-session.js';
import {renderMatch,renderBracket} from '../js/ui.js';

const user={...squadTeam(allSquads[0]),id:'user',clubId:'user',name:'Meu time'};
const make=seed=>createTournament(user,allSquads,{mode:'champions',seed});
const afterGroups=seed=>{
  let t=make(seed);
  for(let round=0;round<3;round++)t=playNextRound(t);
  return t;
};
const legacy=(seed,rounds=3)=>{
  let t=createTournament(user,squadsForMode(allSquads,'champions'),{mode:'cup',seed});
  for(let round=0;round<rounds;round++)t=playNextRound(t);
  return t;
};

test('Champions keeps its groups and seeded halves, then plays two legs through the semi and one neutral final',()=>{
  const initial=make(83),before=structuredClone(initial);
  let t=initial;
  for(let round=1;round<=10;round++){
    t=playNextRound(t);
    assert.ok(t.matches.filter(match=>match.round>round).every(match=>!match.result));
    if(round===3){
      for(const tie of t.bracket[0].ties){
        assert.ok(t.groups.some(group=>group.standings[0].teamId===tie.teamIds[1]),'the group winner hosts the return');
        assert.ok(t.groups.some(group=>group.standings[1].teamId===tie.teamIds[0]));
      }
    }
  }
  assert.deepEqual(initial,before);
  assert.deepEqual(t,simulateTournament(initial));
  assert.equal(t.progressRound,10);
  assert.equal(t.matches.length,77);
  assert.equal(t.matches.filter(match=>match.stage==='group').length,48);
  assert.deepEqual(t.bracket.map(stage=>stage.matches.length),[16,8,4,1]);
  assert.deepEqual(t.bracket.map(stage=>stage.ties.length),[8,4,2,1]);
  assert.ok(t.matches.every(match=>match.result.duration===90&&!match.result.extraTime));
  assert.equal(t.matches.at(-1).neutral,true);
  assert.equal(t.championId,t.bracket.at(-1).ties[0].winnerId);
  assert.ok(t.userMatches.length>=3&&t.userMatches.length<=10);
  assert.equal(t.campaign.wins+t.campaign.draws+t.campaign.losses,t.campaign.played);
  for(const stage of t.bracket)for(const tie of stage.ties){
    const games=tie.matchIds.map(id=>t.matches.find(match=>match.id===id));
    assert.equal(games.length,stage.stage==='final'?1:2);
    if(games.length===2){
      assert.equal(games[0].homeId,games[1].awayId);
      assert.equal(games[0].awayId,games[1].homeId);
      assert.equal(games[1].round,games[0].round+1);
    }
    if(stage.stage!=='final')assert.ok(!t.groups.some(group=>tie.teamIds.every(id=>group.teamIds.includes(id))));
  }
});

test('Champions qualifies by aggregate, allows a return-leg defeat and settles equal totals with penalties only after the return',()=>{
  let aggregateDiffers=false,shootout=false;
  for(let seed=1;seed<=8;seed++){
    const t=simulateTournament(make(seed));
    for(const stage of t.bracket.filter(stage=>stage.stage!=='final'))for(const tie of stage.ties){
      const [first,last]=tie.matchIds.map(id=>t.matches.find(match=>match.id===id));
      assert.equal(first.result.penalties,null);
      assert.equal(first.result.extraTime,false);
      const totals=[first.result.homeGoals+last.result.awayGoals,first.result.awayGoals+last.result.homeGoals];
      assert.deepEqual(tie.aggregate,totals);
      if(totals[0]===totals[1]){
        shootout=true;
        assert.ok(last.result.penalties);
        assert.equal(tie.winnerId,last.result.penalties[0]>last.result.penalties[1]?last.homeId:last.awayId);
        assert.ok(last.result.events.filter(event=>event.shootout).every(event=>event.minute===90));
      }else{
        assert.equal(last.result.penalties,null);
        assert.equal(tie.winnerId,totals[0]>totals[1]?first.homeId:first.awayId);
        if(last.result.winnerId&&last.result.winnerId!==tie.winnerId)aggregateDiffers=true;
      }
    }
  }
  assert.ok(aggregateDiffers);
  assert.ok(shootout);
});

test('the live Champions keeps a losing first leg alive, schedules its return and reveals the aggregate qualifier at the final whistle',()=>{
  let t;
  for(let seed=1;seed<=100;seed++){
    const candidate=afterGroups(seed);
    if(candidate.campaign.eliminated)continue;
    const pending=playNextRound(candidate),match=pending.userMatches.at(-1);
    if(match.result.winnerId&&match.result.winnerId!=='user'){t=candidate;break;}
  }
  assert.ok(t);
  const before=structuredClone(t);
  const state={...prepareUserRound(t),mode:'champions',formation:user.formation,matchMinute:0,matchSpeed:4};
  assert.equal(currentMatch(state).leg,1);
  assert.equal(upcomingFixtures(t,currentMatch(state)).length,1);
  assert.ok(renderMatch(state).includes('Jogar a volta'));
  assert.ok(!renderMatch(state).includes('Classificado:'));
  assert.ok(state.pendingRound.bracket[0].ties.every(tie=>tie.winnerId===null));
  assert.equal(commitUserRound(state),false);
  state.matchMinute=90;
  assert.equal(commitUserRound(state),true);
  assert.equal(state.tournament.campaign.eliminated,false);
  Object.assign(state,prepareUserRound(state.tournament),{matchMinute:0});
  assert.equal(currentMatch(state).leg,2);
  const html=renderMatch(state);
  assert.ok(html.includes('Ida + volta')&&html.includes('data-match-aggregate'));
  assert.ok(!html.includes('Classificado:')&&!html.includes('Pênaltis <b>'));
  const resumed=JSON.parse(JSON.stringify(state));
  assert.deepEqual(currentMatch(resumed),currentMatch(state));
  state.matchMinute=90;commitUserRound(state);
  const tie=state.tournament.bracket[0].ties.find(tie=>tie.teamIds.includes('user'));
  assert.equal(state.tournament.campaign.eliminated,tie.winnerId!=='user');
  assert.ok(renderMatch(state).includes('Classificado:'));
  const bracket=renderBracket(state);
  assert.ok(bracket.includes('CHAMPIONS LEAGUE')&&bracket.includes('Placar agregado'));
  assert.ok(bracket.includes('Ida ·')&&bracket.includes('Volta ·'));
  assert.ok(!bracket.includes('COPA DO BRASIL')&&!bracket.includes('Sorteio entre os classificados'));
  assert.deepEqual(t,before);
});

test('active single-leg Champions saves retain completed scores and opponents while upgrading only future ties',()=>{
  const original=legacy(83),pending=playNextRound(original);
  original.mode='champions';pending.mode='champions';
  const before=structuredClone(original);
  const state={tournament:original,pendingRound:pending,userMatchIndex:original.userMatches.length,matchMinute:37};
  const migrated=migrateChampionsFormat(state);
  assert.equal(migrated.tournament.knockoutFormat,'two-legged');
  assert.deepEqual(migrated.tournament.matches.filter(match=>match.result),original.matches.filter(match=>match.result));
  const opponents=t=>t.bracket[0].matches.map(match=>[match.homeId,match.awayId].sort().join(':'));
  assert.deepEqual([...new Set(opponents(migrated.tournament))].sort(),opponents(original).sort());
  assert.equal(migrated.tournament.bracket[0].matches.length,16);
  assert.equal(currentMatch(migrated).leg,1);
  assert.equal(migrated.matchMinute,0);
  assert.deepEqual(original,before);
  const later=legacy(83,4);later.mode='champions';
  const upgraded=upgradeChampionsTournament(later);
  assert.deepEqual(upgraded.matches.filter(match=>match.result),later.matches.filter(match=>match.result));
  assert.ok(upgraded.bracket[0].ties.every(tie=>tie.matchIds.length===1&&tie.winnerId));
  assert.ok(upgraded.bracket[1].ties.every(tie=>tie.matchIds.length===2&&!tie.winnerId));
  assert.ok(simulateTournament(upgraded).complete);
});

test('upgrading during the groups preserves the current replay and completed historical campaigns stay untouched',()=>{
  const original=legacy(12,1),pending=playNextRound(original);
  original.mode='champions';pending.mode='champions';
  const state={tournament:original,pendingRound:pending,userMatchIndex:original.userMatches.length,matchMinute:24.5};
  const migrated=migrateChampionsFormat(state);
  assert.equal(migrated.matchMinute,24.5);
  assert.deepEqual(currentMatch(migrated).result,currentMatch(state).result);
  const complete=simulateTournament(legacy(12));complete.mode='champions';
  assert.equal(upgradeChampionsTournament(complete),complete);
  assert.deepEqual(migrateChampionsFormat({tournament:complete}),{});
});
