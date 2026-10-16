import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {clubs,allSquads} from '../data/clubs.js';
import {CLUB_LOGOS} from '../data/club-logos.js';
import {PLAYER_PORTRAITS} from '../data/player-portraits.js';
import {playerPortrait} from '../js/player-portraits.js';
import {renderDraft,renderPlayerDragCard} from '../js/ui.js';
import {createDraft} from '../js/draft.js';
const root=new URL('../',import.meta.url);
const sources=JSON.parse(fs.readFileSync(new URL('assets/players/sources.json',root),'utf8'));
const logoSources=JSON.parse(fs.readFileSync(new URL('assets/logos/sources.json',root),'utf8'));
const missing=JSON.parse(fs.readFileSync(new URL('assets/players/missing.json',root),'utf8'));
const framing=JSON.parse(fs.readFileSync(new URL('assets/players/framing.json',root),'utf8'));
const players=[...new Map(allSquads.flatMap(s=>s.jogadores.map(p=>[p.id,p]))).values()];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function assertImage(file){
 assert.match(file,/^assets\/(?:players|logos)\/[^/]+\.(?:png|jpe?g|webp)$/);
 const bytes=fs.readFileSync(new URL(file,root));
 assert.ok(bytes.length>400,file);
 const valid=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
  ||(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)
  ||(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP');
 assert.ok(valid,'Arquivo não é imagem: '+file);return bytes;
}
test('os 40 clubes têm escudos locais válidos e a fonte registrada',()=>{
 for(const club of clubs){
  const src=CLUB_LOGOS[club.id];const bytes=assertImage(src);
  const source=logoSources.logos.find(s=>s.clubId===club.id);
  assert.ok(source?.source,club.id);
  assert.equal(src,'assets/logos/'+source.file);
  if(source.sha256)assert.equal(hash(bytes),source.sha256,club.id);
 }
});
test('todas as pessoas têm uma foto local íntegra, sem depender de URL externa ou fallback',()=>{
 assert.deepEqual(missing,[]);
 for(const player of players)assert.ok(playerPortrait(player.id),player.id);
 for(const [id,portrait] of Object.entries(PLAYER_PORTRAITS)){
  const source=sources.players[id];assert.ok(source?.source,id);
  assert.equal(portrait.src,source.file,id);
  assert.equal(hash(assertImage(portrait.src)),source.sha256,id);
 }
});
test('todos os retratos têm janela de rosto e pescoço ligada ao arquivo correto',()=>{
 for(const [id,portrait] of Object.entries(PLAYER_PORTRAITS)){
  const verified=framing.players[id],frame=portrait.frame,face=verified?.face;
  assert.ok(frame&&face,id);
  assert.equal(verified.sourceHash,sources.players[id].sha256,id);
  const eps=.0001;
  assert.ok(face.x>=frame.x-eps&&face.y>=frame.y-eps&&face.x+face.width<=frame.x+frame.width+eps&&face.y+face.height<=frame.y+frame.height+eps,'Rosto cortado: '+id);
  assert.ok(frame.y+frame.height<=face.y+face.height*1.26+eps,'Corpo abaixo do pescoço: '+id);
 }
});
test('a lista mostra posições e as fotos ficam nos cartões ao arrastar',()=>{
 for(const squad of allSquads){
  const draft={...createDraft(123,'2026-10-16','champions'),currentSquad:squad,currentSquadId:squad.id};
  const html=renderDraft({mode:'champions',formation:'4-3-3',draft});
  const shown=[...html.matchAll(/<span class="player-avatar">([^<]+)<\/span>/g)].map(m=>m[1]);
  assert.deepEqual(shown,squad.jogadores.map(p=>p.tags[0]),squad.id);
  assert.ok(!html.includes('data-avatar-portrait'),squad.id);
 }
 for(const player of players){
  const card=renderPlayerDragCard({player,squad:allSquads[0],hidden:false});
  assert.ok(card.includes('src="'+playerPortrait(player.id).src+'"'),player.id);
  assert.ok(card.includes('class="face-framed"')&&card.includes('--portrait-x:'),player.id);
 }
});
test('um save antigo de Mancini conserva a foto da mesma pessoa',()=>{
 assert.equal(playerPortrait('mancini'),playerPortrait('amantino-mancini'));
});
