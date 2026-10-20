import {nationalSquads} from './national-teams.js?v=national-peaks-v2-20261020';
export const BRAZIL_CLUB_IDS = Object.freeze([
  'flamengo','palmeiras','sao-paulo','corinthians','santos','gremio','internacional',
  'vasco','fluminense','botafogo','cruzeiro','atletico-mineiro','athletico-paranaense','bahia','fortaleza',
]);
// Clubs in our historical database confirmed in the CBF's 2026 participant list.
export const BRAZIL_CUP_CLUB_IDS = BRAZIL_CLUB_IDS;
export const EUROPE_CLUB_IDS = Object.freeze([
  'real-madrid','barcelona','bayern','milan','manchester-united','liverpool','manchester-city',
  'arsenal','chelsea','inter','juventus','ajax','napoli','tottenham','atletico-madrid',
  'borussia-dortmund','psg','porto','benfica','valencia','monaco','celtic','marseille','psv','roma',
]);
export function squadsForMode(squads,mode){
  if(mode==='world-cup')return nationalSquads;
  squads=squads.filter(squad=>!squad.clubId.startsWith('selecao-'));
  const ids=mode==='copa-do-brasil'?BRAZIL_CUP_CLUB_IDS:mode==='brasileirao'?BRAZIL_CLUB_IDS:mode==='champions'?EUROPE_CLUB_IDS:null;
  return ids?squads.filter(squad=>ids.includes(squad.clubId)):squads;
}
export function competitionName(mode){return {'copa-do-brasil':'Copa do Brasil',brasileirao:'Brasileirão',champions:'Champions League','world-cup':'Copa do Mundo',legends:'Modo Lendas',quick:'Modo rápido'}[mode]||'Copa ScoreFut';}
export function competitionLogo(mode){return {'world-cup':'assets/competitions/world-cup.png','copa-do-brasil':'assets/competitions/copa-do-brasil.png',brasileirao:'assets/competitions/brasileirao.png',champions:'assets/competitions/champions-league.png'}[mode]||null;}
