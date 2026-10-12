import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMATIONS,positionFit} from '../js/engine.js';
import {createDraft,movableSlots,movePick} from '../js/draft.js';
import {renderSummary,renderDraft} from '../js/ui.js';
import {allSquads} from '../data/clubs.js';

const slots=FORMATIONS['4-3-3'].slots;
const ca=slots.find(slot=>slot.label==='CA'),pd=slots.find(slot=>slot.label==='PD'),gol=slots.find(slot=>slot.position==='GOL');
const player=(id,tags)=>({id,nome:id,tags,ovr:92,atributos:{ataque:90,meio:80,defesa:60,finalizacao:90,reflexo:30,posicionamento:85},titulos:1});
const pick=(id,tags,slot)=>({player:player(id,tags),slot,clubId:'sao-paulo',clubName:'São Paulo',squadId:'sao-paulo-2005',ano:2005});
const draft=picks=>({...createDraft(17,'2026-10-11','cup'),picks,currentSquadId:allSquads[0].id,seen:[allSquads[0].id],selectedPickId:picks[0].player.id});

test('an assigned attacker can move to an empty compatible wing without consuming progress or altering the player',()=>{
  const before=draft([pick('atacante',['CA','PD'],ca)]),snapshot=structuredClone(before);
  assert.ok(movableSlots(before,'4-3-3','atacante').some(slot=>slot.id===pd.id));
  const after=movePick(before,'4-3-3','atacante',pd.id);
  assert.equal(after.picks[0].slot.id,pd.id);
  assert.deepEqual(after.picks[0].player,before.picks[0].player);
  for(const key of ['rerolls','seen','rngState','seed','currentSquadId'])assert.deepEqual(after[key],before[key]);
  assert.equal(after.selectedPickId,null);
  assert.deepEqual(before,snapshot);
});

test('occupied positions swap only when both players fit; ratings and identities remain intact',()=>{
  const before=draft([pick('primeiro',['CA','PD'],ca),pick('segundo',['CA','PD'],pd)]);
  const after=movePick(before,'4-3-3','primeiro',pd.id);
  assert.deepEqual(after.picks.map(pick=>pick.slot.id),[pd.id,ca.id]);
  assert.deepEqual(after.picks.map(pick=>pick.player),before.picks.map(pick=>pick.player));
  assert.equal(new Set(after.picks.map(pick=>pick.slot.id)).size,after.picks.length);
  const invalid=draft([pick('primeiro',['CA','PD'],ca),pick('goleiro',['GOL'],pd)]);
  assert.ok(!movableSlots(invalid,'4-3-3','primeiro').some(slot=>slot.id===pd.id));
  assert.throws(()=>movePick(invalid,'4-3-3','primeiro',pd.id),/compatível/);
  assert.throws(()=>movePick(before,'4-3-3','primeiro',gol.id),/compatível/);
  assert.throws(()=>movePick(before,'4-3-3','primeiro','missing'),/compatível/);
  assert.throws(()=>movePick(before,'4-3-3','missing',pd.id),/compatível/);
});

test('every permitted swap across all formations leaves both players compatible and all eleven slots unique',()=>{
  for(const [formation,{slots}] of Object.entries(FORMATIONS)){
    const picks=slots.map((slot,index)=>pick('jogador-'+index,[slot.label],slot));
    const before=draft(picks),snapshot=structuredClone(before);
    for(const entry of picks)for(const destination of movableSlots(before,formation,entry.player.id)){
      const after=movePick(before,formation,entry.player.id,destination.id);
      assert.equal(after.picks.length,11);
      assert.equal(new Set(after.picks.map(pick=>pick.slot.id)).size,11);
      assert.equal(new Set(after.picks.map(pick=>pick.player.id)).size,11);
      assert.ok(after.picks.every(pick=>positionFit(pick.player,pick.slot)!==null));
    }
    assert.deepEqual(before,snapshot);
  }
});

test('picked circles can be selected in draft and summary and occupied compatible destinations stay enabled',()=>{
  const d=draft([pick('primeiro',['CA','PD'],ca),pick('segundo',['CA','PD'],pd)]);
  const state={mode:'cup',formation:'4-3-3',teamName:'Meu time',draft:{...d,currentSquad:null}};
  for(const html of [renderDraft(state),renderSummary(state)]){
    assert.ok(html.includes('data-lineup-player="primeiro"'));
    const target=html.match(new RegExp('<button[^>]*data-value="'+pd.id+'"[^>]*>'))[0];
    assert.ok(target.includes('compatible'));
    assert.ok(!target.includes('disabled'));
    assert.ok(target.includes('Trocar primeiro'));
    assert.ok(html.includes('move-origin'));
  }
});
