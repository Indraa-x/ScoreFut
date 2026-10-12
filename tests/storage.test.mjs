import test from 'node:test';
import assert from 'node:assert/strict';
import {statistics} from '../js/storage.js';
test('empty history has stable initial statistics',()=>{assert.deepEqual(statistics([]),{titles:0,played:0,best:'—',streak:0,winRate:0});});
test('first completed campaign sets best rank without a previous record',()=>{const stats=statistics([{rank:4,stageLabel:'Semifinal',champion:false}]);assert.equal(stats.best,'Semifinal');assert.equal(stats.played,1);});
test('best campaign and current consecutive title streak use actual records',()=>{const stats=statistics([{rank:6,stageLabel:'Campeão',champion:true},{rank:2,stageLabel:'Oitavas',champion:false},{rank:6,stageLabel:'Campeão',champion:true},{rank:6,stageLabel:'Campeão',champion:true}]);assert.equal(stats.titles,3);assert.equal(stats.streak,2);assert.equal(stats.best,'Campeão');assert.equal(stats.winRate,75);});
