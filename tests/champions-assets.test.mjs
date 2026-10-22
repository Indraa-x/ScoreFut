import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {clubs,allSquads} from '../data/clubs.js';
import {CLUB_LOGOS} from '../data/club-logos.js';
import {renderDraft,renderPlayerDragPreview} from '../js/ui.js';
import {createDraft} from '../js/draft.js';

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

test('every era renders positions and ratings without requiring player faces or cards',()=>{
 for(const squad of allSquads){
  const draft={...createDraft(123,'2026-10-22','champions'),currentSquad:squad,currentSquadId:squad.id};
  const html=renderDraft({mode:'champions',formation:'4-3-3',draft});
  const positions=[...html.matchAll(/<span class="player-avatar">([^<]+)<\/span>/g)].map(match=>match[1]);
  assert.deepEqual(positions,squad.jogadores.map(player=>player.tags[0]),squad.id);
  assert.ok(!/assets\/players|data-player-portrait|player-drag-card/.test(html),squad.id);
  for(const player of squad.jogadores){
   const preview=renderPlayerDragPreview({player,squad,hidden:false});
   assert.ok(preview.includes('player-drag-preview'),player.id);
   assert.ok(preview.includes('>'+player.ovr+'<small>OVR</small>'),player.id);
   assert.ok(!/<img|data-player-portrait|class="player-drag-card/.test(preview),player.id);
  }
 }
});

test('the lightweight drag preview keeps hidden ratings hidden',()=>{
 const squad=allSquads[0],preview=renderPlayerDragPreview({player:squad.jogadores[0],squad,hidden:true});
 assert.ok(preview.includes('>??<small>OVR</small>'));
 const main=fs.readFileSync(new URL('js/main.js',root),'utf8');
 assert.ok(!/preloadPlayerPortraits|player-portraits/.test(main));
});
