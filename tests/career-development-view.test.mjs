import test from 'node:test';
import assert from 'node:assert/strict';
import {createCareer, CAREER_KEY} from '../js/career.js';
import {playerDevelopment} from '../js/career-development.js';
import {developmentView} from '../js/career-development-view.js';
import {renderCareer, renderCareerDevelopment} from '../js/career-view.js';
import {initCareer} from '../js/career-controller.js';
import * as ui from '../js/ui.js';
const base = () => ({...createCareer(77,'career26-bundesliga-21'),budget:100000});

test('the training workspace filters accents, selects a visible athlete and handles empty results', () => {
  const c=base(),p=c.roster.find(player=>player.nome==='Felipe Chávez');
  const found=developmentView(c,{search:'felipe chavez',selectedId:'missing'});
  assert.equal(found.rows.length,1);
  assert.equal(found.selected.player.id,p.id);
  assert.ok(developmentView(c,{filter:'youth'}).rows.every(row=>row.state.age!==null&&row.state.age<=23));
  assert.equal(developmentView(c,{filter:'injured'}).selected,null);
  const html=renderCareerDevelopment(c,ui,{search:'<script>not a player</script>'});
  assert.match(html,/Nenhum jogador encontrado/);
  assert.match(html,/Escolha um jogador/);
  assert.doesNotMatch(html,/<script>/);
});

test('an injured athlete opens recovery and completed sessions cannot be confirmed again',()=>{
  let c=base(),p=c.roster[0];
  c={...c,development:{tick:4,players:{[p.id]:{...playerDevelopment(c,p),injury:2}}}};
  let view=developmentView(c,{selectedId:p.id,plan:'potential'});
  assert.equal(view.plan,'recovery');
  assert.equal(view.blocked,'');
  let html=renderCareerDevelopment(c,ui,{selectedId:p.id,plan:'potential'});
  assert.match(html,new RegExp('data-value="recovery:'+p.id+'"'));
  assert.match(html,/Iniciar recuperação/);
  c.development.players[p.id].lastTraining=4;
  view=developmentView(c,{selectedId:p.id});
  assert.equal(view.trained,true);
  html=renderCareerDevelopment(c,ui,{selectedId:p.id});
  assert.match(html,/Sessão concluída/);
  assert.match(html,/data-action="career-train"[^>]+ disabled/);
});

test('switching players and plans previews the session without spending; confirmation trains only the selected athlete',()=>{
  let saved=base(),writes=0;
  const p=saved.roster.find(player=>player.nome==='Lennart Karl');
  const before=structuredClone(saved);
  const page=initCareer({app:{addEventListener(){},querySelector(){return null;}},
    storage:{read:key=>key===CAREER_KEY?saved:null,write:(key,value)=>{saved=value;writes++;return true;}},
    ui,render(){},navigate(){},toast(){}});
  page.setTab('club');
  page.actions['career-development-player'](p.id);
  page.actions['career-development-plan']('potential');
  assert.equal(writes,0);
  assert.deepEqual(saved,before);
  let html=page.open();
  assert.match(html,new RegExp('data-action="career-train" data-value="potential:'+p.id+'"'));
  assert.match(html,/data-value="potential" aria-pressed="true"/);
  page.actions['career-train']('potential:'+p.id);
  assert.equal(saved.budget,before.budget-120);
  assert.equal(saved.development.players[p.id].potentialSessions,1);
  assert.equal(Object.keys(saved.development.players).length,1);
  html=page.open();
  assert.match(html,/Sessão concluída/);
  const count=writes;
  page.actions['career-train']('potential:'+p.id);
  assert.equal(writes,count);
  assert.equal(saved.budget,before.budget-120);
});

test('the club shows one selected profile and one confirmation action instead of repeated expanded training forms',()=>{
  const c=base(),html=renderCareer(c,'club',ui);
  assert.equal((html.match(/data-action="career-train"/g)??[]).length,1);
  assert.equal((html.match(/data-development-player="/g)??[]).length,1);
  assert.equal((html.match(/data-action="career-development-player"/g)??[]).length,c.roster.length);
  assert.match(html,/aria-controls="career-development-focus"/);
  assert.match(html,/Galeria de títulos/);
  assert.doesNotMatch(html,/<details class="career-development-player"/);
});
