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
test('World Cup has three historical XIs for each of twenty countries and stays isolated from club modes',()=>{
  assert.equal(nationalTeams.length,60);
  assert.equal(new Set(nationalTeams.map(t=>t.id)).size,20);
  assert.equal(nationalSquads.reduce((n,s)=>n+s.jogadores.length,0),660);
  for(const id of new Set(nationalTeams.map(t=>t.id))){
    const eras=nationalTeams.filter(team=>team.id===id);
    assert.equal(eras.length,3,id);
    assert.equal(new Set(eras.map(team=>team.ano)).size,3,id);
  }
  assert.ok(!MODES.some(m=>m.id==='legends'));
  assert.equal(competitionName('world-cup'),'Copa do Mundo');
  assert.ok(fs.existsSync(competitionLogo('world-cup')));
  assert.equal(squadsForMode(allSquads,'world-cup').length,60);
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
      assert.equal(p.ratingEdition,'Pico histórico ScoreFut');
      assert.ok(Object.values(p.atributos).every(Number.isFinite));
    }
    assert.doesNotThrow(()=>squadTeam(squad),`${squad.nome} ${squad.ano} must be usable as a tournament opponent`);
  }
});

test('national crests stay local and available face portraits render on every historical player card',()=>{
  const logos=JSON.parse(fs.readFileSync('assets/logos/national-sources.json','utf8'));
  const sources=JSON.parse(fs.readFileSync('assets/players/sources.json','utf8')).players;
  for(const squad of nationalSquads){
    const logo=logos.logos.find(l=>l.id===squad.clubId);
    assert.equal(CLUB_LOGOS[squad.clubId],logo.file);
    assert.equal(createHash('sha256').update(fs.readFileSync(logo.file)).digest('hex'),logo.sha256);
    for(const player of squad.jogadores){
      const portrait=playerPortrait(player.id);
      const html=renderPlayerDragCard({player,squad,hidden:false});
      if(portrait){
        assert.ok(fs.existsSync(portrait.src),player.id);
        assert.ok(html.includes(portrait.src),player.id);
        if(portrait.frame)assert.ok(html.includes('face-framed'),player.id);
        if(sources[player.id]?.sha256)assert.equal(createHash('sha256').update(fs.readFileSync(portrait.src)).digest('hex'),sources[player.id].sha256);
      }else assert.ok(html.includes('drag-card-initials'),player.id);
    }
  }
  const setup=renderSetup({mode:'world-cup',formation:'4-3-3'});
  assert.ok(setup.includes('Copa do Mundo')&&setup.includes('OVRs históricos ScoreFut')&&setup.includes('3 fases históricas por seleção'));
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
      const html=renderDraft({mode:'world-cup',formation,draft:{...draft,currentSquad:squad,otherSeasonAvailable:true}});
      assert.ok(html.includes('Fase histórica sorteada')&&html.includes('Outra fase')&&!html.includes('Outra temporada'));
      const player=squad.jogadores.find(p=>!draft.picks.some(pick=>pick.player.id===p.id)&&automaticSlot(draft,formation,p));
      assert.ok(player,formation+'/'+seed+'/'+i);
      draft=confirmPick(draft,nationalSquads,formation,player.id);
    }
    assert.equal(draft.picks.length,11);
    assert.equal(new Set(draft.picks.map(pick=>pick.clubId)).size,11,'Each selected country appears once even though it has three eras');
    assert.equal(draft.rerolls,0);
  }
});

test('two phase rerolls expose all three eras of the current country',()=>{
  let draft=createDraft(728,'2026-10-20','world-cup');
  draft=drawSquad(draft,nationalSquads,'4-3-3','new','world-cup');
  const first=nationalSquads.find(squad=>squad.id===draft.currentSquadId);
  const years=new Set([first.ano]);
  for(let i=0;i<2;i++){
    draft=drawSquad(draft,nationalSquads,'4-3-3','season','world-cup');
    const next=nationalSquads.find(squad=>squad.id===draft.currentSquadId);
    assert.equal(next.clubId,first.clubId);
    years.add(next.ano);
  }
  assert.deepEqual([...years].sort((a,b)=>a-b),nationalSquads.filter(squad=>squad.clubId===first.clubId).map(squad=>squad.ano).sort((a,b)=>a-b));
});

test('twenty-team groups schedule every pair once, qualify eight, and finish a deterministic seven-game route',()=>{
  for(let seed=0;seed<16;seed++){
    let t=createTournament(user,allSquads,{mode:'world-cup',seed,excludeSquadIds:nationalSquads.map(s=>s.id)});
    assert.equal(t.teams.length,20);
    assert.equal(new Set(t.teams.map(t=>t.clubId)).size,20);
    assert.equal(t.teams.filter(team=>team.id!=='user').length,19);
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

