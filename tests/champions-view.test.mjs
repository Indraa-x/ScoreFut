import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/clubs.js';
import {squadTeam,createTournament,playNextRound,simulateTournament} from '../js/engine.js';
import {prepareUserRound,currentMatch,commitUserRound} from '../js/match-session.js';
import {championsGroup,championsBracket} from '../js/champions-view.js';
import {renderMatch,renderBracket,renderChampionsTie} from '../js/ui.js';

const user={...squadTeam(allSquads[0]),id:'user',clubId:'user',name:'Meu time'};
const make=seed=>createTournament(user,allSquads,{mode:'champions',seed});
const advance=(t,rounds)=>{for(let i=0;i<rounds;i++)t=playNextRound(t);return t;};
const stateFor=t=>({screen:'match',mode:'champions',formation:user.formation,matchMinute:0,matchSpeed:1,userMatchIndex:Math.max(0,t.userMatches.length-1),tournament:t});

test('group standings show the user group and real W/D/L, goal totals, points and recent form',()=>{
  const t=advance(make(83),2),before=structuredClone(t),group=championsGroup(t);
  assert.ok(group.teamIds.includes('user'));assert.equal(group.complete,false);assert.equal(group.rounds,3);
  for(const row of group.standings){
    assert.equal(row.form.length,2);assert.equal(row.played,2);
    assert.equal(row.wins,row.form.filter(game=>game.outcome==='V').length);
    assert.equal(row.draws,row.form.filter(game=>game.outcome==='E').length);
    assert.equal(row.losses,row.form.filter(game=>game.outcome==='D').length);
    assert.equal(row.points,row.wins*3+row.draws);
    assert.equal(row.goalsFor,row.form.reduce((sum,game)=>sum+game.goals,0));
    assert.equal(row.goalsAgainst,row.form.reduce((sum,game)=>sum+game.against,0));
    assert.equal(row.goalDifference,row.goalsFor-row.goalsAgainst);
  }
  const html=renderBracket({...stateFor(t),championsView:'groups'});
  assert.ok(html.includes('Seu grupo'));assert.ok(html.includes('aria-label="Tabela completa do Grupo A"'));
  for(const label of ['Jogos','Vitórias','Empates','Derrotas','Gols marcados e sofridos','Saldo de gols','Pontos','Forma'])assert.ok(html.includes(label),label);
  assert.equal((html.match(/data-action="champions-group"/g)||[]).length,8);
  const other=renderBracket({...stateFor(t),championsView:'groups',championsGroupId:'B'});
  assert.ok(other.includes('Tabela completa do Grupo B'));
  assert.deepEqual(t,before);
});

test('the match sidebar shows the group table without a full-standings button or pending round results',()=>{
  const session={...stateFor(make(83)),...prepareUserRound(make(83))},before=structuredClone(session.tournament);
  assert.equal(championsGroup(session.tournament).standings.reduce((sum,row)=>sum+row.played,0),0);
  const html=renderMatch(session);
  assert.ok(html.includes('Seu grupo na Champions'));assert.ok(!html.includes('Ver classificação completa'));
  assert.ok(html.includes('champions-sidebar-group'));
  const table=html.match(/<table class="champions-table compact"[\s\S]*?<\/table>/)[0];
  assert.equal((table.match(/scope="row"/g)||[]).length,4);
  assert.equal((table.match(/class="champions-rank"/g)||[]).length,4);
  assert.equal((table.match(/<small>/g)||[]).length,4);
  assert.ok(table.includes('title="Pontos">PTS'));
  assert.ok(table.includes('<small>Seu time</small>'));
  for(const id of championsGroup(session.tournament).teamIds.filter(id=>id!=='user')){
    const team=session.tournament.teams.find(team=>team.id===id);
    assert.ok(table.includes('<small>Temporada '+team.ano+'</small>'));
  }
  assert.ok(!html.includes('champions-sidebar-footer'));
  assert.ok(!html.includes('champions-sidebar-tie'));
  assert.ok(championsBracket(session.tournament).flat().every(node=>node.entries.every(entry=>!entry.id)&&node.scores.every(score=>score===null)));
  assert.deepEqual(session.tournament,before);
  session.matchMinute=currentMatch(session).result.duration;assert.equal(commitUserRound(session),true);
  assert.equal(championsGroup(session.tournament).standings.reduce((sum,row)=>sum+row.played,0),4);
  assert.equal(championsGroup(session.tournament).standings.reduce((sum,row)=>sum+row.form.length,0),4);
});

test('the complete 16-team tree preserves the actual draw, bracket halves and unknown future opponents',()=>{
  const t=advance(make(83),3),before=structuredClone(t),rounds=championsBracket(t);
  assert.deepEqual(rounds.map(round=>round.length),[8,4,2,1]);
  for(let i=0;i<8;i++)assert.deepEqual(rounds[0][i].entries.map(entry=>entry.id),t.bracket[0].ties[i].teamIds);
  assert.ok(rounds[0].every(node=>node.scores.every(score=>score===null)&&node.games.length===2));
  assert.deepEqual(rounds[1][0].entries.map(entry=>entry.label),['Vencedor O1','Vencedor O2']);
  assert.deepEqual(rounds[1][2].entries.map(entry=>entry.label),['Vencedor O5','Vencedor O6']);
  assert.deepEqual(rounds[3][0].entries.map(entry=>entry.label),['Vencedor S1','Vencedor S2']);
  const html=renderBracket({...stateFor(t),championsView:'knockout'});
  assert.ok(html.includes('champions-tree-lines'));assert.ok(html.includes('champions-mobile-bracket'));
  assert.equal((html.match(/data-action="champions-round"/g)||[]).length,4);
  assert.ok(html.includes('Ida e volta'));assert.ok(html.includes('Final única'));
  const details=renderChampionsTie(t,rounds[0][0].id);
  assert.ok(details.includes('Ida ·'));assert.ok(details.includes('Volta ·'));
  assert.equal((details.match(/A disputar/g)||[]).length,2);assert.ok(!details.includes('Classificado:'));
  assert.deepEqual(t,before);
});

test('finished ties show oriented aggregate scores, the correct qualifier and the winning club in the final',()=>{
  const t=simulateTournament(make(83)),before=structuredClone(t),rounds=championsBracket(t);
  for(const node of rounds.flat()){
    assert.ok(node.known);assert.ok(node.winnerId);
    const actual=t.bracket.find(stage=>stage.stage===node.stage).ties[node.index];
    assert.equal(node.winnerId,actual.winnerId);assert.deepEqual(node.scores,actual.aggregate);
    const details=renderChampionsTie(t,node.id);
    for(const game of node.games)assert.ok(details.includes(`${game.result.homeGoals} – ${game.result.awayGoals}`));
    if(node.penalties)assert.ok(details.includes(node.penalties.join(' – ')));
    assert.ok(details.includes(node.stage==='final'?'Campeão:':'Classificado:'));
  }
  const html=renderBracket({...stateFor(t),championsView:'knockout'});
  assert.ok(html.includes('CAMPEÃO'));assert.ok(html.includes('champions-mobile-winner'));
  assert.equal(rounds[3][0].winnerId,t.championId);
  assert.equal(renderChampionsTie(t,'unknown'), '');
  assert.deepEqual(t,before);
});

test('the next game replaces the group card only after the last group result is committed',()=>{
  let qualifiedSeed;
  for(let seed=1;seed<=20;seed++){if(!advance(make(seed),3).campaign.eliminated){qualifiedSeed=seed;break;}}
  assert.ok(qualifiedSeed);
  const t=advance(make(qualifiedSeed),2),s={...stateFor(t),...prepareUserRound(t)};
  assert.equal(currentMatch(s).stage,'group');
  const before=renderMatch(s);
  assert.ok(before.includes('champions-sidebar-group'));
  assert.ok(!before.includes('Próximo jogo'));
  s.matchMinute=currentMatch(s).result.duration;
  assert.equal(commitUserRound(s),true);
  const finishedGroups=renderMatch(s);
  assert.ok(!finishedGroups.includes('champions-sidebar'));
  assert.ok(finishedGroups.includes('champions-next-game'));
  assert.equal((finishedGroups.match(/aria-label="Próximo jogo"/g)||[]).length,1);
  assert.equal((finishedGroups.match(/class="upcoming-game"/g)||[]).length,1);
  assert.ok(finishedGroups.indexOf('champions-next-game')<finishedGroups.indexOf('data-match-goals'));
  Object.assign(s,prepareUserRound(s.tournament),{matchMinute:0});
  assert.equal(currentMatch(s).stage,'round16');
  const knockout=renderMatch(s);
  assert.ok(knockout.includes('champions-next-game'));
  assert.ok(!/Mata-mata da Champions|Ver chaveamento|classificação final|champions-sidebar/.test(knockout));
  const other=renderMatch({...s,mode:'cup',tournament:{...s.tournament,mode:'cup'}});
  assert.ok(!other.includes('champions-sidebar'));
  assert.ok(other.includes('Próximo jogo'));
});
