/** Classic 32-team World Cup: eight groups, overall goal difference before head-to-head. */
export const WORLD_CUP_PENDING_PAIRS=Object.freeze([
 ['1º Grupo A','2º Grupo B'],['1º Grupo C','2º Grupo D'],
 ['1º Grupo E','2º Grupo F'],['1º Grupo G','2º Grupo H'],
 ['1º Grupo B','2º Grupo A'],['1º Grupo D','2º Grupo C'],
 ['1º Grupo F','2º Grupo E'],['1º Grupo H','2º Grupo G'],
]);
const difference=(a,b,keys)=>{for(const key of keys){const delta=b[key]-a[key];if(delta)return delta;}return 0;};
function discipline(id,matches){
 return matches.reduce((total,match)=>{
  const side=match.homeId===id?'home':match.awayId===id?'away':null;
  if(!side)return total;
  const cards=new Map();
  for(const event of match.result?.events||[]){
   if(event.team!==side||!['yellow','red'].includes(event.type))continue;
   const key=event.playerId||event.player?.id||event.playerName||event.player?.nome||event.type;
   const entry=cards.get(key)||{yellow:0,red:0};entry[event.type]++;cards.set(key,entry);
  }
  return total+[...cards.values()].reduce((sum,card)=>sum+(card.red?(card.yellow>=2?3:card.yellow?5:4):card.yellow>=2?3:card.yellow),0);
 },0);
}
export function worldCupGroupOrder(rows,matches,lot){
 const ordered=[...rows].sort((a,b)=>difference(a,b,['points','goalDifference','goalsFor']));
 const tied=[];
 for(const row of ordered){const group=tied.at(-1);if(group&&!difference(group[0],row,['points','goalDifference','goalsFor']))group.push(row);else tied.push([row]);}
 return tied.flatMap(group=>{
  if(group.length===1)return group;
  const mini=new Map(group.map(row=>[row.teamId,{points:0,goalDifference:0,goalsFor:0}]));
  for(const match of matches){
   if(!match.result||!mini.has(match.homeId)||!mini.has(match.awayId))continue;
   for(const [id,goals,against] of [[match.homeId,match.result.homeGoals,match.result.awayGoals],[match.awayId,match.result.awayGoals,match.result.homeGoals]]){
    const row=mini.get(id);row.points+=goals>against?3:goals===against?1:0;row.goalDifference+=goals-against;row.goalsFor+=goals;
   }
  }
  return [...group].sort((a,b)=>difference(mini.get(a.teamId),mini.get(b.teamId),['points','goalDifference','goalsFor'])||discipline(a.teamId,matches)-discipline(b.teamId,matches)||lot(a.teamId)-lot(b.teamId));
 });
}
export function worldCupRound16Pairings(tournament){
 if(tournament.groups.length!==8||tournament.groups.some(group=>group.standings.length!==4||group.standings.some(row=>row.played!==3)))throw Error('Os oito grupos precisam terminar antes das oitavas da Copa do Mundo.');
 const team=(group,rank)=>tournament.groups.find(item=>item.id===group).standings[rank-1].teamId;
 return [['A','B'],['C','D'],['E','F'],['G','H'],['B','A'],['D','C'],['F','E'],['H','G']].map(([a,b])=>[team(a,1),team(b,2)]);
}
