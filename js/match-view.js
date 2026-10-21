import {renderMatchGoals} from './match-goals.js?v=live-match-motion-20261021';
import { competitionName, competitionLogo } from '../data/competitions.js?v=club-only-cleanup-20261020';
import { currentMatch, canContinueTournament, upcomingFixtures } from './match-session.js?v=cup-stoppage-20261021';
import { formatMatchClock, matchPhase, matchEndLabel, scoreAt, lineupAnchors, MATCH_SPEEDS } from './match-motion.js?v=live-match-motion-20261021';

const displayName = team => team.ano && team.name.endsWith(` ${team.ano}`) ? team.name.slice(0, -String(team.ano).length - 1) : team.name;
const rgb = color => {
  let hex = color.replace('#', ''); if (hex.length === 3) hex = [...hex].map(c => c + c).join('');
  return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) || 0);
};

export function renderMatchView(s, { esc, icon, badge, pitchLines, btn }) {
  const t = s.tournament, match = currentMatch(s);
  if (!match) return '';
  const result = match.result, ended = s.matchMinute >= result.duration;
  const twoLegged = !!match.tieId;
  const home = t.teams.find(team => team.id === match.homeId), away = t.teams.find(team => team.id === match.awayId);
  const scores = scoreAt(result, s.matchMinute), anchors = lineupAnchors(home, away);
  const homeKit=home.id===t.userTeamId?'#13754b':'#3169b8';
  const awayKit=away.id===t.userTeamId?'#13754b':'#3169b8';
  const homeColors=home.id===t.userTeamId?['#2bb777','#174b2e']:home.cores||['#13754b','#174b2e'];
  const awayColors=away.id===t.userTeamId?['#2bb777','#174b2e']:away.cores||['#13754b','#174b2e'];
  const teamInfo = (team, side, kit) => {
    return `<div class="match-team ${side}">${badge(team)}<div><span class="match-team-side"><i style="background:${esc(kit)}"></i>${team.id===t.userTeamId?'Seu time':'Adversário'}</span><h2>${esc(displayName(team))}</h2><small><b>OVR ${Math.round(team.strength.overall)}</b>${team.id===t.userTeamId?'':' · '+esc(team.ano || '')}</small></div></div>`;
  };
  const player = (entry, index, team, side) => {
    const anchor = anchors[(side === 'home' ? 0 : home.lineup.length) + index];
    const kit = entry.slot.position === 'GOL' ? team.id===t.userTeamId ? '#f0c757' : '#e99573' : side === 'home' ? homeKit : awayKit;
    const [r,g,b]=rgb(kit), numberColor=r*.299+g*.587+b*.114>160?'#17232b':'#fff';
    return `<span class="match-player ${side}" data-match-player style="left:${anchor.x}%;top:${anchor.y}%;--kit:${esc(kit)};--number-color:${numberColor}" title="Nº ${esc(entry.player.camisa || index + 1)} · ${esc(displayName(team))}"><b>${esc(entry.player.camisa || index + 1)}</b></span>`;
  };
  const upcoming = upcomingFixtures(t, match), recent = t.userMatches.map((fixture, index) => ({fixture, index})).filter(({fixture}) => fixture.id !== match.id).slice(-3).reverse();
  const pendingPhase = t.mode !== 'brasileirao' && canContinueTournament(t)
    && match.stage !== 'final' && !upcoming.some(fixture => fixture.stage !== 'group');
  const fixtures = upcoming.slice(0, 5).map(fixture => {
    const isHome = fixture.homeId === t.userTeamId, opponent = t.teams.find(team => team.id === (isHome ? fixture.awayId : fixture.homeId));
    return `<article class="upcoming-game"><div class="fixture-round"><span>${esc(fixture.stageLabel)}</span><small>${isHome ? 'Casa' : 'Fora'}</small></div><div class="fixture-opponent">${badge(opponent)}<div><strong>${esc(displayName(opponent))}</strong><span>Temporada ${esc(opponent.ano || '')}</span></div>${icon('arrow')}</div></article>`;
  });
  const phase = matchPhase(result,s.matchMinute);
  const morePlayed = s.userMatchIndex < t.userMatches.length - 1;
  const nextFixture = morePlayed ? t.userMatches[s.userMatchIndex+1] : upcoming[0];
  const nextLabel = morePlayed ? 'Rever próximo jogo' : twoLegged && match.leg===1 && match.stage!=='final' ? 'Jogar a volta' : match.stage==='final' ? 'Ver resultado' : s.pendingRound || canContinueTournament(t)
    ? nextFixture?.stage === match.stage ? 'Próxima partida' : 'Próxima etapa' : 'Ver resultado';
  const logo = competitionLogo(s.mode), speed = MATCH_SPEEDS.includes(s.matchSpeed) ? s.matchSpeed : 1;
  const penaltyScore = ended && result.penalties ? `<span class="match-penalties">Pênaltis <b>${result.penalties.join(' – ')}</b></span>` : '';
  const firstLeg = twoLegged && match.leg === 2 ? t.matches.find(fixture => fixture.tieId === match.tieId && fixture.leg === 1) : null;
  const previousGoals = firstLeg ? [firstLeg.result.awayGoals, firstLeg.result.homeGoals] : [0,0];
  const aggregateScore = twoLegged && match.leg === 2
    ? `<span class="match-aggregate">Ida + volta <b data-match-aggregate data-home="${previousGoals[0]}" data-away="${previousGoals[1]}">${previousGoals[0]+scores[0]} – ${previousGoals[1]+scores[1]}</b></span>` : '';
  const tie = ended && twoLegged && (match.leg === 2 || match.stage === 'final') ? (s.pendingRound || t).bracket.flatMap(stage => stage.ties || []).find(tie => tie.id === match.tieId) : null;
  const cupStatus = tie?.winnerId
    ? `<span class="match-cup-outcome">${match.stage === 'final' ? 'Campeão' : 'Classificado'}: ${esc(displayName(t.teams.find(team => team.id === tie.winnerId)))}</span>`
    : '';
  const winnerId=tie?.winnerId || result.winnerId || (result.penalties ? result.penalties[0]>result.penalties[1] ? home.id : away.id : result.homeGoals>result.awayGoals ? home.id : result.awayGoals>result.homeGoals ? away.id : null);
  const outcome=ended ? winnerId===t.userTeamId?'victory':winnerId?'defeat':'draw' : 'playing';
  const statusLabel=ended ? tie&&match.stage!=='final' ? outcome==='victory'?'Classificado':'Eliminado' : outcome==='victory'?'Vitória':outcome==='defeat'?'Derrota':'Empate' : 'Em jogo';
  const speedLabels={1:'Normal',4:'Rápido',8:'Muito rápido'};
  return `<div class="screen-title match-page-title"><div>${logo ? `<img class="competition-logo" src="${logo}" width="256" height="256" alt="">` : icon('trophy')}<div><h1>${esc(competitionName(s.mode))}</h1><span>${esc(match.stageLabel)}</span></div></div>${btn(nextLabel+' '+icon('arrow'),'next-match',true,`class="match-next" ${ended?'':'disabled title="Disponível quando a partida terminar"'}`)}</div>
<div class="match-layout"><section class="match-card panel" aria-label="Placar e campo"><div class="live-scoreboard">${teamInfo(home, 'home', homeKit)}<div class="score-center"><span class="match-status ${outcome}"><i></i>${statusLabel}</span><div class="score-numbers" aria-label="Placar"><span>${scores[0]}</span><i>–</i><span>${scores[1]}</span></div><div class="match-clock-row"><span class="score-clock">${formatMatchClock(s.matchMinute)}</span><small data-match-phase>${ended ? 'Fim de jogo' : phase}</small></div>${aggregateScore}${penaltyScore}${cupStatus}</div>${teamInfo(away, 'away', awayKit)}</div>
<div class="live-field-wrap"><div class="live-pitch-area"><div class="live-pitch" data-live-pitch aria-label="Simulação das duas escalações em campo">${pitchLines(false)}${(home.lineup || []).map((entry, index) => player(entry, index, home, 'home')).join('')}${(away.lineup || []).map((entry, index) => player(entry, index, away, 'away')).join('')}<span class="match-ball" data-match-ball>${icon('ball')}</span><div class="goal-notice" data-goal-notice>${icon('ball')}<strong>Gol!</strong><span data-goal-name></span></div></div></div></div>
<div class="match-field-legend" aria-label="Cores dos times no campo"><span><i style="background:${esc(homeKit)}"></i>${esc(displayName(home))} →</span><span>← ${esc(displayName(away))}<i style="background:${esc(awayKit)}"></i></span></div>
<div class="live-progress"><input id="match-timeline" type="range" min="0" max="${result.duration}" step="0.01" value="${s.matchMinute}" style="--progress:${s.matchMinute / result.duration * 100}%" aria-label="Progresso da partida" disabled><span>0′</span><span data-match-end-time>${matchEndLabel(result)}</span></div>
<div class="live-controls">${ended?`<span class="match-end-label">${icon('check')}${result.penalties?'Decidida nos pênaltis':result.extraTime?'Após prorrogação':'Partida encerrada'}</span>`:''}<div class="match-speed" role="group" aria-label="Velocidade da partida"><span>Ritmo da partida</span><div>${MATCH_SPEEDS.map(value => `<button data-action="match-speed" data-value="${value}" aria-label="Velocidade ${value} vezes" aria-pressed="${speed === value}">${speedLabels[value]} <small>${value}×</small></button>`).join('')}</div></div></div></section>
<aside class="match-calendar"><section class="match-goals-panel panel" aria-label="Gols da partida"><div class="calendar-heading"><div>${icon('ball')}<h2>Gols da partida</h2></div></div><div class="match-goals" data-match-goals data-home-name="${esc(displayName(home))}" data-away-name="${esc(displayName(away))}" data-home-color1="${esc(homeColors[0])}" data-home-color2="${esc(homeColors[1])}" data-away-color1="${esc(awayColors[0])}" data-away-color2="${esc(awayColors[1])}" aria-live="polite" aria-label="Autores dos gols">${renderMatchGoals(result,s.matchMinute,{home:displayName(home),away:displayName(away)},{home:homeColors,away:awayColors})}</div></section><section class="fixtures-panel panel ${t.mode === 'brasileirao' ? 'league-campaign' : ''}" aria-label="Próximos jogos"><div class="calendar-heading"><div>${icon('calendar')}<h2>Próximo jogo</h2></div><span>${upcoming.length ? `${upcoming.length} ${upcoming.length === 1 ? 'jogo' : 'jogos'}` : competitionName(s.mode)}</span></div><div class="fixture-list">${fixtures[0]||''}${fixtures.length>1?`<details class="match-extra-fixtures"><summary>Ver próximos jogos (${fixtures.length-1})</summary>${fixtures.slice(1).join('')}</details>`:''}${pendingPhase ? `<div class="fixture-pending">${icon('bracket')}<div><strong>${match.stage === 'group' ? 'Mata-mata' : 'Próxima fase'}</strong><span>Confronto a definir</span><small>${match.stage === 'group' ? 'Os dois primeiros do grupo avançam.' : 'Os vencedores definem o próximo confronto.'}</small></div></div>` : ''}${!fixtures.length && !pendingPhase ? `<div class="calendar-empty">${icon('trophy')}<strong>${ended && !canContinueTournament(t) ? 'Campanha encerrada' : 'Último jogo'}</strong><p>${ended ? 'Confira o resultado da sua campanha.' : 'Tudo se decide em campo.'}</p></div>` : ''}</div>${upcoming.length > 5 ? `<p class="calendar-note">Mais ${upcoming.length - 5} jogos no calendário.</p>` : ''}</section>
${recent.length ? `<details class="recent-panel panel"><summary>Jogos anteriores</summary><div class="recent-list">${recent.map(({fixture, index}) => {const opponent = t.teams.find(team => team.id === (fixture.homeId === t.userTeamId ? fixture.awayId : fixture.homeId));const own = fixture.homeId === t.userTeamId ? fixture.result.homeGoals : fixture.result.awayGoals, other = fixture.homeId === t.userTeamId ? fixture.result.awayGoals : fixture.result.homeGoals;return `<button class="recent-game" data-action="match-index" data-value="${index}" ${s.pendingRound ? 'disabled' : ''}>${badge(opponent)}<span><strong>${esc(displayName(opponent))}</strong><small>${esc(fixture.stageLabel)}</small></span><b>${own}–${other}</b></button>`;}).join('')}</div></details>` : ''}</aside></div>`;
}
