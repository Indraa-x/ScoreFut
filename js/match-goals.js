import {escapeHtml as escape} from './html.js';
import {matchIncidentsAt} from './match-discipline.js';
import { formatMatchEventMinute } from './match-motion.js';


export const goalBallIcon = '<svg class="match-goal-ball" viewBox="0 0 24 24" stroke="#151515" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="#fff"/><path fill="#151515" stroke="none" d="m12 7 4.8 3.5-1.8 5.7H9l-1.8-5.7ZM9 2.5 12 2l3 .5L12 5ZM2.5 9l3.1 1.5L2.8 15 2 12Zm19 0 .5 3-.8 3-2.8-4.5ZM5.3 19.4l4.3-.8-.8 2.9Zm13.4 0-3.5 2.1-.8-2.9Z"/><path fill="none" d="M12 4v3m4.8 3.5 2.9-.7m-4.7 6.4 1.6 2.7m-7.6-2.7-1.6 2.7m-.2-8.4-2.9-.7"/></svg>';

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
