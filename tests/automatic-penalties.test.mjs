import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {squadTeam,createTournament} from '../js/engine.js';
import {prepareUserRound,currentMatch,commitUserRound} from '../js/match-session.js';
import {renderMatch} from '../js/ui.js';

const user={...squadTeam(allSquads[0]),id:'user',name:'Meu time'};
function penaltyFinal(mode){
  for(let seed=1;seed<150;seed++){
    const tournament=createTournament(user,allSquads,{mode,seed});
    const opponent=tournament.teams.find(team=>team.id!=='user');
    const fixture={id:'automatic-final',stage:'final',stageLabel:'Final',round:7,homeId:'user',awayId:opponent.id,neutral:true,result:null,...(mode==='world-cup'?{}:{tieId:'final-tie',leg:1})};
    Object.assign(tournament,{teams:[tournament.teams.find(team=>team.id==='user'),opponent],groups:[],matches:[fixture],userMatches:[],progressRound:6,bracket:[{stage:'final',matches:[fixture],...(mode==='world-cup'?{}:{ties:[{id:'final-tie',teamIds:['user',opponent.id],matchIds:[fixture.id],winnerId:null,aggregate:null}]})}]});
    const state={screen:'match',mode,formation:user.formation,matchSpeed:4,matchMinute:0,...prepareUserRound(tournament)};
    if(currentMatch(state).result.penalties)return state;
  }
  throw Error('No penalty fixture for '+mode);
}

for(const mode of ['world-cup','champions','copa-do-brasil'])test(mode+': unfinished interactive saves resume with an automatic result and allow campaign progression',()=>{
  let state=penaltyFinal(mode);
  const fixture=currentMatch(state),expectedResult=structuredClone(fixture.result);
  fixture.result.interactiveShootout={version:2,complete:false,scores:[0,0],kicks:[],selection:'left'};
  state.penaltyBusy=true;
  state=JSON.parse(JSON.stringify(state));
  assert.equal(commitUserRound(state),false);
  state.matchMinute=currentMatch(state).result.duration;
  const html=renderMatch(state);
  assert.ok(html.includes('data-live-pitch'));
  assert.ok(html.includes('Pênaltis <b>'+expectedResult.penalties.join(' – ')+'</b>'));
  assert.ok(!/penalty-shoot|penalty-stage|has-shootout|Escolha onde bater/.test(html));
  assert.ok(!html.match(/<button[^>]*data-action="next-match"[^>]*>/)[0].includes('disabled'));
  assert.equal(commitUserRound(state),true);
  assert.equal(state.pendingRound,null);
  assert.deepEqual(currentMatch(state).result.penalties,expectedResult.penalties);
  assert.equal(currentMatch(state).result.winnerId,expectedResult.winnerId);
  assert.equal(state.tournament.campaign.champion,expectedResult.winnerId==='user');
});
