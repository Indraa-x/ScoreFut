import test from 'node:test';
import assert from 'node:assert/strict';
import { allSquads } from '../data/clubs.js';
import { squadTeam, createTournament } from '../js/engine.js';
import { renderMatch, renderBracket } from '../js/ui.js';
import { prepareUserRound, currentMatch, commitUserRound } from '../js/match-session.js';

const home = { ...squadTeam(allSquads[0]), id:'user', name:'Meu time' };
const view = (overrides = {}) => ({
  screen:'match', mode:'champions', formation:home.formation, matchMinute:0, matchPlaying:false, matchSpeed:1,
  ...prepareUserRound(createTournament(home, allSquads, {mode:'champions',seed:39})), ...overrides,
});
const score = html => html.match(/class="score-numbers"[^>]*>(.*?)<\/div>/s)[1].replace(/<[^>]*>/g,'');

test('the match screen shows 22 numbered circles, a real calendar and speed controls without incident or statistics panels',()=>{
  const state=view(), html=renderMatch(state), match=currentMatch(state);
  assert.equal(score(html),'0–0');
  assert.equal((html.match(/data-match-player /g)||[]).length,22);
  for(const marker of html.matchAll(/<span class="match-player [^>]+>(.*?)<\/span>/g))assert.ok(!/<svg|<small/.test(marker[1]));
  assert.ok(html.includes('data-match-goals'));
  assert.ok(html.includes('Próximo jogo'));
  assert.ok(html.includes('Gols da partida'));
  assert.ok(html.includes('match-field-legend'));
  assert.ok(!html.includes('Ver próximos jogos'));
  for(const label of ['Normal','Rápido'])assert.ok(html.includes(label));
  assert.ok(!/Muito rápido|Ritmo da partida|<small>[148]×<\/small>/.test(html));
  assert.ok(html.indexOf('data-live-pitch')<html.indexOf('data-match-goals'));
  assert.ok(!html.includes('Confronto a definir'));
  assert.ok(html.includes('assets/competitions/champions-league.png'));
  assert.ok(!/Estatísticas|Lances|Escanteios|Cartões|match-statistics|match-feed|campaign-strip/.test(html));
  assert.equal((html.match(/data-action="match-speed"/g)||[]).length,2);
  for(const [speed,label]of [[4,'Normal'],[8,'Rápido']])assert.ok(html.includes('data-value="'+speed+'" aria-label="'+label+'"'));
  const future=state.tournament.matches.filter(m=>m.round>match.round&&[m.homeId,m.awayId].includes('user'));
  for(const fixture of future){
    const opponent=state.tournament.teams.find(team=>team.id===(fixture.homeId==='user'?fixture.awayId:fixture.homeId));
    assert.ok(html.includes(opponent.name.replace(/ \d{4}$/,'')));
    assert.equal(fixture.result,null);
  }
  assert.ok(html.includes('Próxima partida'));
  assert.ok(!/Assistir|Pausar|Pausada|Apito final|data-action="play"|data-action="skip"|Chaveamento/.test(html));
  const advance=html.match(/<button[^>]*data-action="next-match"[^>]*>/)[0];
  assert.ok(advance.includes('disabled'));
  assert.ok(html.indexOf(advance)<html.indexOf('class="match-layout"'));
  assert.ok(!/match-timeline|live-progress|data-match-end-time|Progresso da partida/.test(html));
  assert.ok(!renderBracket(state).includes('resultados ainda não reproduzidos'));
  assert.equal(state.tournament.groups[0].standings[0].played,0);
});

test('both cups expose only normal and fast, with a lightning icon only on active fast',()=>{
  for(const mode of ['champions','copa-do-brasil'])for(const matchSpeed of [undefined,1,4,8]){
    const state={...view(),mode,matchSpeed,...prepareUserRound(createTournament(home,allSquads,{mode,seed:39}))};
    const html=renderMatch(state),controls=html.match(/<div class="match-speed"[\s\S]*?<\/section>/)[0];
    const buttons=[...controls.matchAll(/<button[^>]*data-action="match-speed"[^>]*>[\s\S]*?<\/button>/g)].map(match=>match[0]);
    assert.equal(buttons.length,2);
    assert.equal(buttons[0].includes('aria-pressed="true"'),matchSpeed!==8);
    assert.equal(buttons[1].includes('aria-pressed="true"'),matchSpeed===8);
    assert.equal(buttons[1].includes('<svg'),matchSpeed===8);
    assert.ok(!buttons[0].includes('<svg'));
    assert.ok(!/Ritmo da partida|Muito rápido|[148][×x]/.test(controls));
  }
});

test('fractional minutes show seconds and reveal only goals already reached',()=>{
  const state=view({matchMinute:15.5}), match=currentMatch(state), away=state.tournament.teams.find(team=>team.id===match.awayId);
  match.result.events=[
    {minute:12,type:'goal',team:'away',player:away.lineup[0].player,x:.5,y:.8},
    {minute:70,type:'goal',team:'home',player:home.lineup[0].player,x:.5,y:.2},
  ];
  match.result.homeGoals=1;match.result.awayGoals=1;
  const html=renderMatch(state);
  assert.equal(score(html),'0–1');
  assert.ok(html.includes('15:30'));
  assert.ok(!html.includes('70′'));
  const goals=html.match(/data-match-goals[^>]*>(.*?)<\/section>/s)[1];
  assert.ok(goals.includes(away.lineup[0].player.nome));
  assert.ok(!goals.includes(home.lineup[0].player.nome));
});

test('a compact added-time badge precedes the clock, including after the final whistle',()=>{
  const state=view(),match=currentMatch(state);
  Object.assign(match.result,{duration:95,extraTime:false,regulationStoppageTime:5});
  for(const minute of [89,90,95]){
    state.matchMinute=minute;
    const html=renderMatch(state),badge=html.match(/<span class="match-added-time"[^>]*>(.*?)<\/span>/);
    assert.ok(badge);
    assert.equal(badge[0].includes(' hidden'),minute<90);
    if(minute>=90){assert.equal(badge[1],'+5');assert.ok(badge[0].includes('aria-label="5 minutos de acréscimo"'));}
    assert.ok(html.indexOf(badge[0])<html.indexOf('class="score-clock"'));
  }
  Object.assign(match.result,{extraTime:true,extraTimeStart:95,extraTimeEnd:125,extraTimeStoppageTime:7,duration:132});
  for(const [minute,hidden,label] of [[95,true,'+0'],[125,false,'+7'],[132,false,'+7']]){
    state.matchMinute=minute;
    const badge=renderMatch(state).match(/<span class="match-added-time"[^>]*>(.*?)<\/span>/);
    assert.equal(badge[0].includes(' hidden'),hidden);assert.equal(badge[1],label);
  }
});

test('the result clearly reports victory, draw or defeat from the user perspective, even when playing away',()=>{
  for(const winning of ['user','opponent',null]){
    const state=view({matchMinute:90}),match=currentMatch(state);
    const opponent=match.homeId==='user'?match.awayId:match.homeId;
    match.homeId=opponent;match.awayId='user';
    const winnerId=winning==='user'?'user':winning==='opponent'?opponent:null;
    match.result={...match.result,duration:90,homeGoals:winning==='opponent'?2:0,awayGoals:winning==='user'?2:0,winnerId,penalties:null,events:[]};
    const html=renderMatch(state),status=html.match(/class="match-status [^"]*"[^>]*>(.*?)<\/span>/s)[1];
    assert.ok(status.includes(winning==='user'?'Vitória':winning==='opponent'?'Derrota':'Empate'));
    const markers=[...html.matchAll(/class="match-player (home|away)"[^>]*--kit:([^;]+);/g)];
    assert.ok(markers.filter(([,side])=>side==='away').some(([, ,color])=>color==='#13754b'));
    assert.ok(markers.filter(([,side])=>side==='home').some(([, ,color])=>color==='#3169b8'));
  }
});

test('knockout calendars and bracket accept undetermined results and advance only after the match ends',()=>{
  let state=view();
  for(let i=0;i<3;i++){
    state.matchMinute=currentMatch(state).result.duration;
    commitUserRound(state);
    if(i<2)Object.assign(state,prepareUserRound(state.tournament),{matchMinute:0});
  }
  assert.equal(state.tournament.progressRound,3);
  assert.ok(state.tournament.bracket[0].matches.every(m=>m.result===null));
  assert.doesNotThrow(()=>renderBracket(state));
  assert.ok(renderBracket(state).includes('—'));
  if(!state.tournament.campaign.eliminated){
    const html=renderMatch(state);
    assert.ok(html.includes('Oitavas de final'));
    assert.ok(!html.includes('Quartas de final'));
    assert.ok(html.includes('Próxima etapa'));
    assert.ok(!html.match(/<button[^>]*data-action="next-match"[^>]*>/)[0].includes('disabled'));
  }
});

test('the final displays shootout scores separately without a fictitious next stage',()=>{
  const state=view({matchMinute:120}), match=currentMatch(state);
  match.stage='final';match.stageLabel='Final';
  match.result={events:[],duration:120,penalties:[3,4],extraTime:true,homeGoals:1,awayGoals:1};
  state.tournament.matches=[];
  const html=renderMatch(state);
  assert.equal(score(html),'1–1');
  assert.ok(html.includes('Pênaltis <b>3 – 4</b>'));
  assert.ok(html.includes('Decidida nos pênaltis'));
  assert.ok(!html.includes('Confronto a definir'));
});
