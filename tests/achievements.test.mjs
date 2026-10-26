import test from 'node:test';
import assert from 'node:assert/strict';
import {achievementsFor,achievementSummary,updateAchievementLedger,recordAchievementProgress} from '../js/achievements.js';

const campaign=(champion=false,mode='quick')=>({champion,mode});
const achievement=(records,id,ledger)=>achievementsFor(records,ledger).find(item=>item.id===id);

test('three consecutive titles stay earned after a loss, including a streak earlier in the history',()=>{
  const records=[campaign(),campaign(true),campaign(true),campaign(true),campaign(),campaign(true)];
  const streak=achievement(records,'three-win-streak');
  assert.equal(streak.value,3);
  assert.equal(streak.unlocked,true);
  assert.equal(achievement([campaign(true),campaign(),campaign(true),campaign(true)],'three-win-streak').value,2);
  const ledger=updateAchievementLedger(records);
  assert.equal(achievement([campaign()], 'three-win-streak',ledger).unlocked,true);
});

test('earned progress survives truncated or empty history and merges with new progress',()=>{
  const initial=Array.from({length:10},(_,index)=>campaign(index<3,index===0?'world-cup':'quick'));
  const ledger=updateAchievementLedger(initial);
  const truncated=[campaign()];
  for(const id of ['first-campaign','three-campaigns','ten-campaigns','first-title','three-titles','world-cup-title']){
    assert.equal(achievement(truncated,id,ledger).unlocked,true,id);
    assert.equal(achievement([],id,ledger).unlocked,true,id);
  }
  const advanced=updateAchievementLedger([campaign(true,'champions'),campaign(true,'copa-do-brasil')],ledger);
  assert.equal(advanced.progress['champions-title'],1);
  assert.equal(advanced.progress['brazil-title'],1);
  assert.equal(advanced.progress['three-titles'],3);
  assert.deepEqual(updateAchievementLedger([],advanced),advanced);
});

test('mode titles require a real win in their matching competition',()=>{
  const records=[campaign(false,'world-cup'),campaign(true,'quick'),campaign(true,'champions'),campaign(true,'copa-do-brasil')];
  assert.equal(achievement(records,'world-cup-title').unlocked,false);
  assert.equal(achievement(records,'champions-title').unlocked,true);
  assert.equal(achievement(records,'brazil-title').unlocked,true);
  assert.equal(achievement([{champion:'true',mode:'world-cup'}],'world-cup-title').unlocked,false);
});

test('ledger snapshots contain only known, finite, capped integer progress',()=>{
  const legacy=JSON.parse('{"first-campaign":99,"three-campaigns":2.9,"ten-campaigns":"10","first-title":-4,"three-titles":null,"five-titles":true,"three-win-streak":3,"world-cup-title":1,"unknown":4,"__proto__":{"polluted":true}}');
  const ledger=updateAchievementLedger([],legacy);
  assert.equal(ledger.version,1);
  assert.equal(Object.keys(ledger.progress).length,10);
  assert.equal(ledger.progress['first-campaign'],1);
  assert.equal(ledger.progress['three-campaigns'],2);
  assert.equal(ledger.progress['ten-campaigns'],0);
  assert.equal(ledger.progress['first-title'],0);
  assert.equal(ledger.progress['five-titles'],0);
  assert.equal(ledger.progress['three-win-streak'],3);
  assert.equal(Object.hasOwn(ledger.progress,'unknown'),false);
  assert.equal(Object.hasOwn(ledger.progress,'__proto__'),false);
  assert.equal({}.polluted,undefined);
  const hostile=Object.create({'first-title':1});
  hostile['five-titles']=Infinity;
  assert.equal(updateAchievementLedger([],{version:1,progress:hostile}).progress['first-title'],0);
  assert.equal(updateAchievementLedger([],{version:1,progress:hostile}).progress['five-titles'],0);
});

test('malformed or unsupported saved data cannot invent medals or throw',()=>{
  for(const ledger of [null,undefined,[],true,'bad',{version:99,progress:{'first-title':1}},{version:1,progress:[]},{version:1,progress:null},{version:1}]){
    assert.deepEqual(achievementSummary([],ledger),{unlocked:0,total:10});
  }
  assert.deepEqual(achievementSummary([null,undefined,[],false]),{unlocked:0,total:10});
});

test('snapshot merging never mutates records or previous ledgers',()=>{
  const records=[campaign(true,'world-cup'),campaign(false)];
  const prior={version:1,progress:{'first-title':1,'ten-campaigns':7}};
  const beforeRecords=structuredClone(records),beforeLedger=structuredClone(prior);
  const merged=updateAchievementLedger(records,prior);
  achievementsFor(records,prior);
  achievementSummary(records,prior);
  assert.deepEqual(records,beforeRecords);
  assert.deepEqual(prior,beforeLedger);
  assert.notEqual(merged,prior);
  assert.notEqual(merged.progress,prior.progress);
});

test('record events advance lifetime partial titles even after older wins leave the last 50 records',()=>{
  let records=[],ledger=null;
  for(let index=0;index<205;index++){
    const record={id:`record-${index}`,...campaign(index%51===0,index===0?'world-cup':'quick')};
    ledger=recordAchievementProgress(record,records,ledger);
    records=[...records,record].slice(-50);
  }
  assert.equal(records.filter(record=>record.champion).length,1);
  assert.equal(ledger.progress['five-titles'],5);
  assert.equal(ledger.progress['three-titles'],3);
  assert.equal(ledger.progress['ten-campaigns'],10);
  assert.equal(achievement(records,'five-titles',ledger).unlocked,true);
  assert.equal(achievement(records,'world-cup-title',ledger).unlocked,true);
  assert.equal(ledger.lastRecordId,'record-204');
});

test('replaying a committed record does not increment progress, with or without detailed history',()=>{
  const record={id:'same-record',...campaign(true,'champions')};
  const first=recordAchievementProgress(record,[],null);
  assert.deepEqual(recordAchievementProgress(record,[],first),first);
  assert.deepEqual(recordAchievementProgress(record,[record],first),first);
  const seeded=recordAchievementProgress(record,[record]);
  assert.equal(seeded.progress['three-campaigns'],1);
  assert.equal(seeded.progress['three-titles'],1);
  const later=[record,{id:'later',...campaign(false)}];
  const duplicate=recordAchievementProgress(record,later,updateAchievementLedger(later));
  assert.equal(duplicate.progress['three-campaigns'],2);
  assert.equal(duplicate.progress['three-titles'],1);
  assert.equal(duplicate.currentStreak,0);
  assert.equal(duplicate.lastRecordId,'later');
});

test('current streak resets while the best streak medal stays earned and metadata survives an empty snapshot',()=>{
  let ledger=null;
  for(let index=1;index<=3;index++)ledger=recordAchievementProgress({id:`win-${index}`,...campaign(true)},[],ledger);
  assert.equal(ledger.currentStreak,3);
  assert.equal(ledger.progress['three-win-streak'],3);
  ledger=recordAchievementProgress({id:'loss',...campaign(false)},[],ledger);
  assert.equal(ledger.currentStreak,0);
  assert.equal(ledger.progress['three-win-streak'],3);
  assert.deepEqual(updateAchievementLedger([],ledger),ledger);
  const preserved=updateAchievementLedger([{id:'primary-loss',...campaign(false)}],ledger);
  assert.equal(preserved.currentStreak,0);
  assert.equal(preserved.lastRecordId,'loss');
  const seeded=updateAchievementLedger([{id:'primary-loss',...campaign(false)}],{version:1,progress:ledger.progress});
  assert.equal(seeded.currentStreak,0);
  assert.equal(seeded.lastRecordId,'primary-loss');
});

test('render-time snapshot merges retain the latest committed event if detailed history was not written',()=>{
  const before=[{id:'first',...campaign(true)}];
  const event={id:'second',...campaign(true)};
  const ledger=recordAchievementProgress(event,before,updateAchievementLedger(before));
  assert.equal(ledger.currentStreak,2);
  assert.equal(ledger.lastRecordId,'second');
  const rendered=updateAchievementLedger(before,ledger);
  assert.equal(rendered.currentStreak,2);
  assert.equal(rendered.lastRecordId,'second');
  const next=recordAchievementProgress({id:'third',...campaign(true)},before,rendered);
  assert.equal(next.currentStreak,3);
  assert.equal(next.progress['three-win-streak'],3);
  assert.equal(next.progress['three-titles'],3);
});

test('record metadata uses only valid own fields and event processing remains immutable',()=>{
  const inherited=Object.create({currentStreak:9,lastRecordId:'fake'});
  inherited.version=1;inherited.progress={'three-win-streak':1};
  const sanitized=updateAchievementLedger([],inherited);
  assert.equal(Object.hasOwn(sanitized,'currentStreak'),false);
  assert.equal(Object.hasOwn(sanitized,'lastRecordId'),false);
  for(const metadata of [{currentStreak:-1,lastRecordId:7},{currentStreak:Infinity,lastRecordId:''},{currentStreak:1.5,lastRecordId:' '.repeat(2)}]){
    const ledger=updateAchievementLedger([],{version:1,progress:{},...metadata});
    assert.equal(Object.hasOwn(ledger,'currentStreak'),false);
    assert.equal(Object.hasOwn(ledger,'lastRecordId'),false);
  }
  const before=[{id:'earlier',...campaign(true)}],prior=updateAchievementLedger(before);
  const record={id:'next',...campaign(true,'copa-do-brasil')};
  const savedBefore=structuredClone(before),savedPrior=structuredClone(prior),savedRecord=structuredClone(record);
  const merged=recordAchievementProgress(record,before,prior);
  assert.equal(merged.currentStreak,2);
  assert.equal(merged.progress['brazil-title'],1);
  assert.deepEqual(before,savedBefore);
  assert.deepEqual(prior,savedPrior);
  assert.deepEqual(record,savedRecord);
});
