import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {squadTeam,createTournament} from '../js/engine.js';
import {prepareUserRound,currentMatch,commitUserRound} from '../js/match-session.js';
import {renderMatch} from '../js/ui.js';
import {penaltyProgress,beginPenaltyReplay,advancePenaltyReplay,matchHasEnded,penaltyInterval,renderPenaltyMarks} from '../js/match-penalties.js';

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
  assert.ok(html.includes('data-penalty-marks'));
  assert.ok(html.includes('aria-label="'+expectedResult.penalties[0]+' gols nos pênaltis"'));
  assert.ok(html.includes('aria-label="'+expectedResult.penalties[1]+' gols nos pênaltis"'));
  assert.ok(!/penalty-shoot|penalty-stage|has-shootout|Escolha onde bater/.test(html));
  assert.ok(!html.match(/<button[^>]*data-action="next-match"[^>]*>/)[0].includes('disabled'));
  assert.equal(commitUserRound(state),true);
  assert.equal(state.pendingRound,null);
  assert.deepEqual(currentMatch(state).result.penalties,expectedResult.penalties);
  assert.equal(currentMatch(state).result.winnerId,expectedResult.winnerId);
  assert.equal(state.tournament.campaign.champion,expectedResult.winnerId==='user');
});

function elapse(state,match,milliseconds){
  for(let remaining=milliseconds;remaining>0;remaining-=100)advancePenaltyReplay(state,match,Math.min(100,remaining));
}

for(const mode of ['world-cup','champions','copa-do-brasil'])test(mode+': reveal kicks individually, resume a partial shootout, and hide the winner until the last kick',()=>{
  let state=penaltyFinal(mode),match=currentMatch(state);
  state.matchMinute=match.result.duration;
  const originalResult=structuredClone(match.result);
  assert.equal(beginPenaltyReplay(state,match),true);
  assert.equal(matchHasEnded(state,match),false);
  assert.equal(commitUserRound(state),false);
  assert.deepEqual(penaltyProgress(state,match).scores,[0,0]);
  let html=renderMatch(state);
  assert.ok(html.includes('class="match-status playing"'));
  assert.ok(html.match(/<button[^>]*data-action="next-match"[^>]*>/)[0].includes('disabled'));
  assert.equal((html.match(/class="shootout-dot /g)||[]).length,10);
  elapse(state,match,1700);assert.equal(penaltyProgress(state,match).revealed,0);
  elapse(state,match,100);assert.equal(penaltyProgress(state,match).revealed,1);
  assert.equal(commitUserRound(state),false);
  elapse(state,match,900);
  state=JSON.parse(JSON.stringify(state));match=currentMatch(state);
  assert.equal(beginPenaltyReplay(state,match),true);
  assert.equal(penaltyProgress(state,match).revealed,1);
  elapse(state,match,900);assert.equal(penaltyProgress(state,match).revealed,2);
  while(penaltyProgress(state,match).playing){
    const before=penaltyProgress(state,match).revealed;
    elapse(state,match,1800);
    assert.equal(penaltyProgress(state,match).revealed,before+1);
  }
  assert.equal(matchHasEnded(state,match),true);
  assert.deepEqual(penaltyProgress(state,match).scores,originalResult.penalties);
  assert.deepEqual(match.result,originalResult);
  assert.equal(beginPenaltyReplay(state,match),false);
  assert.equal(commitUserRound(state),true);
});

test('both match speeds keep the normal penalty cadence and suspended frames never reveal a burst',()=>{
  assert.equal(penaltyInterval(4),1800);assert.equal(penaltyInterval(8),1800);
  const state=penaltyFinal('world-cup'),match=currentMatch(state);
  state.matchMinute=match.result.duration;beginPenaltyReplay(state,match);
  advancePenaltyReplay(state,match,60000);
  assert.equal(penaltyProgress(state,match).revealed,0);
  state.matchSpeed=8;elapse(state,match,400);
  assert.equal(penaltyProgress(state,match).revealed,0);
  elapse(state,match,1150);
  assert.equal(penaltyProgress(state,match).revealed,1);
});

test('sudden-death dots grow only as the extra attempts are revealed and label every team outcome',()=>{
  const events=Array.from({length:12},(_,i)=>({type:'penalty',shootout:true,team:i%2?'away':'home',converted:i!==11}));
  const match={id:'sudden',result:{duration:120,penalties:[6,5],events:[{type:'penalty',shootout:false,team:'home',converted:true},...events]}};
  const state={matchMinute:120,matchSpeed:4,tournament:{seed:17}};
  const names={home:'Meu time',away:'Adversário'},esc=String;
  beginPenaltyReplay(state,match);
  assert.equal(penaltyProgress(state,match).events.length,12);
  elapse(state,match,18000);
  assert.equal((renderPenaltyMarks(state,match,names,esc).match(/class="shootout-dot /g)||[]).length,10);
  elapse(state,match,1800);
  assert.equal((renderPenaltyMarks(state,match,names,esc).match(/class="shootout-dot /g)||[]).length,11);
  elapse(state,match,1800);
  const html=renderPenaltyMarks(state,match,names,esc);
  assert.equal((html.match(/class="shootout-dot /g)||[]).length,12);
  assert.ok(html.includes('Adversário, 6ª cobrança: errou'));
  assert.deepEqual(penaltyProgress(state,match).scores,[6,5]);
});
