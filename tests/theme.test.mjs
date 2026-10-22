import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../js/theme.js',import.meta.url),'utf8');
function load(saved,{blockRead=false,blockWrite=false}={}) {
  const store=new Map([['scorefut.active','saved campaign'],['scorefut.history','saved history']]);
  if(saved!==undefined)store.set('scorefut.theme',saved);
  const root={dataset:{},style:{}},attributes={},listeners={},meta={};
  const button={setAttribute:(key,value)=>attributes[key]=value,addEventListener:(name,handler)=>listeners[name]=handler};
  let ready;
  const document={documentElement:root,readyState:'loading',querySelector:selector=>({setAttribute:(_,value)=>meta[selector]=value}),getElementById:()=>button,addEventListener:(_,handler)=>ready=handler};
  const localStorage={getItem:key=>{if(blockRead)throw Error('blocked');return store.get(key)??null;},setItem:(key,value)=>{if(blockWrite)throw Error('blocked');store.set(key,value);}};
  vm.runInNewContext(source,{document,localStorage});
  return {root,store,attributes,meta,ready:()=>ready(),click:()=>listeners.click()};
}

test('dark is the first-visit default and the explicit theme loads before styles',()=>{
  const page=load();
  assert.equal(page.root.dataset.theme,'dark');
  assert.equal(page.root.style.colorScheme,'dark');
  assert.equal(page.meta['meta[name="theme-color"]'],'#101513');
  assert.ok(html.indexOf('src="js/theme.js')<html.indexOf('rel="stylesheet"'));
  assert.ok(!html.includes('css/force-light.css'));
});

test('the saved light or dark theme is restored without reading a device preference',()=>{
  for(const theme of ['light','dark']){
    const page=load(JSON.stringify(theme));
    assert.equal(page.root.dataset.theme,theme);
    assert.equal(page.meta['meta[name="color-scheme"]'],theme);
    page.ready();
    assert.equal(page.attributes['aria-pressed'],String(theme==='dark'));
    assert.equal(page.attributes['aria-label'],theme==='dark'?'Ativar modo claro':'Ativar modo escuro');
  }
});

test('switching persists only the theme and survives reload without touching campaigns',()=>{
  const page=load();page.ready();page.click();
  assert.equal(page.root.dataset.theme,'light');
  assert.equal(page.attributes['aria-label'],'Ativar modo escuro');
  assert.equal(page.store.get('scorefut.theme'),'"light"');
  assert.equal(load(page.store.get('scorefut.theme')).root.dataset.theme,'light');
  page.click();
  assert.equal(page.root.dataset.theme,'dark');
  assert.equal(page.store.get('scorefut.active'),'saved campaign');
  assert.equal(page.store.get('scorefut.history'),'saved history');
});

test('blocked or invalid storage still allows both themes during the session',()=>{
  for(const saved of [undefined,'broken','null','"system"']){
    const page=load(saved,{blockWrite:true});page.ready();page.click();
    assert.equal(page.root.dataset.theme,'light');
    page.click();assert.equal(page.root.dataset.theme,'dark');
  }
  const blocked=load('"light"',{blockRead:true,blockWrite:true});
  assert.equal(blocked.root.dataset.theme,'dark');
  blocked.ready();blocked.click();assert.equal(blocked.root.dataset.theme,'light');
});
