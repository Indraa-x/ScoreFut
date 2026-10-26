import { formatMatchEventMinute } from './match-motion.js?v=world-cup-20261026';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const color=(value,fallback)=>/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value||'')?value:fallback;

export function goalsAt(result,minute){
  return result.events.filter(event=>event.type==='goal'&&!event.shootout&&event.minute<=minute).sort((a,b)=>a.minute-b.minute);
}

/** Only scorers already revealed by the clock, grouped by team and player. */
export function renderMatchGoals(result,minute,names={},colors={}){
  const goals=goalsAt(result,minute);
  if(!goals.length)return '<p class="match-no-goals">Nenhum gol marcado.</p>';
  return ['home','away'].map(side=>{
    const players=new Map();
    for(const goal of goals.filter(goal=>goal.team===side)){
      const key=goal.player.id||goal.player.nome;
      if(!players.has(key))players.set(key,{name:goal.player.nome,minutes:[]});
      players.get(key).minutes.push(formatMatchEventMinute(result,goal.minute));
    }
    const palette=colors[side]||[];
    const title=names[side]?`<h3 class="scorer-team-name" style="--team-color-1:${color(palette[0],'#13754b')};--team-color-2:${color(palette[1],'#174b2e')}">${escape(names[side])}</h3>`:'';
    return `<div class="match-scorers ${side}">${title}${[...players.values()].map(player=>`<p><strong>${escape(player.name)}</strong><span>${player.minutes.map(minute=>escape(minute)+'′').join(', ')}</span></p>`).join('')||'<span class="match-no-scorer">—</span>'}</div>`;
  }).join('');
}
