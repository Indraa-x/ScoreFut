import test from 'node:test';
import assert from 'node:assert/strict';
import {archiveRetiredCompetition} from '../js/storage.js';

function fixture(mode,fail=false){
 const raw=JSON.stringify({mode,draft:{picks:[{player:{id:'saved-player'}}]},tournament:{score:'preserved'}});
 const values=new Map([['scorefut.active',raw],['scorefut.history','["previous"]'],['scorefut.achievements','{"previous":true}']]);
 globalThis.localStorage={getItem:key=>values.get(key)??null,removeItem:key=>values.delete(key),setItem(key,value){if(fail&&key.includes('retired-national'))throw Error('Quota');values.set(key,value);}};
 return {raw,values};
}
test('retired national saves are archived exactly while campaign totals and earned progress remain untouched',()=>{
 const {raw,values}=fixture('euro');
 assert.equal(archiveRetiredCompetition(),true);
 assert.equal(values.get('scorefut.active'),undefined);
 assert.equal(values.get('scorefut.retired-national.active'),raw);
 assert.equal(values.get('scorefut.history'),'["previous"]');
 assert.equal(values.get('scorefut.achievements'),'{"previous":true}');
 assert.equal(archiveRetiredCompetition(),true);
});
test('a failed archive restores the original active save instead of losing the lineup or result',()=>{
 const {raw,values}=fixture('euro',true);
 assert.equal(archiveRetiredCompetition(),false);
 assert.equal(values.get('scorefut.active'),raw);
 assert.equal(values.has('scorefut.retired-national.active'),false);
});
test('current competition saves are left in place',()=>{
 const {raw,values}=fixture('world-cup');
 assert.equal(archiveRetiredCompetition(),true);
 assert.equal(values.get('scorefut.active'),raw);
 assert.equal(values.size,3);
});
