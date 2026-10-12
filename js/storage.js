const prefix = 'scorefut.';
export function read(key, fallback = null) { try { const value = localStorage.getItem(prefix+key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } }
export function write(key, value) { try {localStorage.setItem(prefix+key,JSON.stringify(value));return true;} catch {return false;} }
export function remove(key) {try {localStorage.removeItem(prefix+key);} catch { /* Navegação privada pode bloquear o armazenamento. */ }}
export function today() {return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function statistics(history = read('history',[])) {
  let streak=0; for(const game of [...history].reverse()) {if(game.champion) streak++;else break;}
  const best = history.reduce((a,b)=>(b.rank||0)>(a?.rank||0)?b:a,null);
  return {titles:history.filter(g=>g.champion).length,played:history.length,best:best?.stageLabel || '—',streak,winRate:history.length?Math.round(history.filter(g=>g.champion).length/history.length*100):0};
}
