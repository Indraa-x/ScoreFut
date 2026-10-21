import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/clubs.js';
import {createDraft,drawSquad,DEFAULT_REROLLS} from '../js/draft.js';
import {renderDraft} from '../js/ui.js';

test('the shared count decreases to zero and exhausted controls remain clickable for feedback without allowing another draw',()=>{
  let draft=createDraft(42,'2026-10-12','champions');
  assert.equal(draft.rerolls,DEFAULT_REROLLS);
  for(const [index,kind] of ['new','season','club','season'].entries()){
    draft=drawSquad(draft,allSquads,'4-3-3',kind);
    const remaining=3-index;
    const html=renderDraft({mode:'champions',formation:'4-3-3',teamName:'Meu time',rolling:false,draft:{...draft,currentSquad:allSquads.find(squad=>squad.id===draft.currentSquadId),otherSeasonAvailable:true}});
    assert.equal(draft.rerolls,remaining);
    assert.ok(html.includes(`<strong>${remaining}</strong> ${remaining===1?'skip restante':'skips restantes'}`));
    assert.ok(html.includes('3 no total'));
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
