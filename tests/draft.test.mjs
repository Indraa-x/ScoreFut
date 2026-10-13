import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMATIONS,TEAM_SIZE,hashSeed,positionFit} from '../js/engine.js';
import {allSquads} from '../data/clubs.js';
import {squadsForMode} from '../data/competitions.js';
import {createDraft,availableSlots,automaticSlot,drawSquad,confirmPick,migrateDraft} from '../js/draft.js';
const formation='4-3-3',slots=FORMATIONS[formation].slots;
const player=(id,tag)=>({id,nome:id,tags:[tag],ovr:88,atributos:{ataque:88,meio:88,defesa:88,finalizacao:88,reflexo:88,posicionamento:88}});
const squads=Array.from({length:80},(_,i)=>({id:`club-${Math.floor(i/4)}-${2000+i%4}`,clubId:`club-${Math.floor(i/4)}`,nome:`Clube ${Math.floor(i/4)}`,ano:2000+i%4,jogadores:slots.map((s,j)=>player(`person-${i}-${j}`,s.label))}));
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);Object.values(v).forEach(freeze)}return v};
const pick=(d,id)=>{const s=squads.find(s=>s.id===d.currentSquadId),slot=slots.find(s=>s.id===id);const p=s.jogadores.find(p=>p.tags.includes(slot.label)&&!d.picks.some(e=>e.player.id===p.id));return confirmPick(d,squads,formation,p.id)};
const field=count=>slots.filter(s=>s.position!=='GOL').slice(0,count).map((slot,i)=>({slot,player:player('previous-'+i,slot.label),squadId:'picked-'+i,clubId:'picked-club-'+i}));
test('three rerolls are shared across all eleven rounds and discarded squads never return',()=>{
 for(let seed=0;seed<25;seed++){
  let d=createDraft(seed,'2026-10-10','cup');d=drawSquad(d,squads,formation);d=drawSquad(d,squads,formation,'season');d=drawSquad(d,squads,formation,'club');
  d=pick(d,'gol');d=drawSquad(d,squads,formation);d=drawSquad(d,squads,formation,'season');d=pick(d,'ld');
  for(const slot of slots.filter(s=>!['gol','ld'].includes(s.id))){d=drawSquad(d,squads,formation);d=pick(d,slot.id)}
  assert.equal(d.picks.length,TEAM_SIZE);assert.equal(d.seen.length,14);assert.equal(new Set(d.seen).size,14);assert.equal(d.rerolls,0);
 }
});
test('other season keeps the club and changes year; other club changes club',()=>{
 let d=drawSquad(createDraft(12,'date','cup'),squads,formation);const first=squads.find(s=>s.id===d.currentSquadId);
 d=drawSquad(d,squads,formation,'season');const second=squads.find(s=>s.id===d.currentSquadId);
 assert.equal(first.clubId,second.clubId);assert.notEqual(first.ano,second.ano);
 d=drawSquad(d,squads,formation,'club');assert.notEqual(squads.find(s=>s.id===d.currentSquadId).clubId,second.clubId);
});
test('daily draws are deterministic and never allow rerolls',()=>{
 const d=freeze(createDraft('ScoreFut:2026-10-10','2026-10-10','daily'));freeze(squads);
 const run=()=>{let next=d;for(const slot of slots){next=drawSquad(next,squads,formation);next=pick(next,slot.id)}return next};
 assert.deepEqual(run(),run());assert.equal(d.picks.length,0);assert.equal(d.rngState,hashSeed('ScoreFut:2026-10-10'));
 const drawn=drawSquad(d,squads,formation);assert.throws(()=>drawSquad(drawn,squads,formation,'club'),/todos os re-sorteios/);assert.throws(()=>drawSquad(drawn,squads,formation,'season'),/todos os re-sorteios/);
});
test('Champions keeps strong clubs attainable while making them slightly less common',()=>{
 const pool=squadsForMode(allSquads,'champions');
 const averages=new Map();
 for(const squad of pool){
  const record=averages.get(squad.clubId)||{total:0,count:0};
  for(const player of squad.jogadores){record.total+=player.ovr;record.count++;}
  averages.set(squad.clubId,record);
 }
 const strong=new Set([...averages].filter(([,record])=>record.total/record.count>=85).map(([id])=>id));
 let weightedStrong=0,uniformStrong=0,weightedSamples=0;
 for(let seed=0;seed<1000;seed++){
  const initial=createDraft(seed,'date','champions');
  const weighted=drawSquad(initial,pool,formation,'new','champions');
  const uniform=drawSquad(initial,pool,formation,'new','quick');
  const weightedClub=pool.find(squad=>squad.id===weighted.currentSquadId).clubId;
  const uniformClub=pool.find(squad=>squad.id===uniform.currentSquadId).clubId;
  if(strong.has(weightedClub))weightedStrong++;
  if(strong.has(uniformClub))uniformStrong++;
  if(weightedClub==='real-madrid')weightedSamples++;
 }
 assert.ok(weightedStrong<uniformStrong*.92,`${weightedStrong} vs ${uniformStrong}`);
 assert.ok(weightedStrong>100,'os clubes fortes continuam aparecendo com frequência');
 assert.ok(weightedSamples>0,'Real Madrid continua podendo ser sorteado');
});
test('the same person cannot be selected twice across seasons',()=>{
 const person=player('same-person','MC'),current={...squads[0],jogadores:[person,...squads[0].jogadores]};
 const d={...createDraft(1,'date','cup'),currentSquadId:current.id,selectedId:person.id,selectedSlotId:'mc-2',picks:[{player:person,slot:slots.find(s=>s.id==='mc-1')}]};
 assert.throws(()=>confirmPick(d,[current],formation,person.id),/já está no seu time/);assert.equal(d.picks.length,1);
});
test('specific legal empty slots are the only selectable destinations',()=>{
 const d=createDraft(2,'date','cup');
 assert.deepEqual(availableSlots(d,formation,player('gk','GOL')).map(s=>s.id),['gol']);
 assert.deepEqual(availableSlots(d,formation,player('cb','ZAG')).map(s=>s.id),['zag-1','zag-2']);
 assert.deepEqual(availableSlots(d,formation,player('st','CA')).map(s=>s.id),['ca']);
 assert.deepEqual(availableSlots(d,formation,player('rb','LD')).map(s=>s.id),['ld','le']);
 assert.equal(availableSlots({...d,picks:[{slot:slots.find(s=>s.id==='ca')}]},formation,player('st','CA')).length,0);
});
test('a player is added directly to a compatible free position without a slot selection',()=>{
 const squad=squads[0],d={...createDraft(1,'date','cup'),currentSquadId:squad.id};
 for(const tag of ['GOL','CA','MC','ZAG','LD','LE']){
  const person=squad.jogadores.find(p=>p.tags.includes(tag));
  const chosen=confirmPick(freeze(d),squads,formation,person.id);
  assert.equal(chosen.picks[0].slot.label,tag);assert.equal(chosen.currentSquadId,null);assert.equal(d.picks.length,0);
 }
 assert.throws(()=>confirmPick(d,squads,formation,'unknown-player'),/elenco sorteado/);
 const occupied={...d,picks:[{slot:slots.find(s=>s.id==='ca'),player:player('existing-ca','CA')}]};
 assert.throws(()=>confirmPick(occupied,squads,formation,squad.jogadores.find(p=>p.tags.includes('CA')).id),/Não há posição livre/);
});
test('automatic placement prefers natural roles, then nearby roles without changing the player rating',()=>{
 const rb=player('rb','LD'),squad={...squads[0],jogadores:[rb]},d={...createDraft(3,'date','cup'),currentSquadId:squad.id};
 assert.equal(automaticSlot(d,formation,rb).id,'ld');
 const occupied={...d,picks:[{slot:slots.find(s=>s.id==='ld'),player:player('existing-rb','LD')}]};
 const chosen=confirmPick(occupied,[squad],formation,rb.id);
 assert.equal(chosen.picks.at(-1).slot.id,'le');assert.equal(chosen.picks.at(-1).player.ovr,88);
 const blocked={...occupied,picks:[...occupied.picks,{slot:slots.find(s=>s.id==='le'),player:player('existing-lb','LE')}]};
 assert.equal(automaticSlot(blocked,formation,rb),null);
 assert.throws(()=>confirmPick(blocked,[squad],formation,rb.id),/Não há posição livre/);
 const mc=player('mc','MC'),partiallyFilled={...d,picks:[{slot:slots.find(s=>s.id==='mc-1'),player:player('existing-mc','MC')}]};
 assert.equal(automaticSlot(partiallyFilled,formation,mc).id,'mc-2');
 const hybrid={...mc,tags:['MC','VOL']};
 assert.equal(automaticSlot(d,formation,hybrid).id,'mc-1');
 assert.equal(automaticSlot({...d,picks:slots.filter(s=>s.label==='MC').map((slot,i)=>({slot,player:player('occupied-mc-'+i,'MC')}))},formation,hybrid).id,'vol');
});
test('the eleventh round forces an unused goalkeeper without spending rerolls',()=>{
 const d={...createDraft(9,'date','cup'),picks:field(10)};
 const pool=squads.map((s,i)=>({...s,jogadores:s.jogadores.map(p=>p.tags.includes('GOL')&&i!==7?player(p.id,'CA'):p)}));
 const drawn=drawSquad(d,pool,formation);assert.equal(drawn.currentSquadId,pool[7].id);assert.equal(drawn.rerolls,3);
 const compatible=pool[7].jogadores.filter(p=>availableSlots(drawn,formation,p).length);assert.equal(compatible.length,1);assert.ok(compatible[0].tags.includes('GOL'));
});
test('dropping into a chosen compatible position respects that destination and keeps full ratings',()=>{
 const squad=squads[0],d=freeze({...createDraft(5,'date','cup'),currentSquadId:squad.id});
 const rb=squad.jogadores.find(p=>p.tags.includes('LD'));
 const next=confirmPick(d,squads,formation,rb.id,'le');
 assert.equal(next.picks[0].slot.id,'le');assert.equal(next.picks[0].player.ovr,rb.ovr);
 assert.deepEqual(next.picks[0].player.atributos,rb.atributos);
 assert.equal(next.currentSquadId,null);assert.equal(next.selectedId,null);assert.equal(d.picks.length,0);
 const cb=squad.jogadores.find(p=>p.tags.includes('ZAG'));
 assert.equal(confirmPick(d,squads,formation,cb.id,'zag-2').picks[0].slot.id,'zag-2');
});
test('a drop rejects incompatible, occupied and nonexistent positions without consuming the draw',()=>{
 const squad=squads[0],d=freeze({...createDraft(5,'date','cup'),currentSquadId:squad.id});
 for(const [tag,target]of [['CA','zag-1'],['GOL','mc-1'],['MC','ca'],['ZAG','ld'],['LD','not-a-slot']]){
  const person=squad.jogadores.find(p=>p.tags.includes(tag));
  assert.throws(()=>confirmPick(d,squads,formation,person.id,target),/posição livre destacada/);
 }
 const filled=freeze({...d,picks:[{slot:slots.find(s=>s.id==='le'),player:player('existing-left-back','LE')}]});
 assert.throws(()=>confirmPick(filled,squads,formation,squad.jogadores.find(p=>p.tags.includes('LD')).id,'le'),/posição livre destacada/);
 assert.equal(d.currentSquadId,squad.id);assert.equal(d.picks.length,0);assert.equal(d.rerolls,3);
});
test('completed eleven-player drafts forbid further draws and confirmations',()=>{
 const d={...createDraft(3,'date','cup'),picks:slots.map((slot,i)=>({slot,player:player('full-'+i,slot.label)}))};
 assert.throws(()=>drawSquad(d,squads,formation),/time já está completo/);assert.throws(()=>confirmPick(d,squads,formation),/time já está completo/);
 assert.throws(()=>drawSquad(createDraft(1,'date','cup'),squads,formation,'club'),/Sorteie um elenco primeiro/);
 const drawn=drawSquad(createDraft(1,'date','cup'),squads,formation);assert.throws(()=>drawSquad(drawn,squads,formation),/Escolha um jogador/);
});
test('legacy choices migrate to real slots with identities and seed preserved',()=>{
 const d={...createDraft(77,'date','cup'),picks:['GOL','ZAG','MC','MC','CA'].map((tag,i)=>({player:player('legacy-'+i,tag),slot:{id:['gol','zag','mc-1','mc-2','ca'][i],label:tag,position:tag==='ZAG'?'DEF':tag==='CA'?'ATA':tag==='GOL'?'GOL':'MEI'},squadId:'old-'+i})),selectedId:'stale',selectedSlotId:'zag'};
 const migrated=migrateDraft(d,formation,squads);assert.equal(migrated.picks.length,5);assert.equal(migrated.seed,d.seed);assert.equal(migrated.selectedId,null);
 assert.ok(migrated.picks.every(p=>slots.some(s=>s.id===p.slot.id)&&positionFit(p.player,p.slot)!==null));assert.equal(new Set(migrated.picks.map(p=>p.slot.id)).size,5);
 const twoStrikers={...d,picks:d.picks.slice(0,3).concat(['a','b'].map(id=>({player:player(id,'CA'),slot:{id}})))};
 assert.equal(migrateDraft(twoStrikers,'4-4-2',squads).picks.length,5);
});
test('all eight formations can finish eleven-round drafts against the real historical pool',()=>{
 for(const key of Object.keys(FORMATIONS))for(let seed=0;seed<30;seed++){
  let d=createDraft(seed,'date','cup');
  for(let round=0;round<11;round++){
   d=drawSquad(d,allSquads,key);const squad=allSquads.find(s=>s.id===d.currentSquadId);
   const candidates=squad.jogadores.filter(p=>!d.picks.some(e=>e.player.id===p.id)&&availableSlots(d,key,p).length).sort((a,b)=>availableSlots(d,key,a).length-availableSlots(d,key,b).length||b.ovr-a.ovr);
   d=confirmPick(d,allSquads,key,candidates[0].id);
  }
  assert.equal(d.picks.length,11);assert.equal(new Set(d.picks.map(p=>p.player.id)).size,11);assert.equal(d.picks.filter(p=>p.slot.position==='GOL').length,1);
 }
});
