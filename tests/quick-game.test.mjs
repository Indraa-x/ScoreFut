import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads,clubs} from '../data/clubs.js';
import {positionFit,calculateTeam,SIMULATION_SETTINGS,FORMATIONS,squadTeam} from '../js/engine.js';
import {selectQuickTeam,simulateQuickGame} from '../js/quick-game.js';
import {renderHome,renderSetup,renderSummary,renderResult} from '../js/ui.js';
import {competitionName} from '../data/competitions.js';
import {filterQuickClubs} from '../js/quick-catalog.js';
const choose=squadId=>selectQuickTeam({squadId,seed:42,date:'2026-10-11',squads:allSquads});

test('choosing any historical team preserves its eleven real players and stops with a ready lineup, without simulating',()=>{
  const before=structuredClone(allSquads);
  for(const squad of allSquads){
    const selection=choose(squad.id),{draft}=selection;
    assert.equal(selection.quickSquadId,squad.id);
    assert.equal(selection.teamName,squad.nome+' '+squad.ano);
    assert.equal(draft.picks.length,11);
    assert.equal(draft.seen.length,1);
    assert.equal(draft.rerolls,0);
    assert.equal(draft.currentSquadId,null);
    assert.ok(!Object.hasOwn(selection,'tournament'));
    assert.equal(new Set(draft.picks.map(pick=>pick.player.id)).size,11);
    assert.equal(new Set(draft.picks.map(pick=>pick.slot.id)).size,11);
    assert.equal(draft.picks.filter(pick=>pick.slot.position==='GOL').length,1);
    assert.deepEqual(draft.picks.map(pick=>pick.player.id).sort(),squad.jogadores.map(player=>player.id).sort());
    for(const pick of draft.picks){
      assert.notEqual(positionFit(pick.player,pick.slot),null);
      assert.equal(pick.squadId,squad.id);
      assert.deepEqual(pick.player,squad.jogadores.find(player=>player.id===pick.player.id));
    }
  }
  assert.deepEqual(allSquads,before);
  assert.deepEqual(choose(allSquads[0].id),choose(allSquads[0].id));
  assert.throws(()=>choose('unknown'),/Escolha um time/);
});

test('the separate simulation action completes the knockout, preserves the chosen club and uses neutral ratings',()=>{
  const selected=selectQuickTeam({squadId:allSquads[0].id,formation:'4-4-2',seed:42,date:'2026-10-12',squads:allSquads}),before=structuredClone(selected);
  const args={picks:selected.draft.picks,formation:selected.formation,squads:allSquads,seed:77,teamName:selected.teamName};
  const tournament=simulateQuickGame(args);
  assert.ok(tournament.complete);
  assert.equal(tournament.mode,'quick');
  assert.equal(tournament.teams.length,16);
  assert.equal(tournament.groups.length,0);
  assert.equal(tournament.matches.length,15);
  assert.ok(tournament.matches.every(match=>match.result));
  assert.ok(tournament.userMatches.length>=1&&tournament.userMatches.length<=4);
  assert.equal(tournament.settings.modelVersion,SIMULATION_SETTINGS.modelVersion);
  const user=tournament.teams.find(team=>team.id==='user');
  assert.deepEqual(user.lineup,selected.draft.picks);
  assert.equal(user.name,selected.teamName);
  assert.equal(user.formation,'4-4-2');
  assert.equal(user.clubId,allSquads[0].clubId);
  assert.deepEqual(user.cores,allSquads[0].cores);
  assert.deepEqual(user.strength,calculateTeam(selected.draft.picks));
  assert.ok(tournament.teams.filter(team=>team.id!=='user').every(team=>team.id!==selected.quickSquadId));
  assert.deepEqual(simulateQuickGame(args),tournament);
  assert.deepEqual(selected,before);
  assert.throws(()=>simulateQuickGame({...args,picks:selected.draft.picks.slice(1)}),/onze posições/);
  assert.throws(()=>simulateQuickGame({...args,picks:[selected.draft.picks[0],...selected.draft.picks.slice(0,10)]}),/jogadores únicos/);
});

test('Euro replaces the visible quick mode while legacy club selection and saved previews remain readable',()=>{
  const home=renderHome({clubs,stats:{titles:0,best:'—',streak:0,winRate:0}});
  assert.ok(home.includes('data-value="euro"'));
  assert.ok(!home.includes('data-value="quick"'));
  assert.ok(home.includes('Euro'));
  assert.ok(!home.includes('Copa ScoreFut'));
  assert.ok(!home.includes('data-value="cup"'));
  const first=renderSetup({mode:'quick',formation:'4-3-3'});
  assert.ok(first.includes('Escolha a formação'));
  assert.equal((first.match(/data-action="formation"/g)||[]).length,8);
  assert.ok(first.includes('Escolher time'));
  assert.ok(!first.includes('data-action="quick-team"'));
  assert.ok(!first.includes('data-action="tournament"'));
  const setup=renderSetup({mode:'quick',formation:'4-3-3',quickStep:'clubs'});
  assert.equal((setup.match(/data-action="quick-team"/g)||[]).length,
    filterQuickClubs({formation:'4-3-3'}).filter(club=>club.available).length);
  assert.ok(!setup.includes('auto-quick'));
  assert.ok(!setup.includes('Montar meu time'));
  assert.ok(!setup.includes('data-action="tournament"'));
  const selected=choose(allSquads[0].id);
  const summary=renderSummary({mode:'quick',...selected});
  assert.ok(summary.includes('Pular para simulação'));
  assert.ok(summary.includes('data-action="tournament"'));
  assert.ok(summary.includes('data-action="quick-choose-club"'));
  assert.ok(summary.includes('id="quick-season"'));
  assert.equal((summary.match(/data-lineup-player=/g)||[]).length,11);
  const t=simulateQuickGame({picks:selected.draft.picks,formation:selected.formation,squads:allSquads,seed:77,teamName:selected.teamName}),c=t.campaign;
  const result=renderResult({mode:'quick',teamName:selected.teamName,formation:selected.formation,picks:selected.draft.picks,strength:calculateTeam(selected.draft.picks).overall,champion:c.champion,stageLabel:c.stageLabel,goalsFor:c.goalsFor,goalsAgainst:c.goalsAgainst,played:c.played,topScorer:c.topScorer},t);
  assert.equal(competitionName('quick'),'Modo rápido');
  assert.equal((result.match(/class="result-match-row"/g)||[]).length,t.userMatches.length);
  assert.ok(result.includes('data-action="result-lineup"'));
});

test('quick mode honors each requested formation and never replaces it with an automatic formation',()=>{
  const before=structuredClone(allSquads);
  for(const formation of Object.keys(FORMATIONS)){
    let successes=0,blocked=0;
    for(const squad of allSquads){
      let compatible;
      try{compatible=squadTeam(squad,formation);}catch{blocked++;assert.throws(()=>selectQuickTeam({squadId:squad.id,formation,seed:1,date:'2026-10-12',squads:allSquads}),/não possui uma escalação válida/);continue;}
      const selection=selectQuickTeam({squadId:squad.id,formation,seed:1,date:'2026-10-12',squads:allSquads});
      assert.equal(selection.formation,formation);
      assert.deepEqual(selection.draft.picks,compatible.lineup);
      assert.equal(selection.draft.picks.length,11);
      assert.equal(new Set(selection.draft.picks.map(pick=>pick.slot.id)).size,11);
      assert.ok(selection.draft.picks.every(pick=>positionFit(pick.player,pick.slot)!==null));
      successes++;
    }
    assert.ok(successes>0);
    assert.ok(blocked>0);
  }
  assert.deepEqual(allSquads,before);
  assert.throws(()=>selectQuickTeam({squadId:allSquads[0].id,formation:'unknown',seed:1,date:'2026-10-12',squads:allSquads}),/formação disponível/);
});
