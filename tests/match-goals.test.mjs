import test from 'node:test';
import assert from 'node:assert/strict';
import {goalsAt,renderMatchGoals} from '../js/match-goals.js';

test('only goals reached by the clock appear; incidents and shootouts cannot leak players or future scorers',()=>{
  const player=(id,nome=id)=>({id,nome});
  const result={events:[
    {type:'goal',minute:88,team:'away',player:player('future')},
    {type:'goal',minute:12,team:'home',player:player('scorer','Nome <seguro>')},
    {type:'corner',minute:5,team:'home',player:player('corner taker')},
    {type:'penalty',minute:120,team:'away',converted:true,shootout:true,player:player('penalty taker')},
    {type:'goal',minute:35,team:'home',player:player('scorer','Nome <seguro>')},
  ]};
  const before=structuredClone(result);
  assert.ok(renderMatchGoals(result,0).includes('Nenhum gol marcado'));
  const html=renderMatchGoals(result,35,{home:'Meu time',away:'Adversário'},{home:['#2bb777','#174b2e'],away:['#ffffff','#c9a247']});
  assert.ok(html.includes('>Meu time</h3>'));
  assert.ok(html.includes('>Adversário</h3>'));
  assert.ok(html.includes('--team-color-1:#2bb777;--team-color-2:#174b2e'));
  assert.ok(html.includes('--team-color-1:#ffffff;--team-color-2:#c9a247'));
  assert.ok(html.includes('Nome &lt;seguro&gt;'));
  assert.equal((html.match(/Nome &lt;seguro&gt;/g)||[]).length,1);
  assert.ok(html.includes('12′, 35′'));
  assert.ok(!/future|corner taker|penalty taker/.test(html));
  assert.equal(goalsAt(result,87.99).length,2);
  assert.equal(goalsAt(result,88).length,3);
  assert.ok(renderMatchGoals(result,120).includes('future'));
  assert.ok(!renderMatchGoals(result,120).includes('penalty taker'));
  assert.deepEqual(result,before);
});
