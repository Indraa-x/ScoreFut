import { achievementsFor,achievementSummary } from './achievements.js?v=username-login-20261025';
import { achievementBadge } from './achievement-badges.js?v=career-medals-20261025';
import { competitionName } from '../data/competitions.js?v=euro-20261023';
import { formatHistoryDate } from './history.js?v=euro-20261023';

const pad=value=>String(value).padStart(2,'0');
const exitIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M10 4H4v16h6m4-13 5 5-5 5m-6-5h13"/></svg>';

function profileEmblem(name,esc){
  const monogram=Array.from(name).slice(0,2).join('').toLocaleUpperCase('pt-BR');
  return `<svg class="career-emblem" viewBox="0 0 84 96" aria-hidden="true"><path class="career-emblem-edge" d="m42 3 36 13v33c0 20-15 34-36 44C21 83 6 69 6 49V16L42 3Z"/><path class="career-emblem-field" d="m42 9 30 11v29c0 16-12 28-30 38C24 77 12 65 12 49V20L42 9Z"/><path class="career-emblem-stripe" d="M26 15v60l8 6V12Zm24-3v69l8-6V15Z"/><path class="career-emblem-shirt" d="m31 30-13 8 7 12 7-4v24h20V46l7 4 7-12-13-8c-4 7-18 7-22 0Z"/><text x="42" y="58" text-anchor="middle">${esc(monogram)}</text><path class="career-emblem-stitch" d="M35 22h14M38 77h8"/></svg>`;
}

function achievementTiles(achievements){
  return achievements.map(item=>`<article class="achievement-tile ${item.unlocked?'is-earned':'is-pending'}" data-achievement="${item.id}">
    ${achievementBadge(item.id,item.unlocked)}
    <h4>${item.name}</h4><p>${item.description}</p>
    <span class="achievement-state">${item.unlocked?'Conquistada':`${item.value} de ${item.target}`}</span>
  </article>`).join('');
}

function recentCampaigns(history,{esc,icon}){
  const recent=[...history].reverse().slice(0,3);
  if(!recent.length)return `<div class="career-empty">${icon('ball')}<p>Sua primeira campanha começa no campo.<span>Jogue uma competição para abrir seu histórico.</span></p></div>`;
  return `<div class="career-results">${recent.map((record,index)=>`<div class="career-result ${record.champion?'is-champion':''}">
    <span class="career-result-number">${pad(index+1)}</span>
    <span class="career-result-team"><strong>${esc(record.teamName||'Meu time')}</strong><small>${esc(competitionName(record.mode))}${record.date?`<span> · ${esc(formatHistoryDate(record.date))}</span>`:''}</small></span>
    <span class="career-result-outcome">${record.champion?`${icon('trophy')} Campeão`:esc(record.stageLabel||'Campanha encerrada').replace(/^Eliminado\s*[·—-]\s*/i,'')}</span>
  </div>`).join('')}</div>`;
}

export function renderAccountView(account,records,stats,view,{esc,icon}){
  const history=Array.isArray(records)?records:[];
  const achievements=achievementsFor(history);
  const summary=achievementSummary(history);
  if(!account){
    const create=view==='register';
    const preview=achievements.filter(item=>item.unlocked).slice(-3);
    const display=preview.length?preview:achievements.slice(0,3);
    return `<div class="account-modal-view"><div class="modal-head"><div><span class="eyebrow accent">SCOREFUT · PERFIL</span><h2 id="modal-title">${create?'Crie sua conta':'Entre na sua conta'}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Fechar">${icon('close')}</button></div>
      <div class="account-auth-layout"><section class="account-auth-card"><span class="account-brand-mark">${icon('ball')}</span><span class="eyebrow accent">SUA JORNADA, SALVA</span><h3>${create?'Comece sua história':'Bom ter você de volta'}</h3><p>${create?'Crie um perfil para organizar seu histórico e acompanhar cada conquista.':'Entre para rever suas campanhas e continuar acumulando conquistas.'}</p>
        <form class="account-form" id="account-form" data-mode="${create?'register':'login'}" novalidate><label for="account-username">Nome de usuário</label><input id="account-username" name="username" type="text" minlength="3" maxlength="40" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="${create?'Escolha seu nome de usuário':'Seu nome de usuário'}" required><label for="account-password">Senha</label><input id="account-password" name="password" type="password" autocomplete="${create?'new-password':'current-password'}" minlength="8" maxlength="128" placeholder="${create?'Pelo menos 8 caracteres':'Sua senha'}" required><p class="account-form-error" id="account-error" role="alert" hidden></p><button class="btn btn-primary account-submit" type="submit">${create?'Criar conta':'Entrar'} ${icon('arrow')}</button></form>
        <p class="account-switch">${create?'Já tem uma conta?':'Ainda não tem conta?'} <button type="button" data-action="account-mode" data-value="${create?'login':'register'}">${create?'Entrar':'Criar conta'}</button></p><p class="account-local-note">Conta local · guarde a senha; não há recuperação ou sincronização.</p>
      </section><aside class="account-benefit-card"><span class="eyebrow">SUA COLEÇÃO COMEÇA AQUI</span><h3>Cada campanha<br>deixa uma marca.</h3><p>Seu histórico em campo. Suas conquistas na coleção.</p><div class="account-preview-medals">${display.map(item=>`<div>${achievementBadge(item.id,item.unlocked)}<span>${item.name}</span></div>`).join('')}</div><div class="account-preview-stats"><span><b>${pad(stats.played)}</b> campanhas</span><span><b>${pad(stats.titles)}</b> títulos</span><span><b>${summary.unlocked}/${summary.total}</b> conquistas</span></div></aside></div></div>`;
  }

  const name=String(account.username||account.name||'Jogador');
  const joined=new Date(account.createdAt);
  const memberSince=Number.isFinite(joined.getTime())?`Desde ${new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(joined)}`:'Seu perfil no ScoreFut';
  return `<div class="account-modal-view account-career">
    <header class="modal-head"><div><span class="eyebrow accent">SCOREFUT / PERFIL</span><h2 id="modal-title">Sua carreira</h2></div><button class="icon-button" data-action="close-modal" aria-label="Fechar">${icon('close')}</button></header>
    <section class="career-passport" aria-label="Perfil e estatísticas">
      <div class="career-identity">${profileEmblem(name,esc)}<div class="career-player"><span class="eyebrow">JOGADOR</span><h3>${esc(name)}</h3><p>${memberSince}</p></div><button class="career-logout" data-action="account-logout" aria-label="Sair da conta">${exitIcon}<span>Sair</span></button></div>
      <div class="career-honours">${icon('trophy')}<strong>${pad(stats.titles)}</strong><span>títulos<br> conquistados</span></div>
      <div class="career-record"><div><strong>${pad(stats.played)}</strong><span>Campanhas jogadas</span></div><div><strong>${stats.winRate}<small>%</small></strong><span>Taxa de títulos</span></div><div><strong>${pad(stats.streak)}</strong><span>Sequência atual</span></div></div>
    </section>
    <section class="career-collection" aria-labelledby="career-collection-title"><header class="career-section-head"><div><span class="eyebrow">SUA COLEÇÃO</span><h3 id="career-collection-title">Conquistas</h3></div><div class="career-collection-count"><span><b>${pad(summary.unlocked)}</b> / ${pad(summary.total)} <small>conquistadas</small></span><div class="career-collection-track" aria-hidden="true">${achievements.map(item=>`<i class="${item.unlocked?'filled':''}"></i>`).join('')}</div></div></header><div class="achievement-shelf">${achievementTiles(achievements)}</div></section>
    <section class="career-history" aria-labelledby="career-history-title"><header class="career-section-head"><div><span class="eyebrow">ÚLTIMAS CAMPANHAS</span><h3 id="career-history-title">No seu histórico</h3></div><button class="account-history-link" data-action="account-history">Ver histórico ${icon('arrow')}</button></header>${recentCampaigns(history,{esc,icon})}</section>
    <p class="account-local-note account-footnote">Perfil salvo neste navegador · sem sincronização entre aparelhos.</p>
  </div>`;
}
