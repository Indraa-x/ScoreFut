import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {nationalTeams,nationalSquads} from '../data/national-teams.js';
import {allSquads as clubSquads,clubs} from '../data/clubs.js';
import {allSquads} from '../data/game-squads.js';
import {squadsForMode,competitionName,competitionLogo} from '../data/competitions.js';
import {FORMATIONS,squadTeam,createTournament,playNextRound,simulateTournament} from '../js/engine.js';
import {createDraft,drawSquad,confirmPick,automaticSlot} from '../js/draft.js';
import {prepareUserRound,currentMatch,commitUserRound,canContinueTournament} from '../js/match-session.js';
import {MODES} from '../js/state.js';
import {renderDraft,renderPlayerDragCard,renderSetup,renderHome} from '../js/ui.js';
import {playerPortrait} from '../js/player-portraits.js';
import {CLUB_LOGOS} from '../data/club-logos.js';

const user={...squadTeam(nationalSquads[0]),id:'user',clubId:'user',name:'Meu time'};
test('World Cup replaces Legends and isolates twenty complete national XIs from club modes',()=>{
  assert.equal(nationalTeams.length,20);
  assert.equal(new Set(nationalTeams.map(t=>t.id)).size,20);
  assert.equal(nationalSquads.reduce((n,s)=>n+s.jogadores.length,0),220);
  assert.ok(!MODES.some(m=>m.id==='legends'));
  assert.equal(competitionName('world-cup'),'Copa do Mundo');
  assert.ok(fs.existsSync(competitionLogo('world-cup')));
  assert.equal(squadsForMode(allSquads,'world-cup').length,20);
  for(const mode of ['quick','champions','copa-do-brasil','cup']){
    assert.deepEqual(squadsForMode(allSquads,mode),squadsForMode(clubSquads,mode));
  }
  for(const squad of nationalSquads){
    assert.equal(squad.jogadores.length,11);
    assert.equal(new Set(squad.jogadores.map(p=>p.id)).size,11);
    assert.equal(squad.jogadores.filter(p=>p.tags.includes('GOL')).length,1);
    assert.ok(squad.jogadores.find(p=>p.tags.includes('GOL')).atributos.posicionamento>=65,'Goalkeeper positioning must use the goalkeeper attribute');
    for(const p of squad.jogadores){
      assert.ok(p.ovr>=50&&p.ovr<=96);
      assert.equal(p.ratingEdition,'FIFA 20');
      assert.match(p.ratingSource,/sofifa\.com\/player\//);
      assert.ok(Object.values(p.atributos).every(Number.isFinite));
    }
  }
});

test('all national crests and every player card have local verified face portraits',()=>{
  const logos=JSON.parse(fs.readFileSync('assets/logos/national-sources.json','utf8'));
  const sources=JSON.parse(fs.readFileSync('assets/players/sources.json','utf8')).players;
  for(const squad of nationalSquads){
    const logo=logos.logos.find(l=>l.id===squad.clubId);
    assert.equal(CLUB_LOGOS[squad.clubId],logo.file);
    assert.equal(createHash('sha256').update(fs.readFileSync(logo.file)).digest('hex'),logo.sha256);
    for(const player of squad.jogadores){
      const portrait=playerPortrait(player.id);
      assert.ok(portrait?.frame,player.id);
      assert.ok(fs.existsSync(portrait.src));
      assert.equal(String(sources[player.id].eaId),player.eaId,'National photos must use the verified EA identity, never a name-only homonym');
      const html=renderPlayerDragCard({player,squad,hidden:false});
      assert.ok(html.includes(portrait.src)&&html.includes('face-framed'));
    }
  }
  const setup=renderSetup({mode:'world-cup',formation:'4-3-3'});
  assert.ok(setup.includes('Copa do Mundo')&&setup.includes('OVRs de referência FIFA 20'));
  const home=renderHome({clubs,stats:{titles:0,best:'—',streak:0,winRate:0}});
  assert.ok(home.includes('data-value="world-cup"')&&!home.includes('Modo Lendas'));
});

test('national draft fills every formation with three shared skips and keeps photos off position rows',()=>{
  for(const formation of Object.keys(FORMATIONS))for(let seed=0;seed<12;seed++){
    let draft=createDraft(seed,'2026-10-20','world-cup');
    for(let i=0;i<11;i++){
      draft=drawSquad(draft,nationalSquads,formation);
      if(i<3)draft=drawSquad(draft,nationalSquads,formation,'club');
      const squad=nationalSquads.find(s=>s.id===draft.currentSquadId);
      const html=renderDraft({mode:'world-cup',formation,draft:{...draft,currentSquad:squad}});
      assert.ok(html.includes('Seleção sorteada')&&!html.includes('Outra temporada'));
      const player=squad.jogadores.find(p=>!draft.picks.some(pick=>pick.player.id===p.id)&&automaticSlot(draft,formation,p));
      assert.ok(player,formation+'/'+seed+'/'+i);
      draft=confirmPick(draft,nationalSquads,formation,player.id);
    }
    assert.equal(draft.picks.length,11);
    assert.equal(draft.rerolls,0);
  }
});

test('twenty-team groups schedule every pair once, qualify eight, and finish a deterministic seven-game route',()=>{
  for(let seed=0;seed<16;seed++){
    let t=createTournament(user,allSquads,{mode:'world-cup',seed,excludeSquadIds:nationalSquads.map(s=>s.id)});
    assert.equal(t.teams.length,20);
    assert.equal(new Set(t.teams.map(t=>t.clubId)).size,20);
    assert.equal(t.matches.length,40);
    assert.equal(prepareUserRound(t).pendingRound.userMatches[0].round,1);
    for(const group of t.groups){
      const matches=t.matches.filter(m=>m.groupId===group.id);
      assert.equal(matches.length,10);
      assert.equal(new Set(matches.map(m=>[m.homeId,m.awayId].sort().join('|'))).size,10);
      for(const id of group.teamIds){
        const own=matches.filter(m=>m.homeId===id||m.awayId===id);
        assert.equal(own.length,4);
        assert.equal(new Set(own.map(m=>m.round)).size,4);
      }
    }
    const initial=structuredClone(t);
    for(let round=0;round<5;round++)t=playNextRound(t);
    assert.equal(t.groups.flatMap(g=>g.standings).filter(r=>r.qualified).length,8);
    assert.ok(t.groups.every(g=>g.standings.every(r=>r.played===4)));
    assert.equal(t.bracket[0].stage,'quarter');
    t=simulateTournament(t);
    assert.deepEqual(t,simulateTournament(initial));
    assert.equal(t.matches.length,47);
    assert.ok(t.complete&&t.championId);
    assert.equal(t.campaign.champion,t.championId===user.id);
    assert.ok([4,5,6,7].includes(t.userMatches.length));
  }
});

test('live World Cup handles group byes, saves, and elimination without skipping a user match',()=>{
  let session={...prepareUserRound(createTournament(user,allSquads,{mode:'world-cup',seed:3})),matchMinute:0};
  let watched=0;
  while(currentMatch(session)){
    const match=currentMatch(session);watched++;
    session.matchMinute=match.result.duration;
    assert.ok(commitUserRound(session));
    session=JSON.parse(JSON.stringify(session));
    if(!canContinueTournament(session.tournament))break;
    Object.assign(session,prepareUserRound(session.tournament),{matchMinute:0});
    assert.ok(watched<8);
  }
  assert.equal(watched,session.tournament.userMatches.length);
  assert.ok(watched>=4&&watched<=7);
});
