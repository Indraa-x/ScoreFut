import test from 'node:test';
import assert from 'node:assert/strict';
import {saveCampaignProgress} from '../js/campaign-progress.js';
import {updateAchievementLedger} from '../js/achievements.js';

const campaign=(id,champion=false,mode='quick')=>({id,champion,mode});
function fixture(allowWrite=()=>true){
  const values=new Map([['active',{draft:'unfinished'}]]),calls=[];
  return {values,calls,storage:{
    write(key,value){calls.push(`write:${key}`);if(!allowWrite(key,value,values))return false;values.set(key,structuredClone(value));return true;},
    remove(key){calls.push(`remove:${key}`);values.delete(key);}
  }};
}

test('a completed record is appended once and does not advance its ledger twice',()=>{
  const f=fixture(),record=campaign('one',true,'world-cup');
  const first=saveCampaignProgress(record,[],null,f.storage);
  assert.equal(first.ledgerSaved,true);
  assert.equal(first.historySaved,true);
  assert.equal(first.ledger.progress['three-titles'],1);
  const before=structuredClone(f.values.get('history'));
  const second=saveCampaignProgress(record,before,first.ledger,f.storage);
  assert.deepEqual(second.ledger,first.ledger);
  assert.deepEqual(f.values.get('history'),[record]);
  assert.deepEqual(before,[record]);
  assert.deepEqual(f.calls.slice(0,3),['write:achievements','write:history','remove:active']);
});

test('lifetime title progress advances before the detailed archive is capped at 50',()=>{
  const previous=Array.from({length:50},(_,i)=>campaign(`loss-${i}`));
  const ledger=updateAchievementLedger([],{version:1,progress:{'five-titles':2,'three-titles':2},currentStreak:0,lastRecordId:'old-loss'});
  const f=fixture(),record=campaign('third-win',true,'champions');
  const result=saveCampaignProgress(record,previous,ledger,f.storage);
  assert.equal(result.ledger.progress['three-titles'],3);
  assert.equal(result.ledger.progress['five-titles'],3);
  assert.equal(result.ledger.progress['champions-title'],1);
  assert.equal(f.values.get('history').length,50);
  assert.equal(f.values.get('history')[0].id,'loss-1');
  assert.equal(f.values.get('history').at(-1).id,'third-win');
  assert.equal(previous.length,50);
  assert.equal(previous[0].id,'loss-0');
  assert.equal(ledger.progress['five-titles'],2);
});

test('a failed large history write retries after a durable ledger releases the active snapshot',()=>{
  const f=fixture((key,value,values)=>key!=='history'||!values.has('active'));
  const result=saveCampaignProgress(campaign('one'),[],null,f.storage);
  assert.equal(result.ledgerSaved,true);
  assert.equal(result.historySaved,true);
  assert.equal(f.values.has('active'),false);
  assert.deepEqual(f.calls,['write:achievements','write:history','remove:active','write:history']);
});

test('a failed ledger write retries after a durable history releases the active snapshot',()=>{
  const f=fixture((key,value,values)=>key!=='achievements'||!values.has('active'));
  const result=saveCampaignProgress(campaign('one',true),[],null,f.storage);
  assert.equal(result.ledgerSaved,true);
  assert.equal(result.historySaved,true);
  assert.equal(f.values.has('active'),false);
  assert.deepEqual(f.calls,['write:achievements','write:history','remove:active','write:achievements']);
});

test('if neither completion source saves, the active snapshot stays available for retry',()=>{
  const f=fixture(()=>false),before=structuredClone(f.values.get('active'));
  const result=saveCampaignProgress(campaign('one',true),[],null,f.storage);
  assert.equal(result.ledgerSaved,false);
  assert.equal(result.historySaved,false);
  assert.equal(result.ledger.progress['first-title'],1);
  assert.equal(result.ledger.lastRecordId,'one');
  assert.deepEqual(f.values.get('active'),before);
  assert.deepEqual(f.calls,['write:achievements','write:history']);
});

test('a remaining ledger failure is reported even when campaign history is durable',()=>{
  const f=fixture(key=>key!=='achievements');
  const result=saveCampaignProgress(campaign('one',true),[],null,f.storage);
  assert.equal(result.ledgerSaved,false);
  assert.equal(result.historySaved,true);
  assert.equal(result.ledger.progress['first-title'],1);
  assert.equal(f.values.get('history')[0].id,'one');
  assert.equal(f.values.has('active'),false);
  assert.deepEqual(f.calls,['write:achievements','write:history','remove:active','write:achievements']);
});

test('throwing storage implementations preserve the computed ledger and unfinished snapshot',()=>{
  const f=fixture();
  f.storage.write=()=>{throw new Error('quota');};
  const result=saveCampaignProgress(campaign('one'),[],null,f.storage);
  assert.equal(result.ledgerSaved,false);
  assert.equal(result.historySaved,false);
  assert.equal(result.ledger.progress['first-campaign'],1);
  assert.equal(f.values.has('active'),true);
});
