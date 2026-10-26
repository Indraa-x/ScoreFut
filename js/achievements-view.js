import { achievementsFor,achievementSummary } from './achievements.js?v=browser-achievements-20261025';
import { achievementBadge } from './achievement-badges.js?v=career-medals-20261025';

const pad=value=>String(value).padStart(2,'0');

export function renderAchievementsView(records,stats,ledger,{icon}){
  const achievements=achievementsFor(records,ledger);
  const summary=achievementSummary(records,ledger);
  return `<div class="achievements-page">
    <header class="achievements-heading"><div><span class="eyebrow accent">SALA DE TROFÉUS</span><h1>Conquistas</h1><p>Cada campanha conta para a sua coleção.</p></div><div class="achievements-total"><strong>${pad(summary.unlocked)}<small> / ${pad(summary.total)}</small></strong><span>medalhas conquistadas</span><div class="achievement-total-track" aria-hidden="true">${achievements.map(item=>`<i class="${item.unlocked?'filled':''}"></i>`).join('')}</div></div></header>
    <section class="achievements-overview" aria-label="Seu progresso no jogo">${[['stat-campaigns',stats.played,'Campanhas jogadas'],['stat-trophy',stats.titles,'Títulos conquistados'],['flame',stats.streak,'Sequência atual']].map(([mark,value,label])=>`<div class="achievements-stat">${icon(mark)}<strong>${pad(value)}</strong><span>${label}</span></div>`).join('')}</section>
    <section class="achievements-cabinet" aria-labelledby="achievement-collection-title"><header class="achievement-collection-heading"><h2 id="achievement-collection-title">Sua coleção</h2><span>${summary.total-summary.unlocked} ${summary.total-summary.unlocked===1?'medalha para buscar':'medalhas para buscar'}</span></header><div class="achievement-shelf">${achievements.map(item=>`<article class="achievement-tile ${item.unlocked?'is-earned':'is-pending'}" data-achievement="${item.id}">${achievementBadge(item.id,item.unlocked)}<h3>${item.name}</h3><p>${item.description}</p><span class="achievement-state">${item.unlocked?'Conquistada':`${item.value} de ${item.target}`}</span></article>`).join('')}</div></section>
    <p class="achievements-save-note">${icon('shield')} Suas conquistas são salvas automaticamente neste navegador.</p>
  </div>`;
}
