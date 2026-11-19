import {CAREER_BIRTH_YEARS} from '../data/career-2026/birth-years.js';
import {hashSeed, mulberry32} from './engine.js';
import {goalsAt} from './match-goals.js';

export const DEVELOPMENT_PLANS = {
  form: {name:'Recuperar forma', description:'Recupera o OVR perdido por má fase.', cost:90},
  intense: {name:'Treino intenso', description:'Mais experiência e recuperação de forma.', cost:180},
  technique: {name:'Treino técnico', description:'Ganha experiência para aumentar o OVR.', cost:80},
  potential: {name:'Desenvolver potencial', description:'Amplia o teto de evolução a cada quatro sessões.', cost:120},
  recovery: {name:'Recuperação', description:'Reduz em duas partidas o tempo de lesão.', cost:60},
};
export function playerDevelopment(career, player) {
  const year = CAREER_BIRTH_YEARS.get(player.id);
  const age = year ? 2025 + career.season - year : null;
  const saved = career.development?.players?.[player.id];
  const baseOvr = saved?.baseOvr ?? player.ovr;
  return {xp:0, baseOvr, potential:Math.min(99,Math.max(player.ovr,baseOvr+(age!==null&&age<=23?18:age!==null&&age<=28?9:4))),
    formLoss:0, badStreak:0, formRecovery:0, lastRating:null, injury:0, appearances:0, goals:0, potentialSessions:0, lastTraining:-1, ...saved, age};
}
export const developmentThreshold = ovr => 240 + Math.max(0,ovr-60)*8;
export const playerInjured = (career,id) => (career.development?.players?.[id]?.injury??0)>0;
export const developmentLocked = career => Boolean(career.replay?.round===career.round&&career.replay.season===career.season || career.champions?.replay);
function gain(player, state, amount) {
  let ovr=player.ovr, xp=state.xp+amount;
  if(state.formLoss>0)return {player,state:{...state,xp:Math.min(xp,developmentThreshold(ovr)-1)}};
  while(ovr<Math.min(99,state.potential)&&xp>=developmentThreshold(ovr)) {xp-=developmentThreshold(ovr);ovr++;}
  return {player:ovr===player.ovr?player:{...player,ovr},state:{...state,xp:ovr>=state.potential?Math.min(xp,developmentThreshold(ovr)-1):xp}};
}

// Role-aware form estimate from recorded match events, not a random player rating.
export function careerPerformance(match,team,entry) {
  const side=match.homeId===team.id?'home':'away',other=side==='home'?'away':'home';
  const goals=goalsAt(match.result,match.result.duration);
  const scored=goals.filter(e=>e.team===side&&e.player.id===entry.player.id).length;
  const assists=goals.filter(e=>e.team===side&&e.assist?.id===entry.player.id).length;
  const own=match.result[side+'Goals']??goals.filter(e=>e.team===side).length;
  const conceded=match.result[other+'Goals']??goals.filter(e=>e.team===other).length;
  const lost=own<conceded,won=own>conceded;
  const defensive=['GOL','ZAG','LE','LD','VOL'].includes(entry.slot?.position??entry.player.tags[0]);
  let rating=6.4+(won?.4:lost?-.4:0)+Math.min(1.8,scored*.9)+Math.min(1,assists*.5);
  if(defensive)rating+=conceded===0?.8:-Math.min(1.2,Math.max(0,conceded-1)*.6);
  else if(lost&&own<=1&&!scored&&!assists)rating-=.6;
  if((match.result.events??[]).some(e=>e.type==='red'&&e.team===side&&e.player?.id===entry.player.id))rating-=2;
  return Math.round(Math.max(3,Math.min(10,rating))*10)/10;
}
function restoreForm(player,state) {
  if(state.formLoss<=0||state.formRecovery<2)return {player,state};
  return {player:{...player,ovr:Math.min(99,state.potential,player.ovr+1)},
    state:{...state,formLoss:state.formLoss-1,formRecovery:0}};
}

export function trainCareerPlayer(career,id,plan) {
  const player=career.roster.find(p=>p.id===id),preset=DEVELOPMENT_PLANS[plan];
  if(!player||!preset)throw Error('Escolha um jogador e um treino válido.');
  if(developmentLocked(career))throw Error('Conclua a partida antes de treinar.');
  const state=playerDevelopment(career,player),tick=career.development?.tick??0;
  if(state.lastTraining===tick)throw Error('Este jogador já treinou. Avance uma partida para uma nova sessão.');
  if(state.injury&&plan!=='recovery')throw Error('Jogador lesionado: escolha Recuperação.');
  if(!state.injury&&plan==='recovery')throw Error('Este jogador não está lesionado.');
  if(plan==='form'&&!state.formLoss&&!state.badStreak)throw Error('Este jogador já está em boa forma.');
  if(career.budget<preset.cost)throw Error('Saldo insuficiente para esta sessão.');
  const next={...state,lastTraining:tick};
  if(plan==='recovery')next.injury=Math.max(0,next.injury-2);
  if(plan==='potential') {next.potentialSessions++;if(next.potentialSessions%4===0)next.potential=Math.min(99,next.potential+1);}
  if(plan==='form'||plan==='intense'){next.badStreak=0;if(next.formLoss>0)next.formRecovery++;}
  const restored=restoreForm(player,next);
  const amount=plan==='recovery'||plan==='form'?0:plan==='potential'?18:plan==='intense'?70:35;
  const updated=gain(restored.player,restored.state,amount);
  return {...career,budget:career.budget-preset.cost,roster:career.roster.map(p=>p.id===id?updated.player:p),
    development:{...career.development,tick,players:{...career.development?.players,[id]:updated.state}}};
}
export function progressCareerPlayers(career,match,team,canInjure=()=>false) {
  const key=`${career.season}:${match.stage}:${match.id}`;
  if(career.development?.lastMatch===key)return career;
  const tick=(career.development?.tick??0)+1, players={...career.development?.players};
  const played=new Set(team.lineup.map(p=>p.player.id));
  const entries=new Map(team.lineup.map(entry=>[entry.player.id,entry]));
  const side=match.homeId===team.id?'home':'away', goals=new Map();
  for(const goal of goalsAt(match.result,match.result.duration))if(goal.team===side)goals.set(goal.player.id,(goals.get(goal.player.id)??0)+1);
  const won=match.result.winnerId===team.id;
  let roster=career.roster.map(player=>{
    const state=playerDevelopment(career,player);
    const next={...state,injury:Math.max(0,state.injury-1)};
    if(!played.has(player.id)){players[player.id]=next;return player;}
    next.appearances++;next.goals+=goals.get(player.id)??0;
    const rating=careerPerformance(match,team,entries.get(player.id));
    next.lastRating=rating;
    let current=player;
    if(rating<6){
      next.badStreak++;next.formRecovery=0;
      if(next.badStreak>=3){
        next.badStreak=0;
        if(next.formLoss<3&&player.ovr>40){current={...player,ovr:player.ovr-1};next.formLoss++;}
      }
    }else{
      next.badStreak=0;
      if(rating>=7&&next.formLoss>0)next.formRecovery++;
    }
    const restored=restoreForm(current,next);
    const multiplier=state.age!==null&&state.age<=23?1.35:state.age!==null&&state.age>=31?0.65:1;
    const xp=rating<6?0:Math.round((28+Math.min(30,(goals.get(player.id)??0)*10)+(won?5:0))*multiplier);
    const updated=gain(restored.player,restored.state,xp);players[player.id]=updated.state;return updated.player;
  });
  // At most one injury at a time, and only when a compatible replacement exists.
  if(!Object.values(players).some(p=>p.injury>0)) {
    const rng=mulberry32(hashSeed(`${career.seed}:${key}:injury`));
    if(rng()<0.16){const eligible=roster.filter(p=>played.has(p.id)&&canInjure(p.id));
      if(eligible.length){const p=eligible[Math.floor(rng()*eligible.length)];players[p.id]={...players[p.id],injury:1+Math.floor(rng()*3)};}}
  }
  return {...career,roster,development:{tick,lastMatch:key,players}};
}
