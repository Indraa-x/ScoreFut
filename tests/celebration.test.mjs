import test from 'node:test';
import assert from 'node:assert/strict';
import {renderResult} from '../js/ui.js';
import {initCelebration} from '../js/celebration.js';

test('champions use the supplied competition trophy and colorful confetti; eliminations do not celebrate',()=>{
  const record={id:'title',champion:true,teamName:'Meu time',strength:92,goalsFor:20,goalsAgainst:4,played:7,picks:[],formation:'4-3-3'};
  for(const [mode,file] of [['champions','champions-trophy.png'],['copa-do-brasil','brazil-cup-trophy.png']]){
    const html=renderResult({...record,mode},null);
    assert.ok(html.includes(file));
    assert.ok(!html.includes('class="result-trophy"'));
    assert.ok((html.match(/--c:/g)||[]).length>100);
    assert.ok(new Set([...html.matchAll(/--c:(#[a-z0-9]+)/g)].map(match=>match[1])).size>=6);
    assert.ok(html.includes('data-action="celebration-sound"'));
    const eliminated=renderResult({...record,mode,champion:false},null);
    assert.ok(!eliminated.includes(file));
    assert.ok(!eliminated.includes('champion-confetti'));
    assert.ok(!eliminated.includes('celebration-sound'));
  }
});

test('victory audio plays once per result entry, can be muted, and stops on exit or a hidden page',async()=>{
  const original={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
  const documentListeners={},appListeners={},sources=[],envelopes=[];
  const buffer={duration:20.405};
  let loads=0,decodes=0;
  const gain=()=>{const envelope=[];envelopes.push(envelope);return {gain:{setValueAtTime(value,time){envelope.push([value,time]);},linearRampToValueAtTime(value,time){envelope.push([value,time]);}},connect(){},disconnect(){}};};
  class Audio{
    constructor(){this.currentTime=0;this.sampleRate=100;this.destination={};}
    resume(){return Promise.resolve();}
    createGain(){return gain();}
    decodeAudioData(){decodes++;return Promise.resolve(buffer);}
    createBufferSource(){const source={connect(){},disconnect(){},start(...args){this.started=args;},stop(){this.stopped=true;}};sources.push(source);return source;}
  }
  const control={setAttribute(){},textContent:''};
  const app={querySelector:selector=>selector==='.result-hero'?{clientHeight:620,style:{setProperty(){}}}:control,addEventListener:(event,handler)=>{appListeners[event]=handler;}};
  let screen='home',record=null;
  globalThis.window={AudioContext:Audio};
  globalThis.document={hidden:false,addEventListener:(event,handler)=>{documentListeners[event]=handler;}};
  globalThis.fetch=async url=>{assert.equal(url,'assets/audio/champion-crowd.mp3');loads++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  try{
    const celebration=initCelebration({app,getRecord:()=>record,getScreen:()=>screen});
    celebration.attach();assert.equal(sources.length,0);
    screen='result';record={id:'victory',champion:true};
    celebration.attach();await settle();
    assert.equal(sources.length,1);
    assert.equal(sources[0].buffer,buffer);
    assert.deepEqual(sources[0].started,[.04,0,12]);
    assert.deepEqual(envelopes[0].map(([value])=>value),[0,.025,.025,0]);
    const count=sources.length;celebration.attach();await settle();assert.equal(sources.length,count);
    appListeners.click({target:{closest:()=>control}});assert.ok(sources.every(source=>source.stopped));
    assert.ok(control.textContent.includes('desligado'));
    appListeners.click({target:{closest:()=>control}});await settle();assert.ok(sources.length>count);
    assert.equal(loads,1);assert.equal(decodes,1);
    globalThis.document.hidden=true;documentListeners.visibilitychange();assert.ok(sources.every(source=>source.stopped));
    globalThis.document.hidden=false;screen='home';celebration.attach();
    const exitCount=sources.length;await settle();assert.equal(sources.length,exitCount);
    screen='result';record={id:'loss',champion:false};celebration.attach();await settle();assert.equal(sources.length,exitCount);
    screen='result';record={id:'late-victory',champion:true};celebration.attach();
    screen='home';celebration.attach();await settle();assert.equal(sources.length,exitCount);
  }finally{globalThis.window=original.window;globalThis.document=original.document;globalThis.fetch=original.fetch;}
});

test('a slow crowd download cannot start playing after leaving or muting the result',async()=>{
  const original={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
  let resolveDownload,screen='result',record={id:'slow-victory',champion:true},started=0;
  const listeners={};
  const control={setAttribute(){}};
  const app={querySelector:selector=>selector==='.result-hero'?null:control,addEventListener:(type,handler)=>{listeners[type]=handler;}};
  class Audio{
    resume(){return Promise.resolve();}
    decodeAudioData(){return Promise.resolve({duration:20});}
    createBufferSource(){started++;throw new Error('Cancelled download must never produce a source');}
  }
  globalThis.window={AudioContext:Audio};
  globalThis.document={addEventListener(){}};
  globalThis.fetch=()=>new Promise(resolve=>{resolveDownload=resolve;});
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  try{
    const celebration=initCelebration({app,getRecord:()=>record,getScreen:()=>screen});
    celebration.attach();await settle();
    listeners.click({target:{closest:()=>control}});
    screen='home';celebration.attach();
    resolveDownload({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});await settle();
    assert.equal(started,0);
  }finally{globalThis.window=original.window;globalThis.document=original.document;globalThis.fetch=original.fetch;}
});
