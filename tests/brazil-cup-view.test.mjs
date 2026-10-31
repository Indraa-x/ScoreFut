import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/clubs.js';
import {BRAZIL_CUP_CLUB_IDS} from '../data/competitions.js';
import {squadTeam,createTournament,playNextRound,simulateTournament} from '../js/engine.js';
import {prepareUserRound} from '../js/match-session.js';
import {championsBracket} from '../js/champions-view.js';
import {renderBracket,renderChampionsTie,renderResult} from '../js/ui.js';

const user={...squadTeam(allSquads[0]),id:'user',clubId:'user',name:'Meu time'};
const make=(seed=39,options={})=>createTournament(user,allSquads,{mode:'copa-do-brasil',seed,...options});
const stateFor=t=>({screen:'bracket',mode:t.mode,tournament:t});

test('Brazil uses only the knockout tree and keeps the quarterfinal redraw private until committed',()=>{
  const initial=make(),before=structuredClone(initial),pending=prepareUserRound(initial);
  const rounds=championsBracket(initial),html=renderBracket({...stateFor(initial),pendingRound:pending.pendingRound});
  assert.deepEqual(rounds.map(round=>round.length),[8,4,2,1]);
  assert.ok(rounds[0].every(node=>node.known && node.scores.every(score=>score===null)));
  assert.ok(rounds[1].every(node=>!node.known && node.entries.every(entry=>!entry.id && entry.label==='Sorteio das quartas')));
  assert.ok(html.includes('Confrontos a definir'));
  assert.ok(html.includes('brazil-cup-trophy.png'));
  assert.ok(!html.includes('champions-group-picker'));
  assert.ok(!html.includes('champions-phase-picker'));
  assert.equal((html.match(/data-action="champions-tie"/g)||[]).length,8);
  assert.equal((html.match(/<path class=/g)||[]).length,6,'no first-round connector promises an opponent before the redraw');
  const details=renderChampionsTie(initial,rounds[0][0].id);
  assert.equal((details.match(/A disputar/g)||[]).length,2);
  assert.equal(renderChampionsTie(initial,rounds[1][0].id),'');
  assert.deepEqual(initial,before);
});

test('Brazil connectors follow the real quarterfinal draw, aggregates and champion without changing the tournament',()=>{
  for(const seed of [11,39,83]){
    let t=playNextRound(playNextRound(make(seed)));
    const rounds=championsBracket(t),before=structuredClone(t);
    const native=t.bracket.find(stage=>stage.stage==='round16').ties;
    assert.equal(new Set(rounds[0].map(node=>node.id)).size,8);
    assert.ok(rounds[0].some((node,index)=>node.id!==native[index].id),'exercise the redrawn first-round layout');
    for(let index=0;index<rounds[1].length;index++){
      assert.deepEqual(rounds[0].slice(index*2,index*2+2).map(node=>node.winnerId),rounds[1][index].entries.map(entry=>entry.id));
    }
    assert.deepEqual(t,before);
    t=simulateTournament(t);
    const completed=championsBracket(t),snapshot=structuredClone(t),html=renderBracket(stateFor(t));
    for(let stage=0;stage<completed.length-1;stage++)for(let i=0;i<completed[stage+1].length;i++){
      assert.deepEqual(new Set(completed[stage].slice(i*2,i*2+2).map(node=>node.winnerId)),new Set(completed[stage+1][i].entries.map(entry=>entry.id)));
    }
    for(const node of completed.flat()){
      const actual=t.bracket.find(stage=>stage.stage===node.stage).ties.find(tie=>tie.id===node.id);
      assert.deepEqual(node.scores,actual.aggregate);
      const details=renderChampionsTie(t,node.id);
      for(const game of node.games){
        assert.ok(details.includes(`${game.result.homeGoals} – ${game.result.awayGoals}`));
        for(const [side,id] of [['home',game.homeId],['away',game.awayId]]){
          const team=t.teams.find(team=>team.id===id),era=id===t.userTeamId?'Elenco montado':String(team.ano);
          assert.ok(details.includes(`tie-fixture-${side}"><small class="tie-fixture-era">${era}</small>`));
        }
      }
      if(node.penalties)assert.ok(details.includes(node.penalties.join(' – ')));
    }
    assert.equal((html.match(/data-action="champions-tie"/g)||[]).length,15);
    assert.equal((html.match(/class="winning-path"/g)||[]).length,3);
    assert.equal(completed.at(-1)[0].winnerId,t.championId);
    assert.deepEqual(t,snapshot);
  }
});

test('Brazil direct qualifiers and smaller fields display real rounds without phantom fixtures',()=>{
  const excluded=allSquads.filter(s=>s.clubId==='flamengo').map(s=>s.id);
  const t=make(11,{excludeSquadIds:excluded}),bye=t.bracket[0].ties.find(tie=>tie.bye),before=structuredClone(t);
  const html=renderBracket(stateFor(t)),details=renderChampionsTie(t,bye.id);
  assert.ok(html.includes('tie-bye'));
  assert.ok(details.includes('Classificação direta'));
  assert.ok(!details.includes('A disputar'));
  assert.deepEqual(t,before);
  assert.equal(simulateTournament(t).matches.length,27);
  for(const count of [1,3,7]){
    const pool=allSquads.filter(s=>BRAZIL_CUP_CLUB_IDS.slice(0,count).includes(s.clubId));
    const small=createTournament(user,pool,{mode:'copa-do-brasil',seed:11});
    const rounds=championsBracket(small),view=renderBracket(stateFor(small));
    assert.deepEqual(rounds.map(round=>round[0].stage),small.cupStages);
    assert.equal((view.match(/data-action="champions-round"/g)||[]).length,small.cupStages.length);
    assert.equal(rounds.at(-1).length,1);
    assert.ok(!view.includes('stage-round16'));
  }
});

test('Brazil result screen keeps the completed competition available for review',()=>{
  const t=simulateTournament(make()),record={id:'cup-review',mode:t.mode,teamName:'Meu time',champion:false,strength:85,stageLabel:'Oitavas de final',goalsFor:1,goalsAgainst:2,played:2};
  assert.ok(renderResult(record,t).includes('Ver competição'));
});
