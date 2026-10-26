import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {clubs,allSquads} from '../data/game-squads.js';
import {CLUB_LOGOS} from '../data/club-logos.js';
import {renderDraft,renderPlayerDragPreview} from '../js/ui.js';
import {createDraft} from '../js/draft.js';
import {FORMATIONS,positionFit,POSITION_MAP} from '../js/engine.js';

const root=new URL('../',import.meta.url);
const sources=JSON.parse(fs.readFileSync(new URL('assets/logos/sources.json',root),'utf8'));

test('all 43 clubs have a valid local crest with a recorded source',()=>{
 assert.equal(clubs.length,43);
 for(const club of clubs){
  const src=CLUB_LOGOS[club.id];assert.match(src,/^assets\/logos\/[^/]+\.png$/);
  const bytes=fs.readFileSync(new URL(src,root));assert.ok(bytes.length>400,club.id);
  assert.ok(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),club.id);
  const source=sources.logos.find(source=>source.clubId===club.id);
  assert.ok(source?.source,club.id);assert.equal(src,'assets/logos/'+source.file);
  if(source.sha256)assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256,club.id);
 }
});

test('every era lists attack, midfield, defense and goalkeeper in order without changing its roster',()=>{
 for(const squad of allSquads){
  const original=structuredClone(squad.jogadores);
  const draft={...createDraft(123,'2026-10-22','champions'),currentSquad:squad,currentSquadId:squad.id};
  const html=renderDraft({mode:squad.kind==='national'?'world-cup':'champions',formation:'4-3-3',draft});
  const positions=[...html.matchAll(/<span class="player-avatar">([^<]+)<\/span>/g)].map(match=>match[1]);
  assert.deepEqual([...positions].sort(),squad.jogadores.map(player=>player.tags[0]).sort(),squad.id);
  assert.match(positions.map(tag=>POSITION_MAP[tag]+',').join(''),/^(?:ATA,)*(?:MEI,)*(?:DEF,)*GOL,$/,squad.id);
  assert.deepEqual(squad.jogadores,original,squad.id+' must keep its source order');
  assert.ok(!/assets\/players|data-player-portrait|player-drag-card/.test(html),squad.id);
  for(const player of squad.jogadores){
   const preview=renderPlayerDragPreview({player,squad,hidden:false});
   assert.ok(preview.includes('player-drag-preview'),player.id);
   assert.ok(preview.includes('class="slot-ovr">'+player.ovr+'</span>'),player.id);
   assert.ok(preview.includes('src="'+CLUB_LOGOS[squad.clubId]+'"'),player.id);
   assert.ok(!/assets\/players|data-player-portrait|player-drag-card|drag-player-info|drag-rating/.test(preview),player.id);
  }
 }
});

test('the lightweight drag preview keeps hidden ratings hidden',()=>{
 const squad=allSquads[0],preview=renderPlayerDragPreview({player:squad.jogadores[0],squad,hidden:true});
 assert.ok(preview.includes('class="slot-ovr">??</span>'));
 const main=fs.readFileSync(new URL('js/main.js',root),'utf8');
 assert.ok(!/preloadPlayerPortraits|player-portraits/.test(main));
});

test('the drag marker exactly reuses the field circle, including goalkeepers and hidden OVRs',()=>{
 const formation='4-3-3',squad=allSquads.find(s=>s.id==='bayern-2020');
 for(const player of [squad.jogadores.find(p=>p.tags.includes('GOL')),squad.jogadores.find(p=>p.tags.includes('CA'))]){
  const draft={...createDraft(123,'2026-10-22','champions'),currentSquad:squad,currentSquadId:squad.id,picks:[]};
  const slot=FORMATIONS[formation].slots.find(slot=>positionFit(player,slot)!==null);
  draft.picks=[{player,slot,clubId:squad.clubId,clubName:squad.nome,ano:squad.ano,squadId:squad.id}];
  for(const hidden of [false,true]){
   const preview=renderPlayerDragPreview({player,squad,slot,hidden});
   const circle=preview.match(/<span class="slot-circle [^"]*">[\s\S]*?<\/span><\/span>/)?.[0];
   const field=renderDraft({mode:hidden?'legends':'champions',formation,draft}).match(/<button class="pitch-slot picked[^>]*>[\s\S]*?<\/button>/)?.[0];
   assert.ok(circle);
   assert.equal(circle,field.match(/<span class="slot-circle [^"]*">[\s\S]*?<\/span><\/span>/)[0]);
   assert.equal(circle.includes('goalkeeper'),player.tags.includes('GOL'));
   assert.equal(circle.includes('class="slot-ovr">??</span>'),hidden);
   assert.equal((preview.match(/<img/g)||[]).length,1);
  }
 }
});
