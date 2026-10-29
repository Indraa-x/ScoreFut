import { formatMatchEventMinute } from './match-motion.js?v=ovr-gap-20261029';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function goalsAt(result,minute){
  return result.events.filter(event=>event.type==='goal'&&!event.shootout&&event.minute<=minute).sort((a,b)=>a.minute-b.minute);
}

/** Only scorers already revealed by the clock, grouped by team and player. */
export function renderMatchGoals(result,minute,names={}){
  const goals=goalsAt(result,minute);
  if(!goals.length)return '';
  return ['home','away'].map(side=>{
    const players=new Map();
    for(const goal of goals.filter(goal=>goal.team===side)){
      const key=goal.player.id||goal.player.nome;
      if(!players.has(key))players.set(key,{name:goal.player.nome,minutes:[]});
      players.get(key).minutes.push(formatMatchEventMinute(result,goal.minute));
    }
    return `<div class="match-scorers ${side}" aria-label="Gols de ${escape(names[side]||side)}">${[...players.values()].map(player=>`<p><strong>${escape(player.name)}</strong><span>${player.minutes.map(minute=>escape(minute)+'′').join(', ')}</span></p>`).join('')}</div>`;
  }).join('');
}
