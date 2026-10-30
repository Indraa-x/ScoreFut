import {matchIncidentsAt} from './match-discipline.js?v=discipline-20261030';
import { formatMatchEventMinute } from './match-motion.js?v=discipline-20261030';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

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
      players.get(key).minutes.push(formatMatchEventMinute(result,goal.minute)+'′'+(penalty?' (pen)':''));
    }
    return `<div class="match-scorers ${side}" aria-label="Gols de ${escape(names[side]||side)}">${[...players.values()].map(player=>`<p><strong>${escape(player.name)}</strong><span>${player.minutes.map(minute=>escape(minute)).join(', ')}</span></p>`).join('')}${result.events.filter(e=>e.type==='red'&&e.team===side&&e.minute<=minute).map(e=>`<p class="match-red-card"><i aria-label="Cartão vermelho"></i><strong>${escape(e.player.nome)}</strong><span>${escape(formatMatchEventMinute(result,e.minute))}′</span></p>`).join('')}</div>`;
  }).join('');
}
