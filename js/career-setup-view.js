import {assetUrl} from './asset-url.js';
import {escapeHtml as esc} from './html.js';
import {CAREER_LEAGUES, careerLeague, careerSeasonTeam} from '../data/career-leagues.js';
import {careerPortraitUrl} from '../data/career-2026/player-portraits.js';
import {startsInChampions} from '../data/career-2026/champions-qualifiers.js';

export const CAREER_SAVE_LIMIT = 3;

export function seasonCrest(league, index = 0) {
  const x = index % 6 * 20;
  const y = Math.floor(index / 6) * 100 / 3;
  return `<span class="career-season-crest" aria-hidden="true" style="background-image:url('${assetUrl(league.sheet)}');background-position:${x}% ${y}%"></span>`;
}

function leagueCard(item, selected, ui) {
  return `<button class="career-league-choice" type="button" data-action="career-select-league" data-value="${item.id}" aria-pressed="${selected}">
    <span class="career-league-choice-top">
      <span class="career-league-mark">${seasonCrest(item)}</span>
      <span class="career-league-indicator">${ui.icon(selected ? 'check' : 'arrow')}</span>
    </span>
    <span class="career-league-choice-copy"><strong>${esc(item.name)}</strong><small>${item.season} · ${item.teams.length} clubes</small></span>
  </button>`;
}

const normalize = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
const trashIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/></svg>';
const average = team => Math.round(team.jogadores.reduce((sum,p)=>sum+p.ovr,0)/team.jogadores.length);
const clubStyle = team => '--pick-primary:'+esc(team.cores[0])+';--pick-secondary:'+esc(team.cores[1]);

function clubPreview(league, selected, hasSave, ui, state) {
  if (!selected) return '<aside class="career-club-preview is-empty">'+seasonCrest(league)+'<h3>Seu próximo clube</h3><p>Selecione um time para ver o elenco.</p></aside>';
  const stars=[...selected.jogadores].sort((a,b)=>b.ovr-a.ovr).slice(0,3);
  return `<aside class="career-club-preview${state.animate ? ' is-changing' : ''}" style="${clubStyle(selected)}" aria-label="Prévia de ${esc(selected.nome)}">
    <div class="career-club-preview-brand">${seasonCrest(league,selected.crestIndex)}<span>${esc(league.name)}</span><h3>${esc(selected.nome)}</h3></div>
    <dl class="career-club-preview-stats"><div><dt>OVR médio</dt><dd>${average(selected)}</dd></div><div><dt>Jogadores</dt><dd>${selected.jogadores.length}</dd></div></dl>
    <div class="career-club-preview-stars"><h4>Destaques do elenco</h4>${stars.map(player=>{const photo=careerPortraitUrl(player);return `<div><span class="career-setup-player-photo">${ui.icon('users')}${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async">` : ''}</span><span><strong>${esc(player.nome)}</strong><small>${esc(player.tags.join(' / '))}</small></span><b>${player.ovr}</b></div>`;}).join('')}</div>
    <p class="career-club-preview-competition">${ui.icon(startsInChampions(selected.id)?'trophy':'calendar')}${startsInChampions(selected.id)?'Liga nacional + Champions':'Liga nacional'}</p>
    <button class="btn btn-primary" type="button" data-action="career-create"${state.full&&!hasSave?' disabled':''}>${hasSave?'Continuar campanha':state.full?'Limite de campanhas':'Iniciar campanha'}${ui.icon('arrow')}</button>
    ${state.full&&!hasSave?'<p class="career-club-catalog-note">Exclua uma campanha salva para iniciar outra.</p>':''}
  </aside>`;
}

export function renderCareerClubChoices(league,selected,ui,search='') {
  const teams=league.teams.filter(team=>normalize(team.nome).includes(normalize(search)));
  return {count:teams.length,html:teams.map(team=>`<button class="career-club-tile" type="button" data-action="career-select-club" data-value="${team.id}" aria-pressed="${team===selected}" style="${clubStyle(team)}">
        <span class="career-club-tile-top"><span class="career-club-tile-rating" title="Média de OVR do elenco">${average(team)}<small>OVR</small></span>${team===selected?ui.icon('check'):startsInChampions(team.id)?'<span class="career-club-champions" title="Champions na 1ª temporada" aria-label="Champions na 1ª temporada">'+ui.icon('trophy')+'</span>':''}</span>
        ${seasonCrest(league,team.crestIndex)}<strong>${esc(team.nome)}</strong>
      </button>`).join('')||`<div class="career-club-search-empty">${ui.icon('search')}<p>Nenhum clube encontrado.</p><button type="button" data-action="career-setup-clear">Limpar busca</button></div>`};
}

function clubPicker(league, selected, hasSave, ui, state) {
  const choices=renderCareerClubChoices(league,selected,ui,state.search??'');
  return `<section class="career-card panel career-setup-stage career-club-stage" data-league="${league.id}" aria-labelledby="career-setup-clubs">
    <div class="career-setup-section-heading"><h2 id="career-setup-clubs">Escolha o clube</h2><span class="career-setup-league-label">${seasonCrest(league)}${esc(league.name)}</span></div>
    <div class="career-club-browser"><div class="career-club-catalog">
      <label class="career-club-search">${ui.icon('search')}<input id="career-setup-search" type="search" placeholder="Buscar clube" aria-label="Buscar clube" value="${esc(state.search??'')}" autocomplete="off"><span data-club-search-count aria-live="polite">${choices.count} ${choices.count===1?'clube':'clubes'}</span></label>
      <div class="career-club-grid">${choices.html}</div>
      <p class="career-club-catalog-note">${league.id==='brasileirao'?'OVRs sem nota oficial aparecem como estimativa.':'OVRs oficiais do EA FC 27.'}</p>
    </div>${clubPreview(league,selected,hasSave,ui,state)}</div>
  </section>`;
}

function savedCampaignCard(save, ui, state) {
  const team=careerSeasonTeam(save.clubId),league=team&&careerLeague(team.leagueId),id=save.clubId??'';
  const pending=state.pendingDelete===id,year=2025+save.season;
  const edition=league ? league.id==='brasileirao'?year:String(year).slice(-2)+'/'+String(year+1).slice(-2) : 'Temporada '+save.season;
  return `<article class="career-save-card${pending?' is-confirming':''}"><button class="career-save-choice" type="button" data-action="career-load" data-value="${esc(id)}">
    <span class="career-save-mark">${league?seasonCrest(league,team.crestIndex):ui.icon('shield')}</span><span><strong>${esc(save.name)}</strong><small>${league?esc(league.name)+' · ':''}${edition}</small></span>${ui.icon('arrow','class="career-save-arrow"')}
  </button><button class="career-save-delete" type="button" data-action="career-delete-request" data-value="${esc(id)}" aria-label="Excluir campanha de ${esc(save.name)}" title="Excluir campanha" aria-expanded="${pending}">${trashIcon}</button>
  ${pending?`<div class="career-save-confirm" role="group" aria-label="Confirmar exclusão de ${esc(save.name)}"><strong>Excluir ${esc(save.name)}?</strong><p>O progresso desta campanha será apagado.</p><div><button type="button" class="btn btn-outline" data-action="career-delete-cancel" data-value="${esc(id)}">Cancelar</button><button type="button" class="btn career-save-delete-confirm" data-action="career-delete-confirm" data-value="${esc(id)}">Excluir campanha</button></div></div>`:''}</article>`;
}

export function renderCareerSetup(leagueId, clubId, saves, ui, state = {}) {
  state = {...state, full:saves.length>=CAREER_SAVE_LIMIT};
  const league = careerLeague(leagueId);
  const team = careerSeasonTeam(clubId);
  const selected = team?.leagueId === league?.id ? team : null;
  const hasSave = selected && saves.some(save => save.clubId === selected.id);
  return `<section class="career-setup">
    <header class="career-setup-hero">
      <div class="career-setup-hero-pitch" aria-hidden="true">${ui.pitchLines(false)}</div>
      <div class="career-setup-hero-copy">
        <span class="eyebrow accent">Modo carreira</span>
        <h1>Escolha seu clube</h1>
        <p>Escolha uma liga e assuma o comando do seu time.</p>
      </div>
      <button type="button" class="btn btn-outline" data-action="career">${ui.icon('back')} Voltar</button>
    </header>
    <section class="career-card panel career-setup-stage" aria-labelledby="career-setup-leagues">
      <div class="career-setup-section-heading"><h2 id="career-setup-leagues">Escolha a liga</h2></div>
      <div class="career-setup-leagues">${CAREER_LEAGUES.map(item => leagueCard(item, item === league, ui)).join('')}</div>
    </section>
    ${league ? clubPicker(league, selected, hasSave, ui, state) : ''}
    ${saves.length || state.deletedName ? `<section class="career-card panel career-setup-stage" aria-labelledby="career-setup-saves">
      <div class="career-setup-section-heading"><h2 id="career-setup-saves">Campanhas salvas</h2><span class="career-save-limit-count">${saves.length} / ${CAREER_SAVE_LIMIT}</span></div>
      ${state.deletedName ? `<p class="career-save-undo" role="status">Campanha de ${esc(state.deletedName)} excluída.<button type="button" data-action="career-delete-undo">Desfazer</button></p>` : ''}
      <div class="career-setup-saves">${saves.map(save => savedCampaignCard(save, ui, state)).join('')}</div>
    </section>` : ''}
  </section>`;
}
