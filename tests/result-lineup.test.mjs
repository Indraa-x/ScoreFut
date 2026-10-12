import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMATIONS} from '../js/engine.js';
import {renderResult,renderResultLineup} from '../js/ui.js';

test('result lineup opens as a read-only pitch using the saved players and positions in every formation',()=>{
  for(const [formation,{slots}] of Object.entries(FORMATIONS)){
    const picks=slots.map((slot,index)=>({slot,clubId:'sao-paulo',clubName:'São Paulo',ano:2005,player:{id:'saved-'+index,nome:'Jogador '+index,ovr:80+index}}));
    const record={formation,picks,teamName:'Time <salvo>',mode:'champions',champion:true,strength:90,goalsFor:20,goalsAgainst:4,played:7};
    const before=structuredClone(record);
    const result=renderResult(record,null);
    assert.ok(result.includes('data-action="result-lineup"'));
    assert.ok(result.includes('Ver escalação'));
    assert.ok(!result.includes('Copiar resultado'));
    assert.ok(!result.includes('result-lineup-list'));
    assert.ok(!result.includes('result-lineup-pitch'));
    const pitch=renderResultLineup(record);
    assert.equal((pitch.match(/class="pitch-slot picked"/g)||[]).length,11);
    assert.ok(pitch.includes('Time &lt;salvo&gt;'));
    assert.ok(pitch.includes('data-action="close-modal"'));
    assert.ok(!pitch.includes('data-action="slot"'));
    assert.ok(!pitch.includes('data-lineup-player'));
    for(const pick of picks){
      assert.ok(pitch.includes(`left:${pick.slot.x}%;top:${pick.slot.y}%`));
      assert.ok(pitch.includes(`${pick.slot.label}: ${pick.player.nome} · São Paulo · 2005 · OVR ${pick.player.ovr}`));
    }
    assert.equal((pitch.match(/--stripe-1:/g)||[]).length,11);
    assert.deepEqual(record,before);
  }
});
