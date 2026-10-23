/** EURO's six-group format. No pending live results or module-level RNG state. */
export const EURO_THIRD_COMBINATIONS = Object.freeze({
  ABCD:'ADBC', ABCE:'AEBC', ABCF:'AFBC', ABDE:'DEAB', ABDF:'DFAB', ABEF:'EFBA',
  ACDE:'EDCA', ACDF:'FDCA', ACEF:'EFCA', ADEF:'EFDA', BCDE:'EDBC', BCDF:'FDCB',
  BCEF:'FECB', BDEF:'FEDB', CDEF:'FEDC',
});
export const EURO_PENDING_PAIRS = Object.freeze([
  ['1º Grupo B','3º Grupo A/D/E/F'],['1º Grupo A','2º Grupo C'],
  ['1º Grupo F','3º Grupo A/B/C'],['2º Grupo D','2º Grupo E'],
  ['1º Grupo E','3º Grupo A/B/C/D'],['1º Grupo D','2º Grupo F'],
  ['1º Grupo C','3º Grupo D/E/F'],['2º Grupo A','2º Grupo B'],
]);
const disciplinaryPoints=(id,matches)=>matches.reduce((total,match)=>{
  const side=match.homeId===id?'home':match.awayId===id?'away':null;
  return total+(side?(match.result?.events||[]).filter(event=>event.team===side)
    .reduce((sum,event)=>sum+(event.type==='yellow'?1:event.type==='red'?3:0),0):0);
},0);
const difference=(a,b,keys)=>{for(const key of keys){const delta=b[key]-a[key];if(delta)return delta;}return 0;};

export function euroGroupOrder(rows,matches,lot) {
  const fallback=(a,b)=>difference(a,b,['goalDifference','goalsFor'])
    ||disciplinaryPoints(a.teamId,matches)-disciplinaryPoints(b.teamId,matches)||lot(a.teamId)-lot(b.teamId);
  function headToHead(tied){
    if(tied.length<2)return tied;
    const ids=new Set(tied.map(row=>row.teamId));
    const mini=new Map(tied.map(row=>[row.teamId,{points:0,goalDifference:0,goalsFor:0}]));
    for(const match of matches.filter(match=>match.result&&ids.has(match.homeId)&&ids.has(match.awayId))){
      for(const [id,goals,against] of [[match.homeId,match.result.homeGoals,match.result.awayGoals],[match.awayId,match.result.awayGoals,match.result.homeGoals]]){
        const row=mini.get(id);row.points+=goals>against?3:goals===against?1:0;row.goalsFor+=goals;row.goalDifference+=goals-against;
      }
    }
    const sorted=[...tied].sort((a,b)=>difference(mini.get(a.teamId),mini.get(b.teamId),['points','goalDifference','goalsFor']));
    const batches=[];
    for(const row of sorted){const prev=batches.at(-1);if(prev&&!difference(mini.get(prev[0].teamId),mini.get(row.teamId),['points','goalDifference','goalsFor']))prev.push(row);else batches.push([row]);}
    return batches.length===1?sorted.sort(fallback):batches.flatMap(batch=>headToHead(batch));
  }
  const sorted=[...rows].sort((a,b)=>b.points-a.points),batches=[];
  for(const row of sorted){const prev=batches.at(-1);if(prev&&prev[0].points===row.points)prev.push(row);else batches.push([row]);}
  return batches.flatMap(headToHead);
}

export function euroThirdPlaceStandings(tournament,lot=id=>id) {
  return tournament.groups.map(group=>({...group.standings[2],groupId:group.id}))
    .filter(row=>row.teamId).sort((a,b)=>difference(a,b,['points','goalDifference','goalsFor','wins'])
      ||disciplinaryPoints(a.teamId,tournament.matches)-disciplinaryPoints(b.teamId,tournament.matches)
      ||String(lot(a.teamId)).localeCompare(String(lot(b.teamId)),undefined,{numeric:true}))
    .map((row,index)=>({...row,qualified:tournament.progressRound>=3&&index<4}));
}

export function euroRound16Pairings(tournament,lot) {
  const third=euroThirdPlaceStandings(tournament,lot).slice(0,4);
  const combination=third.map(row=>row.groupId).sort().join('');
  const allocation=EURO_THIRD_COMBINATIONS[combination];
  if(!allocation)throw new Error('Os seis grupos precisam terminar para definir as oitavas da Euro.');
  const team=(group,rank)=>tournament.groups.find(item=>item.id===group).standings[rank-1].teamId;
  const opponents=Object.fromEntries(['B','C','E','F'].map((group,index)=>[group,team(allocation[index],3)]));
  return [[team('B',1),opponents.B],[team('A',1),team('C',2)],
    [team('F',1),opponents.F],[team('D',2),team('E',2)],
    [team('E',1),opponents.E],[team('D',1),team('F',2)],
    [team('C',1),opponents.C],[team('A',2),team('B',2)]];
}
