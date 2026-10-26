import { createTournament, playNextRound, calculateTeam, SIMULATION_SETTINGS, upgradeChampionsTournament } from './engine.js?v=world-cup-20261026';

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
  if (!match || state.matchMinute < match.result.duration || !state.pendingRound
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
