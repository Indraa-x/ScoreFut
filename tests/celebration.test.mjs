import test from 'node:test';
import assert from 'node:assert/strict';
import {renderResult} from '../js/ui.js';
import {initCelebration} from '../js/celebration.js';

test('champions use the supplied competition trophy and colorful confetti; eliminations do not celebrate',()=>{
  const record={id:'title',champion:true,teamName:'Meu time',strength:92,goalsFor:20,goalsAgainst:4,played:7,picks:[],formation:'4-3-3'};
  for(const [mode,file] of [['world-cup','world-cup-trophy.png'],['champions','champions-trophy.png'],['copa-do-brasil','brazil-cup-trophy.png']]){
    const html=renderResult({...record,mode},null);
    assert.ok(html.includes(file));
    assert.ok(!html.includes('class="result-trophy"'));
    assert.ok((html.match(/--c:/g)||[]).length>100);
    assert.ok(new Set([...html.matchAll(/--c:(#[a-z0-9]+)/g)].map(match=>match[1])).size>=6);
    assert.ok(!html.includes('celebration-sound'));
    assert.ok(!html.includes('Som ligado'));
    const eliminated=renderResult({...record,mode,champion:false},null);
    assert.ok(!eliminated.includes(file));
    assert.ok(!eliminated.includes('champion-confetti'));
    assert.ok(!eliminated.includes('celebration-sound'));
  }
});


test('celebration fits confetti to the card without initializing audio or fetching recordings',()=>{
  const originalWindow=globalThis.window,originalFetch=globalThis.fetch;
  const fail=()=>{assert.fail('Silent celebrations must not initialize audio or download recordings');};
  globalThis.window={AudioContext:class {constructor(){fail();}},webkitAudioContext:class {constructor(){fail();}}};
  globalThis.fetch=fail;
  let fall;
  const app={querySelector:selector=>selector==='.result-hero'?{clientHeight:620,style:{setProperty(key,value){assert.equal(key,'--confetti-fall');fall=value;}}}:null,addEventListener:fail};
  try{
    const celebration=initCelebration({app});
    celebration.attach();celebration.attach();assert.equal(fall,'660px');
    app.querySelector=()=>null;celebration.attach();
  }finally{globalThis.window=originalWindow;globalThis.fetch=originalFetch;}
});
