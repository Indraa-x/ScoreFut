import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {clubs,allSquads} from '../data/game-squads.js';import {EUROPE_CLUB_IDS,squadsForMode} from '../data/competitions.js';import {CLUB_LOGOS} from '../data/club-logos.js';
import {squadTeam,positionFit} from '../js/engine.js';import {createDraft,drawSquad,refreshDraftRatings} from '../js/draft.js';
test('Leverkusen replaces Celtic with five complete eligible eras and a local crest',()=>{
 assert.equal(clubs.length,43);assert.equal(allSquads.length,370);assert.ok(!clubs.some(c=>c.id==='celtic'));assert.ok(!allSquads.some(s=>s.clubId==='celtic'));
 assert.ok(EUROPE_CLUB_IDS.includes('leverkusen'));assert.ok(!EUROPE_CLUB_IDS.includes('celtic'));
 const eras=allSquads.filter(s=>s.clubId==='leverkusen');assert.deepEqual(eras.map(s=>s.ano),[1988,2002,2011,2015,2024]);
 for(const s of eras){const team=squadTeam(s);assert.equal(team.lineup.length,11);assert.equal(new Set(team.lineup.map(p=>p.player.id)).size,11);for(const pick of team.lineup)assert.notEqual(positionFit(pick.player,pick.slot),null);
  assert.equal(squadsForMode(allSquads,'copa-do-brasil').some(x=>x.id===s.id),false);
  assert.equal(drawSquad(createDraft(3,'date','champions'),squadsForMode(allSquads,'champions').filter(x=>x.id===s.id),team.formation).currentSquadId,s.id);
  for(const p of s.jogadores){assert.equal(p.ratingKind,s.ano<2005?'editorial-estimate':'release-rating');if(s.ano>=2005){assert.equal(p.releaseRating.releaseYear,s.ano);assert.equal(p.releaseRating.ovr,p.ovr);assert.equal(p.releaseRating.eaId,p.eaId);}}
 }
 const data=fs.readFileSync(new URL('../'+CLUB_LOGOS.leverkusen,import.meta.url));assert.ok(data.length>400);assert.equal(data.subarray(1,4).toString(),'PNG');
});
test('newly added stars use canonical person IDs and Celtic saves remain readable',()=>{
 const lever=allSquads.filter(s=>s.clubId==='leverkusen');
 for(const s of lever)for(const p of s.jogadores){if(!p.eaId)continue;for(const same of allSquads.flatMap(t=>t.jogadores).filter(t=>(t.eaId??t.releaseRating?.eaId)===p.eaId))assert.equal(same.id,p.id);}
 const before={...createDraft(1,'date','champions'),picks:[{squadId:'celtic-2003',player:{id:'henrik-larsson',ovr:85},slot:{id:'ca'}}]};assert.deepEqual(refreshDraftRatings(before,allSquads),before);assert.equal(CLUB_LOGOS.celtic,'assets/logos/celtic.png');
});
