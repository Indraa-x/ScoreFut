import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/clubs.js';
import {BRAZIL_CUP_CLUB_IDS} from '../data/competitions.js';
import {squadTeam,createTournament,playNextRound,simulateTournament,resolveBrazilCupTie,mulberry32} from '../js/engine.js';
import {prepareUserRound,currentMatch,commitUserRound,canContinueTournament,upcomingFixtures} from '../js/match-session.js';
import {renderMatch,renderBracket} from '../js/ui.js';

const user={...squadTeam(allSquads[0]),id:'user',clubId:'user',name:'Meu time'};
const make=seed=>createTournament(user,allSquads,{mode:'copa-do-brasil',seed});

test('Brazil cup has unique participating clubs, two legs through semis and one neutral final',()=>{
  const initial=make(39), before=structuredClone(initial);
  assert.equal(initial.teams.length,16);
  assert.equal(new Set(initial.teams.map(team=>team.clubId)).size,16);
  assert.ok(initial.teams.filter(team=>!team.isUser).every(team=>BRAZIL_CUP_CLUB_IDS.includes(team.clubId)));
  assert.deepEqual(initial.groups,[]);
  assert.equal(initial.bracket.length,1);
  assert.ok(initial.matches.every(match=>match.result===null));
  let t=initial;
  for(let round=1;round<=7;round++){
    t=playNextRound(t);
    assert.ok(t.matches.filter(match=>match.round>round).every(match=>match.result===null));
    for(const stage of t.bracket)for(const tie of stage.ties){
      const games=tie.matchIds.map(id=>t.matches.find(match=>match.id===id));
      assert.equal(games.length,stage.stage==='final'?1:2);
      if(games.length===2){assert.equal(games[0].homeId,games[1].awayId);assert.equal(games[0].awayId,games[1].homeId);}
      if(tie.winnerId&&games.length===2){
        const first=games[0],last=games[1];
        const sum=[first.result.homeGoals+last.result.awayGoals,first.result.awayGoals+last.result.homeGoals];
        assert.deepEqual(tie.aggregate,sum);
        const decisive=sum[0]>sum[1]?first.homeId:sum[1]>sum[0]?first.awayId:last.result.penalties[0]>last.result.penalties[1]?last.homeId:last.awayId;
        assert.equal(tie.winnerId,decisive);
      }
    }
  }
  assert.deepEqual(initial,before);
  assert.deepEqual(t,simulateTournament(initial));
  assert.equal(t.matches.length,29);
  assert.ok(t.matches.every(({result:r})=>r.duration===90+r.regulationStoppageTime+(r.extraTime?30+r.extraTimeStoppageTime:0)));
  assert.equal(t.matches.filter(match=>match.stage==='final').length,1);
  assert.ok(t.matches.at(-1).neutral);
  assert.equal(t.championId,t.bracket.at(-1).ties[0].winnerId);
  assert.ok(t.userMatches.length<=7);
  const quarter=t.bracket.find(stage=>stage.stage==='quarter'), semi=t.bracket.find(stage=>stage.stage==='semi');
  for(let i=0;i<2;i++)assert.deepEqual([...semi.ties[i].teamIds].sort(),quarter.ties.slice(i*2,i*2+2).map(tie=>tie.winnerId).sort());
});

test('aggregate winner can lose the return leg; equal totals go straight to penalties regardless of away goals',()=>{
  const a={...user,id:'a'},b={...squadTeam(allSquads[1]),id:'b'};
  const fixture=(homeGoals,awayGoals,winnerId)=>({result:{homeGoals,awayGoals,winnerId,duration:90,extraTime:false,penalties:null,events:[],scorers:[]}});
  const first=fixture(5,0,'a'),last=fixture(2,0,'b'), snapshot=structuredClone([first,last]);
  const resolved=resolveBrazilCupTie(first,last,b,a,mulberry32(44));
  assert.equal(resolved.winnerId,'a');
  assert.equal(resolved.result.winnerId,'b');
  assert.deepEqual(resolved.aggregate,[2,5]);
  assert.equal(resolved.result.penalties,null);
  assert.deepEqual([first,last],snapshot);
  const tied=resolveBrazilCupTie(fixture(2,0,'a'),fixture(3,1,'b'),b,a,mulberry32(45));
  assert.deepEqual(tied.aggregate,[3,3]);
  assert.notEqual(tied.result.penalties[0],tied.result.penalties[1]);
  assert.equal(tied.winnerId,tied.result.penalties[0]>tied.result.penalties[1]?'b':'a');
  assert.ok(tied.result.events.every(event=>event.shootout&&event.minute===90));
  assert.equal(tied.result.duration,90);
});

test('losing the first leg allows a return match; results and qualifiers stay private until committed',()=>{
  let initial, pending;
  for(let seed=1;seed<100;seed++){
    initial=make(seed);pending=playNextRound(initial);
    if(pending.userMatches[0].result.winnerId!=='user'&&pending.userMatches[0].result.winnerId)break;
  }
  assert.equal(pending.campaign.eliminated,false);
  const s={...prepareUserRound(initial),mode:'copa-do-brasil',formation:user.formation,matchMinute:0,matchSpeed:4};
  assert.equal(upcomingFixtures(s.tournament,currentMatch(s)).length,1);
  assert.ok(renderMatch(s).includes('Volta'));
  assert.ok(renderBracket(s).includes('Confrontos a definir'));
  assert.ok(!renderBracket(s).includes('PONTOS CORRIDOS'));
  assert.equal(commitUserRound(s),false);
  s.matchMinute=currentMatch(s).result.duration;assert.equal(commitUserRound(s),true);
  assert.equal(canContinueTournament(s.tournament),true);
  Object.assign(s,prepareUserRound(s.tournament));s.matchMinute=0;
  assert.equal(currentMatch(s).leg,2);
  assert.ok(renderMatch(s).includes('data-match-aggregate'));
  assert.ok(!renderMatch(s).includes('Classificado:'));
  const resumed=JSON.parse(JSON.stringify(s));
  assert.deepEqual(currentMatch(resumed).result,currentMatch(s).result);
  s.matchMinute=currentMatch(s).result.duration;assert.equal(commitUserRound(s),true);
  const tie=s.tournament.bracket[0].ties.find(tie=>tie.teamIds.includes('user'));
  assert.equal(s.tournament.campaign.eliminated,tie.winnerId!=='user');
  assert.ok(renderMatch(s).includes('Classificado:'));
  assert.ok(!s.tournament.matches.some(match=>match.round>2&&match.result));
});

test('excluded seasons stay excluded and missing clubs get byes without duplicate or phantom fixtures',()=>{
  const excluded=allSquads.filter(squad=>squad.clubId==='flamengo').map(squad=>squad.id);
  const initial=createTournament(user,allSquads,{mode:'copa-do-brasil',seed:11,excludeSquadIds:excluded});
  assert.equal(initial.teams.length,15);
  assert.equal(initial.bracket[0].ties.filter(tie=>tie.bye).length,1);
  const t=simulateTournament(initial);
  assert.ok(t.complete);
  assert.equal(t.matches.length,27);
  assert.ok(t.teams.every(team=>!excluded.includes(team.id)));
  assert.ok(t.matches.every(match=>match.homeId&&match.awayId&&match.result));
});

test('a tied neutral final is settled by a shootout after the complete match clock',()=>{
  let found=false;
  for(let seed=1;seed<=100&&!found;seed++){
    const t=simulateTournament(make(seed)),final=t.matches.at(-1);
    if(final.result.homeGoals!==final.result.awayGoals)continue;
    found=true;
    assert.ok(final.neutral);
    assert.equal(final.result.duration,90+final.result.regulationStoppageTime+(final.result.extraTime?30+final.result.extraTimeStoppageTime:0));
    assert.ok(final.result.penalties);
    assert.equal(t.championId,final.result.penalties[0]>final.result.penalties[1]?final.homeId:final.awayId);
    assert.ok(final.result.events.filter(event=>event.shootout).every(event=>event.minute===final.result.duration));
  }
  assert.ok(found);
});
