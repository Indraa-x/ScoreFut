import {renderMatchGoals} from './match-goals.js?v=scoreboard-scorers-20261027';
import {matchHasEnded,renderPenaltyMarks,penaltyProgress} from './match-penalties.js?v=no-end-label-20261028';
import {championsGroup,renderChampionsSidebar} from './champions-view.js?v=simulation-gap-20261026';
import { competitionName, competitionLogo } from '../data/competitions.js?v=world-cup-20261026';
import { currentMatch, canContinueTournament, nextFixturePreview } from './match-session.js?v=no-end-label-20261028';
import { formatMatchClock, matchAddedMinutes, matchPhase, scoreAt, lineupAnchors, MATCH_SPEEDS, normalizeMatchSpeed } from './match-motion.js?v=no-end-label-20261028';

const displayName = team => team.ano && team.name.endsWith(` ${team.ano}`) ? team.name.slice(0, -String(team.ano).length - 1) : team.name;
const rgb = color => {
  let hex = color.replace('#', ''); if (hex.length === 3) hex = [...hex].map(c => c + c).join('');
  return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) || 0);
};

export function renderMatchView(s, { esc, icon, badge, pitchLines, btn }) {
  const t = s.tournament, match = currentMatch(s);
  if (!match) return '';
  const result=match.result,ended=matchHasEnded(s,match),deciding=penaltyProgress(s,match).playing;
  const twoLegged = !!match.tieId;
  const home = t.teams.find(team => team.id === match.homeId), away = t.teams.find(team => team.id === match.awayId);
  const scores = scoreAt(result, s.matchMinute), anchors = lineupAnchors(home, away);
  const homeKit=home.id===t.userTeamId?'#13754b':'#3169b8';
  const awayKit=away.id===t.userTeamId?'#13754b':'#3169b8';
  const teamInfo = (team, side, kit) => {
    return `<div class="match-team ${side}">${badge(team)}<div><span class="match-team-side"><i style="background:${esc(kit)}"></i>${team.id===t.userTeamId?'Seu time':'Adversário'}</span><h2>${esc(displayName(team))}</h2><small><b>OVR ${Math.round(team.strength.overall)}</b>${team.id===t.userTeamId?'':' · '+esc(team.ano || '')}</small></div></div>`;
  };
  const player = (entry, index, team, side) => {
    const anchor = anchors[(side === 'home' ? 0 : home.lineup.length) + index];
    const kit = entry.slot.position === 'GOL' ? team.id===t.userTeamId ? '#f0c757' : '#e99573' : side === 'home' ? homeKit : awayKit;
    const [r,g,b]=rgb(kit), numberColor=r*.299+g*.587+b*.114>160?'#17232b':'#fff';
    return `<span class="match-player ${side}" data-match-player style="left:${anchor.x}%;top:${anchor.y}%;--kit:${esc(kit)};--number-color:${numberColor}" title="Nº ${esc(entry.player.camisa || index + 1)} · ${esc(displayName(team))}"><b>${esc(entry.player.camisa || index + 1)}</b></span>`;
  };
  const preview=nextFixturePreview(s), upcoming=preview.fixture?[preview.fixture]:[];
  const recent = t.userMatches.map((fixture, index) => ({fixture, index})).filter(({fixture}) => fixture.id !== match.id).slice(-3).reverse();
  const fixtures = upcoming.slice(0, 1).map(fixture => {
    const isHome = fixture.homeId === t.userTeamId, opponent = t.teams.find(team => team.id === (isHome ? fixture.awayId : fixture.homeId));
    return `<article class="upcoming-game"><div class="fixture-round"><span>${esc(fixture.stageLabel)}</span><small>${fixture.neutral?'Campo neutro':isHome?'Casa':'Fora'}</small></div><div class="fixture-opponent">${badge(opponent)}<div><strong>${esc(displayName(opponent))}</strong><span>Temporada ${esc(opponent.ano || '')}</span></div>${icon('arrow')}</div></article>`;
  });
  const possible=preview.opponentIds?.map(id=>t.teams.find(team=>team.id===id)).filter(Boolean)||[];
  const pendingText=possible.length?`Se avançar: ${possible.length>1?'vencedor de ':''}${possible.map(team=>displayName(team)).join(' × ')}`:preview.draw?'Adversário definido no sorteio após esta fase.':'Adversário definido após a classificação.';
  const nextContent=fixtures[0]||(preview.kind==='pending'?`<div class="fixture-pending">${icon('bracket')}<div><strong>${esc(preview.stageLabel)}</strong><span>${esc(pendingText)}</span></div></div>`:`<div class="calendar-empty">${icon('trophy')}<strong>${preview.kind==='complete'?'Campanha encerrada':'Último jogo'}</strong><p>${preview.kind==='complete'?'Confira o resultado da sua campanha.':'Tudo se decide em campo.'}</p></div>`);
  const nextGamePanel = `<section class="fixtures-panel panel ${t.mode === 'brasileirao' ? 'league-campaign' : ['champions','world-cup'].includes(t.mode) ? 'champions-next-game' : ''}" aria-label="Próximo jogo"><div class="calendar-heading"><div>${icon('calendar')}<h2>Próximo jogo</h2></div></div><div class="fixture-list">${nextContent}</div></section>`;
  const championsPanel=['champions','world-cup'].includes(t.mode)?(match.stage!=='group'||championsGroup(t)?.complete?nextGamePanel:renderChampionsSidebar(t,{esc,icon,badge})):'';
  const phase = matchPhase(result,s.matchMinute);
  const addedMinutes = matchAddedMinutes(result,s.matchMinute);
  const morePlayed = s.userMatchIndex < t.userMatches.length - 1;
  const nextFixture = morePlayed ? t.userMatches[s.userMatchIndex+1] : upcoming[0];
  const nextLabel = morePlayed ? 'Rever próximo jogo' : twoLegged && match.leg===1 && match.stage!=='final' ? 'Jogar a volta' : match.stage==='final' ? 'Ver resultado' : s.pendingRound || canContinueTournament(t)
    ? nextFixture?.stage === match.stage ? 'Próxima partida' : 'Próxima etapa' : 'Ver resultado';
  const trophy = {'world-cup':'assets/competitions/world-cup-trophy.png',champions:'assets/competitions/champions-trophy.png','copa-do-brasil':'assets/competitions/brazil-cup-trophy.png'}[s.mode];
  const logo = trophy || competitionLogo(s.mode), speed = normalizeMatchSpeed(s.matchSpeed);
  const penaltyScore = result.penalties ? `<div class="match-penalty-marks" data-penalty-marks data-home-name="${esc(displayName(home))}" data-away-name="${esc(displayName(away))}" aria-label="Cobranças de pênaltis" ${s.matchMinute>=result.duration?'':'hidden'}>${renderPenaltyMarks(s,match,{home:displayName(home),away:displayName(away)},esc)}</div>` : '';
  const firstLeg = twoLegged && match.leg === 2 ? t.matches.find(fixture => fixture.tieId === match.tieId && fixture.leg === 1) : null;
  const previousGoals = firstLeg ? [firstLeg.result.awayGoals, firstLeg.result.homeGoals] : [0,0];
  const aggregateScore = twoLegged && match.leg === 2
    ? `<span class="match-aggregate">Ida + volta <b data-match-aggregate data-home="${previousGoals[0]}" data-away="${previousGoals[1]}">${previousGoals[0]+scores[0]} – ${previousGoals[1]+scores[1]}</b></span>` : '';
  const tie = ended && twoLegged && (match.leg === 2 || match.stage === 'final') ? (s.pendingRound || t).bracket.flatMap(stage => stage.ties || []).find(tie => tie.id === match.tieId) : null;
  const winnerId=tie?.winnerId || result.winnerId || (result.penalties ? result.penalties[0]>result.penalties[1] ? home.id : away.id : result.homeGoals>result.awayGoals ? home.id : result.awayGoals>result.homeGoals ? away.id : null);
  const outcome=ended ? winnerId===t.userTeamId?'victory':winnerId?'defeat':'draw' : 'playing';
  const statusLabel=deciding?'Pênaltis':ended ? tie&&match.stage!=='final' ? outcome==='victory'?'Classificado':'Eliminado' : outcome==='victory'?'Vitória':outcome==='defeat'?'Derrota':'Empate' : 'Em jogo';
  const speedLabels={4:'Normal',8:'Rápido'};
  return `<div class="screen-title match-page-title"><div>${logo ? `<img class="competition-logo${trophy?' competition-trophy':''}" src="${logo}" width="256" height="256" alt="">` : icon('trophy')}<div><h1>${s.mode==='world-cup'?`<button class="match-competition-link" data-action="champions-view" data-value="groups" aria-label="Ver competição da Copa do Mundo">${esc(competitionName(s.mode))}${icon('arrow')}</button>`:esc(competitionName(s.mode))}</h1><span>${esc(match.stageLabel)}</span></div></div>${btn(nextLabel+' '+icon('arrow'),'next-match',true,`class="match-next" ${ended?'':'disabled title="Disponível quando a partida terminar"'}`)}</div>
<div class="match-layout"><section class="match-card panel" aria-label="Placar e campo"><div class="live-scoreboard">${teamInfo(home, 'home', homeKit)}<div class="score-center"><span class="match-status ${outcome}"><i></i>${statusLabel}</span><div class="score-numbers" aria-label="Placar"><span>${scores[0]}</span><i>–</i><span>${scores[1]}</span></div><div class="match-clock-row"><span class="match-clock-time"><span class="match-added-time" data-match-added-time aria-label="${addedMinutes} minutos de acréscimo"${addedMinutes ? "" : " hidden"}>+${addedMinutes}</span><span class="score-clock">${formatMatchClock(s.matchMinute)}</span></span><small data-match-phase>${deciding?'Pênaltis':ended?'':phase}</small></div><div class="match-score-details">${aggregateScore}${penaltyScore}</div></div>${teamInfo(away, 'away', awayKit)}<div class="match-score-goals" data-match-goals data-home-name="${esc(displayName(home))}" data-away-name="${esc(displayName(away))}" aria-live="polite" aria-atomic="true" aria-label="Autores dos gols">${renderMatchGoals(result,s.matchMinute,{home:displayName(home),away:displayName(away)})}</div></div>
<div class="live-field-wrap"><div class="live-pitch-area"><div class="live-pitch" data-live-pitch aria-label="Simulação das duas escalações em campo">${pitchLines(false)}${(home.lineup || []).map((entry, index) => player(entry, index, home, 'home')).join('')}${(away.lineup || []).map((entry, index) => player(entry, index, away, 'away')).join('')}<span class="match-ball" data-match-ball>${icon('ball')}</span><div class="goal-notice" data-goal-notice>${icon('ball')}<strong>Gol!</strong><span data-goal-name></span></div></div></div></div>
<div class="live-controls"><div class="match-speed" role="group" aria-label="Velocidade da partida"><div>${MATCH_SPEEDS.map(value => `<button class="${value===8?'match-speed-fast':'match-speed-normal'}" data-action="match-speed" data-value="${value}" aria-label="${speedLabels[value]}" aria-pressed="${speed === value}">${value===8&&speed===8?icon('bolt'):''}${speedLabels[value]}</button>`).join('')}</div></div></div></section>
<aside class="match-calendar">${championsPanel}${['champions','world-cup'].includes(t.mode)?'':nextGamePanel}
${recent.length ? `<details class="recent-panel panel"><summary>Jogos anteriores</summary><div class="recent-list">${recent.map(({fixture, index}) => {const opponent = t.teams.find(team => team.id === (fixture.homeId === t.userTeamId ? fixture.awayId : fixture.homeId));const own = fixture.homeId === t.userTeamId ? fixture.result.homeGoals : fixture.result.awayGoals, other = fixture.homeId === t.userTeamId ? fixture.result.awayGoals : fixture.result.homeGoals;return `<button class="recent-game" data-action="match-index" data-value="${index}" ${s.pendingRound ? 'disabled' : ''}>${badge(opponent)}<span><strong>${esc(displayName(opponent))}</strong><small>${esc(fixture.stageLabel)}</small></span><b>${own}–${other}</b></button>`;}).join('')}</div></details>` : ''}</aside></div>`;
}
