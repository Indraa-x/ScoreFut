import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {euroNations,euroSquads,allSquads,validateData} from '../data/game-squads.js';
import {squadsForMode} from '../data/competitions.js';
import {CLUB_LOGOS} from '../data/club-logos.js';
import {FORMATIONS,squadTeam,createTournament,playNextRound,simulateTournament,hashSeed} from '../js/engine.js';
import {EURO_THIRD_COMBINATIONS,euroGroupOrder,euroThirdPlaceStandings,euroRound16Pairings} from '../js/euro.js';
import {createDraft,drawSquad,confirmPick,automaticSlot} from '../js/draft.js';
import {prepareUserRound,commitUserRound,currentMatch} from '../js/match-session.js';
import {renderHome,renderSetup,renderDraft,renderMatch,renderBracket,renderResult} from '../js/ui.js';
import {championsBracket} from '../js/champions-view.js';

const candidateTeams=new Map(euroSquads.map(s=>[s.id,squadTeam(s)]));
const user={...candidateTeams.get('nation-spain-2024'),id:'user',clubId:'user',name:'Meu time'};
const make=(seed=14,extra={})=>createTournament(user,allSquads,{mode:'euro',seed,candidateTeams,...extra});

test('Euro has 24 nations, 101 real editions, eleven usable players and local federation crests',()=>{
 assert.equal(euroNations.length,24);assert.equal(euroSquads.length,101);assert.ok(validateData().valid,validateData().errors.join('\n'));
 assert.deepEqual(euroNations.find(n=>n.id==='nation-georgia').eras,[2024]);
 assert.deepEqual(euroNations.find(n=>n.id==='nation-serbia').eras,[2024]);
 assert.deepEqual(euroNations.find(n=>n.id==='nation-slovenia').eras,[2000,2024]);
 for(const nation of euroNations){assert.ok(nation.eras.length<=5);assert.ok(existsSync(CLUB_LOGOS[nation.id]));}
 assert.ok(existsSync('assets/competitions/euro-trophy.png'));
 for(const team of candidateTeams.values()){assert.equal(team.lineup.length,11);assert.equal(new Set(team.lineup.map(p=>p.player.id)).size,11);}
 assert.equal(squadsForMode(allSquads,'euro').length,101);
 assert.equal(squadsForMode(allSquads,'quick').length,215);
 assert.equal(squadsForMode(allSquads,'champions').length,140);
 assert.equal(squadsForMode(allSquads,'copa-do-brasil').length,75);
});

test('Euro ratings follow actual playing year, keep creator reviews and disclose unverified values',()=>{
 for(const s of euroSquads)for(const p of s.jogadores){
  const year=s.ano===2020?2021:s.ano;assert.equal(s.ratingYear,year);
  if(s.ano<1993){assert.equal(p.ratingExpectedEdition,null);assert.match(p.ratingReason,/anterior à série FIFA/);}
  if(p.ratingKind==='release-rating'){assert.equal(p.releaseRating.releaseYear,year);assert.ok(p.ratingSource?.startsWith('https://'));assert.equal(p.releaseRating.ovr,p.ovr);}
  else if(p.ratingKind==='editorial-estimate')assert.match(p.ratingReason,/Estimativa/);
 }
 assert.equal(euroSquads.find(s=>s.id==='nation-england-2004').jogadores.find(p=>p.id==='sol-campbell').ovr,90);
 assert.equal(euroSquads.find(s=>s.id==='nation-portugal-2012').jogadores.find(p=>p.id==='cristiano-ronaldo').ovr,92);
 const miramontes=euroSquads.find(s=>s.id==='nation-spain-1964').jogadores.find(p=>p.nome.includes('Miramontes'));assert.notEqual(miramontes.id,'luis-suarez');
 assert.ok(euroSquads.filter(s=>s.ano<1990).flatMap(s=>s.jogadores).filter(p=>p.ovr>=93).every(p=>/beckenbauer|muller|rummenigge|platini|charlton|cruyff|gullit|basten/.test(p.id)));
});

test('Euro draft can fill all eight formations without duplicates and preserves four skips',()=>{
 for(const formation of Object.keys(FORMATIONS))for(let seed=0;seed<12;seed++){
  let draft=createDraft(seed,'2026-10-23','euro');assert.equal(draft.rerolls,4);
  for(let round=0;round<11;round++){
   draft=drawSquad(draft,euroSquads,formation);const s=euroSquads.find(s=>s.id===draft.currentSquadId);
   const p=s.jogadores.find(p=>!draft.picks.some(pick=>pick.player.id===p.id)&&automaticSlot(draft,formation,p));
   assert.ok(p,formation);draft=confirmPick(draft,euroSquads,formation,p.id);
  }
  assert.equal(draft.picks.length,11);assert.equal(new Set(draft.picks.map(p=>p.player.id)).size,11);
 }
 const s=euroSquads.find(s=>s.clubId==='nation-georgia');
 const draft={...createDraft(1,'2026-10-23','euro'),currentSquadId:s.id,seen:[s.id]};
 assert.throws(()=>drawSquad(draft,euroSquads,'4-3-3','season'),/outra temporada/);assert.equal(draft.rerolls,4);
});

test('Euro draws 23 unique national opponents and six neutral groups even after sole editions were drafted',()=>{
 const t=make(17,{excludeSquadIds:['nation-georgia-2024','nation-serbia-2024']});
 assert.equal(t.teams.length,24);assert.equal(new Set(t.teams.map(s=>s.clubId)).size,24);assert.equal(t.groups.length,6);assert.equal(t.matches.length,36);
 assert.ok(t.matches.every(m=>m.neutral&&m.stage==='group'));
 for(const group of t.groups){assert.equal(group.teamIds.length,4);const games=t.matches.filter(m=>m.groupId===group.id);assert.equal(games.length,6);assert.equal(new Set(games.map(m=>[m.homeId,m.awayId].sort().join(':'))).size,6);}
 assert.deepEqual(make(17,{excludeSquadIds:['nation-georgia-2024','nation-serbia-2024']}),t);
});

test('all 15 best-third combinations produce the official eight distinct round-of-16 pairings',()=>{
 for(const [combination,allocation] of Object.entries(EURO_THIRD_COMBINATIONS)){
  const groups=[...'ABCDEF'].map(id=>({id,standings:[1,2,3,4].map(rank=>({teamId:id+rank,points:rank===3&&combination.includes(id)?4:0,goalDifference:0,goalsFor:0,wins:0}))}));
  const t={groups,matches:[],progressRound:3},pairs=euroRound16Pairings(t,id=>id);
  assert.equal(new Set(pairs.flat()).size,16);assert.equal(pairs[0][1],allocation[0]+'3');assert.equal(pairs[6][1],allocation[1]+'3');assert.equal(pairs[4][1],allocation[2]+'3');assert.equal(pairs[2][1],allocation[3]+'3');
  assert.ok(pairs.every(([a,b])=>a[0]!==b[0]));
 }
});

test('group ties apply head-to-head before overall goal difference and reapply within a tied subset',()=>{
 const row=(id,points,diff)=>({teamId:id,points,goalDifference:diff,goalsFor:6});
 const game=(h,a,x,y)=>({homeId:h,awayId:a,result:{homeGoals:x,awayGoals:y,events:[]}});
 assert.deepEqual(euroGroupOrder([row('a',6,1),row('b',6,9),row('c',0,-10)],[game('a','b',1,0)],()=>1).map(r=>r.teamId),['a','b','c']);
 const rows=[row('a',6,0),row('b',6,1),row('c',6,20)];
 const games=[game('a','b',2,1),game('b','c',1,0),game('c','a',1,0)];
 assert.deepEqual(euroGroupOrder(rows,games,()=>1).map(r=>r.teamId),['a','b','c']);
});

test('three group rounds qualify twelve top-two teams and exactly four thirds, without mutating the draw',()=>{
 const initial=make();let t=initial;
 for(let i=0;i<3;i++)t=playNextRound(t);
 assert.equal(initial.progressRound,0);assert.ok(initial.matches.every(m=>!m.result));
 assert.equal(t.groups.flatMap(g=>g.standings).filter(r=>r.qualified).length,16);
 assert.equal(t.groups.filter(g=>g.standings[2].qualified).length,4);
 assert.equal(t.bracket[0].matches.length,8);assert.equal(t.matches.length,44);
 const thirds=euroThirdPlaceStandings(t,id=>hashSeed(`${t.seed}:${id}`));assert.equal(thirds.filter(r=>r.qualified).length,4);
 assert.ok(t.groups.flatMap(g=>g.standings).filter(r=>r.qualified).every(r=>t.bracket[0].matches.some(m=>[m.homeId,m.awayId].includes(r.teamId))));
 assert.ok(t.matches.filter(m=>m.stage==='group').every(m=>!m.result.extraTime&&!m.result.penalties));
});

test('Euro completes in seven rounds with 51 neutral matches, single legs and resumable state',()=>{
 for(let seed=1;seed<=8;seed++){
  const initial=make(seed),complete=simulateTournament(initial);
  assert.equal(complete.progressRound,7);assert.equal(complete.matches.length,51);assert.equal(complete.bracket.length,4);assert.ok(complete.matches.every(m=>m.neutral&&m.result));
  assert.ok(complete.bracket.every(s=>!s.ties));assert.equal(complete.matches.find(m=>m.stage==='final').result.winnerId,complete.championId);
  assert.ok(complete.userMatches.length>=3&&complete.userMatches.length<=7);
  let resumed=JSON.parse(JSON.stringify(playNextRound(playNextRound(initial))));resumed=simulateTournament(resumed);assert.deepEqual(resumed,complete);
 }
});

test('a user qualified among the four best thirds proceeds to the round of 16',()=>{
 let t=make(7);for(let i=0;i<3;i++)t=playNextRound(t);
 const group=t.groups.find(g=>g.teamIds.includes(t.userTeamId));
 assert.equal(group.standings[2].teamId,t.userTeamId);assert.equal(group.standings[2].qualified,true);
 assert.equal(t.campaign.eliminated,false);
 const session=prepareUserRound(t);assert.equal(currentMatch(session).stage,'round16');
 assert.equal(session.tournament.progressRound,3);assert.equal(session.pendingRound.progressRound,4);
});

test('live Euro tables and knockout slots never expose a pending round before the final whistle',()=>{
 const t=playNextRound(playNextRound(make(11))),state={mode:'euro',screen:'match',matchMinute:0,...prepareUserRound(t)};
 const before=JSON.stringify(state.tournament.groups),match=currentMatch(state);
 assert.equal(state.tournament.bracket.length,0);assert.equal(state.pendingRound.bracket.length,1);assert.equal(commitUserRound(state),false);
 const groups=renderBracket({...state,championsView:'groups'});assert.ok(groups.includes('Melhores terceiros'));
 assert.equal(JSON.stringify(state.tournament.groups),before);assert.ok(championsBracket(state.tournament)[0].every(n=>!n.known));
 assert.ok(renderMatch(state).includes('Seu grupo'));
 assert.ok(renderMatch(state).includes('aria-label="Ver competição da Euro"'));
 state.matchMinute=match.result.duration;assert.ok(commitUserRound(state));assert.equal(state.tournament.bracket.length,1);
 assert.ok(!renderMatch(state).includes('<h2>Seu grupo</h2>'));
});

test('Euro replaces the visible quick mode, carries its trophy and renders complete competition views',()=>{
 const setup=renderSetup({mode:'euro',formation:'4-3-3'});assert.ok(setup.includes('euro-trophy.png'));assert.ok(!setup.includes('data-value="quick"'));
 assert.ok(setup.includes('Uma seleção e uma edição'));
 const t=make();assert.ok(renderBracket({tournament:t,mode:'euro'}).includes('Fases da Euro'));
 const pending=renderBracket({tournament:t,mode:'euro',championsView:'knockout'});assert.ok(pending.includes('3º Grupo A/D/E/F'));assert.ok(!pending.includes('Grupo G'));
 const final=simulateTournament(t),html=renderBracket({tournament:final,mode:'euro',championsView:'knockout'});assert.ok(html.includes('euro-trophy.png'));assert.ok(!html.includes('Ida e volta'));
 const d={...createDraft(4,'2026-10-23','euro'),currentSquad:euroSquads.at(-1),otherSeasonAvailable:false};assert.ok(renderDraft({mode:'euro',formation:'4-3-3',draft:d}).includes('Outra seleção'));
 const source=readFileSync('css/euro.css','utf8');assert.ok(source.includes('[data-value="euro"]'));
});
