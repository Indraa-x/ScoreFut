import { createTournament, playNextRound, calculateTeam, SIMULATION_SETTINGS, upgradeChampionsTournament } from './engine.js?v=penalty-dots-clean-20261028';
import {matchHasEnded} from './match-penalties.js?v=penalty-dots-clean-20261028';

export const MATCH_FLOW_VERSION = 1;

export function currentMatch(state) {
  return state.tournament?.userMatches[state.userMatchIndex]
    || state.pendingRound?.userMatches[state.userMatchIndex] || null;
}

export function canContinueTournament(tournament) {
  return !tournament.complete && !tournament.campaign?.eliminated;
}

/** Keep completed games when an active Champions save adopts two-legged ties. */
export function migrateChampionsFormat(state) {
  if (!state.tournament) return {};
  const tournament = upgradeChampionsTournament(state.tournament);
  if (tournament === state.tournament) return {};
  if (!state.pendingRound) return {tournament};
  if (currentMatch(state)?.stage === 'group') return {
    tournament,pendingRound:upgradeChampionsTournament(state.pendingRound),
    userMatchIndex:state.userMatchIndex,matchMinute:state.matchMinute,
  };
  const session = prepareUserRound(tournament);
  return {...session, matchMinute:currentMatch(state)?.id === currentMatch(session)?.id ? state.matchMinute : 0};
}

/** Prepare only the next round. Its results stay private until the final whistle. */
export function prepareUserRound(tournament) {
  let committed = tournament;
  while (canContinueTournament(committed)) {
    const pending = playNextRound(committed);
    if (pending.userMatches.length > committed.userMatches.length) {
      return { tournament: committed, pendingRound: pending, userMatchIndex: committed.userMatches.length };
    }
    committed = pending; // A league bye has no user match to replay.
  }
  return { tournament: committed, pendingRound: null, userMatchIndex: Math.max(0, committed.userMatches.length - 1) };
}

export function commitUserRound(state) {
  const match = currentMatch(state);
  if (!match || !matchHasEnded(state,match) || !state.pendingRound
    || state.userMatchIndex !== state.tournament.userMatches.length) return false;
  state.tournament = state.pendingRound;
  state.pendingRound = null;
  state.matchUnlockedIndex = state.userMatchIndex;
  return true;
}

/** Keep completed rounds; regenerate only an uncommitted match under current difficulty. */
export function migrateNeutralSimulation(state) {
  if(!state.tournament || state.tournament.settings?.modelVersion===SIMULATION_SETTINGS.modelVersion)return {};
  const {draftFamiliarity,...oldSettings}=state.tournament.settings||{};
  const tournament={...state.tournament,settings:{...oldSettings,...SIMULATION_SETTINGS},teams:state.tournament.teams.map(team=>({...team,isUser:team.id===state.tournament.userTeamId,strength:calculateTeam(team.lineup)}))};
  // Version 3 already used the current ratings. Keep a replay that has started;
  // its following rounds adopt the new matchup rule without changing visible scores.
  if(state.pendingRound&&oldSettings.modelVersion>=3&&state.matchMinute>0){
    return {tournament,pendingRound:{...state.pendingRound,settings:tournament.settings,teams:tournament.teams}};
  }
  if(state.pendingRound)return {...prepareUserRound(tournament),matchMinute:0};
  return {tournament};
}

/** Rebuild an old, fully simulated save only as far as the viewed round. */
export function migrateMatchSession(saved, squads) {
  const previous = saved.tournament;
  const viewed = previous.userMatches[saved.userMatchIndex || 0];
  const user = previous.teams.find(team => team.id === previous.userTeamId);
  let tournament = createTournament(user, squads, {
    mode: previous.mode, seed: previous.seed, settings: previous.settings,
    excludeSquadIds: saved.draft?.picks.map(pick => pick.squadId) || [],
  });
  while (tournament.progressRound < (viewed?.round || 1) - 1) tournament = playNextRound(tournament);
  const session = { ...saved, ...prepareUserRound(tournament), matchFlowVersion: MATCH_FLOW_VERSION };
  const match = currentMatch(session);
  session.matchMinute = Math.min(Math.max(0, saved.matchMinute || 0), match?.result.duration || 90);
  commitUserRound(session);
  return session;
}

export function upcomingFixtures(tournament, match) {
  return (tournament.matches || []).filter(fixture => !fixture.result && fixture.id !== match?.id
    && fixture.round > (match?.round || 0)
    && [fixture.homeId, fixture.awayId].includes(tournament.userTeamId))
    .sort((a, b) => a.round - b.round);
}

/** Preview known fixtures, including replays, without reading an unfinished round's outcomes. */
export function nextFixturePreview(state) {
  const match=currentMatch(state);
  if(!match)return {kind:'complete'};
  const ended=matchHasEnded(state,match);
  const t=ended&&state.pendingRound?state.pendingRound:state.tournament;
  const fixture=[...(t.matches||[]),...(t.userMatches||[])]
    .filter(next=>next.id!==match.id&&next.round>match.round&&[next.homeId,next.awayId].includes(t.userTeamId))
    .sort((a,b)=>a.round-b.round)[0];
  // Replaying an earlier game of a finished campaign still has a next opponent.
  if(fixture)return {kind:'fixture',fixture:{...fixture,result:null}};
  if(ended&&!canContinueTournament(t))return {kind:'complete'};
  if(match.stage==='final'||t.mode==='brasileirao')return {kind:ended?'complete':'final'};
  const stages=['round16','quarter','semi','final'];
  const labels=['Oitavas de final','Quartas de final','Semifinal','Final'];
  const nextIndex=match.stage==='group'?0:stages.indexOf(match.stage)+1;
  const draw=t.mode==='copa-do-brasil'&&match.stage==='round16';
  const stage=t.bracket?.find(stage=>stage.stage===match.stage);
  const ties=stage?.ties||stage?.matches||[];
  const index=ties.findIndex(tie=>match.tieId?tie.id===match.tieId:tie.id===match.id);
  const neighbor=index>=0&&!draw?ties[index^1]:null;
  const neighborResult=neighbor&&!neighbor.teamIds?t.matches.find(f=>f.id===neighbor.id)?.result:null;
  const winner=neighbor?.winnerId||neighborResult?.winnerId;
  const opponentIds=(winner?[winner]:neighbor?.teamIds||[neighbor?.homeId,neighbor?.awayId])
    .filter(id=>id&&t.teams.some(team=>team.id===id));
  return {kind:'pending',stageLabel:labels[nextIndex]||'Próxima etapa',draw,opponentIds};
}
