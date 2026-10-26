import test from 'node:test';
import assert from 'node:assert/strict';

const guest=key=>'scorefut.'+key;
const scoped=(id,key)=>`scorefut.account.${id}.${key}`;
const record=(id,champion=false,mode='quick',date='2026-10-25')=>({id,champion,mode,date});
const active=seed=>({screen:'draft',mode:'world-cup',draft:{seed,date:'2026-10-25',picks:[]}});
let moduleId=0;

class MemoryStorage{
  constructor(entries={},options={}){this.values=new Map(Object.entries(entries));this.options=options;this.peak=this.size();}
  size(values=this.values){return [...values].reduce((sum,[key,value])=>sum+key.length+value.length,0);}
  blocked(){if(this.options.blocked)throw new Error('Storage is blocked.');}
  get length(){this.blocked();return this.values.size;}
  key(index){this.blocked();return [...this.values.keys()][index]??null;}
  getItem(key){this.blocked();return this.values.get(key)??null;}
  removeItem(key){this.blocked();this.values.delete(key);}
  setItem(key,value){
    this.blocked();
    if(this.options.failKey===key){this.options.failKey=null;throw new Error('Injected write failure.');}
    const next=new Map(this.values).set(key,String(value));
    if(this.options.quota&&this.size(next)>this.options.quota)throw new Error('Quota exceeded.');
    this.values=next;this.peak=Math.max(this.peak,this.size());
  }
  snapshot(){return [...this.values].sort(([left],[right])=>left.localeCompare(right));}
}

async function fixture(entries,run,options={}){
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const store=new MemoryStorage(entries,options);
  Object.defineProperty(globalThis,'localStorage',{value:store,writable:true,configurable:true});
  try{const storage=await import(`../js/storage.js?browser-progress-test=${++moduleId}`);await run(storage,store);}
  finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage;}
}

test('a fresh browser initializes permanent achievements without creating an account',async()=>{
  await fixture({[guest('theme')]:'"dark"'},(storage,store)=>{
    assert.equal(storage.initializeBrowserProgress(),true);
    assert.deepEqual(storage.read('history',[]),[]);
    assert.equal(store.getItem(guest('active')),null);
    assert.equal(store.getItem(guest('browser-progress-version')),'1');
    assert.equal(storage.read('achievements').progress['first-campaign'],0);
    assert.equal(store.getItem(guest('theme')),'"dark"');
    for(const name of ['activeAccountId','setAccountSession','clearGuestProgress','clearAccountProgress','moveGuestProgressToAccount','moveAccountProgressToGuest'])assert.equal(Object.hasOwn(storage,name),false);
  });
});

test('the signed-in career moves to canonical keys with exact raw snapshots preserved',async()=>{
  const history='[\n  '+JSON.stringify(record('signed-in',true,'world-cup'))+'\n]';
  const draft=JSON.stringify(active(42),null,2);
  await fixture({[guest('accounts')]:'[{"id":"one","passwordHash":"old-hash"}]',[guest('account-session')]:'one',[scoped('one','history')]:history,[scoped('one','active')]:draft},(storage,store)=>{
    assert.equal(storage.initializeBrowserProgress(),true);
    assert.equal(store.getItem(guest('history')),history);
    assert.equal(store.getItem(guest('active')),draft);
    assert.equal(store.getItem(scoped('one','history')),null);
    assert.equal(store.getItem(scoped('one','active')),null);
    assert.equal(store.getItem(guest('accounts')),null);
    assert.equal(store.getItem(guest('account-session')),null);
    assert.equal(storage.read('active').draft.seed,42);
    assert.equal(storage.read('achievements').progress['world-cup-title'],1);
  });
});

test('guest progress stays primary without a session and other careers remain archived',async()=>{
  const guestHistory=JSON.stringify([record('guest')]);
  const oldHistory=JSON.stringify([record('older',true,'champions','2026-10-26')]);
  await fixture({[guest('history')]:guestHistory,[guest('active')]:JSON.stringify(active(7)),[scoped('older','history')]:oldHistory,[scoped('older','active')]:JSON.stringify(active(9)),[guest('accounts')]:'[]'},(storage,store)=>{
    assert.equal(storage.initializeBrowserProgress(),true);
    assert.equal(store.getItem(guest('history')),guestHistory);
    assert.equal(storage.read('active').draft.seed,7);
    assert.equal(store.getItem(scoped('older','history')),oldHistory);
    assert.equal(JSON.parse(store.getItem(scoped('older','active'))).draft.seed,9);
    assert.equal(storage.read('achievements').progress['champions-title'],1);
  });
});

test('adopting a profile preserves displaced guest data and every unselected account',async()=>{
  const guestHistory=JSON.stringify([record('guest',true,'world-cup')]),guestActive=JSON.stringify(active(10));
  const currentHistory=JSON.stringify([record('current',true,'champions')]),otherHistory=JSON.stringify([record('other',true,'copa-do-brasil')]);
  await fixture({[guest('history')]:guestHistory,[guest('active')]:guestActive,[guest('account-session')]:'current',[scoped('current','history')]:currentHistory,[scoped('current','active')]:JSON.stringify(active(20)),[scoped('other','history')]:otherHistory,[scoped('other','active')]:JSON.stringify(active(30))},(storage,store)=>{
    assert.equal(storage.initializeBrowserProgress(),true);
    assert.equal(store.getItem(guest('history')),currentHistory);
    assert.equal(storage.read('active').draft.seed,20);
    assert.equal(store.getItem('scorefut.legacy-browser.guest.history'),guestHistory);
    assert.equal(store.getItem('scorefut.legacy-browser.guest.active'),guestActive);
    assert.equal(store.getItem(scoped('other','history')),otherHistory);
    assert.equal(JSON.parse(store.getItem(scoped('other','active'))).draft.seed,30);
    for(const id of ['world-cup-title','champions-title','brazil-title'])assert.equal(storage.read('achievements').progress[id],1);
  });
});

test('without guest progress the newest valid legacy career is selected',async()=>{
  const newest=JSON.stringify([record('newest',false,'quick','2026-09-30')]);
  await fixture({[guest('history')]:'[]',[scoped('old','history')]:JSON.stringify([record('old',false,'quick','2024-01-01')]),[scoped('new','history')]:newest,[scoped('bad','history')]:'not-json'},(storage,store)=>{
    assert.equal(storage.initializeBrowserProgress(),true);
    assert.equal(store.getItem(guest('history')),newest);
    assert.equal(store.getItem(scoped('bad','history')),'not-json');
    assert.notEqual(store.getItem(scoped('old','history')),null);
  });
});

test('a nearly full browser migrates a large draft without holding a second copy',async()=>{
  const draft=JSON.stringify({...active(11),payload:'x'.repeat(3500)});
  const entries={[guest('account-session')]:'large',[guest('accounts')]:'[{"id":"large"}]',[scoped('large','history')]:JSON.stringify([record('large')]),[scoped('large','active')]:draft};
  const quota=new MemoryStorage(entries).size()+800;
  await fixture(entries,(storage,store)=>{
    assert.throws(()=>store.setItem(guest('active'),draft),/Quota exceeded/);
    assert.equal(storage.initializeBrowserProgress(),true);
    assert.equal(store.getItem(guest('active')),draft);
    assert.ok(store.peak<=quota);
  },{quota});
});

for(const failedKey of ['history','active','achievements','browser-progress-version']){
  test(`a failed ${failedKey} write restores exact originals and routes to the old career`,async()=>{
    const entries={[guest('account-session')]:'one',[guest('accounts')]:'[{"id":"one","passwordHash":"retained-until-success"}]',[guest('history')]:'[  '+JSON.stringify(record('guest'))+'  ]',[guest('active')]:JSON.stringify(active(1)),[scoped('one','history')]:JSON.stringify([record('profile',true,'world-cup')],null,2),[scoped('one','active')]:JSON.stringify(active(2),null,2),[guest('theme')]:'"dark"'};
    await fixture(entries,(storage,store)=>{
      const before=store.snapshot();
      assert.equal(storage.initializeBrowserProgress(),false);
      assert.deepEqual(store.snapshot(),before);
      assert.equal(storage.read('history')[0].id,'profile');
      assert.equal(storage.read('active').draft.seed,2);
      assert.equal(storage.read('achievements').progress['world-cup-title'],1);
      assert.equal(storage.initializeBrowserProgress(),true);
      assert.equal(storage.read('history')[0].id,'profile');
      assert.equal(store.getItem(guest('accounts')),null);
    },{failKey:guest(failedKey)});
  });
}

test('independent profiles seed earned medals without joining their winning sequences',async()=>{
  await fixture({[guest('account-session')]:'primary',[scoped('primary','history')]:JSON.stringify([record('p1',true),record('p2',true)]),[scoped('other','history')]:JSON.stringify([record('o1',true),record('o2',true)])},(storage)=>{
    assert.equal(storage.initializeBrowserProgress(),true);
    const ledger=storage.read('achievements');
    assert.equal(ledger.progress['three-win-streak'],2);
    assert.equal(ledger.currentStreak,2);
    assert.equal(ledger.lastRecordId,'p2');
  });
});

test('successful migration is idempotent across calls and page reloads',async()=>{
  await fixture({[guest('account-session')]:'one',[scoped('one','history')]:JSON.stringify([record('current')]),[scoped('archive','history')]:JSON.stringify([record('archive',true,'world-cup')])},async(storage,store)=>{
    assert.equal(storage.initializeBrowserProgress(),true);
    const after=store.snapshot();
    assert.equal(storage.initializeBrowserProgress(),true);
    assert.deepEqual(store.snapshot(),after);
    const reloaded=await import(`../js/storage.js?browser-progress-test=${++moduleId}`);
    assert.equal(reloaded.initializeBrowserProgress(),true);
    assert.deepEqual(store.snapshot(),after);
    assert.equal(reloaded.read('history').length,1);
    assert.equal(reloaded.read('history')[0].id,'current');
  });
});

test('blocked browser storage remains usable for the current page without throwing',async()=>{
  await fixture({},(storage)=>{
    assert.equal(storage.initializeBrowserProgress(),false);
    assert.deepEqual(storage.read('history',[]),[]);
    assert.equal(storage.write('history',[]),false);
    assert.doesNotThrow(()=>storage.remove('active'));
    assert.equal(storage.read('achievements').progress['first-title'],0);
    assert.equal(storage.statistics([]).played,0);
  },{blocked:true});
});
