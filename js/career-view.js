import {playerDevelopment} from './career-development.js';
import {renderDevelopmentPanel} from './career-development-view.js';
import {escapeHtml as esc} from './html.js';
import {assetUrl} from './asset-url.js';
import {championConfetti} from './celebration.js';
import {careerClubStats} from './career.js';
import {competitionLogo} from '../data/competitions.js';
import {renderChampionsStages, renderChampionsTieDetails, championsGroup, renderVerticalChampionsBracket} from './champions-view.js';
import {CAREER_LEAGUES, careerLeague} from '../data/career-leagues.js';
import {seasonCrest} from './career-setup-view.js';
import {FORMATIONS, ROLE_COMPATIBILITY, calculateTeam} from './engine.js';
import {careerMarketCatalog, careerMarketPage} from './career-market.js';
import {careerPortraitUrl} from '../data/career-2026/player-portraits.js';
import {renderLivePitch, renderMatchClock, renderMatchScore, renderMatchScoreDetails, renderMatchSpeed} from './match-view.js';
import {scoreAt} from './match-motion.js';
import {renderMatchGoals} from './match-goals.js';
import {currentMatch} from './match-session.js';
import {matchHasEnded, penaltyProgress} from './match-penalties.js';
import {
  CAREER_CRESTS, CAREER_STYLES, CAREER_TEAM, CHAMPIONS_PLACES, careerChampionsFixture, careerNextCompetition, careerHasChampions, careerClub, careerStyle,
  careerCompetitionName, careerDestinations, careerFixtures, careerPicks, careerRelegation, careerRosterLimit, careerTable, careerTopScorers, careerSeasonScorers, nextCareerMatch,
} from './career.js';

export const CAREER_TABS = {
  overview: {label: 'Visão geral', icon: 'chart'},
  standings: {label: 'Classificação', icon: 'trophy'},

  squad: {label: 'Elenco', icon: 'users'},
  market: {label: 'Mercado', icon: 'subs'},
  transfers: {label: 'Negociações', icon: 'wallet'},
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
  if (amount < 1000) return `€ ${amount.toLocaleString('pt-BR')} mil`;
  const [divisor, unit] = amount >= 1_000_000 ? [1_000_000, 'Bi'] : [1000, 'mi'];
  return `€ ${(amount / divisor).toLocaleString('pt-BR', {maximumFractionDigits: 2})} ${unit}`;
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

const championsLogo = () => `<img src="${assetUrl(competitionLogo('champions'))}" width="32" height="32" alt="">`;
const championsRoundLabel = stageLabel => `<span class="career-competition-round">
  <span class="career-competition-brand" data-league="champions">${championsLogo()}<span class="career-competition-name">Champions League</span></span>
  <span>· ${esc(stageLabel)}</span>
</span>`;

function clubBadge(career, id, ui) {
  const club = careerClub(career, id);
  if (club.leagueId) return seasonCrest(careerLeague(club.leagueId), club.crestIndex);
  return id === CAREER_TEAM ? careerCrest(career.crest) : ui.badge(club);
}

function pitch(career, ui, picks) {
  const crest = clubBadge(career, CAREER_TEAM, ui);
  const describe = ({slot, player}) => `${slot.label} · ${player.nome} · ${player.ovr} OVR`;
  return `<div class="career-pitch" role="img" aria-label="Escalação ${FORMATIONS[career.formation].name}: ${esc(picks.map(describe).join(', '))}">
    ${ui.pitchLines()}
    ${picks.map(pick => {
      const {slot, player} = pick;
      return `<div class="career-pitch-player" style="left:${slot.x}%;top:${slot.y}%" title="${esc(describe(pick))}">
      ${playerToken(player, crest, 'career-squad-token', playerPortrait(player, 'career-token-photo', 72))}
      <span class="career-squad-name">${esc(player.nome)}</span>
    </div>`;
    }).join('')}
  </div>`;
}

function scorerPlayer(career, {name, clubId, playerId}) {
  const matches = player => player.nome === name && (!playerId || player.id === playerId);
  const roster = careerClub(career, clubId).jogadores ?? [];
  const ownPlayer = clubId === CAREER_TEAM ? career.roster.find(matches) : null;
  const clubPlayer = ownPlayer ?? roster.find(matches);
  if (clubPlayer || !playerId) return clubPlayer;

  // A transferred player may have left the squad where the goals were scored.
  const candidates = careerMarketCatalog().offers.filter(({player}) => matches(player));
  return candidates.length === 1 ? candidates[0].player : {id: playerId};
}

function scoringLeaders(career, ui) {
  const {players, incomplete} = careerTopScorers(career);
  let rank = 0;
  return `<section class="career-standings-scorers" aria-label="Artilheiros do campeonato">
    ${players.length ? `<div class="career-table-wrap"><table class="career-table" aria-label="Artilheiros do campeonato">
      <thead><tr><th scope="col">Pos.</th><th scope="col">Jogador</th><th scope="col">Gols</th></tr></thead>
      <tbody>${players.slice(0, 10).map((scorer, index) => {
        const {name, clubId, goals} = scorer;
        if (goals !== players[index - 1]?.goals) rank = index + 1;
        const club = clubId === CAREER_TEAM ? career.name : careerClub(career, clubId).nome;
        return `<tr>
          <td>${rank}</td>
          <th scope="row"><span class="career-table-team">${rosterPortrait(scorerPlayer(career, scorer), ui)}<span>${esc(name)}<small class="career-scoring-club">${esc(club)}</small></span></span></th>
          <td class="career-standings-primary"><strong>${goals}</strong></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>` : `<p class="muted">${incomplete ? 'Ainda não há artilheiros registrados para esta temporada.' : 'Os artilheiros aparecem após os primeiros gols da temporada.'}</p>`}
    ${incomplete ? '<p class="muted">Ranking parcial. Faltam os autores dos gols de partidas antigas.</p>' : ''}
  </section>`;
}

function standings(career, ui, rows) {
  const totalRounds = careerFixtures(career).length;
  const seasonFinished = career.round >= totalRounds;
  const {firstRelegation, playoffPosition} = careerRelegation(career);
  const relegationLabel = seasonFinished ? 'Rebaixados' : 'Zona de rebaixamento';
  const hasChampions = careerHasChampions(career);
  return `<section class="career-card panel career-standings" aria-labelledby="career-standings-title">
    <header class="career-standings-header">
      <h2 id="career-standings-title">Classificação</h2>
      <p class="muted">${esc(careerCompetitionName(career))} · ${career.round ? `Rodada ${career.round} de ${totalRounds}` : 'Pré-temporada'}</p>
    </header>
    <div class="career-standings-switch" role="group" aria-label="Tabela do campeonato">
      <label><input type="radio" name="career-standings-view" value="clubs" aria-controls="career-standings-clubs" checked><span>Clubes</span></label>
      <label><input type="radio" name="career-standings-view" value="scorers" aria-controls="career-standings-scorers"><span>Artilheiros</span></label>
    </div>
    <div class="career-standings-clubs" id="career-standings-clubs">

    <div class="career-table-wrap">
      <table class="career-table" aria-labelledby="career-standings-title">
        <thead><tr>
          <th scope="col" title="Posição">Pos.</th><th scope="col">Clube</th>
          <th scope="col" title="Pontos">Pts</th><th scope="col" title="Jogos">J</th>
          <th scope="col" title="Vitórias">V</th><th scope="col" title="Empates">E</th><th scope="col" title="Derrotas">D</th><th scope="col" title="Saldo de gols">SG</th>
        </tr></thead>
        <tbody>${rows.map((row, index) => {
          const isOwn = row.id === CAREER_TEAM;
          const position = index + 1;
          const inRelegationZone = position >= firstRelegation;
          const inPlayoff = position === playoffPosition;
          const inChampionsZone = hasChampions && position <= CHAMPIONS_PLACES;
          const rowClass = [isOwn && 'career-own-row', inRelegationZone && 'career-relegation-row', inPlayoff && 'career-relegation-playoff', inChampionsZone && 'career-champions-zone'].filter(Boolean).join(' ');
          const status = inRelegationZone ? (seasonFinished ? 'Rebaixado' : 'Na zona de rebaixamento') : (inPlayoff ? 'Na posição de repescagem' : '');
          const zone = inChampionsZone && position === 1
            ? {label: 'Champions League', style: 'career-champions-divider', icon: 'trophy'}
            : inPlayoff ? {label: 'Repescagem', style: 'career-relegation-playoff', icon: 'subs'}
            : position === firstRelegation ? {label: relegationLabel, style: 'career-relegation-row', icon: 'arrow'} : null;
          const draws = row.points - row.wins * 3;
          const losses = row.played - row.wins - draws;
          const difference = row.goalsFor - row.goalsAgainst;
          return `${zone ? `<tr class="career-relegation-divider ${zone.style}"><td colspan="8">
            <div class="career-relegation-heading"><strong>${ui.icon(zone.icon)}${zone.label}</strong></div>
          </td></tr>` : ''}
          <tr${rowClass ? ` class="${rowClass}"` : ''}>
            <td><span class="career-table-position">${position}</span>${inChampionsZone ? `<span class="career-table-status">${seasonFinished ? 'Classificado para a Champions League' : 'Zona de classificação para a Champions League'}</span>` : ''}</td>
            <th scope="row"><span class="career-table-team">${clubBadge(career, row.id, ui)}<span>${esc(careerClub(career, row.id).nome)}</span>${isOwn ? '<span class="career-table-status">Seu clube</span>' : ''}${status ? `<span class="career-table-status">${status}</span>` : ''}</span></th>
            <td class="career-standings-primary"><strong>${row.points}</strong></td><td>${row.played}</td><td>${row.wins}</td><td>${draws}</td><td>${losses}</td>
            <td>${difference > 0 ? '+' : ''}${difference}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
    </div>
    <div id="career-standings-scorers">
      ${scoringLeaders(career, ui)}
    </div>
  </section>`;
}

function matchVenue(isHome, neutral = false) {
  if (neutral) return '<small class="career-match-venue">Campo neutro</small>';
  const outline = isHome
    ? 'm3 11 9-8 9 8M5 10v10h14V10M10 20v-6h4v6'
    : 'M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M8 8v12m8-12v12M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z';
  return `<small class="career-match-venue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${outline}"/></svg>${isHome ? 'Mandante' : 'Visitante'}</small>`;
}

function matchClubStyle(career, id) {
  const club = careerClub(career, id);
  const [primary, secondary] = club.cores
    ?? badgeDesigns[Math.max(0, CAREER_CRESTS.indexOf(career.crest))];
  return `class="career-match-club" style="--match-club-primary:${esc(primary)};--match-club-secondary:${esc(secondary)}"`;
}

function matchScoreboard(career, ui, live, match) {
  const {result, homeId, awayId} = match;
  const score = scoreAt(result, live.matchMinute);
  const ended = matchHasEnded(live, match);
  const homeName = careerClub(career, homeId).nome;
  const awayName = careerClub(career, awayId).nome;
  const deciding = penaltyProgress(live, match).playing;
  const side = (id, name, isHome) => `<div ${matchClubStyle(career, id)}>${clubBadge(career, id, ui)}<strong>${esc(name)}</strong>${matchVenue(isHome, match.neutral)}</div>`;
  const round = live.tournament.mode === 'champions' ? championsRoundLabel(match.stageLabel) : roundLabel(career, match.round);
  const details = renderMatchScoreDetails(live, match, {home: homeName, away: awayName}, esc);
  return `${title(ended ? 'Fim de jogo' : deciding ? 'Disputa por pênaltis' : 'Partida em andamento', round)}
    <div class="career-matchup career-live-scoreboard match-scoreboard-style">
      ${side(homeId, homeName, true)}
      <div class="score-center">
        ${renderMatchScore(score)}
        ${renderMatchClock(result, live.matchMinute, ended || deciding)}
      </div>
      ${side(awayId, awayName, false)}
    </div>
    ${details ? `<div class="match-score-details career-match-details">${details}</div>` : ''}
    <div class="match-score-goals career-live-goals" data-match-goals data-home-name="${esc(homeName)}" data-away-name="${esc(awayName)}"
      aria-label="Autores dos gols" aria-live="polite">${renderMatchGoals(result, live.matchMinute, {home: homeName, away: awayName})}</div>
    ${ended ? button('Avançar', 'career-match-return', '', true) : renderMatchSpeed(live.matchSpeed, ui.icon, 'career-match-speed',
      button('Simular até o fim', 'career-match-finish', '', true))}`;
}

function careerLiveField(career, ui, live, match) {
  return `<section class="career-card panel career-live-field" aria-label="Simulação da partida">
      <div class="career-card-heading">
        <h2>Campinho</h2>
        <span class="career-match-status${matchHasEnded(live, match) ? '' : ' is-live'}">${matchHasEnded(live, match) ? 'Encerrada' : 'Em jogo'}</span>
      </div>
      ${renderLivePitch(live, {esc, icon: ui.icon, pitchLines: ui.pitchLines})}
    </section>`;
}

const careerChampionsHelpers = (career, ui) => ({
  esc, icon: ui.icon, badge: team => clubBadge(career, team.id, ui), actionPrefix: 'career-champions-',
});

export function renderCareerChampionsTie(career, id, ui) {
  return renderChampionsTieDetails(career.champions.tournament, id, careerChampionsHelpers(career, ui));
}

function standingsCompetition(career, ui, rows, view = {}) {
  const european = Boolean(career.champions) && (view.standingsCompetition === 'champions' ||
    !view.standingsCompetition && Boolean(view.championsView));
  const picker = career.champions ? `<nav class="career-competition-switch" aria-label="Competição da classificação">
    <button type="button" data-action="career-standings-competition" data-value="league" data-competition="${esc(career.leagueId ?? 'brasileirao')}" aria-pressed="${!european}">${competitionMark(career)}<span>${esc(careerCompetitionName(career))}</span></button>
    <button type="button" data-action="career-standings-competition" data-value="champions" data-competition="champions" aria-pressed="${european}">${championsLogo()}<span>Champions League</span></button>
  </nav>` : '';
  return picker + `<div class="career-standings-motion">${european ? championsStandings(career, ui, view) : standings(career, ui, rows)}</div>`;
}

function competitionMark(career) {
  const league = careerLeague(career.leagueId);
  return league ? seasonCrest(league) : '';
}

function championsStandings(career, ui, view = {}) {
  const tournament = career.champions?.tournament;
  if (!tournament) return '';
  const knockout = (view.championsView ?? (tournament.bracket.length ? 'knockout' : 'groups')) === 'knockout';
  const group = championsGroup(tournament, view.championsGroupId);
  const winner = tournament.championId;
  const [winnerPrimary, winnerSecondary] = winner ? careerClub(career, winner).cores ?? ['#19734b', '#ffffff'] : [];
  const year = 2025 + career.season;
  return `<section class="career-card panel career-standings career-ucl">
    <header class="career-standings-header"><h2>Classificação</h2><p class="career-ucl-heading">${championsLogo()}Champions League · ${String(year).slice(-2)}/${String(year + 1).slice(-2)}</p></header>
    ${!tournament.teams.some(team => team.id === CAREER_TEAM) ? '<p class="muted career-ucl-absent">Seu clube ficou fora dos quatro primeiros na temporada passada.</p>' : ''}
    <div class="career-ucl-views" role="group" aria-label="Fase da Champions League">
      <button type="button" data-action="career-champions-view" data-value="groups" aria-pressed="${!knockout}">Grupos</button>
      <button type="button" data-action="career-champions-view" data-value="knockout" aria-pressed="${knockout}">Mata-mata</button>
    </div>
    ${winner ? `<div class="career-ucl-winner" style="--winner-primary:${esc(winnerPrimary)};--winner-secondary:${esc(winnerSecondary)}">${clubBadge(career, winner, ui)}<span>Campeão <strong>${esc(careerClub(career, winner).nome)}</strong></span></div>` : ''}
${knockout ? `<div class="career-ucl-desktop champions-competition career-ucl-bracket">${renderChampionsStages({...view, championsView: 'knockout', tournament}, careerChampionsHelpers(career, ui))}</div>
      <div class="career-ucl-mobile">${renderVerticalChampionsBracket(tournament, careerChampionsHelpers(career, ui))}</div>`
      : group ? `<div class="career-ucl-groups" role="group" aria-label="Escolher grupo">${tournament.groups.map(item => `<button type="button" data-action="career-champions-group" data-value="${esc(item.id)}" aria-pressed="${item.id === group.id}">Grupo ${esc(item.id)}${item.teamIds.includes(CAREER_TEAM) ? '<i aria-label="Seu grupo"></i>' : ''}</button>`).join('')}</div>
      <div class="career-ucl-group-list">${tournament.groups.map(item => {
        const current = championsGroup(tournament, item.id);
        return `<section class="career-ucl-group-card" data-selected="${item.id === group.id}">
          <div class="career-ucl-group-title"><h3>${esc(current.name)}</h3><span>${current.complete ? 'Grupo encerrado' : 'Fase de grupos'}</span></div>
          <div class="career-table-wrap" tabindex="0" role="region" aria-label="Tabela do ${esc(current.name)}"><table class="career-table career-ucl-table" aria-label="Classificação do ${esc(current.name)}">
            <thead><tr><th scope="col">Pos.</th><th scope="col">Clube</th><th scope="col">Pts</th><th scope="col">J</th><th scope="col" class="career-ucl-extra">V</th><th scope="col" class="career-ucl-extra">E</th><th scope="col" class="career-ucl-extra">D</th><th scope="col">SG</th></tr></thead>
            <tbody>${current.standings.map((row, index) => `<tr${row.teamId === CAREER_TEAM ? ' class="career-own-row"' : ''}>
              <td>${index + 1}</td><th scope="row"><span class="career-table-team">${clubBadge(career, row.teamId, ui)}<span>${esc(careerClub(career, row.teamId).nome)}</span></span></th>
              <td class="career-table-points">${row.points}</td><td>${row.played}</td><td class="career-ucl-extra">${row.wins}</td><td class="career-ucl-extra">${row.draws}</td><td class="career-ucl-extra">${row.losses}</td><td>${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</td>
            </tr>`).join('')}</tbody></table></div></section>`;
      }).join('')}</div>` : '<p class="muted">Os grupos ainda não foram definidos.</p>'}
  </section>`;
}

const SEASON_TROPHIES = {
  bundesliga: 'assets/trophies/bundesliga.png',
  premier: 'assets/trophies/premier.png',
  laliga: 'assets/trophies/laliga.png',
  brasileirao: 'assets/trophies/brasileirao.png',
  seriea: 'assets/trophies/seriea.png',
};

function seasonEnd(career, ui, position, message, earnedChampions) {
  const champion = position === 1;
  const year = 2026 + Math.max(0, career.season - 1);
  const edition = career.leagueId === 'brasileirao' ? String(year) : `${String(year).slice(-2)}/${String(year + 1).slice(-2)}`;
  const {players, incomplete} = careerSeasonScorers(career);
  const leaders = players.filter(player => player.goals > 0 && player.goals === players[0]?.goals);
  const trophy = SEASON_TROPHIES[career.leagueId];
  return `<section class="career-card panel career-season-end result-hero${champion ? ' is-champion' : ''}">
    ${champion ? championConfetti() : ''}
    ${champion ? `<div class="career-season-backdrop" aria-hidden="true"><span class="career-season-watermark">${clubBadge(career, CAREER_TEAM, ui)}</span><span class="career-season-field">${ui.pitchLines(false)}</span></div>` : ''}
    <header class="career-season-heading">
      <span class="eyebrow">${esc(careerCompetitionName(career))}</span>
      <h2>${champion ? 'É campeão!' : 'Temporada encerrada'}</h2>
      <strong class="career-season-team">${esc(career.name)}</strong>
      <span class="career-season-year">${edition}</span>
      ${champion ? '<p>Uma temporada para entrar na história.</p>' : ''}
    </header>
    <div class="career-season-award">
      ${champion && trophy ? `<img class="champion-trophy career-season-trophy" src="${assetUrl(trophy)}" alt="Taça da ${esc(careerCompetitionName(career))}" width="240" height="260">` : `<div class="career-season-club">${clubBadge(career, CAREER_TEAM, ui)}</div><p>${esc(message)}</p>`}
    </div>
    ${leaders.length ? `<div class="career-season-scorers">
      <span class="career-season-label">${leaders.length > 1 ? 'Artilheiros do time' : 'Artilheiro do time'}</span>
      <div class="career-season-leaders">${leaders.map(leader => `<div class="career-season-scorer">
        ${rosterPortrait(scorerPlayer(career, leader), ui)}
        <div><strong>${esc(leader.name)}</strong><span>${leader.goals} gols</span></div>
      </div>`).join('')}</div>
    </div>` : '<p class="career-season-empty">Nenhum gol registrado nesta temporada.</p>'}
    ${incomplete ? '<small class="career-season-note">Algumas partidas antigas não têm os autores dos gols registrados.</small>' : ''}
    <footer class="career-season-footer">
      ${earnedChampions ? '<p>Seu clube garantiu vaga na próxima Champions League.</p>' : ''}
      ${button('Iniciar próxima temporada', 'career-next-season', String(career.season), true)}
    </footer>
  </section>`;
}

function overview(career, ui, rows, live) {
  const liveMatch = live ? currentMatch(live) : null;
  const european = careerNextCompetition(career) === 'champions';
  const championsFixture = european ? careerChampionsFixture(career) : null;
  const fixture = european ? [championsFixture.homeId, championsFixture.awayId] : nextCareerMatch(career);
  const position = rows.findIndex(row => row.id === CAREER_TEAM) + 1;
  const total = careerFixtures(career).length;
  const picks = liveMatch ? null : careerPicks(career);
  const {firstRelegation, playoffPosition} = careerRelegation(career);
  const seasonFinish = position === 1 ? 'Seu clube conquistou o título!'
    : position >= firstRelegation ? `Seu clube foi rebaixado em ${position}º lugar.`
    : position === playoffPosition ? `Seu clube terminou em ${position}º lugar, na posição de repescagem.`
    : `Seu clube terminou em ${position}º lugar.`;
  const round = european ? championsRoundLabel(championsFixture.stageLabel) : roundLabel(career, career.round + 1, total);
  const resume = european ? career.champions.replay?.id === championsFixture.id : career.replay?.round === career.round;
  const action = european ? 'career-champions-play' : 'career-play';
  const id = `${career.season}:${european ? championsFixture.id : career.round}`;
  const earnedChampions = careerHasChampions(career) && position <= CHAMPIONS_PLACES;
  if (!liveMatch && !fixture) return seasonEnd(career, ui, position, seasonFinish, earnedChampions);
  const match = liveMatch ? matchScoreboard(career, ui, live, liveMatch) : fixture
    ? `<header class="career-fixture-heading">${title('Próxima partida', round)}</header>
      <div class="career-matchup career-fixture">${fixture.map((id, index) => `${index ? '<span class="career-fixture-separator" aria-hidden="true">×</span>' : ''}
        <div ${matchClubStyle(career, id)}><span class="career-fixture-crest">${clubBadge(career, id, ui)}</span><strong>${esc(careerClub(career, id).nome)}</strong>${matchVenue(index === 0, championsFixture?.neutral)}</div>`).join('')}</div>
      ${button(resume ? 'Continuar partida' : 'Simular partida', action, id, true)}`
    : '';
  return `<div class="career-columns">
    <section class="career-card panel career-match${!liveMatch && fixture ? ' career-match-preview' : ''}">${match}
    </section>
    ${liveMatch ? careerLiveField(career, ui, live, liveMatch) : `<section class="career-card panel career-lineup-preview">
      <div class="career-card-heading">
        <div><h2>Escalação titular</h2><span class="career-pill">${FORMATIONS[career.formation].name}</span></div>
        <span class="career-squad-overall">${Math.round(calculateTeam(picks).overall)} <small>OVR</small></span>
      </div>
      ${pitch(career, ui, picks)}
      ${button('Editar escalação', 'career-tab', 'squad')}
    </section>`}
  </div>

  ${career.seasons.length ? `<details class="career-card panel"><summary>Temporadas anteriores</summary><ul class="career-history">${[...career.seasons].reverse().map(season =>
    `<li>Temporada ${season.number} · ${season.position === 1 ? 'Campeão' : `${season.position}º lugar`} · ${season.points} pts · ${money(season.prize)} em premiação
      ${season.championsWinner ? `<small>Campeão da Champions League: ${esc(careerClub(career, season.championsWinner).nome)}</small>` : ''}
      ${season.relegated?.length ? `<small>Rebaixados: ${season.relegated.map(id => esc(careerClub(career, id).nome)).join(', ')}</small>` : ''}
    </li>`).join('')}</ul></details>` : ''}`;
}

function playerToken(player, crest, className, portrait = '') {
  return `<span class="${className}" role="img" aria-label="${player.ovr} OVR">${crest}${portrait}<strong>${player.ovr}</strong></span>`;
}

function playerPortrait(player, className, size) {
  const portrait = careerPortraitUrl(player);
  return portrait ? `<img class="${className}" data-career-portrait src="${portrait}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" referrerpolicy="no-referrer" draggable="false">` : '';
}

function rosterPortrait(player, ui) {
  return `<span class="career-roster-avatar" aria-hidden="true">
    ${ui.icon('users')}
    ${player ? playerPortrait(player, 'career-roster-photo', 44) : ''}
  </span>`;
}

export function renderCareerSale({player, valuation, price, changesLineup, proposalId, buyer}, ui) {
  return `<section class="career-sale-dialog">
    <div class="modal-head">
      <h2 id="modal-title">Vender ${esc(player.nome)}?</h2>
      <button type="button" class="icon-button" data-action="close-modal" aria-label="Fechar">${ui.icon('close')}</button>
    </div>
    <div class="career-sale-value">
      <span>Receita da venda</span><strong>${money(price)}</strong>
      ${valuation.sourceUrl ? `<a href="${esc(valuation.sourceUrl)}" target="_blank" rel="noopener noreferrer">Valor de mercado no Transfermarkt</a>` : '<small>Valor de mercado do Transfermarkt</small>'}
    </div>
    <p class="muted">${buyer ? `${esc(buyer)} receberá o jogador. ` : ''}O jogador sai do elenco e o valor entra no orçamento.${changesLineup ? ' A escalação será ajustada automaticamente.' : ''}</p>
    <div class="dialog-actions">
      <button type="button" class="btn btn-outline" data-action="close-modal" autofocus>Cancelar</button>
      ${button('Confirmar venda', proposalId ? 'career-transfer-confirm' : 'career-sell-confirm', proposalId ?? player.id, true)}
    </div>
  </section>`;
}

function squad(career, ui, {selectedId = null} = {}) {
  const style = careerStyle(career);
  const picks = careerPicks(career);
  const starters = new Set(picks.map(({player}) => player.id));
  const reserves = career.roster.filter(player => !starters.has(player.id)).sort((a, b) => b.ovr - a.ovr);
  const selected = career.roster.find(player => player.id === selectedId);
  const targets = new Set(careerDestinations(career, selectedId).map(slot => slot.id));
  const crest = clubBadge(career, CAREER_TEAM, ui);
  return `<div class="career-squad-layout">
    <section class="career-card panel career-roster" aria-labelledby="career-roster-title">
      <div class="career-card-heading">
        <h2 id="career-roster-title" tabindex="-1">Reservas</h2><span class="career-pill">${reserves.length}</span>
      </div>
      <ul class="career-roster-list" aria-labelledby="career-roster-title">
        ${reserves.map(player => `<li class="career-roster-row">
          <button type="button" class="career-roster-player" data-action="career-select-player" data-value="${esc(player.id)}" aria-pressed="${selectedId === player.id}"
            data-career-drag-player="${esc(player.id)}">
            ${rosterPortrait(player, ui)}
            <span class="career-roster-name">
              <strong>${esc(player.nome)}</strong>
              ${playerDevelopment(career,player).injury ? `<small class="career-injury-label">Lesionado · ${playerDevelopment(career,player).injury} jogo(s)</small>` : ''}
              <small class="career-roster-position">${esc(player.tags[0])}</small>
            </span>
            <span class="career-roster-rating">${player.ovr}<small${player.ratingKind === 'career-estimate' ? ' title="OVR estimado pelo ScoreFut"' : ''}>${player.ratingKind === 'career-estimate' ? 'OVR est.' : 'OVR'}</small></span>
          </button>
          <button type="button" class="career-roster-sell" data-action="career-sell" data-value="${esc(player.id)}" aria-label="Colocar ${esc(player.nome)} à venda" title="Colocar à venda">$</button>
        </li>`).join('') || '<li class="career-roster-empty">Sem jogadores na reserva.</li>'}
      </ul>
    </section>
    <section class="career-card panel career-squad-field" aria-labelledby="career-squad-title">
      <div class="career-card-heading">
        <div><span class="eyebrow accent">11 titulares</span><h2 id="career-squad-title">Escalação titular</h2></div>
        <div class="career-squad-header-actions">
          ${selected && starters.has(selected.id) ? `<button type="button" class="career-roster-sell career-starter-sell" data-action="career-sell" data-value="${esc(selected.id)}" aria-label="Colocar ${esc(selected.nome)} à venda" title="Colocar à venda">$</button>` : ''}
          <span class="career-squad-overall">${Math.round(calculateTeam(picks).overall)} <small>OVR</small></span>
        </div>
      </div>
      <div class="career-pitch career-edit-pitch" role="group" aria-label="${selected && targets.size ? esc(`Escolha uma posição destacada para ${selected.nome}`) : 'Posições no campo'}">
        ${ui.pitchLines()}
        ${picks.map(({slot, player}) => {
          const origin = player.id === selectedId;
          const target = targets.has(slot.id);
          const label = target ? `Colocar ${selected.nome} como ${slot.label} no lugar de ${player.nome}` : `${slot.label} · ${player.nome} · ${player.ovr} OVR`;
          return `<button type="button" class="career-squad-slot${target ? ' is-target' : ''}${origin ? ' is-origin' : ''}"
            style="left:${slot.x}%;top:${slot.y}%" data-action="career-pick-slot" data-value="${slot.id}"
            data-career-drag-player="${esc(player.id)}"
            aria-label="${esc(label)}" title="${esc(label)}" aria-pressed="${origin}"${selected && !origin && !target ? ' disabled' : ''}>
            ${playerToken(player, crest, 'career-squad-token', playerPortrait(player, 'career-token-photo', 72))}
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
  return `<p class="career-market-count" id="career-market-count" tabindex="-1" role="status">${total.toLocaleString('pt-BR')} ${total === 1 ? 'jogador' : 'jogadores'}</p>
    ${entries.length ? `<div class="career-market-grid">${entries.map(({id, player, squad, league, price}) => {
      const signed = owned.has(player.id);
      const affordable = price !== null && career.budget >= price;
      const label = signed ? 'No elenco' : price === null ? 'Sem cotação' : full ? 'Sem vaga' : affordable ? 'Contratar' : 'Sem saldo';
      const crest = seasonCrest(league, squad.crestIndex);
      const clubName = esc(squad.nome);
      return `<article class="career-market-player" tabindex="-1" id="career-offer-${esc(id)}">
        <div class="career-market-player-head">
          <span class="career-market-token" aria-hidden="true">${crest}${playerPortrait(player, 'career-token-photo', 68)}</span>
          <div>
            <h3>${esc(player.nome)}</h3>
            <div class="career-market-club">
              <strong class="career-market-rating" aria-label="${player.ovr} OVR">${player.ovr}</strong>
              <span role="img" aria-label="${clubName}" title="${clubName}">${crest}</span>
              ${player.ratingKind === 'career-estimate' ? '<small>OVR estimado</small>' : ''}
            </div>
          </div>
        </div>
        <div class="career-market-positions" aria-label="Posições">${player.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>
        <div class="career-market-deal">
          <div>
            <small>Preço de compra</small>
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
  const option = (value, text, selected) =>
    `<option value="${value}"${String(value) === selected ? ' selected' : ''}>${text}</option>`;
  return `<section class="career-card panel career-market" aria-labelledby="career-market-title">
    <header class="career-market-head">
      <h2 id="career-market-title">Mercado</h2>
      <button type="button" class="career-market-capacity" data-action="career-tab" data-value="squad">
        ${career.roster.length >= careerRosterLimit(career) ? 'Elenco cheio' : `${careerRosterLimit(career) - career.roster.length} vagas no elenco`}
        ${ui.icon('arrow')}
      </button>
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

export function renderCareerOfferNotice(career, offers, ui) {
  const offer = [...offers].sort((a, b) => b.price - a.price)[0];
  const player = career.roster.find(player => player.id === offer?.playerId);
  if (!player) return '';
  return `<div class="career-offer-notice">
    ${rosterPortrait(player, ui)}
    <div class="career-notice-copy"><span>Nova proposta</span><strong>${esc(player.nome)}</strong>
      <p>${esc(careerClub(career, offer.clubId).nome)} <b>${money(offer.price)}</b></p>
      ${offers.length > 1 ? `<small>+ ${offers.length - 1} ${offers.length === 2 ? 'proposta recebida' : 'propostas recebidas'}</small>` : ''}
    </div>
    <button class="career-notice-close" type="button" data-toast-close aria-label="Fechar notificação">${ui.icon('close')}</button>
    ${button('Ver propostas', 'career-tab', 'transfers', true)}
  </div>`;
}

function transfers(career, ui) {
  const offers = career.transferOffers ?? [], listings = career.transferListings ?? [], deals = career.transferDeals ?? [];
  return `<section class="career-card panel career-transfers">
    <header class="career-transfers-head"><div><h2>Negociações</h2><p class="muted">Propostas e saídas do seu clube</p></div>
      <span class="career-pill">${offers.length} ${offers.length === 1 ? 'proposta' : 'propostas'}</span></header>
    <h3>Propostas recebidas</h3>
    ${offers.length ? `<div class="career-transfer-grid">${offers.map(offer => {
      const player = career.roster.find(player => player.id === offer.playerId);
      if (!player) return '';
      const [primary, secondary] = careerClub(career, offer.clubId).cores ?? ['#19734b', '#ffffff'];
      return `<article class="career-transfer-offer" style="--offer-primary:${esc(primary)};--offer-secondary:${esc(secondary)}">
        <div class="career-transfer-player">${rosterPortrait(player, ui)}<div><strong>${esc(player.nome)}</strong><small>${player.ovr} OVR</small></div></div>
        <div class="career-transfer-details"><div class="career-transfer-buyer">${clubBadge(career, offer.clubId, ui)}<span><small>Clube interessado</small>${esc(careerClub(career, offer.clubId).nome)}</span></div>
        <div class="career-transfer-value"><small>Proposta de compra</small><strong class="career-transfer-price">${money(offer.price)}</strong></div></div>
        <div class="career-transfer-actions">${button('Recusar', 'career-transfer-reject', offer.id)}${button('Analisar proposta', 'career-transfer-open', offer.id, true)}</div>
      </article>`;
    }).join('')}</div>` : '<p class="career-transfer-empty">Nenhuma proposta por enquanto. Os clubes avaliam os jogadores à venda conforme as partidas avançam.</p>'}
    <div class="career-transfers-head"><h3>À venda <span class="career-pill">${listings.length}</span></h3>${button('Ver elenco', 'career-tab', 'squad')}</div>
    ${listings.length ? `<ul class="career-transfer-list">${listings.map(entry => {
      const player = career.roster.find(player => player.id === entry.playerId);
      return player ? `<li><div class="career-transfer-player">${rosterPortrait(player, ui)}<div><strong>${esc(player.nome)}</strong><small>Valor de referência · ${money(entry.price)}</small></div></div>
        ${button('Retirar da venda', 'career-transfer-cancel', player.id)}</li>` : '';
    }).join('')}</ul>` : '<p class="career-transfer-empty">Use o $ no elenco para colocar um jogador à venda.</p>'}
    ${deals.length ? `<h3>Vendas concluídas</h3><ul class="career-transfer-list career-sales-history">${[...deals].reverse().slice(0, 12).map(deal => {
      const year = 2025 + deal.season;
      const edition = career.leagueId === 'brasileirao' ? year : `${String(year).slice(-2)}/${String(year + 1).slice(-2)}`;
      return `<li>
        <div class="career-transfer-player">${rosterPortrait(deal.player, ui)}<div><strong>${esc(deal.player.nome)}</strong><small>${edition}</small></div></div>
        <div class="career-sale-destination"><span class="career-sale-arrow" aria-hidden="true">${ui.icon('arrow')}</span>
          ${clubBadge(career, deal.clubId, ui)}<span>${esc(careerClub(career, deal.clubId).nome)}</span></div>
        <strong class="career-transfer-price">${money(deal.price)}</strong>
      </li>`;
    }).join('')}</ul>` : ''}
  </section>`;
}

function club(career, ui, developmentState) {
  const {played, goals, titles} = careerClubStats(career);
  const edition = season => {
    const year = 2025 + season;
    return career.leagueId === 'brasileirao' ? String(year) : `${String(year).slice(-2)}/${String(year + 1).slice(-2)}`;
  };
  return `<section class="career-card panel career-club-record">
    <header class="career-club-record-heading"><h2>Meu clube</h2><span>${edition(career.season)}</span></header>
    <dl class="career-club-record-stats">
      <div><dt>Jogos na temporada</dt><dd>${played}</dd></div>
      <div><dt>Gols na temporada</dt><dd>${goals}</dd></div>
      <div><dt>Títulos na carreira</dt><dd>${titles.length}</dd></div>
    </dl>
    <div class="career-club-honours"><h3>Galeria de títulos</h3>
      ${titles.length ? `<ul>${[...titles].reverse().map(title => {
        const european = title.competition === 'champions';
        const trophy = european ? 'assets/competitions/champions-trophy.png' : SEASON_TROPHIES[career.leagueId];
        return `<li>${trophy ? `<img src="${assetUrl(trophy)}" alt="" width="64" height="80" loading="lazy">` : ''}
          <div><strong>${esc(european ? 'Champions League' : careerCompetitionName(career))}</strong><span>Campeão · ${edition(title.season)}</span></div></li>`;
      }).join('')}</ul>` : '<p class="muted">Sua história de títulos começa aqui.</p>'}
    </div>
  </section>${renderCareerDevelopment(career, ui, developmentState)}`;
}

export function renderCareer(career, tab, ui, live = null, marketFilters, squadState, previousTab, championsView, developmentState) {
  const rows = careerTable(career);
  const position = rows.findIndex(row => row.id === CAREER_TEAM) + 1;
  const league = careerLeague(career.leagueId);
  const [primary, secondary] = careerClub(career, CAREER_TEAM).cores
    ?? badgeDesigns[Math.max(0, CAREER_CRESTS.indexOf(career.crest))];
  const pages = {overview, standings, club, transfers};
  const tabs = Object.entries(CAREER_TABS);
  const activeTab = tabs.some(([id]) => id === tab) ? tab : 'overview';
  const entering = previousTab === undefined;
  const switching = !entering && previousTab !== activeTab;
  return `<div class="career-page" style="--career-club-primary:${esc(primary)};--career-club-secondary:${esc(secondary)}">
    <header class="career-dashboard-header" style="--career-club-primary:${esc(primary)};--career-club-secondary:${esc(secondary)}">
      <div class="career-dashboard-backdrop" aria-hidden="true">${ui.pitchLines(false)}</div>
      <div class="career-title">
        <span class="career-club-emblem">${clubBadge(career, CAREER_TEAM, ui)}</span>
        <div>
          <span class="eyebrow accent">Carreira de treinador</span>
          <h1>${esc(career.name)}</h1>
          <p>${esc(careerCompetitionName(career))}${league ? ` · ${career.leagueId === 'brasileirao' ? 2025 + career.season : `${String(2025 + career.season).slice(-2)}/${String(2026 + career.season).slice(-2)}`}` : ''}</p>
        </div>
      </div>
      <dl class="career-summary">
        <div><dt>${ui.icon('calendar')} Temporada</dt><dd>${career.season}</dd></div>
        <div><dt>${ui.icon('chart')} Posição</dt><dd>${career.round ? `${position}º lugar` : '—'}</dd></div>
        <div><dt>${ui.icon('wallet')} Orçamento</dt><dd>${money(career.budget)}</dd></div>
      </dl>
    </header>
    <nav class="career-tabs${entering ? ' is-entering' : ''}${switching ? ' is-switching' : ''}" aria-label="Seções da carreira">
      ${tabs.map(([id, {label, icon}]) => `<button type="button" data-action="career-tab" data-value="${id}"${id === activeTab ? ' aria-current="page"' : ''}>${ui.icon(icon)}<span>${label}</span></button>`).join('')}
    </nav>
    <div class="career-content" data-career-tab="${activeTab}">
      ${activeTab === 'standings' ? standingsCompetition(career, ui, rows, championsView)
        : activeTab === 'market' ? market(career, ui, marketFilters)
        : activeTab === 'squad' ? squad(career, ui, squadState)
        : activeTab === 'club' ? club(career, ui, developmentState)
        : pages[activeTab](career, ui, rows, live)}
    </div>
  </div>`;
}


export function renderCareerDevelopment(career, ui, state = {}) {
  return renderDevelopmentPanel(career, ui, state, {
    portrait: player => rosterPortrait(player, ui),
    crest: clubBadge(career, CAREER_TEAM, ui), money,
  });
}
