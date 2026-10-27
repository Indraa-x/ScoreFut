import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {squadTeam,createTournament,simulateTournament} from '../js/engine.js';
import {prepareUserRound,currentMatch,commitUserRound,nextFixturePreview} from '../js/match-session.js';
import {renderMatch} from '../js/ui.js';

const base=squadTeam(allSquads[0]);
const user={...base,id:'user',clubId:'user',name:'Meu time',lineup:base.lineup.map(pick=>({...pick,player:{...pick.player,ovr:99,
  atributos:Object.fromEntries(Object.keys(pick.player.atributos).map(key=>[key,99]))}}))};
const candidateTeams=new Map(allSquads.map(squad=>[squad.id,squadTeam(squad)]));
const cases=[['world-cup',2],['champions',2],['copa-do-brasil',1]];
const initial=(mode,seed)=>createTournament(user,allSquads,{mode,seed,candidateTeams});
const view=(mode,tournament)=>({screen:'match',mode,formation:user.formation,matchMinute:0,matchSpeed:4,...prepareUserRound(tournament)});

for(const [mode,seed]of cases){
  test(`${mode}: preview follows every knockout round, both legs, and the fixture becomes concrete at the whistle`,()=>{
    const state=view(mode,initial(mode,seed)),seen=new Set();
    while(state.pendingRound){
      const match=currentMatch(state),knockout=match.stage!=='group';
      if(knockout){
        seen.add(match.stage);
        const before=structuredClone(state),preview=nextFixturePreview(state),html=renderMatch(state);
        assert.ok(html.includes('aria-label="Próximo jogo"'));
        assert.ok(!html.includes('Campanha encerrada'));
        if(match.stage==='final')assert.equal(preview.kind,'final');
        else if(match.leg===1){assert.equal(preview.kind,'fixture');assert.equal(preview.fixture.leg,2);assert.equal(preview.fixture.stage,match.stage);}
        else{assert.equal(preview.kind,'pending');assert.ok(preview.stageLabel);}
        assert.deepEqual(state,before);
        const secret=state.pendingRound;state.pendingRound={...secret,complete:true,campaign:{...secret.campaign,eliminated:true}};
        assert.deepEqual(nextFixturePreview(state),preview,'an unfinished result must never determine the visible next opponent');state.pendingRound=secret;
      }
      state.matchMinute=match.result.duration;
      const revealed=nextFixturePreview(state);
      if(match.stage!=='final'){
        assert.equal(revealed.kind,'fixture');assert.equal(revealed.fixture.result,null);
        assert.ok(revealed.fixture.round>match.round);
        if(knockout)assert.ok(!renderMatch(state).includes('Campanha encerrada'));
      }else assert.equal(revealed.kind,'complete');
      assert.equal(commitUserRound(state),true);
      assert.deepEqual(nextFixturePreview(state),revealed);
      if(state.tournament.complete)break;
      Object.assign(state,prepareUserRound(state.tournament),{matchMinute:0});
    }
    assert.deepEqual([...seen],['round16','quarter','semi','final']);
  });

  test(`${mode}: reviewing an earlier match in a finished campaign still shows the real next fixture without its score`,()=>{
    const t=simulateTournament(initial(mode,seed));
    const index=t.userMatches.findIndex(match=>match.stage==='round16');
    const state={screen:'match',mode,formation:user.formation,tournament:t,userMatchIndex:index,matchMinute:t.userMatches[index].result.duration};
    const before=structuredClone(state),preview=nextFixturePreview(state);
    assert.equal(t.complete,true);assert.equal(preview.kind,'fixture');
    assert.equal(preview.fixture.id,t.userMatches[index+1].id);assert.equal(preview.fixture.result,null);
    const html=renderMatch(state);assert.ok(html.includes('class="upcoming-game"'));assert.ok(!html.includes('Campanha encerrada'));
    assert.deepEqual(state,before);
    state.userMatchIndex=t.userMatches.length-1;state.matchMinute=currentMatch(state).result.duration;
    assert.equal(nextFixturePreview(state).kind,'complete');
  });
}

test('single-leg and seeded ties preview real possible opponents; Brazil quarterfinal redraw stays pending',()=>{
  for(const [mode,seed]of cases){
    const full=simulateTournament(initial(mode,seed));
    let t=initial(mode,seed),state=view(mode,t);
    while(currentMatch(state).stage==='group'){
      state.matchMinute=currentMatch(state).result.duration;commitUserRound(state);Object.assign(state,prepareUserRound(state.tournament),{matchMinute:0});
    }
    if(currentMatch(state).leg===1){state.matchMinute=currentMatch(state).result.duration;commitUserRound(state);Object.assign(state,prepareUserRound(state.tournament),{matchMinute:0});}
    const preview=nextFixturePreview(state);
    assert.equal(preview.kind,'pending');assert.equal(preview.stageLabel,'Quartas de final');
    if(mode==='copa-do-brasil'){assert.equal(preview.draw,true);assert.deepEqual(preview.opponentIds,[]);}
    else{assert.equal(preview.opponentIds.length,2);assert.ok(preview.opponentIds.every(id=>state.tournament.teams.some(team=>team.id===id)));}
    const losing=full.matches.find(match=>match.stage==='round16'&&match.result.winnerId&&match.result.winnerId!==match.homeId);
    if(mode==='world-cup'&&losing){
      const id=losing.homeId,userMatches=full.matches.filter(match=>match.result&&[match.homeId,match.awayId].includes(id));
      const eliminated={...full,userTeamId:id,userMatches,campaign:{...full.campaign,eliminated:true}};
      const ended={tournament:eliminated,userMatchIndex:userMatches.length-1,matchMinute:userMatches.at(-1).result.duration};
      assert.equal(nextFixturePreview(ended).kind,'complete');
    }
  }
});
