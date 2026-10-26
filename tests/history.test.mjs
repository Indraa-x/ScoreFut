import test from 'node:test';
import assert from 'node:assert/strict';
import {filterHistory,formatHistoryDate} from '../js/history.js';

const records=[
  {id:'one',mode:'quick',date:'2026-10-11',teamName:'São Paulo 2005',champion:true,stageLabel:'Campeão',strength:85.5,goalsFor:12,goalsAgainst:4,played:4,formation:'4-3-3',picks:[]},
  {id:'two',mode:'champions',date:'2026-10-12',teamName:'Meu time',champion:false,stageLabel:'Eliminado · Semifinal',strength:90,goalsFor:14,goalsAgainst:9,played:6,formation:'4-4-2',picks:[]},
  {id:'three',mode:'cup',date:'2026-10-12',teamName:'Meu time',champion:true,stageLabel:'Campeão',strength:88,goalsFor:21,goalsAgainst:5,played:7,formation:'4-3-3',picks:[]},
];

test('history filters combine competition, title status and accent-insensitive search without mutating saves',()=>{
  const before=structuredClone(records);
  assert.deepEqual(filterHistory(records).map(record=>record.id),['three','two','one']);
  assert.deepEqual(filterHistory(records,{search:'  SAO PAULO  '}).map(record=>record.id),['one']);
  assert.deepEqual(filterHistory(records,{mode:'champions',titlesOnly:true}),[]);
  assert.deepEqual(filterHistory(records,{titlesOnly:true}).map(record=>record.id),['three','one']);
  assert.deepEqual(filterHistory(records,{search:'semifinal'}).map(record=>record.id),['two']);
  assert.deepEqual(filterHistory(records,{mode:'cup'}).map(record=>record.id),['three']);
  assert.deepEqual(records,before);
});

test('dates remain the saved calendar day, without local timezone shifts or invalid-date crashes',()=>{
  assert.match(formatHistoryDate('2026-10-12'),/12.*out.*2026/);
  assert.match(formatHistoryDate('2026-01-01'),/01.*jan.*2026/);
  assert.equal(formatHistoryDate('2026-02-31'),'2026-02-31');
  assert.equal(formatHistoryDate('unknown'),'unknown');
  assert.equal(formatHistoryDate(null),'Data não informada');
});
