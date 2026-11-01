import test from 'node:test';
import assert from 'node:assert/strict';
import {resultFixtures} from '../js/share.js';

test('PNG fixtures retain home/away scores, eras and penalties, without exporting future games or mutating the save',()=>{
  const record={tournament:{userTeamId:'user',teams:[{id:'user',name:'Meu time'},{id:'santos-1963',nome:'Santos',ano:1963}],userMatches:[
    {homeId:'santos-1963',awayId:'user',stageLabel:'Final',result:{homeGoals:2,awayGoals:2,penalties:[4,5]}},
    {homeId:'user',awayId:'santos-1963',result:null},
  ]}};
  const before=structuredClone(record),rows=resultFixtures(record);
  assert.equal(rows.length,1);assert.equal(rows[0].home.nome,'Santos');assert.equal(rows[0].home.ano,1963);
  assert.equal(rows[0].away.name,'Meu time');assert.deepEqual(rows[0].result,{homeGoals:2,awayGoals:2,penalties:[4,5]});
  assert.deepEqual(record,before);
});
test('legacy result exports tolerate missing tournament data',()=>{
  assert.deepEqual(resultFixtures({picks:[]}),[]);
  assert.deepEqual(resultFixtures({tournament:{userMatches:[]}}),[]);
});
