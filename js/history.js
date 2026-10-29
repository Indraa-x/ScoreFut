import {competitionName} from '../data/competitions.js?v=leverkusen-20261029';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();

/** Preserve saved order as the recency tie-breaker, without changing any records. */
export function filterHistory(history, {search='',mode='all',titlesOnly=false}={}) {
  const query=normalize(search);
  return [...history].reverse().filter(record =>
    (mode==='all'||record.mode===mode) && (!titlesOnly||record.champion)
    && normalize(`${record.teamName} ${competitionName(record.mode)} ${record.stageLabel} ${record.date}`).includes(query));
}

export function formatHistoryDate(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return String(value || 'Data não informada');
  const date=new Date(`${value}T12:00:00Z`);
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return String(value);
  return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(date);
}
