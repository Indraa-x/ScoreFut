const prefix = 'scorefut.';
const accountScopedKeys=new Set(['active','history']);
const accountKey=(key,id)=>`${prefix}account.${id}.${key}`;
function storageKey(key){const accountId=accountScopedKeys.has(key)?activeAccountId():null;return accountId?accountKey(key,accountId):prefix+key;}
export function activeAccountId(){try{return localStorage.getItem(prefix+'account-session');}catch{return null;}}
export function setAccountSession(id){try{if(id)localStorage.setItem(prefix+'account-session',id);else localStorage.removeItem(prefix+'account-session');return true;}catch{return false;}}
export function clearGuestProgress(){try{localStorage.removeItem(prefix+'active');localStorage.removeItem(prefix+'history');return true;}catch{return false;}}
export function clearAccountProgress(id){try{for(const key of accountScopedKeys)localStorage.removeItem(accountKey(key,id));return true;}catch{return false;}}
function moveProgress(sourceAccountId,targetAccountId){
  const moved=[];
  try{
    for(const key of accountScopedKeys){
      const source=sourceAccountId?accountKey(key,sourceAccountId):prefix+key;
      const target=targetAccountId?accountKey(key,targetAccountId):prefix+key;
      const value=localStorage.getItem(source);
      if(value===null)continue;
      if(localStorage.getItem(target)!==null)throw new Error('O destino já contém progresso.');
      localStorage.removeItem(source);
      try{localStorage.setItem(target,value);}
      catch(error){localStorage.setItem(source,value);throw error;}
      moved.push({source,target,value});
    }
    return true;
  }catch{
    for(const item of moved.reverse()){
      try{localStorage.removeItem(item.target);localStorage.setItem(item.source,item.value);}catch{/* Mantém a falha sinalizada ao chamador. */}
    }
    return false;
  }
}
export function moveGuestProgressToAccount(id){return moveProgress(null,id);}
export function moveAccountProgressToGuest(id){return moveProgress(id,null);}
export function read(key, fallback = null) { try { const value = localStorage.getItem(storageKey(key)); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } }
export function write(key, value) { try {localStorage.setItem(storageKey(key),JSON.stringify(value));return true;} catch {return false;} }
export function remove(key) {try {localStorage.removeItem(storageKey(key));} catch { /* Navegação privada pode bloquear o armazenamento. */ }}
export function today() {return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function statistics(history = read('history',[])) {
  let streak=0; for(const game of [...history].reverse()) {if(game.champion) streak++;else break;}
  const best = history.reduce((a,b)=>(b.rank||0)>(a?.rank||0)?b:a,null);
  return {titles:history.filter(g=>g.champion).length,played:history.length,best:best?.stageLabel || '—',streak,winRate:history.length?Math.round(history.filter(g=>g.champion).length/history.length*100):0};
}
