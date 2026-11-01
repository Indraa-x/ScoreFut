import test from 'node:test';
import assert from 'node:assert/strict';
import {renderHome} from '../js/ui.js';
import {statistics} from '../js/storage.js';
import {homeBestLabel} from '../js/home-stat-icons.js';

test('home keeps earned legacy titles but removes the retired mode from its best-campaign label',()=>{
  const history=[{mode:'quick',champion:true,rank:6,stageLabel:'Campeão · Modo rápido'}];
  const before=structuredClone(history),stats=statistics(history);
  const html=renderHome({stats,clubs:[]});
  assert.equal(stats.titles,1);assert.equal(stats.streak,1);assert.equal(stats.winRate,100);
  assert.ok(!/modo rápido/i.test(html));assert.ok(html.includes('<strong>Campeão</strong>'));
  assert.equal((html.match(/class="home-stat-emblem"/g)||[]).length,4);
  assert.deepEqual(history,before);
  assert.equal(homeBestLabel('Campeão · Champions League'),'Campeão · Champions League');
  assert.equal(homeBestLabel('Eliminado · Final'),'Final');
});
