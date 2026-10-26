import test from 'node:test';
import assert from 'node:assert/strict';
import {initBrowserNavigation} from '../js/browser-navigation.js';

function fixture(hash=''){
  const entries=[{url:'https://example.com/ScoreFut/?v=release'+hash,state:null}],listeners={};let index=0,route={screen:'home',mode:'world-cup'};
  const host={location:new URL(entries[0].url),addEventListener:(name,callback)=>listeners[name]=callback};
  host.history={get state(){return entries[index].state;},replaceState(state,title,url){entries[index]={state,url};host.location=new URL(url);},pushState(state,title,url){entries.splice(++index);entries.push({state,url});host.location=new URL(url);}};
  const navigation=initBrowserNavigation({host,getRoute:()=>route,onVisit:next=>{route={...next};navigation.sync();}});
  navigation.start();
  return {host,entries,navigation,get route(){return route;},set route(value){route=value;},move(delta){index+=delta;host.location=new URL(entries[index].url);listeners.popstate();}};
}

test('Back and Forward visit screens without adding or replaying game snapshots',()=>{
  const f=fixture();
  f.route={screen:'setup',mode:'champions'};f.navigation.push();
  f.route={screen:'draft',mode:'champions',session:'champions:today:42'};f.navigation.push();
  assert.equal(f.entries.length,3);
  f.move(-1);assert.equal(f.route.screen,'setup');assert.equal(f.route.mode,'champions');
  f.move(-1);assert.equal(f.route.screen,'home');
  f.move(1);f.move(1);assert.equal(f.route.screen,'draft');
  assert.equal(f.entries.length,3);assert.equal(f.host.location.search,'?v=release');
  assert.equal(f.host.history.state.scorefutNavigation.route.session,'champions:today:42');
  assert.ok(!('draft' in f.host.history.state.scorefutNavigation.route));
});

test('in-page updates replace the current entry and repeated navigation does not add duplicates',()=>{
  const f=fixture();f.route={screen:'setup',mode:'world-cup'};f.navigation.push();
  f.route.mode='champions';f.navigation.sync();f.navigation.push();
  assert.equal(f.entries.length,2);
  f.route={screen:'achievements'};f.navigation.push();f.move(-1);assert.equal(f.route.mode,'champions');
  f.route={screen:'home'};f.navigation.push();assert.equal(f.entries.length,3);assert.equal(f.host.location.hash,'#home');
});

test('unknown old fragments fall back to home and direct known pages are restored',()=>{
  const unknown=fixture('#manager-market');assert.equal(unknown.route.screen,'home');assert.equal(unknown.entries.length,1);
  const known=fixture('#achievements');assert.equal(known.route.screen,'achievements');assert.equal(known.entries.length,1);
  const legacy=fixture('#history');assert.equal(legacy.route.screen,'achievements');assert.equal(legacy.host.location.hash,'#achievements');assert.equal(legacy.entries.length,1);
});

test('saved browser entries from the retired history screen open achievements',()=>{
  const f=fixture();
  f.entries[0].state={scorefutNavigation:{version:1,route:{screen:'history'}}};
  f.move(0);
  assert.equal(f.route.screen,'achievements');
  assert.equal(f.host.location.hash,'#achievements');
  assert.equal(f.entries.length,1);
});
