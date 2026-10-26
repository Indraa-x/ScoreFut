import {updateAchievementLedger} from './achievements.js?v=world-cup-20261026';

const prefix = 'scorefut.';
const progressKeys=['history','active'];
const migrationKey=prefix+'browser-progress-version';
const migrationVersion='1';
let initialized=false,fallbackKeys=null,inMemoryLedger=null;
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const parse=value=>{try{return value===null?null:JSON.parse(value);}catch{return null;}};
function storageKey(key){return fallbackKeys&&Object.hasOwn(fallbackKeys,key)?fallbackKeys[key]:prefix+key;}

function progressSource(store,id,base){
  const keys={history:base+'history',active:base+'active'};
  const raw={history:store.getItem(keys.history),active:store.getItem(keys.active)};
  const history=parse(raw.history),active=parse(raw.active);
  const validHistory=Array.isArray(history)&&history.every(isRecord);
  const validActive=isRecord(active)&&isRecord(active.draft);
  const records=Array.isArray(history)?history.filter(isRecord):[];
  const dates=[active?.savedAt,active?.updatedAt,active?.draft?.date,...records.map(record=>record.date)];
  const recency=Math.max(0,...dates.map(value=>typeof value==='number'?value:Date.parse(value)).filter(Number.isFinite));
  return {id,keys,raw,records,validHistory,validActive,recency,hasProgress:(validHistory&&history.length>0)||validActive};
}

function collectSources(store){
  const sources=[progressSource(store,'guest',prefix)],bases=new Map();
  for(let index=0;index<store.length;index++){
    const key=store.key(index);
    const account=typeof key==='string'?key.match(/^scorefut\.account\.(.+)\.(?:history|active)$/):null;
    const archive=typeof key==='string'?key.match(/^scorefut\.legacy-browser\.(.+)\.(?:history|active)$/):null;
    if(account)bases.set('account:'+account[1],prefix+'account.'+account[1]+'.');
    if(archive)bases.set('archive:'+archive[1],prefix+'legacy-browser.'+archive[1]+'.');
  }
  const session=store.getItem(prefix+'account-session');
  if(session)bases.set('account:'+session,prefix+'account.'+session+'.');
  for(const [id,base] of [...bases].sort(([left],[right])=>left.localeCompare(right)))sources.push(progressSource(store,id,base));
  const current=session?sources.find(source=>source.id==='account:'+session):null;
  const guest=sources[0];
  const primary=current&&(current.validHistory||current.validActive)?current:guest.hasProgress?guest:
    sources.slice(1).filter(source=>source.hasProgress).sort((left,right)=>right.recency-left.recency||left.id.localeCompare(right.id))[0]||guest;
  return {sources,primary};
}

function credentialsCleanup(store){
  for(const key of ['accounts','account-session']){
    try{store.removeItem(prefix+key);}catch{/* Retry cleanup on the next initialization. */}
  }
}

/** Adopt one existing career without duplicating its large saved match snapshots. */
export function initializeBrowserProgress(){
  if(initialized)return true;
  let store,primary,ledger;
  try{
    store=localStorage;
    if(store.getItem(migrationKey)===migrationVersion){credentialsCleanup(store);initialized=true;fallbackKeys=null;inMemoryLedger=null;return true;}
    const collected=collectSources(store);
    primary=collected.primary;
    fallbackKeys=primary.keys;
    ledger=parse(store.getItem(prefix+'achievements'));
    for(const source of collected.sources)if(source!==primary)ledger=updateAchievementLedger(source.records,ledger);
    // Each old profile owns its own sequence. Only the adopted career supplies the current tail.
    ledger=updateAchievementLedger(primary.records,{version:1,progress:updateAchievementLedger([],ledger).progress});
    inMemoryLedger=ledger;

    const planned=new Map(),removals=new Set();
    const canonical={history:primary.validHistory?primary.raw.history:null,active:primary.validActive?primary.raw.active:null};
    const displaced=[];
    for(const key of progressKeys){
      const target=prefix+key,current=store.getItem(target),next=canonical[key];
      if(current!==next){
        removals.add(target);
        if(next!==null)planned.set(target,next);
        if(current!==null)displaced.push([key,current]);
      }
      if(primary.keys[key]!==target&&next!==null)removals.add(primary.keys[key]);
    }
    if(displaced.length){
      let slot='guest',number=0;
      while(progressKeys.some(key=>store.getItem(prefix+'legacy-browser.'+slot+'.'+key)!==null))slot='guest-'+(++number);
      for(const [key,value] of displaced)planned.set(prefix+'legacy-browser.'+slot+'.'+key,value);
    }
    // Small progress and version writes are last; credentials remain intact until these commit.
    planned.set(prefix+'achievements',JSON.stringify(ledger));
    planned.set(migrationKey,migrationVersion);
    const affected=new Set([...removals,...planned.keys()]);
    const originals=new Map([...affected].map(key=>[key,store.getItem(key)]));
    try{
      // Free the old keys first: a nearly full browser never needs a second copy of a draft.
      for(const key of affected)if(originals.get(key)!==null)store.removeItem(key);
      for(const [key,value] of planned)store.setItem(key,value);
    }catch{
      // Remove every new value before restoring the original quota footprint.
      for(const key of affected){try{store.removeItem(key);}catch{/* Storage may be disabled. */}}
      for(const [key,value] of originals)if(value!==null){try{store.setItem(key,value);}catch{/* Keep legacy routing available below. */}}
      return false;
    }
    credentialsCleanup(store);
    initialized=true;fallbackKeys=null;inMemoryLedger=null;
    return true;
  }catch{
    if(!fallbackKeys)fallbackKeys={history:prefix+'history',active:prefix+'active'};
    if(!inMemoryLedger)inMemoryLedger=updateAchievementLedger([],ledger);
    return false;
  }
}

export function read(key, fallback = null) { if(key==='achievements'&&inMemoryLedger)return inMemoryLedger;try { const value = localStorage.getItem(storageKey(key)); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } }
export function write(key, value) { if(key==='achievements'&&inMemoryLedger)inMemoryLedger=value;try {localStorage.setItem(storageKey(key),JSON.stringify(value));return true;} catch {return false;} }
export function remove(key) {try {localStorage.removeItem(storageKey(key));} catch { /* Navegação privada pode bloquear o armazenamento. */ }}
/** Keep a retired competition's exact save locally, without relabelling its results. */
export function archiveRetiredCompetition(){
 let store,key,raw;
 try{
  store=localStorage;key=storageKey('active');raw=store.getItem(key);
  const saved=parse(raw);
  if(saved?.mode!=='euro')return true;
  let archive=prefix+'retired-national.active',slot=0;
  while(store.getItem(archive)!==null)archive=prefix+'retired-national.active.'+(++slot);
  store.setItem(archive,raw);
  store.removeItem(key);
  return true;
 }catch{return false;}
}
export function today() {return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function statistics(history = read('history',[])) {
  let streak=0; for(const game of [...history].reverse()) {if(game.champion) streak++;else break;}
  const best = history.reduce((a,b)=>(b.rank||0)>(a?.rank||0)?b:a,null);
  return {titles:history.filter(g=>g.champion).length,played:history.length,best:(best?.stageLabel || '—').replace(/\bEuro\b/g,'Seleções'),streak,winRate:history.length?Math.round(history.filter(g=>g.champion).length/history.length*100):0};
}
