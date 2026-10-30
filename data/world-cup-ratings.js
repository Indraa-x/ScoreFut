import {HISTORICAL_NATIONAL_REVIEWS} from './historical-national-review.js?v=historical-review-20261029';
/** Direct creator reviews apply only to the requested national team and era. */
import {IMPORTED_OVR_BY_SQUAD} from './imported-ovr-review.js?v=ovr-import-20261029';
const reviews=[
 ['nation-hungary-1954',[
  ['gyula-grosics',92,88],['jeno-buzanszky',86,82],['gyula-lorant',88,85],
  ['mihaly-lantos',88,85],['jozsef-bozsik',93,89],['jozsef-zakarias',87,82],
  ['nandor-hidegkuti',94,90],['zoltan-czibor',94,89],['laszlo-budai',88,83],
  ['sandor-kocsis',95,91],
 ]],
 ['nation-germany-1974',[
  ['sepp-maier',93,90],['berti-vogts',91,89],['paul-breitner',91,89],
  ['hans-georg-schwarzenbeck',87,83],['jurgen-grabowski',89,85],
  ['wolfgang-overath',91,88],['uli-hoene',89,86],['rainer-bonhof',88,85],
  ['bernd-holzenbein',89,87],
 ]],
];
export const WORLD_CUP_CREATOR_REVIEWS=Object.freeze(Object.fromEntries(reviews.map(([squadId,players])=>[
 squadId,Object.freeze(Object.fromEntries(players.map(([playerId,previousOvr,ovr])=>[playerId,Object.freeze({
  squadId,playerId,previousOvr,ovr,reviewedAt:squadId==='nation-hungary-1954'?'2026-10-27':'2026-10-26',source:'data/world-cup-ratings.js',
  reason:squadId==='nation-hungary-1954'
   ?'Revisão solicitada pelo criador em 27/10/2026: reduzir os demais destaques e manter Puskás isolado como maior OVR do elenco.'
   :'Reequilíbrio solicitado pelo criador em 26/10/2026: OVR geral calculado de 88,5, preservando os principais craques.',
 })]))),
])));
export const GOALKEEPER_CREATOR_REVIEWS=Object.freeze(Object.fromEntries([
 ['nation-italy-2006','gianluigi-buffon',92,94],
 ['nation-germany-2014','manuel-neuer',90,93],
 ['nation-england-1966','gordon-banks',94,92],
].map(([squadId,playerId,previousOvr,ovr])=>[squadId,Object.freeze({[playerId]:Object.freeze({
 squadId,playerId,previousOvr,ovr,reviewedAt:'2026-10-30',source:'data/world-cup-ratings.js',
 reason:'Ajuste de goleiro solicitado pelo criador em 30/10/2026, exclusivo desta seleção e época.',
})})])));
export function applyWorldCupRatingReview(player,squadId){
 const review=GOALKEEPER_CREATOR_REVIEWS[squadId]?.[player.id]??HISTORICAL_NATIONAL_REVIEWS[squadId]?.[player.id]??IMPORTED_OVR_BY_SQUAD[squadId]?.[player.id]??WORLD_CUP_CREATOR_REVIEWS[squadId]?.[player.id];
 if(!review)return player;
 const delta=review.ovr-player.ovr;
 return {...player,ovr:review.ovr,ratingKind:'creator-review',creatorReview:review,
  ratingSource:review.source,ratingReason:review.reason,
  atributos:Object.fromEntries(Object.entries(player.atributos).map(([key,value])=>[key,Math.max(1,Math.min(99,value+delta))])),
 };
}
