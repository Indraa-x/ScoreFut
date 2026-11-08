import {assetUrl} from './asset-url.js';
import {escapeHtml as esc} from './html.js';
import {CAREER_LEAGUES, careerLeague, careerSeasonTeam} from '../data/career-leagues.js';

export function seasonCrest(league, index = 0) {
  const x = index % 6 * 20;
  const y = Math.floor(index / 6) * 100 / 3;
  return `<span class="career-season-crest" aria-hidden="true" style="background-image:url('${assetUrl(league.sheet)}');background-position:${x}% ${y}%"></span>`;
}

export function renderCareerSetup(leagueId, clubId, saves, ui) {
  const league = careerLeague(leagueId);
  const selected = careerSeasonTeam(clubId);
  const hasSave = selected && saves.some(save => save.clubId === clubId);
  return `<section class="career-setup">
    <header class="screen-title">
      <div><span class="eyebrow accent">Modo carreira</span><h1>Escolha seu clube</h1><p>Defina a liga e o time que você vai comandar.</p></div>
      <button type="button" class="btn btn-outline" data-action="career">${ui.icon('back')} Voltar</button>
    </header>
    <section class="career-card panel" aria-labelledby="career-setup-leagues">
      <h2 id="career-setup-leagues">1. Escolha a liga</h2>
      <div class="career-setup-leagues">${CAREER_LEAGUES.map(item => `<button type="button" data-action="career-select-league" data-value="${item.id}" aria-pressed="${item === league}">
        ${seasonCrest(item)}<span><strong>${esc(item.name)}</strong><small>${item.season} · ${item.teams.length} clubes</small></span>
      </button>`).join('')}</div>
    </section>
    ${league ? `<section class="career-card panel" aria-labelledby="career-setup-clubs">
      <h2 id="career-setup-clubs">2. Escolha o clube</h2>
      <p class="muted">${esc(league.name)} · ${league.season}${league.id === 'brasileirao' ? ' · OVRs sem nota oficial aparecem como estimativa.' : ' · OVRs oficiais do EA FC 27.'}</p>
      <div class="career-setup-clubs">${league.teams.map(team => `<button type="button" data-action="career-select-club" data-value="${team.id}" aria-pressed="${team === selected}">
        ${seasonCrest(league, team.crestIndex)}<span><strong>${esc(team.nome)}</strong><small>${team.jogadores.length} jogadores</small></span>
      </button>`).join('')}</div>
      ${selected ? `<div class="career-setup-confirm"><button class="btn btn-primary" type="button" data-action="career-create">${hasSave ? 'Continuar com' : 'Iniciar com'} ${esc(selected.nome)} ${ui.icon('arrow')}</button></div>` : ''}
    </section>` : ''}
    ${saves.length ? `<section class="career-card panel" aria-labelledby="career-setup-saves">
      <h2 id="career-setup-saves">Campanhas salvas</h2>
      <div class="career-setup-saves">${saves.map(save => `<button class="btn btn-outline" type="button" data-action="career-load" data-value="${save.clubId ?? ''}">${esc(save.name)} · Temporada ${save.season}</button>`).join('')}</div>
    </section>` : ''}
  </section>`;
}
