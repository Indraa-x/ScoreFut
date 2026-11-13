import {assetUrl} from './asset-url.js';
import {escapeHtml as esc} from './html.js';
import {CAREER_LEAGUES, careerLeague, careerSeasonTeam} from '../data/career-leagues.js';

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

function clubPicker(league, selected, hasSave, ui) {
  return `<section class="career-card panel career-setup-stage" aria-labelledby="career-setup-clubs">
    <div class="career-setup-section-heading">
      <div><h2 id="career-setup-clubs">Escolha o clube</h2>
        <p class="muted">${league.id === 'brasileirao' ? 'OVRs sem nota oficial aparecem como estimativa.' : 'OVRs oficiais do EA FC 27.'}</p>
      </div>
      <span class="career-setup-league-label">${seasonCrest(league)} ${esc(league.name)}</span>
    </div>
    <div class="career-setup-clubs">${league.teams.map(team => `<button class="career-club-choice" type="button" data-action="career-select-club" data-value="${team.id}" aria-pressed="${team === selected}">
      ${seasonCrest(league, team.crestIndex)}
      <span><strong>${esc(team.nome)}</strong><small>${team.jogadores.length} jogadores</small></span>
      ${team === selected ? ui.icon('check', 'class="career-club-selected"') : ''}
    </button>`).join('')}</div>
    ${selected ? `<div class="career-setup-confirm">
      <span class="career-setup-picked">${seasonCrest(league, selected.crestIndex)} <strong>${esc(selected.nome)}</strong></span>
      <button class="btn btn-primary" type="button" data-action="career-create">${hasSave ? 'Continuar campanha' : 'Iniciar campanha'} ${ui.icon('arrow')}</button>
    </div>` : ''}
  </section>`;
}

function savedCampaignCard(save, ui) {
  const team = careerSeasonTeam(save.clubId);
  const league = team && careerLeague(team.leagueId);
  return `<button class="career-save-choice" type="button" data-action="career-load" data-value="${esc(save.clubId ?? '')}">
    <span class="career-save-mark">${league ? seasonCrest(league, team.crestIndex) : ui.icon('shield')}</span>
    <span><strong>${esc(save.name)}</strong><small>Temporada ${save.season}${league ? ` · ${esc(league.name)}` : ''}</small></span>
    ${ui.icon('arrow', 'class="career-save-arrow"')}
  </button>`;
}

export function renderCareerSetup(leagueId, clubId, saves, ui) {
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
    ${league ? clubPicker(league, selected, hasSave, ui) : ''}
    ${saves.length ? `<section class="career-card panel career-setup-stage" aria-labelledby="career-setup-saves">
      <div class="career-setup-section-heading"><h2 id="career-setup-saves">Campanhas salvas</h2></div>
      <div class="career-setup-saves">${saves.map(save => savedCampaignCard(save, ui)).join('')}</div>
    </section>` : ''}
  </section>`;
}
