/** Exact local-editor export approved by the creator. */
export const IMPORTED_OVR_REVIEW=Object.freeze({
  "format": "scorefut-ovr-review",
  "schemaVersion": 1,
  "baseRatingsVersion": 19,
  "exportedAt": "2026-10-26T17:07:53.408Z",
  "changes": [
    {
      "squadId": "nation-brazil-1962",
      "playerId": "garrincha",
      "clubId": "nation-brazil",
      "clube": "Brasil",
      "ano": 1962,
      "nome": "Garrincha",
      "fromOvr": 97,
      "toOvr": 94,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-brazil-1962",
      "playerId": "pele",
      "clubId": "nation-brazil",
      "clube": "Brasil",
      "ano": 1962,
      "nome": "Pelé",
      "fromOvr": 97,
      "toOvr": 95,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-brazil-1970",
      "playerId": "pele",
      "clubId": "nation-brazil",
      "clube": "Brasil",
      "ano": 1970,
      "nome": "Pelé",
      "fromOvr": 98,
      "toOvr": 95,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-brazil-1994",
      "playerId": "romario",
      "clubId": "nation-brazil",
      "clube": "Brasil",
      "ano": 1994,
      "nome": "Romário",
      "fromOvr": 96,
      "toOvr": 94,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-brazil-2002",
      "playerId": "ronaldo-nazario",
      "clubId": "nation-brazil",
      "clube": "Brasil",
      "ano": 2002,
      "nome": "Ronaldo",
      "fromOvr": 96,
      "toOvr": 95,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-argentina-1986",
      "playerId": "diego-maradona",
      "clubId": "nation-argentina",
      "clube": "Argentina",
      "ano": 1986,
      "nome": "Diego Maradona",
      "fromOvr": 99,
      "toOvr": 96,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-argentina-1990",
      "playerId": "diego-maradona",
      "clubId": "nation-argentina",
      "clube": "Argentina",
      "ano": 1990,
      "nome": "Diego Maradona",
      "fromOvr": 98,
      "toOvr": 96,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-germany-1974",
      "playerId": "franz-beckenbauer",
      "clubId": "nation-germany",
      "clube": "Alemanha",
      "ano": 1974,
      "nome": "Franz Beckenbauer",
      "fromOvr": 96,
      "toOvr": 94,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-germany-1974",
      "playerId": "gerd-muller",
      "clubId": "nation-germany",
      "clube": "Alemanha",
      "ano": 1974,
      "nome": "Gerd Müller",
      "fromOvr": 96,
      "toOvr": 95,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-italy-1934",
      "playerId": "giuseppe-meazza",
      "clubId": "nation-italy",
      "clube": "Itália",
      "ano": 1934,
      "nome": "Giuseppe Meazza",
      "fromOvr": 96,
      "toOvr": 93,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-italy-1938",
      "playerId": "giuseppe-meazza",
      "clubId": "nation-italy",
      "clube": "Itália",
      "ano": 1938,
      "nome": "Giuseppe Meazza",
      "fromOvr": 96,
      "toOvr": 93,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-italy-1938",
      "playerId": "silvio-piola",
      "clubId": "nation-italy",
      "clube": "Itália",
      "ano": 1938,
      "nome": "Silvio Piola",
      "fromOvr": 96,
      "toOvr": 91,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-netherlands-1974",
      "playerId": "johan-cruyff",
      "clubId": "nation-netherlands",
      "clube": "Países Baixos",
      "ano": 1974,
      "nome": "Johan Cruyff",
      "fromOvr": 97,
      "toOvr": 94,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-portugal-1966",
      "playerId": "eusebio",
      "clubId": "nation-portugal",
      "clube": "Portugal",
      "ano": 1966,
      "nome": "Eusébio",
      "fromOvr": 97,
      "toOvr": 95,
      "competition": "world-cup"
    },
    {
      "squadId": "nation-hungary-1954",
      "playerId": "ferenc-puskas",
      "clubId": "nation-hungary",
      "clube": "Hungria",
      "ano": 1954,
      "nome": "Ferenc Puskás",
      "fromOvr": 98,
      "toOvr": 95,
      "competition": "world-cup"
    },
    {
      "squadId": "barcelona-2011",
      "playerId": "lionel-messi",
      "clubId": "barcelona",
      "clube": "FC Barcelona",
      "ano": 2011,
      "nome": "Lionel Messi",
      "fromOvr": 95,
      "toOvr": 96,
      "competition": "champions"
    },
    {
      "squadId": "barcelona-2015",
      "playerId": "lionel-messi",
      "clubId": "barcelona",
      "clube": "FC Barcelona",
      "ano": 2015,
      "nome": "Lionel Messi",
      "fromOvr": 94,
      "toOvr": 95,
      "competition": "champions"
    },
    {
      "squadId": "santos-1963",
      "playerId": "pele",
      "clubId": "santos",
      "clube": "Santos",
      "ano": 1963,
      "nome": "Pelé",
      "fromOvr": 96,
      "toOvr": 95,
      "competition": "copa-do-brasil"
    }
  ],
  "sourceFile": "scorefut-overs-acima-93-2026-10-26 (1).json"
});
const bySquad={};
for(const change of IMPORTED_OVR_REVIEW.changes){
 (bySquad[change.squadId]??={})[change.playerId]=Object.freeze({
  squadId:change.squadId,playerId:change.playerId,ovr:change.toOvr,previousOvr:change.fromOvr,
  source:'data/imported-ovr-review.js',sourceFile:IMPORTED_OVR_REVIEW.sourceFile,exportedAt:IMPORTED_OVR_REVIEW.exportedAt,
  reason:'Ajuste do criador importado de '+IMPORTED_OVR_REVIEW.sourceFile+' em 26/10/2026.',
 });
}
export const IMPORTED_OVR_BY_SQUAD=Object.freeze(Object.fromEntries(Object.entries(bySquad).map(([id,values])=>[id,Object.freeze(values)])));
