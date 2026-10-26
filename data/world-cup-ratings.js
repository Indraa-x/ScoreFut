/** Direct creator reviews apply only to the requested national team and era. */
const reviews=[
 ['nation-hungary-1954',[
  ['gyula-grosics',92,88],['jeno-buzanszky',86,82],['gyula-lorant',88,85],
  ['mihaly-lantos',88,85],['jozsef-bozsik',93,91],['jozsef-zakarias',87,82],
  ['nandor-hidegkuti',94,93],['zoltan-czibor',94,92],['laszlo-budai',88,83],
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
  squadId,playerId,previousOvr,ovr,reviewedAt:'2026-10-26',source:'data/world-cup-ratings.js',
  reason:'Reequilíbrio solicitado pelo criador em 26/10/2026: OVR geral calculado de 88,5, preservando os principais craques.',
 })]))),
])));
export function applyWorldCupRatingReview(player,squadId){
 const review=WORLD_CUP_CREATOR_REVIEWS[squadId]?.[player.id];
 if(!review)return player;
 const delta=review.ovr-player.ovr;
 return {...player,ovr:review.ovr,ratingKind:'creator-review',creatorReview:review,
  ratingSource:review.source,ratingReason:review.reason,
  atributos:Object.fromEntries(Object.entries(player.atributos).map(([key,value])=>[key,Math.max(1,Math.min(99,value+delta))])),
 };
}
