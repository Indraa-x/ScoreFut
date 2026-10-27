import {allSquads as clubSquads,validateData as validateClubs} from './clubs.js?v=creator-import-20261026';
import {worldCupNations,worldCupSquads} from './world-cup-squads.js?v=hungary-puskas-20261027';
export {clubs} from './clubs.js?v=creator-import-20261026';
export {worldCupNations,worldCupSquads};
export const allSquads=[...clubSquads,...worldCupSquads];
export function validateData(){
  const original=validateClubs(),errors=[...original.errors],tags=new Set(['GOL','ZAG','LD','LE','VOL','MC','MEI','MD','ME','PE','PD','SA','CA']);
  if(worldCupNations.length!==32||worldCupSquads.length!==155)errors.push('Copa do Mundo: esperadas 32 seleções e 155 épocas reais.');
  if(new Set(allSquads.map(s=>s.id)).size!==allSquads.length)errors.push('IDs de elenco repetidos.');
  for(const nation of worldCupNations){
    const eras=worldCupSquads.filter(s=>s.clubId===nation.id);
    if(eras.length<1||eras.length>5||eras.length!==new Set(eras.map(s=>s.ano)).size)errors.push(`${nation.nome}: épocas inválidas.`);
  }
  for(const squad of worldCupSquads){
    const players=squad.jogadores;
    if(players.length!==11||new Set(players.map(p=>p.id)).size!==11||players.filter(p=>p.tags.includes('GOL')).length!==1)errors.push(`${squad.id}: escalação inválida.`);
    for(const p of players){
      if(!p.nome||!p.id||!Number.isFinite(p.ovr)||p.ovr<40||p.ovr>99||!p.tags.length||p.tags.some(tag=>!tags.has(tag)))errors.push(`${squad.id}/${p.id}: jogador inválido.`);
      if(['ataque','meio','defesa','finalizacao','reflexo','posicionamento'].some(key=>!Number.isFinite(p.atributos?.[key])))errors.push(`${squad.id}/${p.id}: atributos ausentes.`);
      if(p.ratingKind==='release-rating'&&p.releaseRating.releaseYear!==squad.ratingYear)errors.push(`${squad.id}/${p.id}: edição incorreta.`);
    }
  }
  return {...original,valid:errors.length===0,errors,nations:worldCupNations.length,squads:allSquads.length,players:allSquads.reduce((n,s)=>n+s.jogadores.length,0)};
}
