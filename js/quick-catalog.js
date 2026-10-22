import {clubs, allSquads} from '../data/clubs.js?v=five-eras-20261022';
import {BRAZIL_CLUB_IDS} from '../data/competitions.js?v=five-eras-20261022';
import {squadTeam,FORMATIONS} from './engine.js?v=five-eras-20261022';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

// Ratings here use the same eleven players as the chosen lineup, without a bonus.
export const quickCatalog = clubs.map(club => {
  const seasons = allSquads.filter(squad => squad.clubId === club.id).sort((a,b) => b.ano-a.ano);
  const squad = seasons[0];
  return {...club, squad, seasonCount:seasons.length,
    overall:Math.round(squadTeam(squad).strength.overall),
    region:BRAZIL_CLUB_IDS.includes(club.id) ? 'brasil' : 'europa'};
}).sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'));

const formationCatalogs=new Map();
export function quickSeasons(clubId,formation){
  const seasons=allSquads.filter(squad=>squad.clubId===clubId).sort((a,b)=>b.ano-a.ano);
  if(!formation)return seasons;
  if(!FORMATIONS[formation])throw new Error('Escolha uma formação disponível.');
  return seasons.filter(squad=>{try{squadTeam(squad,formation);return true;}catch{return false;}});
}
function catalogForFormation(formation){
  if(!formation)return quickCatalog;
  if(!formationCatalogs.has(formation))formationCatalogs.set(formation,quickCatalog.map(club=>{
    const seasons=quickSeasons(club.id,formation),squad=seasons[0]||null;
    return {...club,squad,seasonCount:seasons.length,available:Boolean(squad),formation,
      overall:squad?Math.round(squadTeam(squad,formation).strength.overall):null};
  }));
  return formationCatalogs.get(formation);
}
export function filterQuickClubs({search='',region='all',formation=null}={}) {
  const query=normalize(search);
  return catalogForFormation(formation).filter(club => (region==='all'||club.region===region)
    && normalize(`${club.nome} ${club.id.replaceAll('-',' ')} ${club.monograma}`).includes(query));
}
