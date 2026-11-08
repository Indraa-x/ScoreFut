import {escapeHtml as esc} from './html.js';
import {assetUrl} from './asset-url.js';
import {competitionLogo} from '../data/competitions.js';
import {FORMATIONS, ROLE_COMPATIBILITY, calculateTeam} from './engine.js';
import {careerMarketCatalog, careerMarketPage} from './career-market.js';
import {renderLivePitch, renderMatchClock, renderMatchScore, renderMatchSpeed} from './match-view.js';
import {scoreAt} from './match-motion.js';
import {renderMatchGoals} from './match-goals.js';
import {currentMatch} from './match-session.js';
import {matchHasEnded} from './match-penalties.js';
import {
  CAREER_CRESTS, CAREER_TEAM, FACILITIES, MAX_CAREER_ROSTER, MAX_FACILITY_LEVEL, careerClub,
  careerDestinations, careerFixtures, careerPicks, careerScorers, careerTable, facilityPrice, nextCareerMatch,
} from './career.js';

export const CAREER_TABS = {
  overview: {label: 'Visão geral', icon: 'chart'},
  squad: {label: 'Elenco', icon: 'users'},
  market: {label: 'Mercado', icon: 'subs'},
  facilities: {label: 'Instalações', icon: 'bolt'},
  club: {label: 'Meu clube', icon: 'shield'},
};
const careerCoaches = [
  {name: 'Alex Ferguson', src: 'assets/career/ferguson.webp', key: 'ferguson'},
  {name: 'Treinador com a taça do Brasileirão', src: 'assets/career/brasileirao-coach.webp', key: 'brasileirao'},
  {name: 'Pep Guardiola com a taça da Champions League', src: 'assets/career/guardiola.webp', key: 'guardiola'},
];

export function renderCareerIntro(hasSave) {
  const action = hasSave ? 'Continuar campanha' : 'Começar campanha';
  const portrait = ({name, src, key}) =>
    `<img class="career-coach career-coach--${key}" src="${assetUrl(src)}" width="560" height="750" alt="${name}" decoding="async" draggable="false">`;
  return `<section class="home-hero career-hero">
    <div class="hero-copy">
      <h1>Comande seu time.<br><span>Faça história.</span></h1>
      <p>Monte sua escalação, contrate reforços e leve seu clube ao título do Brasileirão no modo Carreira de Treinador.</p>
      <div class="hero-actions">
        <button type="button" class="btn btn-primary hero-play-cta" data-action="career-start">
          <span class="hero-play-content">
            <span class="hero-play-ball" aria-hidden="true"><img src="${assetUrl('assets/play-ball.svg')}" width="48" height="48" alt="" draggable="false"></span>
            <span class="hero-play-label">${action}</span>
          </span>
        </button>
      </div>
      <ul class="hero-steps" aria-label="Opções disponíveis na Carreira">
        <li><span>${Object.keys(FORMATIONS).length}</span> Formações</li>
        <li><span>${CAREER_CRESTS.length}</span> Escudos</li>
        <li><span>${Object.keys(FACILITIES).length}</span> Instalações</li>
        <li><span>${MAX_CAREER_ROSTER}</span> Vagas no elenco</li>
      </ul>
    </div>
    <section class="home-stars career-coaches" aria-label="Retratos de treinadores">
      <div class="career-coach-trio">${careerCoaches.map(portrait).join('')}</div>
    </section>
  </section>`;
}

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
function careerCrest(id) {
  const [fill, color, art] = badgeDesigns[Math.max(0, CAREER_CRESTS.indexOf(id))];
  return `<svg class="career-crest" viewBox="0 0 48 48" aria-hidden="true" focusable="false" style="color:${color}"><path d="M24 3 42 9v11c0 11-7 19-18 24C13 39 6 31 6 20V9Z" fill="${fill}" stroke="currentColor" stroke-width="2"/><g fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${art}</g></svg>`;
}
const money = amount => amount < 1000
  ? `R$ ${amount.toLocaleString('pt-BR')} mil`
  : `R$ ${(amount / 1000).toLocaleString('pt-BR', {maximumFractionDigits: 2})} mi`;
const button = (label, action, value = '', primary = false, disabled = false) =>
  `<button type="button" class="btn ${primary ? 'btn-primary' : 'btn-outline'}" data-action="${action}" data-value="${esc(value)}"${disabled ? ' disabled' : ''}>${label}</button>`;
const title = (label, description) => `<h2>${label}</h2><p class="muted">${description}</p>`;
const roundLabel = (round, total) =>
  `<span class="career-competition-round">
    <span class="career-competition-brand">
      <img src="${assetUrl(competitionLogo('brasileirao'))}" width="32" height="32" alt="" decoding="async">
      <span class="career-competition-name">Campeonato Brasileiro</span>
    </span>
    <span>· Rodada ${round}${total ? ` de ${total}` : ''}</span>
  </span>`;

function clubBadge(career, id, ui) {
  const club = careerClub(career, id);
  return id === CAREER_TEAM ? careerCrest(career.crest) : ui.badge(club);
}

function pitch(career, ui) {
  const picks = careerPicks(career);
  return `<div class="career-pitch" role="img" aria-label="Escalação ${FORMATIONS[career.formation].name}: ${esc(picks.map(({slot, player}) => `${slot.label} ${player.nome}`).join(', '))}">
    ${ui.pitchLines()}
    ${picks.map(({slot, player}) => `<div class="career-pitch-player" style="left:${slot.x}%;top:${slot.y}%">
      <span class="career-pitch-marker${slot.position === 'GOL' ? ' is-keeper' : ''}" title="${esc(player.nome)} · ${player.ovr} OVR">${slot.label}</span>
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

function matchScoreboard(career, ui, live, match) {
  const {result, homeId, awayId} = match;
  const score = scoreAt(result, live.matchMinute);
  const ended = matchHasEnded(live, match);
  const homeName = careerClub(career, homeId).nome;
  const awayName = careerClub(career, awayId).nome;
  const side = (id, name, venue) => `<div>${clubBadge(career, id, ui)}<strong>${esc(name)}</strong><small>${venue}</small></div>`;
  return `${title(ended ? 'Fim de jogo' : 'Partida em andamento', roundLabel(match.round))}
    <div class="career-matchup career-live-scoreboard match-scoreboard-style">
      ${side(homeId, homeName, 'Mandante')}
      <div class="score-center">
        ${renderMatchScore(score)}
        ${renderMatchClock(result, live.matchMinute, ended)}
      </div>
      ${side(awayId, awayName, 'Visitante')}
    </div>
    <div class="match-score-goals career-live-goals" data-match-goals data-home-name="${esc(homeName)}" data-away-name="${esc(awayName)}"
      aria-label="Autores dos gols" aria-live="polite">${renderMatchGoals(result, live.matchMinute, {home: homeName, away: awayName})}</div>
    ${ended ? button('Avançar', 'career-match-return', '', true) : ''}`;
}

function lastMatchScorers(career, last) {
  const replay = career.replay;
  const oldReplay = replay?.season === career.season && replay.round === career.round - 1
    ? replay.tournament.userMatches[0] : null;
  const scorers = last.scorers || [];
  const details = scorers.some(scorer => !scorer.minutes) &&
    oldReplay?.homeId === last.home && oldReplay.awayId === last.away
    ? careerScorers(oldReplay.result) : scorers;

  return `<div class="career-last-goals">${['home', 'away'].map(side => {
    const club = careerClub(career, last[side]).nome;
    const entries = details.filter(scorer => scorer.team === side);
    return `<ul class="career-last-scorers ${side}" aria-label="Gols de ${esc(club)}">
      ${entries.map(({name, minutes, goals}) => `<li><span class="career-scorer-name">${esc(name)}</span>
        ${minutes?.length ? `<span class="career-scorer-minute">${esc(minutes.join(', '))}</span>` : goals > 1 ? `<span>(${goals})</span>` : ''}
      </li>`).join('') || '<li><span>Sem gols</span></li>'}
    </ul>`;
  }).join('')}</div>`;
}

function overview(career, ui, rows, live) {
  const liveMatch = live ? currentMatch(live) : null;
  const fixture = nextCareerMatch(career);
  const last = career.results.at(-1)?.find(result => result.home === CAREER_TEAM || result.away === CAREER_TEAM);
  const position = rows.findIndex(row => row.id === CAREER_TEAM) + 1;
  const total = careerFixtures(career).length;
  const match = liveMatch ? matchScoreboard(career, ui, live, liveMatch) : fixture
    ? `${title('Próxima partida', roundLabel(career.round + 1, total))}
      <div class="career-matchup">${fixture.map((id, index) => `${index ? '<span aria-hidden="true">×</span>' : ''}
        <div>${clubBadge(career, id, ui)}<strong>${esc(careerClub(career, id).nome)}</strong><small>${index ? 'Visitante' : 'Mandante'}</small></div>`).join('')}</div>
      ${button(career.replay?.round === career.round ? 'Continuar partida' : 'Simular partida', 'career-play', `${career.season}:${career.round}`, true)}`
    : `${title('Temporada encerrada', position === 1 ? 'Seu clube conquistou o título!' : `Seu clube terminou em ${position}º lugar.`)}
      <p>Receba a premiação e inicie um novo campeonato com seu elenco e suas instalações.</p>
      ${button('Iniciar próxima temporada', 'career-next-season', String(career.season), true)}`;
  return `<div class="career-columns">
    <section class="career-card panel career-match">${match}
      ${liveMatch ? renderMatchSpeed(live.matchSpeed, ui.icon, 'career-match-speed',
        button('Simular até o fim', 'career-match-finish', '', true, matchHasEnded(live, liveMatch))) : last ? `<div class="career-last">
        <small>Último resultado · Rodada ${career.round}</small>
        <strong>${esc(careerClub(career, last.home).nome)} ${last.homeGoals} × ${last.awayGoals} ${esc(careerClub(career, last.away).nome)}</strong>
        ${lastMatchScorers(career, last)}
      </div>` : ''}
    </section>
    ${liveMatch ? `<section class="career-card panel career-live-field" aria-label="Simulação da partida">
      <h2>Campinho</h2>
      ${renderLivePitch(live, {esc, icon: ui.icon, pitchLines: ui.pitchLines})}
    </section>` : `<section class="career-card panel">
      <div class="career-card-heading"><h2>Escalação</h2><span class="career-pill">${FORMATIONS[career.formation].name}</span></div>
      ${pitch(career, ui)}
      ${button('Editar escalação', 'career-tab', 'squad')}
    </section>`}
  </div>
  ${renderTable(career, ui, rows)}
  ${career.seasons.length ? `<details class="career-card panel"><summary>Temporadas anteriores</summary><ul class="career-history">${[...career.seasons].reverse().map(season =>
    `<li>Temporada ${season.number} · ${season.position === 1 ? 'Campeão' : `${season.position}º lugar`} · ${season.points} pts · ${money(season.prize)} em premiação</li>`).join('')}</ul></details>` : ''}`;
}

function playerToken(player, crest, className) {
  return `<span class="${className}" role="img" aria-label="${player.ovr} OVR">${crest}<strong>${player.ovr}</strong></span>`;
}

function squad(career, ui, {group = 'reserves', selectedId = null} = {}) {
  const picks = careerPicks(career);
  const starters = new Map(picks.map(({slot, player}) => [player.id, slot.label]));
  const reserves = career.roster.filter(player => !starters.has(player.id)).sort((a, b) => b.ovr - a.ovr);
  const showingReserves = group === 'reserves';
  const players = showingReserves ? reserves : picks.map(({player}) => player);
  const selected = career.roster.find(player => player.id === selectedId);
  const targets = new Set(careerDestinations(career, selectedId).map(slot => slot.id));
  const crest = careerCrest(career.crest);
  return `<div class="career-squad-layout">
    <section class="career-card panel career-roster" aria-labelledby="career-roster-title">
      <div class="career-card-heading">
        <h2 id="career-roster-title">Jogadores</h2><span class="career-pill">${career.roster.length} / ${MAX_CAREER_ROSTER}</span>
      </div>
      <div class="career-roster-switch" role="group" aria-label="Grupo de jogadores">
        <button type="button" data-action="career-squad-group" data-value="reserves" aria-pressed="${showingReserves}">Reservas <span>${reserves.length}</span></button>
        <button type="button" data-action="career-squad-group" data-value="starters" aria-pressed="${!showingReserves}">Titulares <span>${picks.length}</span></button>
      </div>
      <ul class="career-roster-list" aria-label="${showingReserves ? 'Reservas' : 'Titulares'}">
        ${players.map(player => `<li class="career-roster-row">
          <button type="button" class="career-roster-player" data-action="career-select-player" data-value="${esc(player.id)}" aria-pressed="${selectedId === player.id}">
            <span class="career-roster-position">${esc(starters.get(player.id) ?? player.tags[0])}</span>
            <span class="career-roster-name"><strong>${esc(player.nome)}</strong><small>${esc(player.tags.join(' / '))}</small></span>
            <span class="career-roster-rating">${player.ovr}<small>OVR</small></span>
          </button>
          ${showingReserves ? `<button type="button" class="career-roster-release" data-action="career-release" data-value="${esc(player.id)}" aria-label="Liberar ${esc(player.nome)}" title="Liberar ${esc(player.nome)}">${ui.icon('close')}</button>` : ''}
        </li>`).join('') || '<li class="career-roster-empty">Sem jogadores na reserva.</li>'}
      </ul>
    </section>
    <section class="career-card panel career-squad-field" aria-labelledby="career-squad-title">
      <div class="career-card-heading">
        <div><span class="eyebrow accent">11 titulares</span><h2 id="career-squad-title">Escalação titular</h2></div>
        <span class="career-squad-overall">${Math.round(calculateTeam(picks).overall)} <small>OVR</small></span>
      </div>
      <div class="career-pitch career-edit-pitch" role="group" aria-label="${selected ? esc(`Escolha uma posição destacada para ${selected.nome}`) : 'Posições no campo'}">
        ${ui.pitchLines()}
        ${picks.map(({slot, player}) => {
          const origin = player.id === selectedId;
          const target = targets.has(slot.id);
          const label = target ? `Colocar ${selected.nome} como ${slot.label} no lugar de ${player.nome}` : `${slot.label} · ${player.nome} · ${player.ovr} OVR`;
          return `<button type="button" class="career-squad-slot${target ? ' is-target' : ''}${origin ? ' is-origin' : ''}"
            style="left:${slot.x}%;top:${slot.y}%" data-action="career-pick-slot" data-value="${slot.id}"
            aria-label="${esc(label)}" title="${esc(label)}" aria-pressed="${origin}"${selected && !origin && !target ? ' disabled' : ''}>
            ${playerToken(player, crest, 'career-squad-token')}
            <span class="career-squad-role">${slot.label}</span>
            <span class="career-squad-name">${esc(player.nome)}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="career-squad-formation">
        <label for="career-formation">Formação</label>
        <select id="career-formation">${Object.entries(FORMATIONS).map(([id, formation]) =>
          `<option value="${id}"${id === career.formation ? ' selected' : ''}>${formation.name}</option>`).join('')}</select>
        ${selected ? button('Cancelar troca', 'career-cancel-pick') : ''}
      </div>
    </section>
  </div>`;
}

export function renderCareerMarketResults(career, ui, filters) {
  const {entries, total, owned, page, pages} = careerMarketPage(career, filters);
  const full = career.roster.length >= MAX_CAREER_ROSTER;
  return `<p class="career-market-count" id="career-market-count" tabindex="-1">${total.toLocaleString('pt-BR')} ${total === 1 ? 'versão encontrada' : 'versões encontradas'}</p>
    ${full ? '<p class="career-market-note">Elenco cheio. Libere um reserva para contratar.</p>' : ''}
    ${entries.length ? `<div class="career-market-grid">${entries.map(({id, player, squad, price}) => {
      const signed = owned.has(player.id);
      const affordable = career.budget >= price;
      return `<article class="career-market-player" tabindex="-1" id="career-offer-${esc(id)}">
        <div class="career-market-player-head">
          ${playerToken(player, ui.badge(squad).replace('<img ', '<img loading="lazy" '), 'career-market-token')}
          <div>
            <h3>${esc(player.nome)}</h3>
            <p>${esc(squad.nome)} <span aria-hidden="true">·</span> ${esc(squad.ano)}</p>
          </div>
        </div>
        <div class="career-market-positions" aria-label="Posições">${player.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>
        <div class="career-market-deal">
          <div><small>Transferência</small><strong>${money(price)}</strong></div>
          ${button(signed ? 'No elenco' : full ? 'Sem vaga' : affordable ? 'Contratar' : 'Sem saldo', 'career-sign', id, affordable && !full && !signed, full || signed || !affordable)}
        </div>
      </article>`;
    }).join('')}</div>` : `<div class="career-market-empty">${ui.icon('search')}<strong>Nenhum jogador encontrado</strong><p>Experimente outro nome ou limpe os filtros.</p></div>`}
    ${pages > 1 ? `<nav class="career-market-pagination" aria-label="Páginas do mercado">
      ${button('Anterior', 'career-market-page', page - 1, false, page === 1)}
      <span>Página <strong>${page}</strong> de ${pages}</span>
      ${button('Próxima', 'career-market-page', page + 1, false, page === pages)}
    </nav>` : ''}`;
}

function market(career, ui, {status, filters}) {
  const ready = status === 'ready';
  const catalog = ready ? careerMarketCatalog() : null;
  const option = (value, text, selected) =>
    `<option value="${value}"${String(value) === selected ? ' selected' : ''}>${text}</option>`;
  return `<section class="career-card panel career-market" aria-labelledby="career-market-title">
    <header class="career-market-head">
      <div>
        <span class="eyebrow accent">${ui.icon('subs')} Central de transferências</span>
        <h2 id="career-market-title">Mercado de jogadores</h2>
        <p>Monte seu elenco com jogadores de clubes e seleções de todas as épocas do ScoreFut.</p>
      </div>
      <dl class="career-market-stats">
        ${ready ? `<div><dt>Versões no catálogo</dt><dd>${catalog.offers.length.toLocaleString('pt-BR')}</dd></div>` : ''}
        <div><dt>Vagas no elenco</dt><dd>${MAX_CAREER_ROSTER - career.roster.length}</dd></div>
      </dl>
    </header>
    ${ready ? `<form id="career-market-filters" role="search" aria-label="Filtrar jogadores">
      <label class="career-market-search">Buscar jogador
        <span>${ui.icon('search')}<input type="search" id="career-market-search" name="search" placeholder="Nome, clube, seleção ou ano" value="${esc(filters.search)}"></span>
      </label>
      <label for="career-market-position">Posição<select name="position" id="career-market-position">
        ${option('', 'Todas', filters.position)}
        ${Object.keys(ROLE_COMPATIBILITY).map(tag => option(tag, tag, filters.position)).join('')}
      </select></label>
      <label for="career-market-decade">Época<select name="decade" id="career-market-decade">
        ${option('', 'Todas as épocas', filters.decade)}
        ${catalog.decades.map(decade => option(decade, `Anos ${decade}`, filters.decade)).join('')}
      </select></label>
      <label for="career-market-order">Ordenar por<select name="order" id="career-market-order">
        ${[['overall', 'Maior OVR'], ['price', 'Menor preço'], ['recent', 'Mais recentes'], ['name', 'Nome (A–Z)']].map(([value, text]) => option(value, text, filters.order)).join('')}
      </select></label>
      <div class="career-market-filter-foot">
        <label class="career-market-affordable"><input type="checkbox" name="affordable"${filters.affordable ? ' checked' : ''}> Dentro do orçamento</label>
        <button type="reset" id="career-market-reset" class="btn btn-outline">Limpar filtros</button>
      </div>
    </form>
    <div data-career-market-results>${renderCareerMarketResults(career, ui, filters)}</div>` :
    status === 'error' ? `<div class="career-market-empty"><strong>O catálogo não carregou.</strong>${button('Tentar novamente', 'career-market-retry')}</div>` :
    '<p role="status" class="career-market-note">Carregando elencos históricos…</p>'}
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

export function renderCareer(career, tab, ui, live = null, marketState, squadState) {
  const rows = careerTable(career);
  const position = rows.findIndex(row => row.id === CAREER_TEAM) + 1;
  const pages = {overview, facilities, club};
  return `<div class="career-page">
    <header class="career-title"><span class="eyebrow accent">Modo carreira</span><h1>Carreira de Treinador</h1></header>
    <nav class="career-tabs" aria-label="Seções da carreira">
      ${Object.entries(CAREER_TABS).map(([id, {label, icon}]) => `<button type="button" data-action="career-tab" data-value="${id}"${id === tab ? ' aria-current="page"' : ''}>${ui.icon(icon)}<span>${label}</span></button>`).join('')}
    </nav>
    <div class="career-summary panel">
      <div class="career-identity">${careerCrest(career.crest)}<strong>${esc(career.name)}</strong></div>
      <div><small>Temporada</small><strong>${career.season}</strong></div>
      <div><small>Posição</small><strong>${career.round ? `${position}º lugar` : '—'}</strong></div>
      <div><small>Orçamento</small><strong>${money(career.budget)}</strong></div>
    </div>
    ${tab === 'market' ? market(career, ui, marketState) : tab === 'squad' ? squad(career, ui, squadState) : (pages[tab] || overview)(career, ui, rows, live)}
  </div>`;
}
