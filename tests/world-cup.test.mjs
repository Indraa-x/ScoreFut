import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {worldCupNations,worldCupSquads,allSquads,validateData} from '../data/game-squads.js';
import {squadsForMode} from '../data/competitions.js';
import {CLUB_LOGOS} from '../data/club-logos.js';
import {FORMATIONS,squadTeam,calculateTeam,createTournament,playNextRound,simulateTournament} from '../js/engine.js';
import {WORLD_CUP_PENDING_PAIRS,worldCupGroupOrder,worldCupRound16Pairings} from '../js/world-cup.js';
import {createDraft,drawSquad,confirmPick,automaticSlot,refreshDraftRatings} from '../js/draft.js';
import {applyWorldCupRatingReview} from '../data/world-cup-ratings.js';
import {prepareUserRound,commitUserRound,currentMatch} from '../js/match-session.js';
import {renderHome,renderSetup,renderDraft,renderMatch,renderBracket,renderResult} from '../js/ui.js';
import {championsBracket} from '../js/champions-view.js';
import {clubs} from '../data/clubs.js';
import {achievementsFor} from '../js/achievements.js';

const candidateTeams=new Map(worldCupSquads.map(squad=>[squad.id,squadTeam(squad)]));
const user={...candidateTeams.get('nation-brazil-1970'),id:'user',clubId:'user',name:'Meu time'};
const make=(seed=14,extra={})=>createTournament(user,allSquads,{mode:'world-cup',seed,candidateTeams,...extra});

test('World Cup provides 32 nations, 155 real eras, unique identities and eleven compatible players per XI',()=>{
 assert.equal(worldCupNations.length,32);assert.equal(worldCupSquads.length,155);
 assert.ok(validateData().valid,validateData().errors.join('\n'));
 assert.deepEqual(worldCupNations.find(n=>n.id==='nation-brazil').eras,[1958,1962,1970,1994,2002]);
 assert.deepEqual(worldCupNations.find(n=>n.id==='nation-senegal').eras,[2002,2018,2022]);
 assert.deepEqual(worldCupNations.find(n=>n.id==='nation-ghana').eras,[2006,2010,2014,2022]);
 const identities=new Map();
 for(const nation of worldCupNations){assert.ok(nation.eras.length>=1&&nation.eras.length<=5);assert.ok(fs.existsSync(CLUB_LOGOS[nation.id]));}
 for(const squad of worldCupSquads){
  assert.ok(squad.ano===1930||squad.ano===1934||squad.ano===1938||squad.ano>=1950&&(squad.ano-1950)%4===0);
  assert.equal(squad.jogadores.length,11);assert.equal(candidateTeams.get(squad.id).lineup.length,11);
  for(const p of squad.jogadores){
   if(identities.has(p.id))assert.equal(identities.get(p.id),p.worldCupPlayerId,p.id);
   identities.set(p.id,p.worldCupPlayerId);
   const age=squad.ano-Number(p.birthDate.slice(0,4));assert.ok(age>=15&&age<=45,squad.id+'/'+p.id);
  }
 }
 assert.equal(squadsForMode(allSquads,'world-cup').length,155);
 assert.equal(squadsForMode(allSquads,'champions').length,140);
 assert.equal(squadsForMode(allSquads,'copa-do-brasil').length,75);
});
test('World Cup OVRs identify the exact released FIFA edition and explicitly distinguish historical estimates',()=>{
 for(const squad of worldCupSquads)for(const p of squad.jogadores){
  assert.equal(squad.ratingYear,squad.ano);
  if(p.ratingKind==='release-rating'){
   assert.equal(p.releaseRating.releaseYear,squad.ano);assert.equal(p.ratingEdition,'FIFA '+String(squad.ano+1).slice(-2));
   assert.equal(p.releaseRating.ovr,p.ovr);assert.ok(p.ratingSource.startsWith('https://'));
  }else if(p.ratingKind==='creator-review'){
   assert.equal(p.creatorReview.squadId,squad.id);assert.equal(p.creatorReview.playerId,p.id);
   assert.equal(p.creatorReview.ovr,p.ovr);assert.ok(['data/world-cup-ratings.js','data/imported-ovr-review.js'].includes(p.ratingSource));
  }else{assert.equal(p.ratingKind,'editorial-estimate');assert.match(p.ratingReason,/Estimativa/);}
  if(squad.ano<1993)assert.equal(p.ratingExpectedEdition,null);
 }
 const player=(s,id)=>worldCupSquads.find(x=>x.id===s).jogadores.find(x=>x.eaId===id);
 assert.equal(player('nation-spain-2010',5479).ovr,89);
 assert.equal(player('nation-argentina-2022',158023).ovr,91);
 assert.equal(player('nation-cameroon-2010',9676).ovr,84);
 const brazil94=worldCupSquads.find(s=>s.id==='nation-brazil-1994').jogadores;
 assert.equal(brazil94.find(p=>p.nome==='Romário').ovr,94);
 assert.equal(brazil94.find(p=>p.nome==='Bebeto').ovr,91);
});
test('Hungary 1954 and Germany 1974 keep earlier reductions, adopt the newer star OVRs and refresh saved picks',()=>{
 const cases=[
  {id:'nation-hungary-1954',before:91.2,stars:{'ferenc-puskas':95,'sandor-kocsis':95}},
  {id:'nation-germany-1974',before:90.9,stars:{'franz-beckenbauer':94,'gerd-muller':95}},
 ];
 for(const item of cases){
  const squad=worldCupSquads.find(s=>s.id===item.id),team=squadTeam(squad);
  assert.equal(team.strength.overall,88.3);assert.equal(squad.jogadores.reduce((sum,p)=>sum+p.ovr,0),971);
  for(const [id,ovr]of Object.entries(item.stars))assert.equal(squad.jogadores.find(p=>p.id===id).ovr,ovr);
  for(const p of squad.jogadores){
   assert.deepEqual(applyWorldCupRatingReview(p,item.id),p);
   assert.ok(Object.values(p.atributos).every(value=>Number.isInteger(value)&&value>=1&&value<=99));
  }
  const draft={...createDraft(42,'2026-10-26','world-cup'),picks:team.lineup.map(pick=>({...pick,squadId:item.id,player:{...pick.player,ovr:pick.player.creatorReview?.previousOvr??pick.player.ovr}}))};
  const original=structuredClone(draft);assert.equal(calculateTeam(draft.picks).overall,item.before);
  const updated=refreshDraftRatings(draft,allSquads);
  assert.equal(calculateTeam(updated.picks).overall,88.3);assert.deepEqual(draft,original);
  assert.deepEqual({...updated,picks:[]},{...draft,picks:[]});
 }
 const unchanged=worldCupSquads.find(s=>s.id==='nation-hungary-1962').jogadores;
 assert.ok(unchanged.every(p=>p.ratingKind!=='creator-review'));
});

test('all eight formations can complete a national draft with four shared skips and no duplicate people',()=>{
 for(const formation of Object.keys(FORMATIONS))for(let seed=0;seed<8;seed++){
  let draft=createDraft(seed,'2026-10-26','world-cup');assert.equal(draft.rerolls,4);
  for(let round=0;round<11;round++){
   draft=drawSquad(draft,worldCupSquads,formation);
   const squad=worldCupSquads.find(x=>x.id===draft.currentSquadId);
   const p=squad.jogadores.find(p=>!draft.picks.some(pick=>pick.player.id===p.id)&&automaticSlot(draft,formation,p));
   assert.ok(p,formation+'/'+seed+'/'+round);draft=confirmPick(draft,worldCupSquads,formation,p.id);
  }
  assert.equal(draft.picks.length,11);assert.equal(new Set(draft.picks.map(p=>p.player.id)).size,11);
 }
});
test('World Cup creates eight neutral groups without repeating a country, even when its eras were drafted',()=>{
 const excluded=worldCupSquads.filter(s=>s.clubId==='nation-senegal').map(s=>s.id);
 const t=make(17,{excludeSquadIds:excluded});
 assert.equal(t.teams.length,32);assert.equal(new Set(t.teams.map(team=>team.clubId)).size,32);
 assert.equal(t.groups.length,8);assert.equal(t.matches.length,48);assert.ok(t.matches.every(m=>m.neutral&&m.stage==='group'&&!m.result));
 for(const group of t.groups){const games=t.matches.filter(m=>m.groupId===group.id);assert.equal(games.length,6);assert.equal(new Set(games.map(m=>[m.homeId,m.awayId].sort().join(':'))).size,6);}
 assert.deepEqual(make(17,{excludeSquadIds:excluded}),t);
});
test('classic World Cup ties use overall goal difference before head-to-head, then direct results when overall figures match',()=>{
 const row=(id,diff)=>({teamId:id,points:6,goalDifference:diff,goalsFor:6});
 const matches=[{homeId:'a',awayId:'b',result:{homeGoals:1,awayGoals:0,events:[]}}];
 assert.deepEqual(worldCupGroupOrder([row('a',1),row('b',9)],matches,()=>1).map(x=>x.teamId),['b','a']);
 assert.deepEqual(worldCupGroupOrder([row('a',1),row('b',1)],matches,()=>1).map(x=>x.teamId),['a','b']);
});
test('three group rounds qualify exactly the top two of every group and preserve opposite bracket halves',()=>{
 const initial=make();let t=initial;for(let i=0;i<3;i++)t=playNextRound(t);
 assert.equal(initial.progressRound,0);assert.ok(initial.matches.every(m=>!m.result));
 assert.equal(t.groups.flatMap(g=>g.standings).filter(r=>r.qualified).length,16);
 assert.ok(t.groups.every(g=>g.standings[0].qualified&&g.standings[1].qualified&&!g.standings[2].qualified&&!g.standings[3].qualified));
 assert.equal(t.bracket[0].matches.length,8);assert.equal(t.matches.length,56);
 const pairs=worldCupRound16Pairings(t);assert.equal(new Set(pairs.flat()).size,16);
 for(const group of t.groups){const first=pairs.findIndex(pair=>pair.includes(group.standings[0].teamId));const second=pairs.findIndex(pair=>pair.includes(group.standings[1].teamId));assert.notEqual(first<4,second<4);}
 assert.deepEqual(WORLD_CUP_PENDING_PAIRS[0],['1º Grupo A','2º Grupo B']);
 assert.ok(t.matches.filter(m=>m.stage==='group').every(m=>!m.result.extraTime&&!m.result.penalties));
});
test('World Cup completes its title route in seven rounds, 63 single-leg neutral matches and resumable seeded results',()=>{
 for(let seed=1;seed<=8;seed++){
  const initial=make(seed),complete=simulateTournament(initial);
  assert.equal(complete.progressRound,7);assert.equal(complete.matches.length,63);assert.equal(complete.bracket.length,4);
  assert.ok(complete.matches.every(m=>m.neutral&&m.result));assert.ok(complete.bracket.every(stage=>!stage.ties));
  assert.equal(complete.matches.find(m=>m.stage==='final').result.winnerId,complete.championId);
  assert.ok(complete.userMatches.length>=3&&complete.userMatches.length<=7);
  const resumed=simulateTournament(JSON.parse(JSON.stringify(playNextRound(playNextRound(initial)))));assert.deepEqual(resumed,complete);
 }
});
test('the live group table and future knockout teams stay private until the final whistle',()=>{
 let state={mode:'world-cup',tournament:make(5),formation:'4-3-3',matchMinute:0,...prepareUserRound(make(5))};
 const group=state.tournament.groups.find(g=>g.teamIds.includes('user'));
 assert.ok(group.standings.every(r=>r.played===0));assert.equal(state.tournament.bracket.length,0);
 const html=renderMatch(state);assert.ok(html.includes('Copa do Mundo'));assert.ok(!html.includes('Melhores terceiros'));
 state.matchMinute=currentMatch(state).result.duration;assert.equal(commitUserRound(state),true);
 assert.ok(state.tournament.groups.find(g=>g.id===group.id).standings.every(r=>r.played===1));
 assert.equal(championsBracket(state.tournament)[0].length,8);
});
test('all competition surfaces use the supplied World Cup trophy and the matching title achievement',()=>{
 const home=renderHome({clubs,stats:{titles:0,best:'—',streak:0,winRate:0}}),setup=renderSetup({mode:'world-cup',formation:'4-3-3'});
 const draft=createDraft(17,'2026-10-26','world-cup'),draftHtml=renderDraft({mode:'world-cup',formation:'4-3-3',draft});
 let t=make(4);for(let i=0;i<3;i++)t=playNextRound(t);
 const bracket=renderBracket({mode:'world-cup',tournament:t,championsView:'knockout',championsRound:'round16'});
 const result=renderResult({id:'world-title',mode:'world-cup',champion:true,teamName:'Meu time',strength:90,goalsFor:15,goalsAgainst:3,played:7},null);
 assert.ok(home.includes('assets/competitions/world-cup-logo.png'));
 for(const html of [setup,bracket,result])assert.ok(html.includes('assets/competitions/world-cup-trophy.png'));
 for(const html of [home,setup,draftHtml,bracket,result])assert.doesNotMatch(html,/\bEuro\b|euro-logo|euro-trophy|Melhores terceiros/);
 assert.ok(setup.includes('32 seleções')||setup.includes('Copa do Mundo'));
 const trophy=achievementsFor([{mode:'world-cup',champion:true}]).find(a=>a.id==='world-cup-title');
 assert.equal(trophy.unlocked,true);assert.equal(trophy.name,'Campeão do mundo');
});
