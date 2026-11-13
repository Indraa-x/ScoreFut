import {escapeHtml as escape} from './html.js';
import {matchIncidentsAt} from './match-discipline.js';
import { formatMatchEventMinute } from './match-motion.js';


export const goalBallIcon = '<svg class="match-goal-ball" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="m12 8 4 3-1.5 4h-5L8 11Zm0-5v5m9 2-5 1m1.5 8L14.5 15m-8 4L9.5 15M3 10l5 1"/></svg>';

export function goalsAt(result,minute){
  return result.events.filter(event=>event.type==='goal'&&!event.shootout&&event.minute<=minute).sort((a,b)=>a.minute-b.minute);
}

/** Only scorers already revealed by the clock, grouped by team and player. */
export function renderMatchGoals(result,minute,names={}){
  const goals=goalsAt(result,minute);
  if(!matchIncidentsAt(result,minute).length)return '';
  return ['home','away'].map(side=>{
    const players=new Map();
    for(const goal of goals.filter(goal=>goal.team===side)){
      const key=goal.player.id||goal.player.nome;
      if(!players.has(key))players.set(key,{name:goal.player.nome,minutes:[]});
      const penalty=goal.origin==='penalty'||result.events.some(e=>e.type==='penalty'&&!e.shootout&&e.converted&&e.team===goal.team&&e.player.id===goal.player.id&&(e.goalMinute??e.minute)===goal.minute);
      players.get(key).minutes.push(formatMatchEventMinute(result,goal.minute)+'′'+(penalty?' (Pen)':''));
    }
    return `<div class="match-scorers ${side}" aria-label="Gols de ${escape(names[side]||side)}">${[...players.values()].map(player=>`<p><strong>${goalBallIcon}${escape(player.name)}</strong><span>${player.minutes.map(minute=>escape(minute)).join(', ')}</span></p>`).join('')}${result.events.filter(e=>e.type==='red'&&e.team===side&&e.minute<=minute).map(e=>`<p class="match-red-card"><i aria-label="Cartão vermelho"></i><strong>${escape(e.player.nome)}</strong><span>${escape(formatMatchEventMinute(result,e.minute))}′</span></p>`).join('')}</div>`;
  }).join('');
}
