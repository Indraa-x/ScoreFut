import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/game-squads.js';
import {squadsForMode} from '../data/competitions.js';
import {FORMATIONS,createTournament,hashSeed} from '../js/engine.js';
import {createDraft,drawSquad,confirmPick,automaticSlot,refreshDraftSkips} from '../js/draft.js';
import {prepareUserRound} from '../js/match-session.js';
import {createChallenge,decodeChallenge,validateChallenge,createChallengeDraft,validateChallengeDraft,challengeTournamentSeed,challengeLink} from '../js/challenge.js';
import {renderHome,renderDraft,renderSummary,renderResult} from '../js/ui.js';

test('challenge codes round-trip every competition and formation, with zero and maximum uint32 seeds',()=>{
  for(const mode of ['world-cup','copa-do-brasil','champions'])for(const formation of Object.keys(FORMATIONS))for(const seed of [0,0xffffffff]){
    const challenge=createChallenge({mode,formation,seed},allSquads);
    assert.deepEqual(validateChallenge(challenge.code,allSquads),challenge);
    assert.deepEqual(decodeChallenge('  '+challenge.code.toLowerCase()+'  '),challenge);
    assert.deepEqual(decodeChallenge(challengeLink(challenge.code,'https://example.com/ScoreFut/?v=old#result')),challenge);
    assert.deepEqual([challenge.mode,challenge.formation,challenge.seed],[mode,formation,seed]);
  }
});

test('malformed, truncated, edited and incompatible codes are rejected without changing any data',()=>{
  const challenge=createChallenge({mode:'champions',formation:'4-3-3',seed:42},allSquads);
  for(const input of [null,{},'', 'a'.repeat(401),'<script>alert(1)</script>',challenge.code.slice(0,-1),challenge.code.replace('-16-','-17-'),'https://example.com/?other=1'])assert.throws(()=>decodeChallenge(input),/inválido/);
  assert.throws(()=>createChallenge({mode:'quick',formation:'4-3-3',seed:1},allSquads));
  assert.throws(()=>createChallenge({mode:'champions',formation:'4-3-3',seed:0x100000000},allSquads));
  const pool=squadsForMode(allSquads,'champions'),changed=structuredClone(pool);changed[0].jogadores[0].ovr--;
  assert.throws(()=>validateChallenge(challenge,changed),/outra versão/);
  const old=challenge.code.split('-');old[4]='5';const body=old.slice(0,-1).join('-');
  old[old.length-1]=hashSeed('ScoreFut challenge 1|'+body).toString(36).toUpperCase().padStart(7,'0');
  assert.equal(decodeChallenge(old.join('-')).modelVersion,5);
  assert.throws(()=>validateChallenge(old.join('-'),allSquads),/outra versão/);
  assert.deepEqual(validateChallenge(challenge,allSquads),challenge);
});

function pickFirstAvailable(draft,pool,formation){
  const squad=pool.find(s=>s.id===draft.currentSquadId),player=squad.jogadores.find(p=>!draft.picks.some(pick=>pick.player.id===p.id)&&automaticSlot(draft,formation,p));
  return confirmPick(draft,pool,formation,player.id);
}

test('independent browsers get the same initial draw and identical choices/skips resume deterministically',()=>{
  for(const mode of ['world-cup','champions','copa-do-brasil']){
    const challenge=createChallenge({mode,formation:'4-3-3',seed:20261101},allSquads),pool=squadsForMode(allSquads,mode);
    let a=createChallengeDraft(challenge,allSquads,'2026-11-01'),b=createChallengeDraft(challenge.code,allSquads,'2026-11-02');
    const forbiddenEntropy=()=>assert.fail('Challenges must use their stored RNG, not browser entropy');
    const draw=(d,kind='new')=>drawSquad(d,pool,challenge.formation,kind,mode,forbiddenEntropy);
    a=draw(a);b=draw(b);assert.equal(a.currentSquadId,b.currentSquadId);
    a=draw(a,'club');b=draw(b,'club');assert.equal(a.currentSquadId,b.currentSquadId);assert.equal(a.rerolls,2);
    a=pickFirstAvailable(a,pool,challenge.formation);b=pickFirstAvailable(b,pool,challenge.formation);
    a=JSON.parse(JSON.stringify(a));assert.deepEqual(refreshDraftSkips(a),a);validateChallengeDraft(a,challenge.formation,allSquads);
    while(a.picks.length<11){a=draw(a);b=draw(b);assert.equal(a.currentSquadId,b.currentSquadId);a=pickFirstAvailable(a,pool,challenge.formation);b=pickFirstAvailable(b,pool,challenge.formation);}
    assert.deepEqual(a.picks,b.picks);assert.equal(a.rngState,b.rngState);
    assert.throws(()=>validateChallengeDraft(a,'4-4-2',allSquads),/formação/);
    const tournament=d=>createTournament({id:'user',clubId:'user',name:'Meu time',lineup:d.picks},allSquads,{mode,seed:challengeTournamentSeed(challenge),excludeSquadIds:d.picks.map(p=>p.squadId)});
    assert.deepEqual(prepareUserRound(tournament(a)),prepareUserRound(tournament(b)));
  }
});

test('normal draws still use fresh browser entropy, and starting a normal draft carries no challenge',()=>{
  let calls=0;const pool=squadsForMode(allSquads,'champions'),draft=createDraft(42,'today','champions');
  drawSquad(draft,pool,'4-3-3','new','champions',length=>{calls++;return length-1;});
  assert.equal(calls,2);assert.equal(draft.challenge,undefined);
});

test('the home offers code challenges and saved draft/result banners are escaped and shareable',()=>{
  const home=renderHome({clubs:[],stats:{titles:0,best:'—',streak:0,winRate:0}});
  assert.ok(home.includes('data-action="challenge-create"'));assert.ok(home.includes('data-action="challenge-enter"'));
  const challenge=createChallenge({mode:'champions',formation:'4-3-3',seed:42},allSquads),draft=createChallengeDraft(challenge,allSquads,'today');
  const state={draft,mode:'champions',formation:'4-3-3',teamName:'Meu time'};
  assert.ok(renderDraft(state).includes(challenge.code));assert.ok(renderSummary(state).includes(challenge.code));
  assert.ok(renderResult({mode:'champions',teamName:'Meu time',strength:90,played:7,challenge},null).includes(challenge.code));
  assert.ok(!renderDraft({...state,draft:{...draft,challenge:{code:'<script>bad</script>'}}}).includes('<script>'));
});
