import test from 'node:test';
import assert from 'node:assert/strict';
import {createCareer, CAREER_KEY} from '../js/career.js';
import {initCareer} from '../js/career-controller.js';
import {renderCareerSetup} from '../js/career-setup-view.js';
import {CAREER_LEAGUES} from '../data/career-leagues.js';
import * as ui from '../js/ui.js';
const activeKey='coach-career-active';
const ids=['career26-bundesliga-21','career26-laliga-243','career26-brasileirao-20002'];
const key=id=>id?CAREER_KEY+':'+id:CAREER_KEY;
function page(active=ids[0]){
  const saves=ids.map((id,i)=>({...createCareer(42+i,id),season:i+1}));
  const legacy={...createCareer(99),name:'Campanha antiga'};
  const slots=new Map([[activeKey,active],[CAREER_KEY,legacy],...saves.map(save=>[key(save.clubId),save])]);
  const errors=[];let reject=null;
  const events={};
  const controller=initCareer({app:{addEventListener(name,fn){events[name]=fn;},querySelector(){return null;}},ui,
    storage:{read:k=>slots.get(k)??null,write:(k,v)=>{if(k===reject)return false;slots.set(k,v);return true;}},
    navigate(){},render(){},toast:message=>errors.push(message)});
  controller.setTab('setup');
  return {controller,slots,saves,legacy,errors,events,reject:key=>reject=key};
}

test('every league offers its clubs and an accurate selected-team preview without writing saves',()=>{
  for(const league of CAREER_LEAGUES){
    const team=league.teams[0],html=renderCareerSetup(league.id,team.id,[],ui);
    assert.equal((html.match(/data-action="career-select-club"/g)??[]).length,league.teams.length);
    assert.match(html,/career-club-preview-stars/);
    assert.match(html,/Buscar clube/);
    assert.ok(html.includes('--pick-primary:'+team.cores[0]));
    assert.match(html,/Iniciar campanha/);
    assert.match(renderCareerSetup(league.id,team.id,[{clubId:team.id}],ui),/Continuar campanha/);
    const empty=renderCareerSetup(league.id,null,[],ui,{search:'nonexistent-club'});
    assert.match(empty,/Nenhum clube encontrado/);
    assert.doesNotMatch(empty,/data-action="career-create"/);
  }
});

test('club search ignores accents and escaped names cannot inject markup in deletion confirmation',()=>{
  const html=renderCareerSetup('laliga',null,[],ui,{search:'atletico madrid'});
  assert.equal((html.match(/data-action="career-select-club"/g)??[]).length,1);
  const saved={clubId:ids[0],name:'<img src=x onerror=oops>',season:2};
  const confirm=renderCareerSetup(null,null,[saved],ui,{pendingDelete:ids[0]});
  assert.doesNotMatch(confirm,/<img src=x/);
  assert.match(confirm,/Confirmar exclusão/);
  assert.match(confirm,/Excluir campanha/);
});

test('deleting a specific inactive campaign requires confirmation and preserves other campaigns',()=>{
  const p=page(),before=structuredClone(p.slots);
  p.controller.actions['career-delete-confirm'](ids[1]);
  assert.deepEqual(p.slots,before);
  p.controller.actions['career-delete-request'](ids[1]);
  assert.deepEqual(p.slots,before);
  p.controller.actions['career-delete-cancel'](ids[1]);
  p.controller.actions['career-delete-confirm'](ids[1]);
  assert.deepEqual(p.slots,before);
  p.controller.actions['career-delete-request'](ids[1]);
  p.controller.actions['career-delete-confirm'](ids[0]);
  assert.deepEqual(p.slots,before);
  p.controller.actions['career-delete-confirm'](ids[1]);
  assert.equal(p.slots.get(key(ids[1])),null);
  for(const id of [ids[0],ids[2],null])assert.deepEqual(p.slots.get(key(id)),before.get(key(id)));
  assert.equal(p.slots.get(activeKey),ids[0]);
  assert.match(p.controller.open(),/Desfazer/);
  p.controller.actions['career-delete-undo']();
  assert.deepEqual(p.slots,before);
});

test('deleting the active campaign selects a valid fallback and undo restores exact progress',()=>{
  const p=page(),before=structuredClone(p.slots);
  p.controller.actions['career-delete-request'](ids[0]);
  p.controller.actions['career-delete-confirm'](ids[0]);
  assert.equal(p.slots.get(activeKey),null);
  p.controller.actions['career-load']('');
  assert.match(p.controller.open(),/Campanha antiga/);
  p.controller.actions['career-new']();
  p.controller.actions['career-delete-undo']();
  assert.deepEqual(p.slots,before);
});

test('legacy campaigns can be deleted and storage failures leave the original save and routing intact',()=>{
  const p=page(null),before=structuredClone(p.slots);
  p.controller.actions['career-delete-request']('');
  p.reject(CAREER_KEY);
  p.controller.actions['career-delete-confirm']('');
  assert.deepEqual(p.slots,before);
  assert.equal(p.errors.length,1);
  p.reject(null);
  p.controller.actions['career-delete-confirm']('');
  assert.equal(p.slots.get(CAREER_KEY),null);
  assert.ok(ids.includes(p.slots.get(activeKey)));
  p.controller.actions['career-delete-undo']();
  assert.deepEqual(p.slots,before);
});

test('undo never overwrites a newly created campaign in the deleted slot',()=>{
  const p=page();
  p.controller.actions['career-delete-request'](ids[1]);
  p.controller.actions['career-delete-confirm'](ids[1]);
  const replacement=createCareer(111,ids[1]);p.slots.set(key(ids[1]),replacement);
  p.controller.actions['career-delete-undo']();
  assert.equal(p.slots.get(key(ids[1])),replacement);
  assert.equal(p.errors.length,1);
});

test('deleting the last campaign returns to a clean intro and cannot resurrect cached progress',()=>{
  const p=page();
  for(const id of [...ids,'']){
    p.controller.actions['career-delete-request'](id);
    p.controller.actions['career-delete-confirm'](id);
  }
  p.controller.actions.career();
  const intro=p.controller.open();
  assert.match(intro,/Começar campanha/);
  assert.doesNotMatch(intro,/Continuar campanha/);
  assert.equal(p.slots.get(CAREER_KEY),null);
});

test('routing failures prevent deletion, and undo keeps a subsequently selected campaign active',()=>{
  const p=page(),before=structuredClone(p.slots);
  p.controller.actions['career-delete-request'](ids[0]);
  p.reject(activeKey);
  p.controller.actions['career-delete-confirm'](ids[0]);
  assert.deepEqual(p.slots,before);
  p.reject(null);
  p.controller.actions['career-delete-confirm'](ids[0]);
  p.controller.actions['career-load'](ids[1]);
  p.controller.actions['career-new']();
  p.controller.actions['career-delete-undo']();
  assert.equal(p.slots.get(activeKey),ids[1]);
  assert.deepEqual(p.slots.get(key(ids[0])),before.get(key(ids[0])));
});
