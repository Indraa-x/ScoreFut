import test from 'node:test';
import assert from 'node:assert/strict';
import { allSquads } from '../data/clubs.js';
import { FORMATIONS, TEAM_SIZE, SIMULATION_SETTINGS, POSITION_MAP, mulberry32, hashSeed, positionFit, calculateTeam, squadTeam, expectedGoals, simulateMatch, createTournament, playNextRound, simulateTournament } from '../js/engine.js';

const player = (id, tag, ovr = 88) => ({ id, nome: id, tags: [tag], ovr, atributos: { ataque: ovr, meio: ovr, defesa: ovr, finalizacao: ovr, reflexo: ovr, posicionamento: ovr } });
const squads = Array.from({ length: 120 }, (_, index) => ({ id: `squad-${index}`, clubId: `club-${Math.floor(index / 4)}`, nome: `Clube ${Math.floor(index / 4)}`, ano: 2000 + index % 4, cores: ['#145b36', '#ffffff'], monograma: 'CL', jogadores: ['GOL','LD','ZAG','ZAG','LE','VOL','MC','MC','PE','PD','CA'].map((tag, place) => player(`p-${index}-${place}`, tag, 80 + index % 15)) }));
const userLineup = FORMATIONS['4-3-3'].slots.map((slot, index) => ({ slot, player: player(`user-${index}`, slot.label), clubId: `user-club-${index}` }));
const user = { id: 'user', name: 'Meu time', lineup: userLineup, strength: calculateTeam(userLineup) };
const deepFreeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

test('eight real formations contain eleven distinct slots and the stated defensive, midfield and attacking lines',()=>{
 assert.equal(TEAM_SIZE,11);assert.deepEqual(Object.keys(FORMATIONS),['4-3-3','4-4-2','4-2-3-1','4-2-4','3-5-2','5-3-2','4-5-1','3-4-3']);
 for(const [key,f] of Object.entries(FORMATIONS)){
  assert.equal(f.slots.length,TEAM_SIZE);assert.equal(new Set(f.slots.map(s=>s.id)).size,TEAM_SIZE);
  assert.equal(f.slots.filter(s=>s.position==='GOL').length,1);
  assert.ok(f.slots.every(s=>s.x>0&&s.x<100&&s.y>0&&s.y<100));
  const lines=key.split('-').map(Number);
  assert.equal(f.slots.filter(s=>s.position==='DEF').length,lines[0],key);
  assert.equal(f.slots.filter(s=>s.position==='MEI').length,lines.slice(1,-1).reduce((sum,n)=>sum+n,0),key);
  assert.equal(f.slots.filter(s=>s.position==='ATA').length,lines.at(-1),key);
  assert.ok(f.slots.every(s=>positionFit(player('natural-'+s.id,s.label),s)===0),key);
 }
 assert.equal(FORMATIONS['4-3-3'].slots.filter(s=>s.position==='DEF').length,4);
 assert.equal(FORMATIONS['3-5-2'].slots.filter(s=>s.position==='MEI').length,5);
 assert.equal(POSITION_MAP.VOL,'MEI');assert.equal(POSITION_MAP.PD,'ATA');
});

test('specific pitch roles allow natural and nearby positions and block arbitrary placement',()=>{
 const fit=(tag,target)=>positionFit(player(tag,tag),{label:target,position:POSITION_MAP[target]});
 for(const tag of ['GOL','ZAG','LD','LE','VOL','MC','MEI','MD','ME','PE','PD','SA','CA'])assert.equal(fit(tag,tag),0);
 assert.equal(fit('ZAG','MC'),null);assert.equal(fit('ZAG','LD'),null);
 assert.equal(fit('CA','MC'),null);assert.equal(fit('CA','PE'),null);
 assert.equal(fit('MC','ZAG'),null);assert.equal(fit('MC','CA'),null);
 assert.equal(fit('LD','MD'),1);assert.equal(fit('LD','LE'),1);assert.equal(fit('LE','ME'),1);
 assert.equal(fit('VOL','ZAG'),1);assert.equal(fit('VOL','MC'),1);
 assert.equal(fit('PE','PD'),1);assert.equal(fit('PD','MD'),1);assert.equal(fit('SA','CA'),1);
 assert.equal(fit('GOL','CA'),null);assert.equal(fit('CA','GOL'),null);
 assert.equal(positionFit({...player('hybrid','CA'),tags:['CA','PE']},FORMATIONS['4-3-3'].slots.find(s=>s.id==='pe')),0);
 assert.equal(positionFit(player('rb','LD'),{position:'DEF'}),0);
});

test('team OVR is the player average and sharing a club adds no automatic bonus', () => {
  assert.equal(calculateTeam([]).overall, 0);
  assert.equal(calculateTeam(userLineup).overall, 88);
  const two = userLineup.map((entry, index) => ({ ...entry, clubId: index < 2 ? 'same' : entry.clubId }));
  const three = userLineup.map((entry, index) => ({ ...entry, clubId: index < 3 ? 'same' : entry.clubId }));
  assert.equal(calculateTeam(two).chemistry, 0);
  assert.deepEqual(calculateTeam(two),calculateTeam(userLineup));
  assert.equal(calculateTeam(three).chemistry, 0);
  assert.deepEqual(calculateTeam(three),calculateTeam(userLineup));
  assert.ok(Object.values(calculateTeam(userLineup)).filter(value => typeof value === 'number').every(value => value >= 0 && value <= 99));
});

test('opponent assignment chooses a complete natural formation without mutating the roster',()=>{
 const squad=deepFreeze(squads[0]);const team=squadTeam(squad);
 assert.equal(team.lineup.length,11);assert.equal(team.formation,'4-3-3');
 assert.ok(team.lineup.every(p=>positionFit(p.player,p.slot)===0));
 assert.equal(team.strength.chemistry,0);assert.equal(team.strength.overall,80);
 assert.equal(squad.jogadores.length,11);
});

test('opponents match flexible roles, never duplicate people, and reject impossible squads',()=>{
 const roles=['GOL','LD','ZAG','ZAG','LE','MD','MC','MC','ME','CA','CA'];
 const squad=deepFreeze({...squads[0],jogadores:roles.map((tag,i)=>player('flex-'+i,tag))});
 const team=squadTeam(squad);
 assert.equal(team.formation,'4-4-2');assert.equal(team.lineup.length,11);
 assert.equal(new Set(team.lineup.map(e=>e.player.id)).size,11);
 assert.ok(team.lineup.every(e=>positionFit(e.player,e.slot)===0));
 assert.throws(()=>squadTeam({...squad,jogadores:squad.jogadores.slice(0,10)}),/dez jogadores/);
 assert.throws(()=>squadTeam({...squad,jogadores:roles.map((tag,i)=>player('impossible-'+i,i?'CA':'GOL'))}),/escalação válida/);
 const same=squad.jogadores.map((p,i)=>i===2?squad.jogadores[1]:p);
 assert.throws(()=>squadTeam({...squad,jogadores:same}),/únicos/);
});

test('all 156 real opponents have eleven unique compatible players and exactly one goalkeeper',()=>{
 assert.equal(allSquads.length,156);
 for(const squad of allSquads){
  assert.equal(squad.jogadores.length,11,squad.id);const team=squadTeam(squad);
  assert.equal(team.lineup.length,11,squad.id);assert.equal(new Set(team.lineup.map(p=>p.player.id)).size,11,squad.id);
  assert.equal(team.lineup.filter(p=>p.slot.position==='GOL').length,1,squad.id);
  assert.ok(team.lineup.every(p=>squad.jogadores.some(candidate=>candidate.id===p.player.id)&&positionFit(p.player,p.slot)!==null),squad.id);
  assert.ok(FORMATIONS[team.formation],squad.id);
 }
});

test('seed generators are stable and resume from explicit state', () => {
  const first = mulberry32('2026-10-10');
  const second = mulberry32('2026-10-10');
  assert.deepEqual(Array.from({ length: 12 }, first), Array.from({ length: 12 }, second));
  const resumed = mulberry32(first.getState());
  assert.equal(first(), resumed());
  assert.notEqual(hashSeed('2026-10-10'), hashSeed('2026-10-11'));
});

test('xG keeps OVR relevant, applies modest assistance and ignores the old large familiarity bonus', () => {
  const home={...user,isUser:false,strength:{...user.strength,attack:90}};
  const away={...squadTeam(squads[0]),isUser:false,strength:{...squadTeam(squads[0]).strength,defense:80}};
  const base=1.3*(90/80)**1.6;
  assert.equal(expectedGoals(home,away),base);
  assert.equal(expectedGoals({...home,isUser:true},away),base*SIMULATION_SETTINGS.userAttackMultiplier);
  assert.equal(expectedGoals(home,{...away,isUser:true}),base/SIMULATION_SETTINGS.userDefenseMultiplier);
  assert.equal(expectedGoals({...home,isUser:true},{...away,isUser:true}),base);
  assert.equal(expectedGoals({...home,strength:{attack:99}},{...away,strength:{defense:1}}),4.5);
  assert.equal(expectedGoals({...home,strength:{attack:1}},{...away,strength:{defense:99}}),.2);
  assert.equal(expectedGoals({...home,isUser:true},away,{...SIMULATION_SETTINGS,draftFamiliarity:3}),base*SIMULATION_SETTINGS.userAttackMultiplier);
  for(let seed=1;seed<=100;seed++)assert.deepEqual(simulateMatch({...home,isUser:true},away,mulberry32(seed),{knockout:true,settings:{...SIMULATION_SETTINGS,draftFamiliarity:3}}),simulateMatch({...home,isUser:true},away,mulberry32(seed),{knockout:true}));
});

test('match events reconcile with the score, stay within the pitch, and resolve knockout draws', () => {
  const away = squadTeam(squads[0]);
  let penaltyMatch = null;
  for (let seed = 0; seed < 60; seed += 1) {
    const result = simulateMatch(user, away, mulberry32(seed), { knockout: true });
    assert.equal(result.events.filter(event => event.type === 'goal' && event.team === 'home').length, result.homeGoals);
    assert.equal(result.events.filter(event => event.type === 'goal' && event.team === 'away').length, result.awayGoals);
    assert.ok(result.events.every(event => event.minute >= 1 && event.minute <= 120 && event.x >= 0 && event.x <= 1 && event.y >= 0 && event.y <= 1 && event.player.id));
    assert.ok(result.events.every((event, index) => !index || event.minute >= result.events[index - 1].minute));
    for (const event of result.events.filter(event => ['corner', 'substitution', 'save'].includes(event.type))) {
      const team = event.team === 'home' ? user : away;
      const assigned = team.lineup.find(entry => entry.player.id === event.player.id);
      assert.ok(assigned);
      if (event.type === 'save') assert.equal(assigned.slot.position, 'GOL');
      else assert.notEqual(assigned.slot.position, 'GOL', 'only outfield players take corners or receive the simulated substitution');
    }
    assert.ok([user.id, away.id].includes(result.winnerId));
    if (result.penalties) penaltyMatch = result;
  }
  assert.ok(penaltyMatch, 'the sample includes a shootout');
  assert.notEqual(...penaltyMatch.penalties);
  assert.equal(penaltyMatch.extraTime, true);
});

test('full cup has 32 unique entrants, excludes drafted squads, and separates clubs within groups', () => {
  const excluded = ['squad-0','squad-11','squad-25','squad-32','squad-44','squad-55','squad-61','squad-77','squad-81','squad-95','squad-111'];
  const cup = createTournament(user, squads, { seed: 123, excludeSquadIds: excluded });
  assert.equal(cup.teams.length, 32);
  assert.equal(new Set(cup.teams.map(team => team.id)).size, 32);
  assert.ok(cup.teams.every(team => !excluded.includes(team.id)));
  assert.equal(cup.groups.length, 8);
  for (const group of cup.groups) {
    assert.equal(group.teamIds.length, 4);
    assert.equal(new Set(group.teamIds.map(id => cup.teams.find(team => team.id === id).clubId)).size, 4);
  }
});

test('shootout terminates with a pathological constant test generator', () => {
  const away = { ...user, id: 'identical-opponent' };
  const result = simulateMatch(user, away, () => 0.5, { knockout: true });
  assert.equal(result.extraTime, true);
  assert.ok(result.penalties);
  assert.notEqual(...result.penalties);
  assert.ok([user.id, away.id].includes(result.winnerId));
});

test('full simulation is pure, repeatable, and equivalent to incrementally playing rounds', () => {
  const initial = deepFreeze(createTournament(user, squads, { seed: 'daily:2026-10-10' }));
  const complete = simulateTournament(initial);
  assert.deepEqual(complete, simulateTournament(initial));
  const candidateTeams = new Map(squads.map(squad => [squad.id, squadTeam(squad)]));
  const prepared = simulateTournament(createTournament(user, squads, { seed: 'daily:2026-10-10', candidateTeams }));
  assert.deepEqual(prepared, complete, 'reusing caller-local prepared opponents preserves the exact seeded tournament');
  let incremental = initial;
  for (let round = 0; round < 7; round += 1) incremental = playNextRound(incremental);
  assert.deepEqual(complete, incremental);
  assert.equal(initial.matches.filter(match => match.result).length, 0);
  assert.equal(initial.progressRound, 0);
  assert.equal(complete.complete, true);
  assert.equal(complete.matches.length, 63);
  assert.equal(complete.matches.filter(match => match.stage === 'group').length, 48);
  assert.deepEqual(complete.bracket.map(stage => stage.matches.length), [8, 4, 2, 1]);
  assert.ok(complete.championId);
  assert.ok(complete.groups.every(group => group.standings.filter(row => row.qualified).length === 2 && group.standings.every(row => row.played === 3)));
  assert.ok(complete.userMatches.length >= 3 && complete.userMatches.length <= 7);
  assert.equal(complete.campaign.played, complete.userMatches.length);
  assert.equal(complete.campaign.champion, complete.championId === user.id);
  assert.equal(complete.campaign.wins + complete.campaign.draws + complete.campaign.losses, complete.campaign.played);
  for (let index = 1; index < complete.bracket.length; index += 1) {
    const prior = complete.bracket[index - 1].matches.map(match => match.result.winnerId).sort();
    const entrants = complete.bracket[index].matches.flatMap(match => [match.homeId, match.awayId]).sort();
    assert.deepEqual(entrants, prior);
  }
});

test('quick mode is a 16-team knockout with exactly 15 fixtures', () => {
  const cup = simulateTournament(createTournament(user, squads, { mode: 'quick', seed: 459 }));
  assert.equal(cup.teams.length, 16);
  assert.equal(cup.groups.length, 0);
  assert.equal(cup.matches.length, 15);
  assert.equal(cup.progressRound, 4);
  assert.ok(cup.matches.every(match => match.result.winnerId));
  assert.ok(cup.userMatches.length >= 1 && cup.userMatches.length <= 4);
});

test('nearby positions keep the full OVR, attributes and shootout finishing',()=>{
 const natural=userLineup.map(entry=>({...entry,player:{...entry.player}}));
 const nearby=natural.map(entry=>entry.slot.id==='le'?{...entry,player:player('nearby-rb','LD')}:entry);
 assert.equal(positionFit(nearby.find(entry=>entry.slot.id==='le').player,'LE'),1);
 assert.deepEqual(calculateTeam(nearby),calculateTeam(natural));
 const opponent=squadTeam(squads[0]);
 const naturalTeam={...user,lineup:natural,strength:calculateTeam(natural)};
 const nearbyTeam={...user,lineup:nearby,strength:calculateTeam(nearby)};
 for(let seed=0;seed<60;seed++){
  const a=simulateMatch(naturalTeam,opponent,mulberry32(seed),{knockout:true});
  const b=simulateMatch(nearbyTeam,opponent,mulberry32(seed),{knockout:true});
  assert.equal(a.homeGoals,b.homeGoals);assert.equal(a.awayGoals,b.awayGoals);assert.deepEqual(a.penalties,b.penalties);
 }
});
