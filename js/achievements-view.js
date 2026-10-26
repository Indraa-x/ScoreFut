import { achievementsFor,achievementSummary } from './achievements.js?v=world-cup-20261026';

const pad=value=>String(value).padStart(2,'0');
const competitions={
  'world-cup-title':{name:'Copa do Mundo',trophy:'assets/competitions/world-cup-trophy.png'},
  'champions-title':{name:'Champions League',trophy:'assets/competitions/champions-trophy.png'},
  'brazil-title':{name:'Copa do Brasil',trophy:'assets/competitions/brazil-cup-trophy.png'}
};

function milestone(item,icon){
  return `<article class="achievement-tile ${item.unlocked?'is-earned':'is-pending'}" data-achievement="${item.id}">
    <span class="achievement-emblem" aria-hidden="true">${icon(item.icon)}</span>
    <div class="achievement-copy"><h3>${item.name}</h3><p>${item.description}</p></div>
    <div class="achievement-progress"><span class="achievement-state">${item.unlocked?`${icon('check')} Conquistada`:`<b>${item.value}</b> / ${item.target}`}</span><span class="achievement-track" role="progressbar" aria-label="${item.name}" aria-valuemin="0" aria-valuemax="${item.target}" aria-valuenow="${item.value}"><i style="width:${item.value/item.target*100}%"></i></span></div>
  </article>`;
}

function competitionTitle(item,icon){
  const competition=competitions[item.id];
  return `<article class="achievement-tile competition-achievement ${item.unlocked?'is-earned':'is-pending'}" data-achievement="${item.id}">
    <div class="achievement-cup" aria-hidden="true"><img src="${competition.trophy}" alt="" width="76" height="92" draggable="false"></div>
    <div class="achievement-copy"><span class="achievement-competition-name">${competition.name}</span><h3>${item.name}</h3><p>${item.description}</p><span class="achievement-state">${icon(item.unlocked?'check':'shield')} ${item.unlocked?'Conquistada':'A conquistar'}</span></div>
  </article>`;
}

export function renderAchievementsView(records,stats,ledger,{icon}){
  const achievements=achievementsFor(records,ledger);
  const summary=achievementSummary(records,ledger);
  const milestones=achievements.filter(item=>!competitions[item.id]);
  const titles=achievements.filter(item=>competitions[item.id]);
  return `<div class="achievements-page">
    <header class="screen-title achievements-title"><div><span class="eyebrow accent">SEU PROGRESSO</span><h1>Conquistas</h1><p>Cada campanha, uma nova marca.</p></div><div class="achievements-total"><div><strong>${pad(summary.unlocked)}<small> / ${pad(summary.total)}</small></strong><span>desbloqueadas</span></div><span class="achievements-total-track" aria-hidden="true"><i style="width:${summary.unlocked/summary.total*100}%"></i></span></div></header>
    <section class="achievements-overview panel" aria-label="Seu progresso no jogo">${[['stat-campaigns',stats.played,'Campanhas jogadas','campaigns'],['stat-trophy',stats.titles,'Títulos conquistados','titles'],['flame',stats.streak,'Sequência atual','streak']].map(([mark,value,label,kind])=>`<div class="achievements-stat"><span class="achievement-stat-icon ${kind}" aria-hidden="true">${icon(mark)}</span><div><strong>${pad(value)}</strong><span>${label}</span></div></div>`).join('')}</section>
    <div class="achievements-layout">
      <section class="panel achievements-journey" aria-labelledby="achievement-collection-title"><header class="achievement-section-heading"><div><h2 id="achievement-collection-title">Sua trajetória</h2><p>Do primeiro jogo à sequência de vitórias.</p></div><span>${milestones.filter(item=>item.unlocked).length} / ${milestones.length}</span></header><div class="achievement-milestones">${milestones.map(item=>milestone(item,icon)).join('')}</div></section>
      <section class="panel achievements-titles" aria-labelledby="achievement-titles-title"><header class="achievement-section-heading"><div><h2 id="achievement-titles-title">As grandes taças</h2><p>O topo de cada competição.</p></div><span>${titles.filter(item=>item.unlocked).length} / ${titles.length}</span></header><div class="achievement-competitions">${titles.map(item=>competitionTitle(item,icon)).join('')}</div></section>
    </div>
    <p class="achievements-save-note">${icon('shield')} Suas conquistas são salvas automaticamente neste navegador.</p>
  </div>`;
}
