import test from 'node:test';
import assert from 'node:assert/strict';
import {allSquads} from '../data/clubs.js';
import {createDraft,drawSquad,DEFAULT_REROLLS} from '../js/draft.js';
import {renderDraft} from '../js/ui.js';

test('the visible shared skip count starts at three, decreases for either action and disables both when exhausted',()=>{
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
      assert.equal(button.includes('disabled'),remaining===0);
    }
  }
  assert.throws(()=>drawSquad(draft,allSquads,'4-3-3','club'),/todos os re-sorteios/);
});
