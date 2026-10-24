import {initBrowserNavigation} from './browser-navigation.js?v=browser-navigation-20261023';
import {selectQuickTeam,simulateQuickGame} from './quick-game.js?v=euro-20261023';
import {filterQuickClubs} from './quick-catalog.js?v=arsenal-88-20261023';
import {filterHistory} from './history.js?v=euro-20261023';
import { clubs, allSquads, validateData } from '../data/game-squads.js?v=arsenal-88-20261023';
import { squadsForMode, competitionName } from '../data/competitions.js?v=euro-20261023';
import { state, MODES } from './state.js?v=euro-20261023';
import { FORMATIONS, TEAM_SIZE, positionFit, calculateTeam, createTournament, simulateTournament } from './engine.js?v=euro-20261023';
import { createDraft, drawSquad, availableSlots, movableSlots, movePick, confirmPick, migrateDraft, refreshDraftRatings, refreshDraftSkips } from './draft.js?v=euro-20261023';
import {cryptoRandomIndex} from './random.js?v=uniform-draw-20261022';
import * as storage from './storage.js?v=five-eras-20261022';
import * as ui from './ui.js?v=home-modric-20261024';
import {downloadResult} from './share.js?v=euro-20261023';
import {initPlayerDrag} from './player-drag.js?v=drag-size-adjustment-20261023';
import {initSkipFeedback} from './skip-feedback.js?v=five-eras-20261022';
import {currentMatch,canContinueTournament,prepareUserRound,commitUserRound,migrateMatchSession,migrateNeutralSimulation,migrateChampionsFormat,MATCH_FLOW_VERSION} from './match-session.js?v=euro-20261023';
import {MATCH_SPEEDS,normalizeMatchSpeed} from './match-motion.js?v=euro-20261023';
import {initMatchPlayback} from './match-playback.js?v=euro-20261023';
import {initCelebration} from './celebration.js?v=euro-20261023';
const app=document.getElementById('app'), modal=document.getElementById('modal');
let toastTimer=null,storageWarning=false,lastRenderedScreen=null,navigation=null,navigationVersion=0;
const navigationSessions=new Map();
const gameScreens=new Set(['draft','summary','match','bracket']);
const sessionId=draft=>draft?`${draft.mode}:${draft.date}:${draft.seed}`:null;
function rememberSession(){if(gameScreens.has(state.screen)&&state.draft&&state.draft.mode===state.mode&&!state.resultRecord){navigationSessions.set(sessionId(state.draft),{...state});}}
function currentRoute(){return {screen:state.screen,mode:state.mode,quickStep:state.quickStep,...(gameScreens.has(state.screen)?{session:sessionId(state.draft)}:{}),...(['result','bracket'].includes(state.screen)&&state.resultRecord?{recordId:state.resultRecord.id}:{}),...(state.screen==='bracket'?{championsView:state.championsView,returnScreen:state.returnScreen}:{})};}
function visitRoute(route){
  navigationVersion++;rememberSession();stopPlayback();if(modal.open)modal.close();
  const requested=route.screen;
  if(requested==='bracket'&&route.recordId){const record=storage.read('history',[]).find(r=>r.id===route.recordId);if(record?.tournament){state.resultRecord=record;state.tournament=record.tournament;state.mode=record.mode;state.screen='bracket';state.championsView=route.championsView||'groups';state.returnScreen=route.returnScreen||'result';}else state.screen='history';}
  else if(gameScreens.has(requested)){
    const id=route.session||sessionId(state.draft)||sessionId(storage.read('active')?.draft);
    const cached=navigationSessions.get(id),saved=storage.read('active');
    if(cached)Object.assign(state,cached);
    else if(saved&&sessionId(saved.draft)===id)restore(saved);
    if(!state.draft||sessionId(state.draft)!==id){state.screen='setup';state.mode=MODES.some(m=>m.id===route.mode)?route.mode:'euro';}
    else{state.mode=state.draft.mode;state.resultRecord=null;state.screen=['match','bracket'].includes(requested)&&!state.tournament?'summary':requested;if(state.screen==='summary'&&state.draft.picks.length!==TEAM_SIZE)state.screen='draft';if(requested==='bracket'){state.championsView=route.championsView||'groups';state.returnScreen=route.returnScreen||'match';}}
  }else if(requested==='result'){
    const record=storage.read('history',[]).find(r=>r.id===route.recordId)|| (state.resultRecord?.id===route.recordId?state.resultRecord:null);
    if(record){state.resultRecord=record;state.tournament=record.tournament||null;state.mode=record.mode;state.screen='result';}else state.screen='history';
  }else{state.screen=requested; if(requested==='setup'){state.mode=MODES.some(m=>m.id===route.mode)||route.mode==='quick'?route.mode:'euro';state.quickStep=route.quickStep||'formation';}}
  state.rolling=false;state.matchPlaying=false;render();window.scrollTo({top:0,behavior:'instant'});
}

const historyFilters={search:'',mode:'all',titlesOnly:false};
const playback=initMatchPlayback({app,state,onFinish:finishCurrentMatch,onSave:persist});
const celebration=initCelebration({app,getRecord:()=>state.resultRecord,getScreen:()=>state.screen});
initSkipFeedback({app,getDraft:()=>state.screen==='draft'&&!state.rolling?state.draft:null});
const validation=validateData();
if(!validation.valid) console.error('Base ScoreFut inválida',validation.errors);
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3400);}
function savedDraft(){const saved=storage.read('active');return saved?.draft?.picks?.length<TEAM_SIZE||saved?.screen==='summary'||saved?.screen==='match'?saved:null;}
function hydrateDraft(){if(!state.draft)return;const pool=squadsForMode(allSquads,state.mode);state.draft.currentSquad=pool.find(s=>s.id===state.draft.currentSquadId)||null;state.draft.otherSeasonAvailable=pool.some(s=>s.clubId===state.draft.currentSquad?.clubId&&!state.draft.seen.includes(s.id));}
function snapshot(){const draft=state.draft?{...state.draft}:null;if(draft){delete draft.currentSquad;delete draft.otherSeasonAvailable;}return {rulesVersion:2,matchFlowVersion:MATCH_FLOW_VERSION,screen:state.screen,mode:state.mode,formation:state.formation,teamName:state.teamName,quickSquadId:state.quickSquadId,draft,tournament:state.tournament,pendingRound:state.pendingRound,userMatchIndex:state.userMatchIndex,matchUnlockedIndex:state.matchUnlockedIndex,matchMinute:state.matchMinute,matchSpeed:state.matchSpeed};}
function persist(){rememberSession();if(!state.draft)return;const saved=snapshot();const ok=storage.write('active',saved);if(!ok&&!storageWarning){storageWarning=true;toast('Este navegador não permite salvar o progresso. Você pode continuar jogando.');}}
function stopPlayback(){playback.stop();state.matchPlaying=false;}
function navigate(screen){navigationVersion++;rememberSession();if(state.screen==='match'&&['home','history','bracket'].includes(screen))persist();stopPlayback();state.screen=screen;navigation?.push();render();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});if(['draft','summary','match'].includes(screen))persist();}
function render(){rememberSession();navigation?.sync();const screenChanged=state.screen!==lastRenderedScreen;const active=document.activeElement;const focusId=active?.id,focusAction=active?.dataset.action,focusValue=active?.dataset.value;const focusInApp=app.contains(active);hydrateDraft();const history=storage.read('history',[]).filter(record=>record.mode!=='world-cup'),stats=storage.statistics(history);let html='';
  switch(state.screen){case'home':html=ui.renderHome({stats,clubs});break;case'setup':html=ui.renderSetup(state);break;case'draft':html=ui.renderDraft(state);break;case'summary':html=ui.renderSummary(state);break;case'match':html=ui.renderMatch(state);break;case'bracket':html=ui.renderBracket(state);break;case'result':html=ui.renderResult(state.resultRecord,state.tournament);break;case'history':html=ui.renderHistory(history,stats,historyFilters);break;default:html=ui.renderHome({stats,clubs});}
  app.innerHTML=html;app.dataset.screen=state.screen;app.dataset.mode=state.mode;app.classList.toggle('screen-arrive',screenChanged);lastRenderedScreen=state.screen;app.setAttribute('aria-live',state.screen==='match'?'off':'polite');document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.action===(state.screen==='history'?'history':'home')));
  playback.attach();if(state.screen==='match'&&state.matchPlaying)playback.start();
  celebration.attach();
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
  if(!state.tournament)state.draft=refreshDraftRatings(state.draft,allSquads);
  delete state.draft.selectedId;delete state.draft.selectedSlotId;delete state.draft.selectedPickId;
  hydrateDraft();if(state.screen==='bracket')state.screen='match';persist();render();return true;
}
function openSetup(mode='euro',quickStep='formation'){
  if(mode==='brasileirao')mode='copa-do-brasil';
  state.mode=mode==='quick'||MODES.some(m=>m.id===mode)?mode:'euro';state.quickStep=quickStep;navigate('setup');
}
function updateQuickSearch(search){
  state.quickSearch=search;
  const items=filterQuickClubs({search,region:state.quickRegion,formation:state.formation});
  const grid=app.querySelector('#quick-club-grid'),count=app.querySelector('[data-quick-count]');
  if(grid)grid.innerHTML=ui.renderQuickClubCards(items);
  if(count)count.textContent=`${items.length} ${items.length===1?'clube':'clubes'}`;
}
function updateHistoryList(){
  if(state.screen!=='history')return;
  const history=storage.read('history',[]).filter(record=>record.mode!=='world-cup'),filtered=filterHistory(history,historyFilters);
  const list=app.querySelector('#history-entries'),count=app.querySelector('[data-history-count]');
  if(list)list.innerHTML=ui.renderHistoryEntries(filtered,Boolean(history.length));
  if(count)count.textContent=`${filtered.length} de ${history.length} campanhas`;
  app.querySelectorAll('[data-action="history-outcome"]').forEach(button=>button.setAttribute('aria-pressed',String((button.dataset.value==='titles')===historyFilters.titlesOnly)));
}
function startDraft(){state.quickSquadId=null;state.teamName='Meu time';const date=storage.today();
  const seed=crypto.getRandomValues(new Uint32Array(1))[0];state.draft=createDraft(seed,date,state.mode);state.tournament=null;state.pendingRound=null;state.resultRecord=null;state.userMatchIndex=0;state.matchUnlockedIndex=0;state.matchMinute=0;state.matchSpeed=4;navigate('draft');
}
async function roll(kind='new'){
  if(state.rolling||(kind!=='new'&&state.draft?.rerolls<=0))return;
  const draftAtStart=state.draft,versionAtStart=navigationVersion;
  let drawn=false;
  state.rolling=true;render();
  await new Promise(r=>setTimeout(r,1500));
  if(navigationVersion!==versionAtStart||state.screen!=='draft'||state.draft!==draftAtStart){state.rolling=false;return;}
  try{state.draft=drawSquad(state.draft,squadsForMode(allSquads,state.mode),state.formation,kind,state.mode,cryptoRandomIndex);drawn=true;persist();}
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
  if(state.tournament){if(state.tournament.complete){const record=storage.read('history',[]).find(r=>r.id===`11-${state.mode}-${state.draft?.seed}-${state.draft?.date}`);if(record){state.resultRecord=record;navigate('result');return;}}navigate('match');return;}
  const picks=state.draft?.picks||[],slots=FORMATIONS[state.formation].slots;
  if(picks.length!==TEAM_SIZE||new Set(picks.map(p=>p.player.id)).size!==TEAM_SIZE||new Set(picks.map(p=>p.slot.id)).size!==TEAM_SIZE||picks.some(p=>!slots.some(s=>s.id===p.slot.id&&positionFit(p.player,s)!==null))){toast('Complete as onze posições antes de entrar em campo.');return;}
  const strength=calculateTeam(state.draft.picks),user={id:'user',name:state.teamName,clubId:'user',monograma:ui.initials(state.teamName),cores:['#2bb777','#174b2e'],lineup:state.draft.picks,strength};
  const seed=crypto.getRandomValues(new Uint32Array(1))[0];
  if(state.mode==='quick'){
    state.tournament=simulateQuickGame({picks,formation:state.formation,squads:allSquads,seed,teamName:state.teamName});
    state.pendingRound=null;state.matchFlowVersion=MATCH_FLOW_VERSION;state.userMatchIndex=state.tournament.userMatches.length-1;state.matchUnlockedIndex=state.userMatchIndex;state.matchMinute=state.tournament.userMatches.at(-1).result.duration;
    finishTournament();return;
  }
  Object.assign(state,prepareUserRound(createTournament(user,allSquads,{mode:state.mode,seed,excludeSquadIds:state.draft.picks.map(p=>p.squadId)})));
  state.matchFlowVersion=MATCH_FLOW_VERSION;state.matchUnlockedIndex=0;state.matchMinute=0;state.matchSpeed=4;navigate('match');}
function finishCurrentMatch(){stopPlayback();commitUserRound(state);persist();render();}
function nextMatch(){
  const match=currentMatch(state);if(!match||state.matchMinute<match.result.duration)return;
  stopPlayback();
  if(state.userMatchIndex<state.tournament.userMatches.length-1)state.userMatchIndex++;
  else if(canContinueTournament(state.tournament)){
    Object.assign(state,prepareUserRound(state.tournament));
    if(!state.pendingRound){finishTournament();return;}
  }else{finishTournament();return;}
  state.matchMinute=0;persist();render();
}
function finishTournament(){
  stopPlayback();
  if(!state.tournament.complete)state.tournament=simulateTournament(state.tournament);
  const t=state.tournament,c=t.campaign,league=state.mode==='brasileirao';
  const rank={group:1,round16:2,quarter:3,semi:4,final:5};
  const title='Campeão · '+competitionName(state.mode);
  const record={rulesVersion:2,id:`11-${state.mode}-${state.draft.seed}-${state.draft.date}`,date:state.draft.date,teamName:state.teamName,mode:state.mode,formation:state.formation,picks:state.draft.picks,strength:calculateTeam(state.draft.picks).overall,champion:c.champion,stageLabel:c.champion?title:league?c.stageLabel:c.stage==='group'?'Eliminado na fase de grupos':`Eliminado · ${c.stageLabel}`,rank:c.champion?6:league?Math.max(1,6-c.position):(rank[c.stage]||1),goalsFor:c.goalsFor,goalsAgainst:c.goalsAgainst,played:c.played,topScorer:c.topScorer,tournament:t};
  const history=storage.read('history',[]);
  if(!history.some(g=>g.id===record.id)){history.push(record);storage.write('history',history.slice(-50));}
  storage.remove('active');rememberSession();state.resultRecord=record;navigate('result');
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
  if(state.screen==='home'&&navigationVersion===versionAtStart)openSetup('euro');
}
async function action(name,value,element){if(state.rolling&&['draw','reroll-club','reroll-season','player'].includes(name))return;switch(name){
case'home':navigate('home');break;case'history':navigate('history');break;case'help':document.getElementById('modal-content').innerHTML=ui.renderHelp();modal.showModal();break;case'close-modal':modal.close();break;
case'setup':openSetup(value||'euro');break;case'play-home':await launchFromHome(element);break;case'mode':{if(MODES.some(m=>m.id===value)){state.mode=value;if(value==='quick')state.quickStep='formation';render();}break;}
case'formation':if(FORMATIONS[value]){state.formation=value;render();}break;case'start':if(state.mode==='quick'){state.quickStep='clubs';render();window.scrollTo({top:0,behavior:'instant'});}else startDraft();break;case'resume':{const saved=savedDraft();if(saved){const router=navigation;navigation=null;restore(saved);navigation=router;navigation?.push();window.scrollTo(0,0);}break;}
case'draw':await roll();break;case'reroll-club':await roll('club');break;case'reroll-season':await roll('season');break;case'player':selectPlayer(value);break;case'slot':slotAction(value);break;
case'tournament':startTournament();break;case'quick-team':chooseQuickTeam(value);break;case'quick-choose-club':openSetup('quick','clubs');break;case'quick-formation':openSetup('quick');break;
case'quick-region':if(['all','brasil','europa'].includes(value)){state.quickRegion=value;render();}break;
case'quick-clear':state.quickSearch='';state.quickRegion='all';render();app.querySelector('#quick-search')?.focus();break;
case'next-match':nextMatch();break;
case'match-speed':{const speed=Number(value);if(MATCH_SPEEDS.includes(speed)){state.matchSpeed=speed;persist();render();if(speed===8)app.querySelector('.match-speed-fast')?.classList.add('is-activating');}break;}
case'bracket':state.returnScreen=state.screen;navigate('bracket');break;case'back-match':navigate(state.returnScreen==='result'?'result':'match');break;
case'champions-view':{if(!['champions','euro'].includes(state.tournament?.mode))break;if(state.screen!=='bracket'){state.returnScreen=state.screen;state.championsGroupId=null;state.championsRound=null;}state.championsView=value==='knockout'?'knockout':'groups';navigate('bracket');break;}
case'champions-group':if(state.screen==='bracket'&&['champions','euro'].includes(state.tournament?.mode)&&state.tournament.groups.some(group=>group.id===value)){state.championsGroupId=value;render();}break;
case'champions-round':if(state.screen==='bracket'&&['champions','euro'].includes(state.tournament?.mode)&&['round16','quarter','semi','final'].includes(value)){state.championsRound=value;render();}break;
case'champions-tie':{if(!['champions','euro'].includes(state.tournament?.mode))break;const content=ui.renderChampionsTie(state.tournament,value);if(content){document.getElementById('modal-content').innerHTML=content;modal.showModal();}break;}
case'match-index':{const i=Number(value);if(!state.pendingRound&&Number.isInteger(i)&&i>=0&&i<state.tournament.userMatches.length){stopPlayback();state.userMatchIndex=i;state.matchMinute=state.tournament.userMatches[i].result.duration;persist();render();}break;}
case'result-lineup':if(state.screen==='result'&&state.resultRecord){document.getElementById('modal-content').innerHTML=ui.renderResultLineup(state.resultRecord);modal.showModal();}break;case'download':downloadResult(state.resultRecord);toast('Seu resultado em PNG está pronto.');break;
case'history-outcome':historyFilters.titlesOnly=value==='titles';updateHistoryList();break;
case'history-clear':Object.assign(historyFilters,{search:'',mode:'all',titlesOnly:false});render();app.querySelector('#history-search')?.focus();break;
case'history-result':{const record=storage.read('history',[]).find(g=>g.id===value);if(record){state.resultRecord=record;state.tournament=record.tournament||null;state.pendingRound=null;state.mode=record.mode;navigate('result');}break;}
}}
document.addEventListener('click',event=>{const element=event.target.closest('[data-action]');if(element&&!element.disabled)action(element.dataset.action,element.dataset.value,element).catch(error=>{console.error(error);toast('Não foi possível completar a ação. '+error.message);});});
app.addEventListener('change',event=>{if(event.target.id==='quick-season')action('quick-team',event.target.value,event.target).catch(error=>toast(error.message));});
app.addEventListener('input',event=>{if(event.target.id==='quick-search'&&state.mode==='quick'&&state.screen==='setup')updateQuickSearch(event.target.value);});
app.addEventListener('input',event=>{if(event.target.id==='history-search'&&state.screen==='history'){historyFilters.search=event.target.value;updateHistoryList();}});
app.addEventListener('change',event=>{if(event.target.id==='history-mode'&&state.screen==='history'){historyFilters.mode=event.target.value;updateHistoryList();}});
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
navigation=initBrowserNavigation({getRoute:currentRoute,onVisit:visitRoute});
navigation.start();
