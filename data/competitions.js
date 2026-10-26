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
  'galatasaray','fenerbahce','rb-leipzig',
]);
export function squadsForMode(squads,mode){
  if(mode==='world-cup')return squads.filter(squad=>squad.kind==='national');
  const ids=mode==='copa-do-brasil'?BRAZIL_CUP_CLUB_IDS:mode==='brasileirao'?BRAZIL_CLUB_IDS:mode==='champions'?EUROPE_CLUB_IDS:null;
  return ids?squads.filter(squad=>ids.includes(squad.clubId)):squads.filter(squad=>squad.kind!=='national');
}
export function competitionName(mode){return {'world-cup':'Copa do Mundo','copa-do-brasil':'Copa do Brasil',brasileirao:'Brasileirão',champions:'Champions League',legends:'Modo Lendas',quick:'Modo rápido'}[mode]||'Copa ScoreFut';}
export function competitionLogo(mode){return {'world-cup':'assets/competitions/world-cup-trophy.png','copa-do-brasil':'assets/competitions/copa-do-brasil.png',brasileirao:'assets/competitions/brasileirao.png',champions:'assets/competitions/champions-league.png'}[mode]||null;}
