import test from 'node:test';
import assert from 'node:assert/strict';
import {filterHistory,formatHistoryDate} from '../js/history.js';
import {renderHistory,renderHistoryEntries} from '../js/ui.js';
import {statistics} from '../js/storage.js';

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

test('history exposes saved results, readable metrics, legacy competitions and safe filtered/empty states',()=>{
  const html=renderHistory(records,statistics(records));
  assert.equal((html.match(/data-action="history-result"/g)||[]).length,3);
  assert.ok(html.indexOf('data-value="three"')<html.indexOf('data-value="two"'));
  for(const text of ['Gols a favor / sofridos','Eliminado · Semifinal','Campeão','OVR','Jogos'])assert.ok(html.includes(text));
  assert.ok(html.includes('<option value="cup"'));
  assert.ok(html.includes('data-mode="quick"'));
  assert.ok(html.includes('data-mode="champions"'));
  const filtered=renderHistory(records,statistics(records),{mode:'champions',titlesOnly:true});
  assert.ok(filtered.includes('Nenhuma campanha encontrada'));
  assert.ok(filtered.includes('data-action="history-clear"'));
  assert.ok(filtered.includes('0 de 3 campanhas'));
  assert.ok(filtered.includes('<strong>3</strong>')); // The total is not reduced by a filter.
  const empty=renderHistory([],statistics([]));
  assert.ok(empty.includes('Sua história começa em campo'));
  assert.ok(empty.includes('Escolher meu time'));
  const unsafe=renderHistoryEntries([{...records[0],teamName:'<img src=x onerror=alert(1)>',id:'" onclick="alert(1)'}]);
  assert.ok(!unsafe.includes('<img src=x'));
  assert.ok(!unsafe.includes(' onclick="'));
  assert.ok(unsafe.includes('&lt;img'));
});
