import { hashSeed, mulberry32, FORMATIONS, TEAM_SIZE, positionFit } from './engine.js?v=five-eras-20261022';
export const DEFAULT_REROLLS = 4;
export function createDraft(seed,date,mode) {return {seed:hashSeed(seed),rngState:hashSeed(seed),date,mode,rerollLimit:mode==='daily'?0:DEFAULT_REROLLS,rerolls:mode==='daily'?0:DEFAULT_REROLLS,seen:[],picks:[],currentSquadId:null,selectedId:null};}
/** Upgrade the budget once, preserving the number of skips already spent. */
export function refreshDraftSkips(draft) {
  if(draft.mode==='daily')return {...draft,rerollLimit:0,rerolls:0};
  const oldLimit=Number.isInteger(draft.rerollLimit)?draft.rerollLimit:3;
  const spent=Math.max(0,oldLimit-(Number.isInteger(draft.rerolls)?draft.rerolls:oldLimit));
  return {...draft,rerollLimit:DEFAULT_REROLLS,rerolls:Math.max(0,DEFAULT_REROLLS-spent)};
}
export function availableSlots(draft,formation,player) {return FORMATIONS[formation].slots.filter(slot=>!draft.picks.some(p=>p.slot.id===slot.id)&&positionFit(player,slot)!==null);}
/** A filled destination permits a swap only when both players fit their new roles. */
export function movableSlots(draft,formation,playerId) {
  const pick=draft.picks.find(p=>p.player.id===playerId);
  if(!pick)return [];
  const source=FORMATIONS[formation].slots.find(slot=>slot.id===pick.slot.id);
  return FORMATIONS[formation].slots.filter(slot=>{
    if(slot.id===pick.slot.id||positionFit(pick.player,slot)===null)return false;
    const occupant=draft.picks.find(p=>p.slot.id===slot.id);
    return !occupant||(source&&positionFit(occupant.player,source)!==null);
  });
}
/** Reposition existing picks without consuming a draw or changing player ratings. */
export function movePick(draft,formation,playerId,targetSlotId) {
  const pick=draft.picks.find(p=>p.player.id===playerId);
  const target=movableSlots(draft,formation,playerId).find(slot=>slot.id===targetSlotId);
  if(!pick||!target)throw new Error('Escolha uma posição compatível destacada para mover ou trocar o jogador.');
  const source=FORMATIONS[formation].slots.find(slot=>slot.id===pick.slot.id);
  return {...draft,selectedId:null,selectedPickId:null,picks:draft.picks.map(entry=>
    entry.player.id===playerId?{...entry,slot:target}:entry.slot.id===target.id?{...entry,slot:source}:entry)};
}
/** Prefer a free natural role, then a permitted nearby role. Ratings stay intact. */
export function automaticSlot(draft,formation,player) {
  const naturalOrder=slot=>player.tags.findIndex(tag=>positionFit({tags:[tag]},slot)===0);
  return availableSlots(draft,formation,player).sort((a,b)=>positionFit(player,a)-positionFit(player,b)||naturalOrder(a)-naturalOrder(b))[0]||null;
}
/** Pure draw: every exposed or discarded squad stays in seen, shared rerolls persist. */
export function drawSquad(draft,squads,formation,kind='new',mode=draft.mode||'') {
  if(draft.picks.length>=TEAM_SIZE) throw new Error('Seu time já está completo.');
  const reroll=kind!=='new';if(reroll&&draft.rerolls<=0) throw new Error('Você usou todos os re-sorteios.');
  const current=squads.find(s=>s.id===draft.currentSquadId);
  if(reroll&&!current) throw new Error('Sorteie um elenco primeiro.');
  if(!reroll&&current) throw new Error('Escolha um jogador antes do próximo sorteio.');
  const needsKeeper=!draft.picks.some(p=>p.slot.position==='GOL');
  const needsForcedKeeper=needsKeeper&&draft.picks.length===TEAM_SIZE-1;
  const candidates=squads.filter(s=>!draft.seen.includes(s.id)
    &&(!reroll||kind==='season'?(!reroll||s.clubId===current.clubId):s.clubId!==current.clubId)
    &&(!needsForcedKeeper||s.jogadores.some(p=>p.tags.includes('GOL')))
    &&s.jogadores.some(p=>!draft.picks.some(pick=>pick.player.id===p.id)&&availableSlots(draft,formation,p).length));
  if(!candidates.length) throw new Error(kind==='season'?'Não há outra temporada compatível disponível para este clube.':'Não há elenco compatível com as posições que faltam.');
  const rng=mulberry32(draft.rngState);const clubIds=[...new Set(candidates.map(s=>s.clubId))];
  const clubAverages=new Map();
  if(mode==='champions')for(const squad of squads){
    const record=clubAverages.get(squad.clubId)||{total:0,count:0};
    for(const player of squad.jogadores){record.total+=player.ovr;record.count++;}
    clubAverages.set(squad.clubId,record);
  }
  const clubWeight=clubId=>{
    if(mode!=='champions')return 1;
    const record=clubAverages.get(clubId);
    const average=record?.count?record.total/record.count:82;
    return Math.exp(-Math.max(0,average-82)*.05);
  };
  const weights=clubIds.map(clubWeight),totalWeight=weights.reduce((sum,weight)=>sum+weight,0);
  let roll=rng()*totalWeight,clubIndex=weights.findIndex(weight=>(roll-=weight)<=0);
  if(clubIndex<0)clubIndex=clubIds.length-1;
  const clubId=clubIds[clubIndex],clubSeasons=candidates.filter(s=>s.clubId===clubId),squad=clubSeasons[Math.floor(rng()*clubSeasons.length)];
  return {...draft,rngState:rng.getState(),rerolls:draft.rerolls-(reroll?1:0),currentSquadId:squad.id,seen:[...draft.seen,squad.id]};
}
export function confirmPick(draft,squads,formation,playerId,targetSlotId) {
  if(draft.picks.length>=TEAM_SIZE) throw new Error('Seu time já está completo.');
  const squad=squads.find(s=>s.id===draft.currentSquadId);const player=squad?.jogadores.find(p=>p.id===playerId);
  if(!player) throw new Error('Escolha um jogador do elenco sorteado.');
  if(draft.picks.some(p=>p.player.id===player.id)) throw new Error('Este jogador já está no seu time.');
  const slot=targetSlotId===undefined?automaticSlot(draft,formation,player):availableSlots(draft,formation,player).find(slot=>slot.id===targetSlotId);
  if(targetSlotId!==undefined&&!slot) throw new Error('Solte o jogador em uma posição livre destacada.');
  if(!slot) throw new Error('Não há posição livre para este jogador.');
  return {...draft,picks:[...draft.picks,{player,slot,squadId:squad.id,clubId:squad.clubId,clubName:squad.nome,ano:squad.ano}],currentSquadId:null,selectedId:null};
}
/** Refresh unfinished selections from their exact club season without losing progress. */
export function refreshDraftRatings(draft,squads) {
  return {...draft,picks:draft.picks.map(pick=>{
    const player=squads.find(s=>s.id===pick.squadId)?.jogadores.find(p=>p.id===pick.player.id);
    return player?{...pick,player}:pick;
  })};
}
/** Preserve compatible choices when upgrading an unfinished five-player draft. */
export function migrateDraft(draft,formation,squads) {
  const slots=FORMATIONS[formation].slots;
  const choices=refreshDraftRatings(draft,squads).picks.filter((pick,i,all)=>all.findIndex(p=>p.player.id===pick.player.id)===i);
  let states=new Map([[0,{picks:[],cost:0}]]);
  for(const pick of choices){
    const next=new Map(states);
    for(const[mask,state]of states)slots.forEach((slot,i)=>{
      const fit=positionFit(pick.player,slot);if(mask&(1<<i)||fit===null)return;
      const key=mask|(1<<i),candidate={picks:[...state.picks,{...pick,slot}],cost:state.cost+fit+(slot.id===pick.slot.id?0:.001)};
      if(!next.has(key)||candidate.cost<next.get(key).cost)next.set(key,candidate);
    });
    states=next;
  }
  const best=[...states.values()].sort((a,b)=>b.picks.length-a.picks.length||a.cost-b.cost)[0];
  return {...draft,picks:best.picks,selectedId:null,selectedSlotId:null};
}
