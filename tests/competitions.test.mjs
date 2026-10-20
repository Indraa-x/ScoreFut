import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads,clubs} from '../data/clubs.js';
import {BRAZIL_CLUB_IDS,EUROPE_CLUB_IDS,squadsForMode} from '../data/competitions.js';
import {MODES} from '../js/state.js';
import {FORMATIONS,squadTeam,createTournament,simulateTournament,playNextRound} from '../js/engine.js';
import {createDraft,drawSquad,confirmPick,automaticSlot} from '../js/draft.js';
import {renderHome,renderSetup,renderMatch,renderBracket} from '../js/ui.js';

const user={...squadTeam(allSquads[0]),id:'user',clubId:'user',name:'Meu time'};

test('the categories include instant quick play and both local competition logos',()=>{
  assert.deepEqual(MODES.map(mode=>mode.id),['quick','copa-do-brasil','champions','world-cup']);
  const home=renderHome({clubs,stats:{titles:0,best:'—',streak:0,winRate:0}});
  for(const mode of ['copa-do-brasil','champions']){
    const setup=renderSetup({mode,formation:'4-3-3'});
    assert.ok(!/Desafio diário|Mata-mata rápido/.test(home+setup));
    assert.ok(setup.includes('assets/competitions/copa-do-brasil.png'));
    assert.ok(setup.includes('assets/competitions/champions-league.png'));
  }
  assert.equal(squadsForMode(allSquads,'copa-do-brasil').length,60);
  assert.equal(squadsForMode(allSquads,'champions').length,96);
  assert.deepEqual(EUROPE_CLUB_IDS.slice(-4),['celtic','marseille','psv','roma']);
});

test('regional drafts can fill eleven compatible positions in every formation using only their own clubs',()=>{
  for(const mode of ['copa-do-brasil','champions'])for(const formation of Object.keys(FORMATIONS))for(let seed=0;seed<5;seed++){
    const pool=squadsForMode(allSquads,mode),allowed=mode==='copa-do-brasil'?BRAZIL_CLUB_IDS:EUROPE_CLUB_IDS;
    let draft=createDraft(seed,'2026-10-10',mode);
    for(let round=0;round<11;round++){
      draft=drawSquad(draft,pool,formation);
      const squad=pool.find(item=>item.id===draft.currentSquadId);
      assert.ok(allowed.includes(squad.clubId));
      const player=squad.jogadores.find(player=>!draft.picks.some(pick=>pick.player.id===player.id)&&automaticSlot(draft,formation,player));
      assert.ok(player,`${mode}/${formation}/${seed}/${round}`);
      draft=confirmPick(draft,pool,formation,player.id);
    }
    assert.equal(draft.picks.length,11);
    assert.equal(new Set(draft.picks.map(pick=>pick.player.id)).size,11);
  }
});

test('legacy Brasileirao schedules each opponent home and away, reconciles points, and crowns the table leader without knockouts',()=>{
  const initial=createTournament(user,allSquads,{mode:'brasileirao',seed:39});
  assert.equal(initial.teams.length,16);
  assert.equal(initial.matches.length,240);
  assert.equal(new Set(initial.teams.map(team=>team.clubId)).size,16);
  assert.ok(initial.teams.filter(team=>!team.isUser).every(team=>BRAZIL_CLUB_IDS.includes(team.clubId)));
  for(const home of initial.teams)for(const away of initial.teams)if(home.id!==away.id)assert.equal(initial.matches.filter(match=>match.homeId===home.id&&match.awayId===away.id).length,1);
  const complete=simulateTournament(initial);
  let incremental=initial;
  for(let round=0;round<30;round++)incremental=playNextRound(incremental);
  assert.deepEqual(complete,incremental);
  assert.equal(initial.progressRound,0);
  assert.equal(complete.userMatches.length,30);
  assert.equal(complete.bracket.length,0);
  assert.ok(complete.matches.every(match=>match.result.duration===90&&!match.result.penalties&&!match.result.extraTime));
  assert.equal(complete.championId,complete.groups[0].standings[0].teamId);
  for(const row of complete.groups[0].standings){assert.equal(row.played,30);assert.equal(row.points,row.wins*3+row.draws);assert.equal(row.goalDifference,row.goalsFor-row.goalsAgainst);}
  assert.equal(complete.campaign.points,complete.campaign.wins*3+complete.campaign.draws);
  assert.equal(complete.campaign.eliminated,false);
  const state={mode:'brasileirao',tournament:complete,formation:user.formation,userMatchIndex:0,matchMinute:0,eventFilter:'all',matchUnlockedIndex:0};
  assert.ok(renderMatch(state).includes('league-campaign'));
  assert.ok(renderBracket(state).includes('league-standings'));
});

test('Champions opponents remain European when creation receives the complete global dataset',()=>{
  const tournament=simulateTournament(createTournament(user,allSquads,{mode:'champions',seed:83}));
  assert.equal(tournament.teams.length,32);
  assert.equal(tournament.groups.length,8);
  assert.equal(tournament.matches.length,63);
  assert.ok(tournament.teams.filter(team=>!team.isUser).every(team=>EUROPE_CLUB_IDS.includes(team.clubId)));
  assert.ok(tournament.groups.every(group=>new Set(group.teamIds.map(id=>tournament.teams.find(team=>team.id===id).clubId)).size===4));
});

test('legacy Brasileirao still completes with a bye when all seasons of one club have been drafted',()=>{
  const excluded=allSquads.filter(squad=>squad.clubId==='flamengo').map(squad=>squad.id);
  const tournament=simulateTournament(createTournament(user,allSquads,{mode:'brasileirao',seed:11,excludeSquadIds:excluded}));
  assert.equal(tournament.teams.length,15);
  assert.equal(tournament.matches.length,210);
  assert.equal(tournament.userMatches.length,28);
  assert.ok(tournament.teams.every(team=>!excluded.includes(team.id)));
  assert.ok(tournament.complete);
});
