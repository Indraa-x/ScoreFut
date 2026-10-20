import {FORMATIONS,TEAM_SIZE,positionFit,calculateTeam,createTournament,simulateTournament,squadTeam} from './engine.js?v=champions-two-legs-20261020';
import {createDraft} from './draft.js?v=champions-two-legs-20261020';

/** Select one historical club's complete lineup; simulation is a separate action. */
export function selectQuickTeam({squadId,seed,date,squads,formation=null}){
  const squad=squads.find(squad=>squad.id===squadId);
  if(!squad)throw new Error('Escolha um time disponível.');
  const team=squadTeam(squad,formation);
  const draft={...createDraft(seed,date,'quick'),picks:team.lineup,seen:[squad.id],rerolls:0};
  return {draft,formation:team.formation,teamName:team.name,quickSquadId:squad.id};
}

/** An entire 16-team knockout, using the shared simulation difficulty without playback delays. */
export function simulateQuickGame({picks,formation,squads,seed,teamName='Meu time'}){
  const slots=FORMATIONS[formation]?.slots;
  if(!slots||picks.length!==TEAM_SIZE||new Set(picks.map(pick=>pick.player.id)).size!==TEAM_SIZE||new Set(picks.map(pick=>pick.slot.id)).size!==TEAM_SIZE||picks.some(pick=>!slots.some(slot=>slot.id===pick.slot.id&&positionFit(pick.player,slot)!==null)))throw new Error('Complete as onze posições com jogadores únicos antes de simular.');
  const squad=picks.every(pick=>pick.squadId===picks[0].squadId)?squads.find(squad=>squad.id===picks[0].squadId):null;
  const user={id:'user',name:teamName,formation,clubId:squad?.clubId||'user',monograma:squad?.monograma||'MT',cores:squad?.cores||['#2bb777','#174b2e'],lineup:picks,strength:calculateTeam(picks)};
  return simulateTournament(createTournament(user,squads,{mode:'quick',seed,excludeSquadIds:picks.map(pick=>pick.squadId)}));
}
