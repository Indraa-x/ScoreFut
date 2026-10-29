import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/clubs.js';
import {createDraft,drawSquad,DEFAULT_REROLLS,refreshDraftSkips} from '../js/draft.js';
import {renderDraft,renderSetup} from '../js/ui.js';

test('the shared count decreases to zero and exhausted controls remain clickable for feedback without allowing another draw',()=>{
  let draft=createDraft(42,'2026-10-12','champions');
  assert.equal(draft.rerolls,DEFAULT_REROLLS);
  assert.equal(DEFAULT_REROLLS,3);
  assert.ok(renderSetup({mode:'champions',formation:'4-3-3'}).includes('3 skips por draft'));
  for(const [index,kind] of ['new','season','club','season'].entries()){
    draft=drawSquad(draft,allSquads,'4-3-3',kind);
    const remaining=3-index;
    const html=renderDraft({mode:'champions',formation:'4-3-3',teamName:'Meu time',rolling:false,draft:{...draft,currentSquad:allSquads.find(squad=>squad.id===draft.currentSquadId),otherSeasonAvailable:true}});
    assert.equal(draft.rerolls,remaining);
    assert.ok(html.includes(`<strong>${remaining}</strong> ${remaining===1?'skip restante':'skips restantes'}`));
    assert.ok(!html.includes('no total'));
    for(const action of ['reroll-club','reroll-season']){
      const button=html.match(new RegExp(`<button[^>]*data-action="${action}"[^>]*>`))[0];
      assert.equal(/\sdisabled(?:[\s=>])/.test(button),false);
      assert.equal(button.includes('aria-disabled="true"'),remaining===0);
    }
  }
  const exhausted=structuredClone(draft);
  for(const kind of ['club','season'])assert.throws(()=>drawSquad(draft,allSquads,'4-3-3',kind),/todos os re-sorteios/);
  assert.deepEqual(draft,exhausted);
});

test('an unavailable season stays disabled while skips remain, but both exhausted controls can explain the limit',()=>{
  const squad=allSquads[0],draft={...createDraft(42,'2026-10-21','champions'),currentSquad:squad,currentSquadId:squad.id,otherSeasonAvailable:false};
  for(const remaining of [3,0]){
    const html=renderDraft({mode:'champions',formation:'4-3-3',teamName:'Meu time',rolling:false,draft:{...draft,rerolls:remaining}});
    const season=html.match(/<button[^>]*data-action="reroll-season"[^>]*>/)[0];
    assert.equal(/\sdisabled(?:[\s=>])/.test(season),remaining>0);
    assert.equal(season.includes('aria-disabled="true"'),remaining===0);
  }
});

test('all competitions have three shared skips and saved drafts keep skips already spent',()=>{
  for(const mode of ['world-cup','champions','copa-do-brasil']){
    assert.equal(createDraft(2,'date',mode).rerolls,3);
    assert.ok(renderSetup({mode,formation:'4-3-3'}).includes('3 skips por draft'));
    for(const oldLimit of [3,4])for(let remaining=0;remaining<=oldLimit;remaining++){
      const legacy={...createDraft(2,'date',mode),rerollLimit:oldLimit,rerolls:remaining};
      const refreshed=refreshDraftSkips(legacy);
      assert.equal(refreshed.rerolls,Math.max(0,3-(oldLimit-remaining)));
      assert.equal(refreshed.rerollLimit,3);
      assert.deepEqual(refreshDraftSkips(refreshed),refreshed);
      assert.equal(legacy.rerolls,remaining);
    }
    const oldest={...createDraft(2,'date',mode),rerolls:2};delete oldest.rerollLimit;
    assert.equal(refreshDraftSkips(oldest).rerolls,2);
  }
  const daily=createDraft(2,'date','daily');assert.equal(refreshDraftSkips(daily).rerolls,0);
});

test('a reroll keeps both controls and the previous club visible while preventing another selection',()=>{
  const squad=allSquads[0],draft={...createDraft(42,'2026-10-23','champions'),currentSquad:squad,currentSquadId:squad.id,otherSeasonAvailable:true};
  const state={mode:'champions',formation:'4-3-3',teamName:'Meu time',rolling:true,draft};
  const html=renderDraft(state);
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(html.includes(squad.nome));
  assert.ok(html.includes('Sorteando…'));
  for(const action of ['reroll-club','reroll-season']){
    const buttons=[...html.matchAll(new RegExp(`<button[^>]*data-action="${action}"[^>]*>`,'g'))];
    assert.equal(buttons.length,1);
    assert.match(buttons[0][0],/\sdisabled(?:[\s=>])/);
  }
  for(const button of html.matchAll(/<button[^>]*data-action="player"[^>]*>/g))assert.match(button[0],/\sdisabled(?:[\s=>])/);
  assert.equal(draft.rerolls,3);
  const first=renderDraft({...state,draft:{...draft,currentSquad:null,currentSquadId:null}});
  assert.ok(first.includes('Buscando time…'));
  assert.ok(!first.includes('data-action="reroll-club"'));
});
