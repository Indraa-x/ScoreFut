import {scrollKnockoutRound} from './knockout-scroll.js';
import {navigationActions} from './actions/navigation.js';
import {draftActions} from './actions/draft.js';
import {matchActions} from './actions/match.js';
import {resultActions} from './actions/result.js';
import {initHomeCounters} from './home-counters.js';
import {initBrowserNavigation} from './browser-navigation.js';
import {selectQuickTeam,simulateQuickGame} from './quick-game.js';
import {filterQuickClubs} from './quick-catalog.js';
import { clubs, allSquads, validateData, loadWorldCupSquads } from '../data/game-squads.js';
import { squadsForMode, competitionName } from '../data/competitions.js';
import { state, MODES } from './state.js';
import { FORMATIONS, TEAM_SIZE, positionFit, calculateTeam, createTournament, simulateTournament } from './engine.js';
import { createDraft, drawSquad, availableSlots, movableSlots, movePick, confirmPick, migrateDraft, refreshDraftRatings, refreshDraftSkips } from './draft.js';
import {cryptoRandomIndex} from './random.js';
import {createChallengeDraft,validateChallengeDraft,challengeTournamentSeed} from './challenge.js';
import * as storage from './storage.js';
import * as ui from './ui.js';
import {renderReleaseDetails} from './release-notice.js';
import {updateAchievementLedger} from './achievements.js';
import {saveCampaignProgress} from './campaign-progress.js';
import {initPlayerDrag} from './player-drag.js';
import {initSkipFeedback} from './skip-feedback.js';
import {currentMatch,canContinueTournament,prepareUserRound,commitUserRound,migrateMatchSession,migrateNeutralSimulation,migrateChampionsFormat,MATCH_FLOW_VERSION} from './match-session.js';
import {beginPenaltyReplay,matchHasEnded} from './match-penalties.js';
import {MATCH_SPEEDS,normalizeMatchSpeed} from './match-motion.js';
import {initMatchPlayback} from './match-playback.js';
import {initCelebration} from './celebration.js';
const app=document.getElementById('app'), modal=document.getElementById('modal');
const homeCounters=initHomeCounters();
const browserProgressReady=storage.initializeBrowserProgress();
const competitionProgressReady=storage.archiveRetiredCompetition();
let toastTimer=null,storageWarning=false,lastRenderedScreen=null,navigation=null,navigationVersion=0;
let pendingAchievementLedger=null;
const navigationSessions=new Map();
const gameScreens=new Set(['draft','summary','match','bracket']);
const sessionId=draft=>draft?(draft.challenge?`challenge:${draft.challenge.code}:${draft.date}`:`${draft.mode}:${draft.date}:${draft.seed}`):null;
const campaignId=()=>state.draft?.challenge?`challenge-${state.draft.challenge.code}-${state.draft.date}`:`11-${state.mode}-${state.draft.seed}-${state.draft.date}`;
function rememberSession(){if(gameScreens.has(state.screen)&&state.draft&&state.draft.mode===state.mode&&!state.resultRecord){navigationSessions.set(sessionId(state.draft),{...state});}}
function currentRoute(){return {screen:state.screen,mode:state.mode,quickStep:state.quickStep,...(gameScreens.has(state.screen)?{session:sessionId(state.draft)}:{}),...(['result','bracket'].includes(state.screen)&&state.resultRecord?{recordId:state.resultRecord.id}:{}),...(state.screen==='bracket'?{championsView:state.championsView,returnScreen:state.returnScreen}:{})};}
function visitRoute(route){
  navigationVersion++;rememberSession();stopPlayback();if(modal.open)modal.close();
  const requested=route.screen;
  if(requested==='bracket'&&route.recordId){const record=storage.read('history',[]).find(r=>r.id===route.recordId);if(record?.tournament&&record.mode!=='euro'){state.resultRecord=record;state.tournament=record.tournament;state.mode=record.mode;state.screen='bracket';state.championsView=route.championsView||'groups';state.returnScreen=route.returnScreen||'result';}else state.screen='achievements';}
  else if(gameScreens.has(requested)){
    const id=route.session||sessionId(state.draft)||sessionId(storage.read('active')?.draft);
    const cached=navigationSessions.get(id),saved=storage.read('active');
    if(cached)Object.assign(state,cached);
    else if(saved&&sessionId(saved.draft)===id)restore(saved);
    if(!state.draft||sessionId(state.draft)!==id){state.screen='setup';state.mode=MODES.some(m=>m.id===route.mode)?route.mode:'world-cup';}
    else{state.mode=state.draft.mode;state.resultRecord=null;state.screen=['match','bracket'].includes(requested)&&!state.tournament?'summary':requested;if(state.screen==='summary'&&state.draft.picks.length!==TEAM_SIZE)state.screen='draft';if(requested==='bracket'){state.championsView=route.championsView||'groups';state.returnScreen=route.returnScreen||'match';}}
  }else if(requested==='result'){
    const record=storage.read('history',[]).find(r=>r.id===route.recordId)|| (state.resultRecord?.id===route.recordId?state.resultRecord:null);
    if(record&&record.mode!=='euro'){state.resultRecord=record;state.tournament=record.tournament||null;state.mode=record.mode;state.screen='result';}else state.screen='achievements';
  }else{state.screen=requested; if(requested==='setup'){state.mode=MODES.some(m=>m.id===route.mode)||route.mode==='quick'?route.mode:'world-cup';state.quickStep=route.quickStep||'formation';}}
  state.rolling=false;state.matchPlaying=false;render();window.scrollTo({top:0,behavior:'instant'});
}

const playback=initMatchPlayback({app,state,onFinish:finishCurrentMatch,onSave:persist});
const celebration=initCelebration({app});
initSkipFeedback({app,getDraft:()=>state.screen==='draft'&&!state.rolling?state.draft:null});
const validation=validateData();
if(!validation.valid) console.error('Base ScoreFut inválida',validation.errors);
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3400);}
async function downloadResult(record){const exporter=await import('./share.js');return exporter.downloadResult(record);}
let challengeDialogPromise=null;
async function openChallenge(kind='create',code=''){
  challengeDialogPromise??=import('./challenge-dialog.js').then(({initChallengeDialog})=>initChallengeDialog({
    modal,content:document.getElementById('modal-content'),getSelection:()=>({mode:state.mode,formation:state.formation}),
    loadSquads:async mode=>{if(mode==='world-cup')await loadWorldCupSquads();return allSquads;},
    startChallenge:challenge=>startDraft(challenge),toast,
  })).catch(error=>{challengeDialogPromise=null;throw error;});
  (await challengeDialogPromise).show(kind,code);
}
function savedDraft(){const saved=storage.read('active');return saved?.draft?.picks?.length<TEAM_SIZE||saved?.screen==='summary'||saved?.screen==='match'?saved:null;}
function hydrateDraft(){if(!state.draft)return;const pool=squadsForMode(allSquads,state.mode);state.draft.currentSquad=pool.find(s=>s.id===state.draft.currentSquadId)||null;state.draft.otherSeasonAvailable=pool.some(s=>s.clubId===state.draft.currentSquad?.clubId&&!state.draft.seen.includes(s.id));}
function snapshot(){const draft=state.draft?{...state.draft}:null;if(draft){delete draft.currentSquad;delete draft.otherSeasonAvailable;}return {rulesVersion:2,matchFlowVersion:MATCH_FLOW_VERSION,screen:state.screen,mode:state.mode,formation:state.formation,teamName:state.teamName,quickSquadId:state.quickSquadId,draft,tournament:state.tournament,pendingRound:state.pendingRound,userMatchIndex:state.userMatchIndex,matchUnlockedIndex:state.matchUnlockedIndex,matchMinute:state.matchMinute,matchSpeed:state.matchSpeed,penaltyReplay:state.penaltyReplay||null};}
function persist(){rememberSession();if(!state.draft)return;const saved=snapshot();storage.write('active',saved);}
function stopPlayback(){playback.stop();state.matchPlaying=false;}
function navigate(screen){navigationVersion++;rememberSession();if(state.screen==='match'&&['home','achievements','bracket'].includes(screen))persist();stopPlayback();state.screen=screen;navigation?.push();render();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});if(['draft','summary','match'].includes(screen))persist();}
function browserAchievements(history){
  const saved=storage.read('achievements');
  const ledger=updateAchievementLedger(history,pendingAchievementLedger||saved);
  if(pendingAchievementLedger){
    const durable=updateAchievementLedger([],saved);
    for(const id of Object.keys(ledger.progress))ledger.progress[id]=Math.max(ledger.progress[id],durable.progress[id]);
  }
  if(pendingAchievementLedger||JSON.stringify(saved)!==JSON.stringify(ledger))pendingAchievementLedger=storage.write('achievements',ledger)?null:ledger;
  return ledger;
}
function render(){rememberSession();navigation?.sync();const screenChanged=state.screen!==lastRenderedScreen;const active=document.activeElement;const focusId=active?.id,focusAction=active?.dataset.action,focusValue=active?.dataset.value;const focusInApp=app.contains(active);hydrateDraft();const history=storage.read('history',[]),stats=storage.statistics(history);let html='';
  switch(state.screen){case'home':html=ui.renderHome({stats,clubs});break;case'setup':html=ui.renderSetup(state);break;case'draft':html=ui.renderDraft(state);break;case'summary':html=ui.renderSummary(state);break;case'match':html=ui.renderMatch(state);break;case'bracket':html=ui.renderBracket(state);break;case'result':html=ui.renderResult(state.resultRecord,state.tournament);break;case'achievements':html=ui.renderAchievements(history,stats,browserAchievements(history));break;default:html=ui.renderHome({stats,clubs});}
  app.innerHTML=html;app.dataset.screen=state.screen;app.dataset.mode=state.mode;app.classList.toggle('screen-arrive',screenChanged);lastRenderedScreen=state.screen;homeCounters.update(app,state.screen);document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.action===(state.screen==='achievements'?'achievements':'home')));
  if(state.screen==='bracket'&&matchMedia('(max-width: 980px)').matches)scrollKnockoutRound(app,app.querySelector('.champions-round-picker [aria-pressed="true"]')?.dataset.value);
  playback.attach();if(state.screen==='match'&&state.matchPlaying)playback.start();
  celebration.attach();
  if(screenChanged&&state.screen==='result'){const notice=document.getElementById('game-announcement');if(notice)notice.textContent=state.resultRecord?.champion?'Campanha encerrada. Campeão!':'Campanha encerrada.';}
  if(focusInApp){let target=focusId?document.getElementById(focusId):[...app.querySelectorAll('[data-action]')].find(el=>el.dataset.action===focusAction&&el.dataset.value===focusValue);if(target?.disabled)target=app.querySelector('[data-action="next-match"],[data-action="player"]:not(:disabled),[data-action="draw"]');target?.focus({preventScroll:true});}
}
function restore(saved){
  const legacy={'2-1-1':'4-3-3','1-2-1':'4-3-3','1-1-2':'4-4-2'};
  const formation=legacy[saved?.formation]||saved?.formation;
  const mode=saved?.mode==='brasileirao'?'copa-do-brasil':saved?.mode==='daily'?'cup':saved?.mode;
  if(!saved?.draft||!FORMATIONS[formation]||!(mode==='cup'||mode==='legends'||mode==='quick'||MODES.some(m=>m.id===mode)))return false;
  const upgrade=saved.rulesVersion!==2||!!legacy[saved.formation];
  Object.assign(state,saved);state.draft=refreshDraftSkips(state.draft);state.mode=mode;state.formation=formation;state.teamName=mode==='quick'?(saved.teamName||'Meu time'):'Meu time';state.quickSquadId=saved.quickSquadId||null;state.matchPlaying=false;state.rolling=false;state.resultRecord=null;state.pendingRound=saved.pendingRound||null;state.matchSpeed=normalizeMatchSpeed(saved.matchSpeed);
  if (saved.mode === 'brasileirao') {
    state.draft = {...state.draft, mode};
    state.tournament=null;state.pendingRound=null;state.userMatchIndex=0;state.matchUnlockedIndex=0;state.matchMinute=0;
    state.screen=state.draft.picks.length===TEAM_SIZE?'summary':'draft';
    toast('O modo brasileiro agora é Copa do Brasil. Sua escalação foi mantida para disputar o mata-mata.');
  }
  const slots=FORMATIONS[formation].slots;
  const invalid=state.draft.picks.some(p=>!slots.some(s=>s.id===p.slot.id&&positionFit(p.player,s)!==null))||new Set(state.draft.picks.map(p=>p.slot.id)).size!==state.draft.picks.length||new Set(state.draft.picks.map(p=>p.player.id)).size!==state.draft.picks.length;
  if(upgrade||invalid){
    state.draft=migrateDraft(state.draft,formation,allSquads);
    state.tournament=null;state.pendingRound=null;state.screen=state.draft.picks.length===TEAM_SIZE?'summary':'draft';state.userMatchIndex=0;state.matchUnlockedIndex=0;state.matchMinute=0;
    if(upgrade)toast('Seu draft agora tem 11 vagas. Mantive as escolhas compatíveis.');
  }
  if(state.tournament&&saved.matchFlowVersion!==MATCH_FLOW_VERSION)Object.assign(state,migrateMatchSession(state,allSquads));
  state.matchFlowVersion=MATCH_FLOW_VERSION;
  Object.assign(state,migrateNeutralSimulation(state));
  Object.assign(state,migrateChampionsFormat(state));
  if(state.tournament)commitUserRound(state);
  if(!state.tournament&&!state.draft.challenge)state.draft=refreshDraftRatings(state.draft,allSquads);
  delete state.draft.selectedId;delete state.draft.selectedSlotId;delete state.draft.selectedPickId;
  hydrateDraft();if(state.screen==='bracket')state.screen='match';persist();render();return true;
}
function openSetup(mode='world-cup',quickStep='formation'){
  if(mode==='brasileirao')mode='copa-do-brasil';
  state.mode=mode==='quick'||MODES.some(m=>m.id===mode)?mode:'world-cup';state.quickStep=quickStep;navigate('setup');
}
function updateQuickSearch(search){
  state.quickSearch=search;
  const items=filterQuickClubs({search,region:state.quickRegion,formation:state.formation});
  const grid=app.querySelector('#quick-club-grid'),count=app.querySelector('[data-quick-count]');
  if(grid)grid.innerHTML=ui.renderQuickClubCards(items);
  if(count)count.textContent=`${items.length} ${items.length===1?'clube':'clubes'}`;
}
function startDraft(challenge=null){const date=storage.today();
  const draft=challenge?createChallengeDraft(challenge,allSquads,date):createDraft(crypto.getRandomValues(new Uint32Array(1))[0],date,state.mode);
  if(challenge){state.mode=draft.mode;state.formation=draft.challenge.formation;}
  state.quickSquadId=null;state.teamName='Meu time';state.draft=draft;state.tournament=null;state.pendingRound=null;state.resultRecord=null;state.userMatchIndex=0;state.matchUnlockedIndex=0;state.matchMinute=0;state.matchSpeed=4;navigate('draft');
}
async function roll(kind='new'){
  if(state.rolling||(kind!=='new'&&state.draft?.rerolls<=0))return;
  const draftAtStart=state.draft,versionAtStart=navigationVersion;
  let drawn=false;
  state.rolling=true;render();
  await new Promise(r=>setTimeout(r,1500));
  if(navigationVersion!==versionAtStart||state.screen!=='draft'||state.draft!==draftAtStart){state.rolling=false;return;}
  try{if(state.draft.challenge)validateChallengeDraft(state.draft,state.formation,allSquads);state.draft=drawSquad(state.draft,squadsForMode(allSquads,state.mode),state.formation,kind,state.mode,cryptoRandomIndex);drawn=true;persist();}
  catch(error){toast(error.message);}
  finally{
    state.rolling=false;render();
    if(drawn&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      app.querySelectorAll('.draw-club,.season-award,.roster-list').forEach(element=>element.animate(
        [{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:320,easing:'cubic-bezier(.2,.7,.3,1)'}
      ));
    }
  }
}
function selectedPlayer(id){
  if(!['draft','summary'].includes(state.screen)||state.rolling)return null;
  return state.draft?.picks.find(pick=>pick.player.id===id)?.player
    ||(state.screen==='draft'?state.draft?.currentSquad?.jogadores.find(p=>p.id===id):null);
}
function playerDestinations(id){
  const player=selectedPlayer(id);if(!player)return [];
  return state.draft.picks.some(pick=>pick.player.id===id)?movableSlots(state.draft,state.formation,id):availableSlots(state.draft,state.formation,player);
}
function selectPlayer(id){
  const player=selectedPlayer(id);if(!player||!availableSlots(state.draft,state.formation,player).length)return;
  state.draft.selectedPickId=null;state.draft.selectedId=id;render();
  scrollToDraftSection('.draft-center');
}
function scrollToDraftSection(selector){
  if(window.matchMedia('(max-width:760px)').matches)app.querySelector(selector)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function selectLineupPlayer(id){
  if(!selectedPlayer(id))return;
  if(state.draft.selectedPickId===id){state.draft.selectedPickId=null;render();return;}
  if(!playerDestinations(id).length){toast('Este jogador não tem outra posição compatível disponível nesta formação.');return;}
  state.draft.selectedId=null;state.draft.selectedPickId=id;render();
}
function slotAction(slotId){
  const moving=state.draft?.selectedPickId;
  if(moving&&playerDestinations(moving).some(slot=>slot.id===slotId)){addPlayer(moving,slotId);return;}
  const pick=state.draft?.picks.find(pick=>pick.slot.id===slotId);
  if(pick){selectLineupPlayer(pick.player.id);return;}
  if(state.draft?.selectedId)addPlayer(state.draft.selectedId,slotId);
}
function highlightDrag(id){
  const player=selectedPlayer(id);if(!player)return false;
  const free=playerDestinations(id).map(slot=>slot.id);if(!free.length)return false;
  const moving=state.draft.picks.find(pick=>pick.player.id===id);
  state.draft.selectedId=moving?null:id;state.draft.selectedPickId=moving?id:null;
  app.querySelectorAll('[data-action="slot"]').forEach(el=>{
    const legal=free.includes(el.dataset.value),origin=moving?.slot.id===el.dataset.value;
    el.disabled=!legal&&!el.classList.contains('picked');
    el.classList.toggle('compatible',legal);el.classList.toggle('move-origin',origin);el.classList.toggle('incompatible',!legal&&!origin);
    if(el.dataset.lineupPlayer)el.setAttribute('aria-pressed',String(origin));
    if(legal){const slot=FORMATIONS[state.formation].slots.find(slot=>slot.id===el.dataset.value);el.setAttribute('aria-label',(el.classList.contains('picked')?'Trocar ':'Colocar ')+player.nome+' como '+slot.label);}
    if(el.classList.contains('empty')){
      const slot=FORMATIONS[state.formation].slots.find(slot=>slot.id===el.dataset.value);
      el.setAttribute('aria-label',legal?'Colocar '+player.nome+' como '+slot.label:'Vaga '+slot.label);
      el.querySelector('small').textContent=legal?'Solte aqui':slot.position==='GOL'?'Goleiro':'Livre';
    }
  });
  app.querySelectorAll('[data-action="player"]').forEach(el=>{const selected=el.dataset.value===id;el.setAttribute('aria-pressed',String(selected));el.closest('.player-row').classList.toggle('selected',selected);});
  const hint=app.querySelector('.placement-hint');if(hint)hint.textContent='Solte '+player.nome+' em uma vaga destacada.';
  return true;
}
function addPlayer(id,slotId){
  if(!['draft','summary'].includes(state.screen)||state.rolling)return;
  try{
    const moving=state.draft?.picks.find(pick=>pick.player.id===id);
    if(moving){
      state.draft=movePick(state.draft,state.formation,id,slotId);persist();render();
      return true;
    }
    if(state.screen!=='draft'||!state.draft?.currentSquadId)return;
    state.draft=confirmPick(state.draft,allSquads,state.formation,id,slotId);
    persist();
    if(state.draft.picks.length===TEAM_SIZE)navigate('summary');
    else{render();scrollToDraftSection('.draw-card');}
    return true;
  }catch(error){toast(error.message);}
}
function chooseQuickTeam(squadId){
  if(state.mode!=='quick'||!['setup','summary'].includes(state.screen)||(state.screen==='setup'&&state.quickStep!=='clubs'))return;
  const seed=crypto.getRandomValues(new Uint32Array(1))[0];
  const choice=selectQuickTeam({squadId,seed,date:storage.today(),squads:allSquads,formation:state.formation});
  stopPlayback();Object.assign(state,choice,{tournament:null,pendingRound:null,resultRecord:null,rolling:false,userMatchIndex:0,matchUnlockedIndex:0,matchMinute:0});
  navigate('summary');
}
function startTournament(){
  if(state.tournament){if(state.tournament.complete){const record=storage.read('history',[]).find(r=>r.id===campaignId());if(record){state.resultRecord=record;navigate('result');return;}}navigate('match');return;}
  if(state.draft?.challenge)validateChallengeDraft(state.draft,state.formation,allSquads);
  const picks=state.draft?.picks||[],slots=FORMATIONS[state.formation].slots;
  if(picks.length!==TEAM_SIZE||new Set(picks.map(p=>p.player.id)).size!==TEAM_SIZE||new Set(picks.map(p=>p.slot.id)).size!==TEAM_SIZE||picks.some(p=>!slots.some(s=>s.id===p.slot.id&&positionFit(p.player,s)!==null))){toast('Complete as onze posições antes de entrar em campo.');return;}
  const strength=calculateTeam(state.draft.picks),user={id:'user',name:state.teamName,clubId:'user',monograma:ui.initials(state.teamName),cores:['#2bb777','#174b2e'],lineup:state.draft.picks,strength};
  const seed=state.draft.challenge?challengeTournamentSeed(state.draft.challenge):crypto.getRandomValues(new Uint32Array(1))[0];
  if(state.mode==='quick'){
    state.tournament=simulateQuickGame({picks,formation:state.formation,squads:allSquads,seed,teamName:state.teamName});
    state.pendingRound=null;state.matchFlowVersion=MATCH_FLOW_VERSION;state.userMatchIndex=state.tournament.userMatches.length-1;state.matchUnlockedIndex=state.userMatchIndex;state.matchMinute=state.tournament.userMatches.at(-1).result.duration;
    finishTournament();return;
  }
  Object.assign(state,prepareUserRound(createTournament(user,allSquads,{mode:state.mode,seed,excludeSquadIds:state.draft.picks.map(p=>p.squadId)})));
  state.matchFlowVersion=MATCH_FLOW_VERSION;state.matchUnlockedIndex=0;state.matchMinute=0;state.matchSpeed=4;navigate('match');}
function finishCurrentMatch(){stopPlayback();const match=currentMatch(state);if(match&&beginPenaltyReplay(state,match)){persist();render();return;}commitUserRound(state);persist();render();}
function nextMatch(){
  const match=currentMatch(state);if(!match||!matchHasEnded(state,match))return;
  stopPlayback();
  if(state.userMatchIndex<state.tournament.userMatches.length-1)state.userMatchIndex++;
  else if(canContinueTournament(state.tournament)){
    Object.assign(state,prepareUserRound(state.tournament));
    if(!state.pendingRound){finishTournament();return;}
  }else{finishTournament();return;}
  state.matchMinute=0;state.penaltyReplay=null;persist();render();
}
function finishTournament(){
  stopPlayback();
  if(!state.tournament.complete)state.tournament=simulateTournament(state.tournament);
  const t=state.tournament,c=t.campaign,league=state.mode==='brasileirao';
  const rank={group:1,round16:2,quarter:3,semi:4,final:5};
  const title='Campeão · '+competitionName(state.mode);
  const record={rulesVersion:2,id:campaignId(),challenge:state.draft.challenge || null,date:state.draft.date,teamName:state.teamName,mode:state.mode,formation:state.formation,picks:state.draft.picks,strength:calculateTeam(state.draft.picks).overall,champion:c.champion,stageLabel:c.champion?title:league?c.stageLabel:c.stage==='group'?'Eliminado na fase de grupos':`Eliminado · ${c.stageLabel}`,rank:c.champion?6:league?Math.max(1,6-c.position):(rank[c.stage]||1),goalsFor:c.goalsFor,goalsAgainst:c.goalsAgainst,played:c.played,topScorer:c.topScorer,tournament:t};
  const history=storage.read('history',[]);
  const saved=saveCampaignProgress(record,history,browserAchievements(history),storage);
  pendingAchievementLedger=saved.ledgerSaved?null:saved.ledger;
  if(!saved.ledgerSaved&&!saved.historySaved)persist();
  if(!saved.ledgerSaved){storageWarning=true;toast('O navegador não conseguiu salvar as conquistas. Elas continuam disponíveis nesta aba.');}
  rememberSession();state.resultRecord=record;navigate('result');
}
async function launchFromHome(button){
  const versionAtStart=navigationVersion;
  if(state.screen!=='home'||button?.disabled)return;
  if(button){
    button.classList.add('is-launching');
    button.disabled=true;
    button.setAttribute('aria-busy','true');
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      const animations=button.getAnimations?.({subtree:true});
      if(animations)await Promise.all(animations.filter(animation=>animation.animationName?.startsWith('sf-play-')).map(animation=>animation.finished.catch(()=>{})));
      else await new Promise(resolve=>setTimeout(resolve,620));
    }
  }
  if(state.screen==='home'&&navigationVersion===versionAtStart)openSetup('world-cup');
}
function resumeGame(){const saved=savedDraft();if(saved){const router=navigation;navigation=null;restore(saved);navigation=router;navigation?.push();window.scrollTo(0,0);}return;}
const actionContext={state, MODES, FORMATIONS, MATCH_SPEEDS, modal, ui, storage, renderReleaseDetails, navigate, openSetup, openChallenge, launchFromHome, render, startDraft, resumeGame, roll, selectPlayer, slotAction, startTournament, chooseQuickTeam, nextMatch, persist, app, stopPlayback, downloadResult, toast};
const actionHandlers={...navigationActions(actionContext), ...draftActions(actionContext), ...matchActions(actionContext), ...resultActions(actionContext)};
async function action(name,value,element){if(['mode','start','setup','play-home','resume'].includes(name)){const mode=name==='resume'?savedDraft()?.mode:name==='play-home'?'world-cup':value||state.mode;if(mode==='world-cup')await loadWorldCupSquads();}if(state.rolling&&['draw','reroll-club','reroll-season','player'].includes(name))return;return actionHandlers[name]?.(value,element);
}
document.addEventListener('click',event=>{const element=event.target.closest('[data-action]');if(element&&!element.disabled)action(element.dataset.action,element.dataset.value,element).catch(error=>{console.error(error);toast('Não foi possível completar a ação. '+error.message);});});
app.addEventListener('change',event=>{if(event.target.id==='quick-season')action('quick-team',event.target.value,event.target).catch(error=>toast(error.message));});
app.addEventListener('input',event=>{if(event.target.id==='quick-search'&&state.mode==='quick'&&state.screen==='setup')updateQuickSearch(event.target.value);});
initPlayerDrag({
  app,
  getPlayer:id=>{
    const player=selectedPlayer(id);
    const pick=state.draft?.picks.find(pick=>pick.player.id===id);
    const squad=pick?allSquads.find(squad=>squad.id===pick.squadId):state.draft?.currentSquad;
    return player&&squad&&playerDestinations(id).length?{player,squad,slot:pick?.slot,hidden:state.mode==='legends'&&state.screen==='draft'}:null;
  },
  onStart:highlightDrag,
  onPlace:addPlayer,
  onCancel:()=>{if(['draft','summary'].includes(state.screen)){state.draft.selectedId=null;state.draft.selectedPickId=null;render();}},
  renderPreview:ui.renderPlayerDragPreview
});
modal.addEventListener('click',event=>{if(event.target===modal)modal.close();});
document.addEventListener('visibilitychange',()=>{if(state.screen==='match'){if(document.hidden){stopPlayback();persist();}render();}});
window.addEventListener('pagehide',()=>{stopPlayback();if(['draft','summary','match'].includes(state.screen))persist();});
if(!browserProgressReady||!competitionProgressReady){storageWarning=true;toast('Não foi possível concluir o salvamento neste navegador. Seu progresso anterior foi mantido.');}
if(storage.read('active')?.draft?.mode==='world-cup')await loadWorldCupSquads();
navigation=initBrowserNavigation({getRoute:currentRoute,onVisit:visitRoute});
navigation.start();
const sharedChallengeUrl=new URL(window.location.href),sharedChallenge=sharedChallengeUrl.searchParams.get('desafio');
if(sharedChallenge!==null){sharedChallengeUrl.searchParams.delete('desafio');history.replaceState(history.state,'',sharedChallengeUrl.href);void openChallenge('enter',sharedChallenge).catch(error=>toast(error.message));}
