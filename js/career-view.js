import {escapeHtml as esc} from './html.js';
import {FORMATIONS, calculateTeam} from './engine.js';
import {
  CAREER_CRESTS, CAREER_TEAM, FACILITIES, MAX_CAREER_ROSTER, MAX_FACILITY_LEVEL, careerClub,
  careerFixtures, careerOffers, careerPicks, careerSlotOptions, careerTable, facilityPrice, nextCareerMatch,
} from './career.js';

export const CAREER_TABS = {
  overview: 'Visão geral', squad: 'Elenco', market: 'Mercado', facilities: 'Instalações', club: 'Meu clube',
};
const badgeDesigns = [
  ['#11634b', '#9af1c9', '<circle cx="24" cy="22" r="9"/><path d="m24 18 4 3-1 4h-6l-1-4zM24 18v-5m4 8 4-2m-5 6 2 4m-8-4-2 4m1-8-4-2"/>'],
  ['#342613', '#ffd37d', '<path d="m14 18 3-6 5 2 4-3 6 4 3 7-3 4-4-1-4 6-6-3-4-5Zm5 0 4 2 6-2m-3 5 3 2m-8 2 3-4"/>'],
  ['#192c4d', '#d5e9ff', '<path d="m12 16 8 4 4-5 4 5 8-4-4 9-5 2-3 5-3-5-5-2Z"/><path d="m20 20 4 3 4-3"/>'],
  ['#174735', '#d6f7e4', '<path d="m11 29 8-12 4 6 5-10 9 16ZM17 20l3 2 2-1m4-4 2 2 2-1"/>'],
  ['#402435', '#ffd087', '<path fill="currentColor" d="m24 12 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>'],
  ['#1c3154', '#d8e8ff', '<path stroke-width="4" d="M15 14v12m9-15v23m9-20v12"/>'],
  ['#3d3210', '#ffda63', '<path fill="currentColor" d="m26 11-12 14h9l-2 10 13-15h-9Z"/>'],
  ['#333a48', '#eef1f6', '<path d="M16 13v7l3 3-2 9h14l-2-9 3-3v-7h-4v4h-2v-4h-4v4h-2v-4Zm8 12v3"/>'],
];
export function careerCrest(id) {
  const [fill, color, art] = badgeDesigns[Math.max(0, CAREER_CRESTS.indexOf(id))];
  return `<svg class="career-crest" viewBox="0 0 48 48" aria-hidden="true" focusable="false" style="color:${color}"><path d="M24 3 42 9v11c0 11-7 19-18 24C13 39 6 31 6 20V9Z" fill="${fill}" stroke="currentColor" stroke-width="2"/><g fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${art}</g></svg>`;
}
const money = amount => amount < 1000
  ? `R$ ${amount.toLocaleString('pt-BR')} mil`
  : `R$ ${(amount / 1000).toLocaleString('pt-BR', {maximumFractionDigits: 2})} mi`;
const button = (label, action, value = '', primary = false, disabled = false) =>
  `<button type="button" class="btn ${primary ? 'btn-primary' : 'btn-outline'}" data-action="${action}" data-value="${esc(value)}"${disabled ? ' disabled' : ''}>${label}</button>`;
const title = (label, description) => `<h2>${label}</h2><p class="muted">${description}</p>`;

function clubBadge(career, id, ui) {
  const club = careerClub(career, id);
  return id === CAREER_TEAM ? careerCrest(career.crest) : ui.badge(club);
}

function pitch(career, ui, details = false) {
  const picks = careerPicks(career);
  return `<div class="career-pitch" role="img" aria-label="Escalação ${FORMATIONS[career.formation].name}: ${esc(picks.map(({slot, player}) => `${slot.label} ${player.nome}`).join(', '))}">
    ${ui.pitchLines()}
    ${picks.map(({slot, player}) => `<div class="career-pitch-player" style="left:${slot.x}%;top:${slot.y}%">
      <span class="career-pitch-marker${slot.position === 'GOL' ? ' is-keeper' : ''}" title="${esc(player.nome)} · ${player.ovr} OVR">${slot.label}</span>
      ${details ? `<small>${esc(player.nome.split(' ').at(-1))}</small>` : ''}
    </div>`).join('')}
  </div>`;
}

function renderTable(career, ui, rows) {
  return `<details class="career-card panel career-league"><summary>Classificação do campeonato</summary>
    <div class="career-table-wrap"><table class="career-table"><thead><tr>
      <th scope="col">Pos.</th><th scope="col">Clube</th><th scope="col">Pts</th><th scope="col">J</th><th scope="col">V</th><th scope="col">SG</th>
    </tr></thead><tbody>${rows.map((row, index) => `<tr${row.id === CAREER_TEAM ? ' class="career-own-row"' : ''}>
      <td>${index + 1}</td><th scope="row">${clubBadge(career, row.id, ui)} ${esc(careerClub(career, row.id).nome)}</th>
      <td><strong>${row.points}</strong></td><td>${row.played}</td><td>${row.wins}</td><td>${row.goalsFor - row.goalsAgainst}</td>
    </tr>`).join('')}</tbody></table></div>
  </details>`;
}

function overview(career, ui, rows) {
  const fixture = nextCareerMatch(career);
  const last = career.results.at(-1)?.find(result => result.home === CAREER_TEAM || result.away === CAREER_TEAM);
  const position = rows.findIndex(row => row.id === CAREER_TEAM) + 1;
  const total = careerFixtures(career).length;
  const match = fixture
    ? `${title('Próxima partida', `Campeonato Brasileiro · Rodada ${career.round + 1} de ${total}`)}
      <div class="career-matchup">${fixture.map((id, index) => `${index ? '<span aria-hidden="true">×</span>' : ''}
        <div>${clubBadge(career, id, ui)}<strong>${esc(careerClub(career, id).nome)}</strong><small>${index ? 'Visitante' : 'Mandante'}</small></div>`).join('')}</div>
      ${button(career.replay?.round === career.round ? 'Continuar partida' : 'Simular partida', 'career-play', `${career.season}:${career.round}`, true)}`
    : `${title('Temporada encerrada', position === 1 ? 'Seu clube conquistou o título!' : `Seu clube terminou em ${position}º lugar.`)}
      <p>Receba a premiação e inicie um novo campeonato com seu elenco e suas instalações.</p>
      ${button('Iniciar próxima temporada', 'career-next-season', String(career.season), true)}`;
  return `<div class="career-columns">
    <section class="career-card panel career-match">${match}
      ${last ? `<div class="career-last">
        <small>Último resultado · Rodada ${career.round}</small>
        <strong>${esc(careerClub(career, last.home).nome)} ${last.homeGoals} × ${last.awayGoals} ${esc(careerClub(career, last.away).nome)}</strong>
        ${last.scorers.length ? `<span>${last.scorers.map(scorer => esc(scorer.name) + (scorer.goals > 1 ? ` (${scorer.goals})` : '')).join(' · ')}</span>` : ''}
        <span>Receita da partida: ${money(last.income)}</span>
      </div>` : ''}
    </section>
    <section class="career-card panel">
      <div class="career-card-heading"><h2>Escalação</h2><span class="career-pill">${FORMATIONS[career.formation].name}</span></div>
      ${pitch(career, ui)}
      ${button('Editar escalação', 'career-tab', 'squad')}
    </section>
  </div>
  ${renderTable(career, ui, rows)}
  ${career.seasons.length ? `<details class="career-card panel"><summary>Temporadas anteriores</summary><ul class="career-history">${[...career.seasons].reverse().map(season =>
    `<li>Temporada ${season.number} · ${season.position === 1 ? 'Campeão' : `${season.position}º lugar`} · ${season.points} pts · ${money(season.prize)} em premiação</li>`).join('')}</ul></details>` : ''}`;
}

function squad(career, ui) {
  const picks = careerPicks(career);
  const starters = new Set(picks.map(pick => pick.player.id));
  return `<div class="career-columns">
    <section class="career-card panel">
      <div class="career-card-heading"><h2>Escalação titular</h2><span class="career-pill">${Math.round(calculateTeam(picks).overall)} OVR</span></div>
      ${pitch(career, ui, true)}
      <label for="career-formation">Formação</label>
      <select id="career-formation">${Object.entries(FORMATIONS).map(([id, formation]) =>
        `<option value="${id}"${id === career.formation ? ' selected' : ''}>${formation.name}</option>`).join('')}</select>
    </section>
    <section class="career-card panel">
      ${title('Titulares', 'Escolha jogadores compatíveis com cada posição.')}
      <div class="career-starters">${picks.map(({slot, player}) => `<div>
        <label for="career-slot-${slot.id}">${slot.label}</label>
        <select id="career-slot-${slot.id}" data-career-slot="${slot.id}">${careerSlotOptions(career, slot).map(p =>
          `<option value="${esc(p.id)}"${p.id === player.id ? ' selected' : ''}>${esc(p.nome)} · ${p.ovr} OVR</option>`).join('')}</select>
      </div>`).join('')}</div>
    </section>
  </div>
  <section class="career-card panel">
    ${title('Reservas', `${career.roster.length} de ${MAX_CAREER_ROSTER} vagas no elenco.`)}
    <div class="career-list">${career.roster.filter(p => !starters.has(p.id)).map(p => `<div class="career-list-row">
      <div><strong>${esc(p.nome)}</strong><small>${esc(p.tags.join(' / '))} · ${p.ovr} OVR</small></div>
      ${button('Liberar', 'career-release', p.id)}
    </div>`).join('') || '<p>Sem jogadores na reserva.</p>'}</div>
  </section>`;
}

function market(career) {
  const offers = careerOffers(career);
  return `<section class="career-card panel">
    ${title('Mercado de jogadores', 'As ofertas mudam a cada cinco rodadas. Jogadores contratados entram na reserva.')}
    <div class="career-list">${offers.map(({player, price}) => `<div class="career-list-row">
      <div><strong>${esc(player.nome)}</strong><small>${esc(player.tags.join(' / '))} · ${player.ovr} OVR</small></div>
      <span class="career-price">${money(price)}</span>
      ${button('Contratar', 'career-sign', player.id, false, career.budget < price || career.roster.length >= MAX_CAREER_ROSTER)}
    </div>`).join('') || '<p>Sem ofertas nesta janela. Jogue as próximas rodadas para abrir novas oportunidades.</p>'}</div>
  </section>`;
}

function facilities(career) {
  return `<section class="career-card panel">
    ${title('Instalações do clube', 'Invista o orçamento em estrutura para fortalecer o clube ao longo da carreira.')}
    <div class="career-list">${Object.entries(FACILITIES).map(([key, facility]) => {
      const level = career.facilities[key];
      const maxed = level >= MAX_FACILITY_LEVEL;
      const price = facilityPrice(career, key);
      return `<div class="career-list-row">
        <div><strong>${facility.name}</strong> <span class="career-pill">Nível ${level}</span><small>${facility.effect}</small></div>
        ${maxed ? '<span>Nível máximo</span>' : `<span class="career-price">${money(price)}</span>${button('Melhorar', 'career-upgrade', key, false, career.budget < price || key === 'academy' && career.roster.length >= MAX_CAREER_ROSTER)}`}
      </div>`;
    }).join('')}</div>
  </section>`;
}

function club(career) {
  return `<section class="career-card panel career-customize">
    ${title('Personalizar clube', 'Escolha o nome e o escudo que vão acompanhar sua carreira.')}
    <form id="career-club-form">
      <label for="career-club-name">Nome do clube</label>
      <input id="career-club-name" name="name" maxlength="32" required value="${esc(career.name)}">
      <fieldset><legend>Escolha seu escudo</legend><div class="career-crest-options">
        ${CAREER_CRESTS.map(id => `<label class="career-crest-choice">
          <input type="radio" name="crest" value="${id}" aria-label="Escudo ${id}"${career.crest === id ? ' checked' : ''}>
          ${careerCrest(id)}
        </label>`).join('')}
      </div></fieldset>
      <button class="btn btn-primary" type="submit">Salvar clube</button>
    </form>
  </section>`;
}

export function renderCareer(career, tab, ui) {
  const rows = careerTable(career);
  const position = rows.findIndex(row => row.id === CAREER_TEAM) + 1;
  const pages = {overview, squad, market, facilities, club};
  return `<div class="career-page">
    <header class="career-title"><span class="eyebrow accent">Modo carreira</span><h1>Carreira de Treinador</h1></header>
    <nav class="career-tabs" aria-label="Seções da carreira">
      ${Object.entries(CAREER_TABS).map(([id, name]) => `<button type="button" data-action="career-tab" data-value="${id}"${id === tab ? ' aria-current="page"' : ''}>${name}</button>`).join('')}
    </nav>
    <div class="career-summary panel">
      <div class="career-identity">${careerCrest(career.crest)}<strong>${esc(career.name)}</strong></div>
      <div><small>Temporada</small><strong>${career.season}</strong></div>
      <div><small>Posição</small><strong>${career.round ? `${position}º lugar` : '—'}</strong></div>
      <div><small>Orçamento</small><strong>${money(career.budget)}</strong></div>
    </div>
    ${(pages[tab] || overview)(career, ui, rows)}
  </div>`;
}
