import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {squadTeam,createTournament} from '../js/engine.js';
import {createPenaltyShootout,penaltyTurn,takePenalty,penaltyWinner,PENALTY_TARGETS} from '../js/penalty-shootout.js';
import {prepareUserRound,currentMatch,ensurePenaltyShootout,finishPenaltyShootout,commitUserRound,nextFixturePreview} from '../js/match-session.js';
import {renderMatch} from '../js/ui.js';

const home={...squadTeam(allSquads[0]),id:'user',name:'Meu time'},away={...squadTeam(allSquads[1]),id:'opponent',name:'Adversário'};
const kick=(side,converted)=>({side,converted});

test('five-kick clinches and sudden death require the right number of attempts, including away-first turns',()=>{
  assert.equal(penaltyWinner([kick(0,true),kick(1,false),kick(0,true),kick(1,false),kick(0,true)],'h','a'),null);
  assert.equal(penaltyWinner([kick(0,true),kick(1,false),kick(0,true),kick(1,false),kick(0,true),kick(1,false)],'h','a'),'h');
  const tied=Array.from({length:10},(_,i)=>kick(i%2,true));
  assert.equal(penaltyWinner(tied,'h','a'),null);
  assert.equal(penaltyWinner([...tied,kick(0,true)],'h','a'),null);
  assert.equal(penaltyWinner([...tied,kick(0,true),kick(1,false)],'h','a'),'h');
  assert.equal(penaltyWinner([...tied,kick(1,true)],'h','a'),null);
  assert.equal(penaltyWinner([...tied,kick(1,true),kick(0,false)],'h','a'),'a');
});

test('left/right choices affect conversion and the opponent takes its kicks automatically',()=>{
  let differentShots=0;
  for(let seed=0;seed<250;seed++){
    const shootout={...createPenaltyShootout(home,away,'user',seed),firstSide:0};
    const attempts=PENALTY_TARGETS.map(target=>takePenalty(shootout,home,away,target.id).kicks[0]);
    if(new Set(attempts.map(k=>k.outcome)).size>1)differentShots++;
    assert.equal(new Set(attempts.map(k=>k.dive)).size,1);
    const defending={...shootout,firstSide:1};
    const automatic=takePenalty(defending,home,away,null);
    assert.deepEqual(automatic,takePenalty(defending,home,away,null));
    assert.equal(automatic.kicks.length,1);
    assert.throws(()=>takePenalty(defending,home,away,'left'),/automática/);
  }
  assert.ok(differentShots>40);
  assert.deepEqual(PENALTY_TARGETS.map(target=>target.id),['left','right']);
});

test('a saved shootout resumes deterministically without repeating kicks or resetting its score',()=>{
  let live=createPenaltyShootout(home,away,'user',91);
  const play=s=>takePenalty(s,home,away,penaltyTurn(s,home,away).attacking?'right':null);
  for(let i=0;i<3;i++)live=play(live);
  let restored=JSON.parse(JSON.stringify(live));
  const seen=new Set();
  for(let i=0;!live.complete&&i<100;i++){
    const turn=penaltyTurn(live,home,away);
    if(turn.number<=5){const key=turn.side+':'+turn.player.id;assert.ok(!seen.has(key));seen.add(key);}
    live=play(live);restored=play(restored);assert.deepEqual(restored,live);
  }
  assert.ok(live.complete);
  assert.equal(takePenalty(live,home,away,'top-left'),live);
  assert.equal(live.winnerId,live.scores[0]>live.scores[1]?home.id:away.id);
  assert.throws(()=>takePenalty({...createPenaltyShootout(home,away,'user',1),firstSide:0},home,away,'center'),/canto válido/);
});

function finalState(mode){
  for(let seed=1;seed<150;seed++){
    const t=createTournament(home,allSquads,{mode,seed});
    const opponent=t.teams.find(team=>team.id!=='user');
    const fixture={id:'interactive-final',stage:'final',stageLabel:'Final',round:7,homeId:'user',awayId:opponent.id,neutral:true,result:null,...(mode==='world-cup'?{}:{tieId:'final-tie',leg:1})};
    Object.assign(t,{teams:[t.teams.find(team=>team.id==='user'),opponent],groups:[],matches:[fixture],userMatches:[],progressRound:6,
      bracket:[{stage:'final',matches:[fixture],...(mode==='world-cup'?{}:{ties:[{id:'final-tie',teamIds:['user',opponent.id],matchIds:[fixture.id],winnerId:null,aggregate:null}]})}]});
    const state={screen:'match',mode,matchMinute:0,matchSpeed:4,...prepareUserRound(t)};
    if(currentMatch(state).result.penalties)return state;
  }
  throw Error('No penalty final found for '+mode);
}

function reversePlayedWinner(state){
  const match=currentMatch(state),home=state.tournament.teams.find(t=>t.id===match.homeId),away=state.tournament.teams.find(t=>t.id===match.awayId);
  const originalWinner=match.result.winnerId,winningSide=originalWinner===home.id?1:0;
  const shootout=ensurePenaltyShootout(state);
  Object.assign(shootout,{kicks:Array.from({length:6},(_,i)=>({side:i%2,converted:i%2===winningSide,player:(i%2?away:home).lineup[i%3].player,target:'right',dive:'left',outcome:i%2===winningSide?'goal':'saved'})),scores:winningSide?[0,3]:[3,0],complete:true,winnerId:winningSide?away.id:home.id});
  return shootout.winnerId;
}

test('two direct shot buttons sit below the pitch and wait during the automatic opponent turn',()=>{
  const state=finalState('world-cup'),match=currentMatch(state),shootout=ensurePenaltyShootout(state);
  state.matchMinute=match.result.duration;shootout.firstSide=0;
  let html=renderMatch(state);
  const buttons=()=>html.match(/<button[^>]*data-action="penalty-shoot"[^>]*>/g)||[];
  assert.equal(buttons().length,2);
  assert.ok(buttons().every(button=>!button.includes('disabled')));
  assert.ok(html.includes('Cobrar para a esquerda')&&html.includes('Cobrar para a direita'));
  assert.ok(html.indexOf('penalty-directions')>html.indexOf('penalty-feedback'));
  assert.ok(!/Defender cobrança|Pular à|Alto|Baixo|penalty-targets|penalty-confirm|Bater pênalti/.test(html));
  shootout.firstSide=1;html=renderMatch(state);
  assert.equal(buttons().length,2);
  assert.ok(html.includes('vai cobrar automaticamente'));
  assert.ok(buttons().every(button=>button.includes('disabled')));
});

for(const mode of ['world-cup','champions','copa-do-brasil'])test(mode+': interactive winner replaces the simulated winner in the final, campaign and history',()=>{
  const state=finalState(mode),original=structuredClone(state.tournament),match=currentMatch(state);
  ensurePenaltyShootout(state);state.matchMinute=match.result.duration;
  assert.equal(commitUserRound(state),false);
  assert.notEqual(nextFixturePreview(state).kind,'complete');
  let html=renderMatch(state);
  assert.ok(html.includes('Disputa interativa de pênaltis'));
  assert.ok(html.match(/<button[^>]*data-action="next-match"[^>]*>/)[0].includes('disabled'));
  assert.ok(!html.includes(`<b>${match.result.penalties.join(' – ')}</b>`));
  const winner=reversePlayedWinner(state),goals=[match.result.homeGoals,match.result.awayGoals];
  const restored=JSON.parse(JSON.stringify(state));
  assert.equal(finishPenaltyShootout(restored),true);
  assert.equal(restored.tournament.championId,winner);
  assert.equal(restored.tournament.campaign.champion,winner==='user');
  const played=currentMatch(restored);
  assert.deepEqual([played.result.homeGoals,played.result.awayGoals],goals);
  assert.equal(played.result.winnerId,winner);
  assert.equal(played.result.events.filter(e=>e.shootout).length,6);
  assert.deepEqual(state.tournament,original);
  html=renderMatch(restored);assert.ok(!html.match(/<button[^>]*data-action="next-match"[^>]*>/)[0].includes('disabled'));
  assert.equal(ensurePenaltyShootout(restored),null);
});

test('a changed return-leg shootout updates future qualifiers while keeping all other played results',()=>{
  let state;
  for(let seed=1;seed<150;seed++){
    const first=prepareUserRound(createTournament(home,allSquads,{mode:'copa-do-brasil',seed}));
    const next={screen:'match',mode:'copa-do-brasil',matchMinute:0,...prepareUserRound(first.pendingRound)};
    if(currentMatch(next).leg===2&&currentMatch(next).result.penalties){state=next;break;}
  }
  assert.ok(state);const match=currentMatch(state),before=structuredClone(state.pendingRound);
  state.matchMinute=match.result.duration;
  const winner=reversePlayedWinner(state);assert.equal(finishPenaltyShootout(state),true);
  const tie=state.tournament.bracket[0].ties.find(tie=>tie.id===match.tieId);
  assert.equal(tie.winnerId,winner);assert.equal(state.tournament.campaign.eliminated,winner!=='user');
  for(const fixture of before.matches.filter(m=>m.result&&m.id!==match.id))assert.deepEqual(state.tournament.matches.find(m=>m.id===fixture.id).result,fixture.result);
  if(winner==='user')assert.ok(state.tournament.matches.some(m=>m.round>match.round&&[m.homeId,m.awayId].includes('user')));
});
