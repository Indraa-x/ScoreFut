import {escapeHtml as esc} from './html.js';
import {assetUrl} from './asset-url.js';
import {competitionLogo} from '../data/competitions.js';
import {CAREER_LEAGUES, careerLeague} from '../data/career-leagues.js';
import {seasonCrest} from './career-setup-view.js';
import {FORMATIONS, ROLE_COMPATIBILITY, calculateTeam} from './engine.js';
import {careerMarketCatalog, careerMarketPage} from './career-market.js';
import {careerPortraitUrl} from '../data/career-2026/player-portraits.js';
import {renderLivePitch, renderMatchClock, renderMatchScore, renderMatchSpeed} from './match-view.js';
import {scoreAt} from './match-motion.js';
import {goalBallIcon, renderMatchGoals} from './match-goals.js';
import {currentMatch} from './match-session.js';
import {matchHasEnded} from './match-penalties.js';
import {
  CAREER_CRESTS, CAREER_STYLES, CAREER_TEAM, FACILITIES, LAST_SAFE_POSITION, MAX_FACILITY_LEVEL, careerClub, careerStyle,
  careerCompetitionName, careerDestinations, careerFacilityLevel, careerFixtures, careerPicks, careerRosterLimit, careerScorers, careerTable, facilityPrice, nextCareerMatch,
} from './career.js';

export const CAREER_TABS = {
  overview: {label: 'Visão geral', icon: 'chart'},
  standings: {label: 'Classificação', icon: 'trophy'},
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
const CAREER_MODE_ENABLED = true;

export function renderCareerIntro(career, ui) {
  const action = CAREER_MODE_ENABLED ? career ? 'Continuar campanha' : 'Começar campanha' : 'Em desenvolvimento';
  const portrait = ({name, src, key}) =>
    `<img class="career-coach career-coach--${key}" src="${assetUrl(src)}" width="560" height="750" alt="${name}" decoding="async" draggable="false">`;
  return `<section class="home-hero career-hero">
    <div class="hero-copy">
      <h1>Comande seu time.<br><span>Faça história.</span></h1>
      <p>Escolha sua liga, monte sua escalação e leve seu clube ao título no modo Carreira de Treinador.</p>
      <div class="hero-actions">
        <button type="button" class="btn btn-primary hero-play-cta${CAREER_MODE_ENABLED ? '' : ' is-development'}" data-action="career-start"${CAREER_MODE_ENABLED ? '' : ' disabled aria-label="Modo Carreira em desenvolvimento"'}>
          <span class="hero-play-content">
            <svg class="career-tactic-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M12 5H8a2 2 0 0 0-2 2v21a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/>
              <rect x="12" y="2" width="8" height="6" rx="2"/>
              <circle cx="11" cy="23" r="1.45" fill="currentColor" stroke="none"/>
              <circle cx="21" cy="23" r="1.45" fill="currentColor" stroke="none"/>
              <path class="career-tactic-route" pathLength="1" d="M11 20v-1a4 4 0 0 1 4-4h5m-3-3 3 3-3 3"/>
            </svg>
            <span class="hero-play-label">${action}</span>
          </span>
        </button>
      </div>
      ${career ? `<div class="career-new-campaign">${button('Nova campanha', 'career-new', '', false, !CAREER_MODE_ENABLED)}</div>` : ''}
      <ul class="hero-steps" aria-label="Opções disponíveis na Carreira">
        <li><span>${Object.keys(FORMATIONS).length}</span> Formações</li>
        <li><span>${CAREER_CRESTS.length}</span> Escudos</li>
        <li><span>${Object.keys(FACILITIES).length}</span> Instalações</li>
        <li><span>${CAREER_LEAGUES.length}</span> Ligas</li>
      </ul>
    </div>
    <section class="home-stars career-coaches" aria-label="Retratos de treinadores">
      <div class="career-coach-trio">${careerCoaches.map(portrait).join('')}</div>
    </section>
  </section>
  ${renderCareerHub(career, ui)}`;
}

function renderCareerHub(career, ui) {
  const fixture = career && nextCareerMatch(career);
  const opponent = fixture && careerClub(career, fixture.find(id => id !== CAREER_TEAM));
  const position = career?.round ? careerTable(career).findIndex(row => row.id === CAREER_TEAM) + 1 : null;
  const features = [
    ['squad', 'Monte o time no campinho', 'Escolha os titulares, teste formações e organize o banco.'],
    ['market', 'Busque novos reforços', 'Encontre jogadores dos elencos 2026/27 e do Brasileirão 2026.'],
    ['facilities', 'Evolua a estrutura', 'Invista no estádio, na base e no centro de treinamento.'],
  ];
  return `<section class="career-intro-hub" aria-labelledby="career-hub-title">
    <h2 id="career-hub-title">Central da Carreira</h2>
    ${career ? `<div class="career-intro-season panel">
      <div class="career-intro-identity">${clubBadge(career, CAREER_TEAM, ui)}
        <div><small>Campanha salva</small><strong>${esc(career.name)}</strong></div>
      </div>
      <dl class="career-intro-stats">
        <div><dt>Temporada</dt><dd>${career.season}</dd></div>
        <div><dt>Posição</dt><dd>${position ? `${position}º` : '—'}</dd></div>
        <div><dt>Orçamento</dt><dd>${money(career.budget)}</dd></div>
      </dl>
      <div class="career-intro-opponent">
        ${opponent ? clubBadge(career, opponent.id, ui) : ui.icon('trophy')}
        <div><small>${opponent ? `Próxima partida · Rodada ${career.round + 1}` : esc(careerCompetitionName(career))}</small>
          <strong>${opponent ? esc(opponent.nome) : 'Temporada encerrada'}</strong></div>
      </div>
    </div>` : ''}
    <div class="career-intro-shortcuts">
      ${features.map(([id, subtitle, description]) => {
        const {label, icon} = CAREER_TABS[id];
        const content = `<span class="career-intro-icon">${ui.icon(icon)}</span>
          <span class="career-intro-card-copy"><small>${label}</small><strong>${subtitle}</strong><span>${description}</span></span>`;
        return CAREER_MODE_ENABLED && career
          ? `<button type="button" class="career-intro-card panel" data-action="career-tab" data-value="${id}">${content}${ui.icon('arrow', 'class="career-intro-arrow"')}</button>`
          : `<article class="career-intro-card panel">${content}</article>`;
      }).join('')}
    </div>
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
const money = amount => {
  if (amount < 1000) return `R$ ${amount.toLocaleString('pt-BR')} mil`;
  const [divisor, unit] = amount >= 1_000_000 ? [1_000_000, 'Bi'] : [1000, 'mi'];
  return `R$ ${(amount / divisor).toLocaleString('pt-BR', {maximumFractionDigits: 2})} ${unit}`;
};
const button = (label, action, value = '', primary = false, disabled = false) =>
  `<button type="button" class="btn ${primary ? 'btn-primary' : 'btn-outline'}" data-action="${action}" data-value="${esc(value)}"${disabled ? ' disabled' : ''}>${label}</button>`;
const title = (label, description) => `<h2>${label}</h2><p class="muted">${description}</p>`;
const roundLabel = (career, round, total) => {
  const league = careerLeague(career.leagueId);
  return `<span class="career-competition-round">
    <span class="career-competition-brand" data-league="${esc(league?.id ?? 'brasileirao')}">
      ${league ? seasonCrest(league) : `<img src="${assetUrl(competitionLogo('brasileirao'))}" width="32" height="32" alt="" decoding="async">`}
      <span class="career-competition-name">${esc(careerCompetitionName(career))}</span>
    </span>
    <span>· ${round ? `Rodada ${round}${total ? ` de ${total}` : ''}` : 'Pré-temporada'}</span>
  </span>`;
};

function clubBadge(career, id, ui) {
  const club = careerClub(career, id);
  if (club.leagueId) return seasonCrest(careerLeague(club.leagueId), club.crestIndex);
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

function standings(career, ui, rows) {
  const totalRounds = careerFixtures(career).length;
  const seasonFinished = career.round >= totalRounds;
  const hasRelegationZone = rows.length > LAST_SAFE_POSITION;
  const relegationLabel = seasonFinished ? 'Rebaixados' : 'Zona de rebaixamento';
  const leader = rows[0];
  const ownIndex = rows.findIndex(row => row.id === CAREER_TEAM);
  const own = rows[ownIndex];
  return `<section class="career-card panel career-standings" aria-labelledby="career-standings-title">
    <header class="career-standings-header">
      <div>
        <h2 id="career-standings-title">Classificação do campeonato</h2>
        <p class="muted">${roundLabel(career, career.round, totalRounds)}</p>
      </div>
      <div class="career-standings-highlights">
        <div><span class="career-section-icon">${ui.icon('shield')}</span><div><small>Seu clube</small><strong>${career.round ? `${ownIndex + 1}º lugar · ${own.points} pts` : 'Aguardando estreia'}</strong></div></div>
        ${career.round ? `<div>${clubBadge(career, leader.id, ui)}<div><small>Líder · ${leader.points} pts</small><strong>${esc(careerClub(career, leader.id).nome)}</strong></div></div>` : ''}
      </div>
    </header>
    <div class="career-table-wrap">
      <table class="career-table" aria-labelledby="career-standings-title">
        <thead><tr>
          <th scope="col" title="Posição">Pos.</th><th scope="col">Clube</th><th scope="col" title="Pontos">PTS</th>
          <th scope="col" title="Jogos">J</th><th scope="col" title="Vitórias">V</th><th scope="col" title="Empates">E</th><th scope="col" title="Derrotas">D</th>
          <th scope="col" title="Saldo de gols">SG</th>
        </tr></thead>
        <tbody>${rows.map((row, index) => {
          const isOwn = row.id === CAREER_TEAM;
          const inRelegationZone = index >= LAST_SAFE_POSITION;
          const rowClass = [isOwn && 'career-own-row', inRelegationZone && 'career-relegation-row'].filter(Boolean).join(' ');
          const draws = row.points - row.wins * 3;
          const losses = row.played - row.wins - draws;
          const difference = row.goalsFor - row.goalsAgainst;
          return `<tr${rowClass ? ` class="${rowClass}"` : ''}>
            <td><span class="career-table-rank${index === 0 && career.round ? ' is-leader' : ''}">${index + 1}</span></td>
            <th scope="row"><span class="career-table-team">${clubBadge(career, row.id, ui)}<span>${esc(careerClub(career, row.id).nome)}</span>${isOwn ? '<small>Seu clube</small>' : ''}${inRelegationZone ? `<span class="career-table-status">${seasonFinished ? 'Rebaixado' : 'Na zona de rebaixamento'}</span>` : ''}</span></th>
            <td><strong>${row.points}</strong></td><td>${row.played}</td><td>${row.wins}</td><td>${draws}</td><td>${losses}</td>
            <td>${difference > 0 ? '+' : ''}${difference}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
    ${hasRelegationZone ? `<p class="career-relegation-legend">${relegationLabel} · ${LAST_SAFE_POSITION + 1}º ao ${rows.length}º lugar</p>` : ''}
  </section>`;
}

function matchVenue(isHome) {
  const outline = isHome
    ? 'm3 11 9-8 9 8M5 10v10h14V10M10 20v-6h4v6'
    : 'M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M8 8v12m8-12v12M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z';
  return `<small class="career-match-venue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${outline}"/></svg>${isHome ? 'Mandante' : 'Visitante'}</small>`;
}

function matchScoreboard(career, ui, live, match) {
  const {result, homeId, awayId} = match;
  const score = scoreAt(result, live.matchMinute);
  const ended = matchHasEnded(live, match);
  const homeName = careerClub(career, homeId).nome;
  const awayName = careerClub(career, awayId).nome;
  const side = (id, name, isHome) => `<div>${clubBadge(career, id, ui)}<strong>${esc(name)}</strong>${matchVenue(isHome)}</div>`;
  return `${title(ended ? 'Fim de jogo' : 'Partida em andamento', roundLabel(career, match.round))}
    <div class="career-matchup career-live-scoreboard match-scoreboard-style">
      ${side(homeId, homeName, true)}
      <div class="score-center">
        ${renderMatchScore(score)}
        ${renderMatchClock(result, live.matchMinute, ended)}
      </div>
      ${side(awayId, awayName, false)}
    </div>
    <div class="match-score-goals career-live-goals" data-match-goals data-home-name="${esc(homeName)}" data-away-name="${esc(awayName)}"
      aria-label="Autores dos gols" aria-live="polite">${renderMatchGoals(result, live.matchMinute, {home: homeName, away: awayName})}</div>
    ${ended ? button('Avançar', 'career-match-return', '', true) : renderMatchSpeed(live.matchSpeed, ui.icon, 'career-match-speed',
      button('Simular até o fim', 'career-match-finish', '', true))}`;
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
      ${entries.map(({name, minutes, goals}) => `<li><span class="career-scorer-name">${goalBallIcon}${esc(name)}</span>
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
    ? `${title('Próxima partida', roundLabel(career, career.round + 1, total))}
      <div class="career-matchup">${fixture.map((id, index) => `${index ? '<span aria-hidden="true">×</span>' : ''}
        <div>${clubBadge(career, id, ui)}<strong>${esc(careerClub(career, id).nome)}</strong>${matchVenue(index === 0)}</div>`).join('')}</div>
      ${button(career.replay?.round === career.round ? 'Continuar partida' : 'Simular partida', 'career-play', `${career.season}:${career.round}`, true)}`
    : `${title('Temporada encerrada', position === 1 ? 'Seu clube conquistou o título!' : position > LAST_SAFE_POSITION ? `Seu clube foi rebaixado em ${position}º lugar.` : `Seu clube terminou em ${position}º lugar.`)}
      <p>Receba a premiação e inicie um novo campeonato com seu elenco e suas instalações.</p>
      ${button('Iniciar próxima temporada', 'career-next-season', String(career.season), true)}`;
  return `<div class="career-columns">
    <section class="career-card panel career-match">${match}
      ${!liveMatch && last ? `<div class="career-last">
        <small>Último resultado · Rodada ${career.round}</small>
        <strong>${esc(careerClub(career, last.home).nome)} ${last.homeGoals} × ${last.awayGoals} ${esc(careerClub(career, last.away).nome)}</strong>
        ${lastMatchScorers(career, last)}
      </div>` : ''}
    </section>
    ${liveMatch ? `<section class="career-card panel career-live-field" aria-label="Simulação da partida">
      <div class="career-card-heading">
        <h2>Campinho</h2>
        <span class="career-match-status${matchHasEnded(live, liveMatch) ? '' : ' is-live'}">${matchHasEnded(live, liveMatch) ? 'Encerrada' : 'Em jogo'}</span>
      </div>
      ${renderLivePitch(live, {esc, icon: ui.icon, pitchLines: ui.pitchLines})}
      <div class="career-pitch-legend">
        ${[liveMatch.homeId, liveMatch.awayId].map(id => `<span><i class="${id === live.tournament.userTeamId ? 'is-own' : ''}" aria-hidden="true"></i>${esc(careerClub(career, id).nome)}</span>`).join('')}
      </div>
    </section>` : `<section class="career-card panel career-lineup-preview">
      <div class="career-card-heading"><h2>Escalação</h2><span class="career-pill">${FORMATIONS[career.formation].name}</span></div>
      ${pitch(career, ui)}
      ${button('Editar escalação', 'career-tab', 'squad')}
    </section>`}
  </div>
  ${career.seasons.length ? `<details class="career-card panel"><summary>Temporadas anteriores</summary><ul class="career-history">${[...career.seasons].reverse().map(season =>
    `<li>Temporada ${season.number} · ${season.position === 1 ? 'Campeão' : `${season.position}º lugar`} · ${season.points} pts · ${money(season.prize)} em premiação
      ${season.relegated?.length ? `<small>Rebaixados: ${season.relegated.map(id => esc(careerClub(career, id).nome)).join(', ')}</small>` : ''}
    </li>`).join('')}</ul></details>` : ''}`;
}

function playerToken(player, crest, className, portrait = '') {
  return `<span class="${className}" role="img" aria-label="${player.ovr} OVR">${crest}${portrait}<strong>${player.ovr}</strong></span>`;
}

function playerPortrait(player, className, size) {
  const portrait = careerPortraitUrl(player);
  return portrait ? `<img class="${className}" data-career-portrait src="${portrait}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '';
}

function rosterPortrait(player, ui) {
  return `<span class="career-roster-avatar" aria-hidden="true">
    ${ui.icon('users')}
    ${playerPortrait(player, 'career-roster-photo', 44)}
  </span>`;
}

export function renderCareerSale({player, valuation, changesLineup}, ui) {
  return `<section class="career-sale-dialog">
    <div class="modal-head">
      <h2 id="modal-title">Vender ${esc(player.nome)}?</h2>
      <button type="button" class="icon-button" data-action="close-modal" aria-label="Fechar">${ui.icon('close')}</button>
    </div>
    <div class="career-sale-value">
      <span>Receita da venda</span><strong>${money(valuation.price)}</strong>
      ${valuation.sourceUrl ? `<a href="${esc(valuation.sourceUrl)}" target="_blank" rel="noopener noreferrer">Valor de mercado no Transfermarkt</a>` : '<small>Valor de mercado do Transfermarkt</small>'}
    </div>
    <p class="muted">O jogador sai do elenco e o valor entra no orçamento.${changesLineup ? ' A escalação será ajustada automaticamente.' : ''}</p>
    <div class="dialog-actions">
      <button type="button" class="btn btn-outline" data-action="close-modal" autofocus>Cancelar</button>
      ${button('Confirmar venda', 'career-sell-confirm', player.id, true)}
    </div>
  </section>`;
}

function squad(career, ui, {group = 'reserves', selectedId = null} = {}) {
  const style = careerStyle(career);
  const picks = careerPicks(career);
  const starters = new Map(picks.map(({slot, player}) => [player.id, slot.label]));
  const reserves = career.roster.filter(player => !starters.has(player.id)).sort((a, b) => b.ovr - a.ovr);
  const showingReserves = group === 'reserves';
  const players = showingReserves ? reserves : picks.map(({player}) => player);
  const selected = career.roster.find(player => player.id === selectedId);
  const targets = new Set(careerDestinations(career, selectedId).map(slot => slot.id));
  const crest = clubBadge(career, CAREER_TEAM, ui);
  return `<div class="career-squad-layout">
    <section class="career-card panel career-roster" aria-labelledby="career-roster-title">
      <div class="career-card-heading">
        <h2 id="career-roster-title">Jogadores</h2><span class="career-pill">${career.roster.length} / ${careerRosterLimit(career)}</span>
      </div>
      <div class="career-roster-switch" role="group" aria-label="Grupo de jogadores">
        <button type="button" data-action="career-squad-group" data-value="reserves" aria-pressed="${showingReserves}">Reservas <span>${reserves.length}</span></button>
        <button type="button" data-action="career-squad-group" data-value="starters" aria-pressed="${!showingReserves}">Titulares <span>${picks.length}</span></button>
      </div>
      <ul class="career-roster-list" aria-label="${showingReserves ? 'Reservas' : 'Titulares'}">
        ${players.map(player => `<li class="career-roster-row">
          <button type="button" class="career-roster-player" data-action="career-select-player" data-value="${esc(player.id)}" aria-pressed="${selectedId === player.id}">
            ${rosterPortrait(player, ui)}
            <span class="career-roster-name">
              <strong>${esc(player.nome)}</strong>
              <small class="career-roster-position">${esc(starters.get(player.id) ?? player.tags[0])}</small>
            </span>
            <span class="career-roster-rating">${player.ovr}<small${player.ratingKind === 'career-estimate' ? ' title="OVR estimado pelo ScoreFut"' : ''}>${player.ratingKind === 'career-estimate' ? 'OVR est.' : 'OVR'}</small></span>
          </button>
          <button type="button" class="career-roster-sell" data-action="career-sell" data-value="${esc(player.id)}" aria-label="Vender ${esc(player.nome)}">Vender</button>
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
            ${playerToken(player, crest, 'career-squad-token', playerPortrait(player, 'career-token-photo', 56))}
            <span class="career-squad-role">${slot.label}</span>
            <span class="career-squad-name">${esc(player.nome)}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="career-squad-formation">
        <label>Formação
          <select id="career-formation">${Object.entries(FORMATIONS).map(([id, formation]) =>
            `<option value="${id}"${id === career.formation ? ' selected' : ''}>${formation.name}</option>`).join('')}</select>
        </label>
        <label>Estilo de jogo
          <select id="career-play-style">${Object.entries(CAREER_STYLES).map(([id, preset]) =>
            `<option value="${id}"${id === style ? ' selected' : ''}>${preset.name}</option>`).join('')}</select>
        </label>
      </div>
    </section>
  </div>`;
}

export function renderCareerMarketResults(career, ui, filters) {
  const {entries, total, owned, page, pages} = careerMarketPage(career, filters);
  const full = career.roster.length >= careerRosterLimit(career);
  return `<p class="career-market-count" id="career-market-count" tabindex="-1">${total.toLocaleString('pt-BR')} ${total === 1 ? 'jogador encontrado' : 'jogadores encontrados'}</p>
    ${full ? '<p class="career-market-note">Elenco cheio. Libere um reserva para contratar.</p>' : ''}
    ${entries.length ? `<div class="career-market-grid">${entries.map(({id, player, squad, league, price}) => {
      const signed = owned.has(player.id);
      const affordable = price !== null && career.budget >= price;
      const label = signed ? 'No elenco' : price === null ? 'Sem cotação' : full ? 'Sem vaga' : affordable ? 'Contratar' : 'Sem saldo';
      return `<article class="career-market-player" tabindex="-1" id="career-offer-${esc(id)}">
        <div class="career-market-player-head">
          ${playerToken(player, seasonCrest(league, squad.crestIndex), 'career-market-token', playerPortrait(player, 'career-token-photo', 58))}
          <div>
            <h3>${esc(player.nome)}</h3>
            <p>${esc(squad.nome)} <span aria-hidden="true">·</span> ${esc(league.season)}${player.ratingKind === 'career-estimate' ? ' · OVR estimado' : ''}</p>
          </div>
        </div>
        <div class="career-market-positions" aria-label="Posições">${player.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>
        <div class="career-market-deal">
          <div>
            <small>Valor de mercado</small>
            <strong>${price === null ? 'Indisponível' : money(price)}</strong>
          </div>
          ${button(label, 'career-sign', id, affordable && !full && !signed, full || signed || !affordable)}
        </div>
      </article>`;
    }).join('')}</div>` : `<div class="career-market-empty">${ui.icon('search')}<strong>Nenhum jogador encontrado</strong><p>Experimente outro nome ou limpe os filtros.</p></div>`}
    ${pages > 1 ? `<nav class="career-market-pagination" aria-label="Páginas do mercado">
      ${button('Anterior', 'career-market-page', page - 1, false, page === 1)}
      <span>Página <strong>${page}</strong> de ${pages}</span>
      ${button('Próxima', 'career-market-page', page + 1, false, page === pages)}
    </nav>` : ''}`;
}

function market(career, ui, filters = {}) {
  const catalog = careerMarketCatalog();
  const option = (value, text, selected) =>
    `<option value="${value}"${String(value) === selected ? ' selected' : ''}>${text}</option>`;
  return `<section class="career-card panel career-market" aria-labelledby="career-market-title">
    <header class="career-market-head">
      <div>
        <span class="eyebrow accent">${ui.icon('subs')} Central de transferências</span>
        <h2 id="career-market-title">Mercado de jogadores</h2>
        <p>Elencos europeus 2026/27 e Brasileirão 2026. Valores de mercado publicados pelo Transfermarkt, convertidos para reais.</p>
      </div>
      <dl class="career-market-stats">
        <div><dt>Jogadores no catálogo</dt><dd>${catalog.offers.length.toLocaleString('pt-BR')}</dd></div>
        <div><dt>Vagas no elenco</dt><dd>${careerRosterLimit(career) - career.roster.length}</dd></div>
      </dl>
    </header>
    <form id="career-market-filters" role="search" aria-label="Filtrar jogadores">
      <label class="career-market-search">Buscar jogador
        <span>${ui.icon('search')}<input type="search" id="career-market-search" name="search" placeholder="Nome ou clube" value="${esc(filters.search ?? '')}"></span>
      </label>
      <label for="career-market-position">Posição<select name="position" id="career-market-position">
        ${option('', 'Todas', filters.position)}
        ${Object.keys(ROLE_COMPATIBILITY).map(tag => option(tag, tag, filters.position)).join('')}
      </select></label>
      <label for="career-market-league">Liga<select name="leagueId" id="career-market-league">
        ${option('', 'Todas as ligas', filters.leagueId)}
        ${CAREER_LEAGUES.map(league => option(league.id, esc(league.name), filters.leagueId)).join('')}
      </select></label>
      <label for="career-market-order">Ordenar por<select name="order" id="career-market-order">
        ${[['overall', 'Maior OVR'], ['price', 'Menor preço'], ['expensive', 'Maior preço'], ['name', 'Nome (A–Z)']].map(([value, text]) => option(value, text, filters.order)).join('')}
      </select></label>
      <div class="career-market-filter-foot">
        <label class="career-market-affordable"><input type="checkbox" name="affordable"${filters.affordable ? ' checked' : ''}> Dentro do orçamento</label>
        <button type="reset" id="career-market-reset" class="btn btn-outline">Limpar filtros</button>
      </div>
    </form>
    <div data-career-market-results>${renderCareerMarketResults(career, ui, filters)}</div>
  </section>`;
}

function facilities(career, ui) {
  const cards = {
    training: {icon: 'bolt', photo: 'assets/career/facilities/training.jpg'},
    academy: {icon: 'users', photo: 'assets/career/facilities/academy.jpg'},
    stadium: {icon: 'shield', photo: 'assets/career/facilities/stadium.jpg'},
    gym: {icon: 'ball', photo: 'assets/career/facilities/gym.jpg'},
    shop: {icon: 'card', photo: 'assets/career/facilities/shop.jpg'},
  };
  return `<section class="career-card panel career-facilities">
    ${title('Instalações do clube', 'Invista na estrutura do clube para melhorar o desempenho, a formação de jogadores e a receita.')}
    <div class="career-facility-grid">${Object.entries(FACILITIES).map(([key, facility]) => {
      const {icon, photo} = cards[key];
      const level = careerFacilityLevel(career, key);
      const maxed = level >= MAX_FACILITY_LEVEL;
      const price = facilityPrice(career, key);
      const canUpgrade = career.budget >= price && (key !== 'academy' || career.roster.length < careerRosterLimit(career));
      return `<article class="career-facility" data-facility="${key}">
        <img class="career-facility-photo" src="${assetUrl(photo)}" alt="" loading="lazy" decoding="async">
        <div class="career-card-heading"><span class="career-section-icon">${ui.icon(icon)}</span><span class="career-pill">Nível ${level} de ${MAX_FACILITY_LEVEL}</span></div>
        <h3>${facility.name}</h3><p>${facility.effect}</p>
        <div class="career-level-meter" aria-hidden="true">${Array.from({length: MAX_FACILITY_LEVEL}, (_, index) => `<span${index < level ? ' class="is-filled"' : ''}></span>`).join('')}</div>
        <div class="career-facility-action">${maxed ? '<strong>Nível máximo</strong>' : `<strong>${money(price)}</strong>${button('Melhorar', 'career-upgrade', key, true, !canUpgrade)}`}</div>
      </article>`;
    }).join('')}</div>
    <a class="career-facility-credits" href="CREDITS.md">Créditos das fotos</a>
  </section>`;
}

function club(career, ui) {
  const league = careerLeague(career.leagueId);
  if (league) {
    const overall = Math.round(calculateTeam(careerPicks(career)).overall);
    return `<section class="career-card panel career-club-profile">
      <div class="career-identity"><span class="career-club-emblem">${clubBadge(career, CAREER_TEAM, ui)}</span>
        <div><h2>${esc(career.name)}</h2><p class="muted">${esc(league.name)} · ${esc(league.season)}</p></div>
      </div>
      <dl class="career-club-facts">
        <div><dt>Jogadores no elenco</dt><dd>${career.roster.length} / ${careerRosterLimit(career)}</dd></div>
        <div><dt>Força dos titulares</dt><dd>${overall} OVR</dd></div>
        <div><dt>Formação</dt><dd>${FORMATIONS[career.formation].name}</dd></div>
      </dl>
      ${button('Ver elenco', 'career-tab', 'squad')}
    </section>`;
  }
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

export function renderCareer(career, tab, ui, live = null, marketFilters, squadState) {
  const rows = careerTable(career);
  const position = rows.findIndex(row => row.id === CAREER_TEAM) + 1;
  const league = careerLeague(career.leagueId);
  const pages = {overview, standings, facilities, club};
  const activeTab = Object.hasOwn(CAREER_TABS, tab) ? tab : 'overview';
  return `<div class="career-page">
    <header class="career-dashboard-header">
      <div class="career-dashboard-backdrop" aria-hidden="true">${ui.pitchLines(false)}</div>
      <div class="career-title">
        <span class="career-club-emblem">${clubBadge(career, CAREER_TEAM, ui)}</span>
        <div>
          <span class="eyebrow accent">Carreira de treinador</span>
          <h1>${esc(career.name)}</h1>
          <p>${esc(careerCompetitionName(career))}${league ? ` · ${esc(league.season)}` : ''}</p>
        </div>
      </div>
      <dl class="career-summary">
        <div><dt>${ui.icon('calendar')} Temporada</dt><dd>${career.season}</dd></div>
        <div><dt>${ui.icon('chart')} Posição</dt><dd>${career.round ? `${position}º lugar` : '—'}</dd></div>
        <div><dt>${ui.icon('card')} Orçamento</dt><dd>${money(career.budget)}</dd></div>
      </dl>
    </header>
    <nav class="career-tabs" aria-label="Seções da carreira">
      ${Object.entries(CAREER_TABS).map(([id, {label, icon}]) => `<button type="button" data-action="career-tab" data-value="${id}"${id === activeTab ? ' aria-current="page"' : ''}>${ui.icon(icon)}<span>${label}</span></button>`).join('')}
    </nav>
    <div class="career-content" data-career-tab="${activeTab}">
      ${activeTab === 'market' ? market(career, ui, marketFilters) : activeTab === 'squad' ? squad(career, ui, squadState) : pages[activeTab](career, ui, rows, live)}
    </div>
  </div>`;
}
