import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {allSquads} from '../data/clubs.js';
import {VINTAGE_RATINGS_BY_SQUAD} from '../data/vintage-ratings.js';
import {CREATOR_RATINGS_BY_SQUAD} from '../data/creator-ratings.js';
import {IMPORTED_OVR_BY_SQUAD} from '../data/imported-ovr-review.js';
import {applyHistoricalFifaRating} from '../data/ratings.js';
import {FORMATIONS,positionFit} from '../js/engine.js';
import {refreshDraftRatings} from '../js/draft.js';

const vintage=allSquads.filter(s=>s.ano>=1970&&s.ano<1990);
const player=(squad,id)=>allSquads.find(s=>s.id===squad)?.jogadores.find(p=>p.id===id);

test('the vintage review covers the exact 275 players without affecting other eras',()=>{
  assert.equal(vintage.length,25);
  assert.deepEqual(new Set(Object.keys(VINTAGE_RATINGS_BY_SQUAD)),new Set(vintage.map(s=>s.id)));
  for(const s of vintage){
    const reviewed=VINTAGE_RATINGS_BY_SQUAD[s.id];
    assert.equal(Object.keys(reviewed).length,11);
    assert.deepEqual(new Set(Object.keys(reviewed)),new Set(s.jogadores.map(p=>p.id)));
    for(const p of s.jogadores){
      const personal=CREATOR_RATINGS_BY_SQUAD[s.id]?.[p.id];
      assert.equal(p.ovr,personal?.ovr??reviewed[p.id].ovr);
      assert.equal(p.ratingKind,personal?'creator-review':'season-review');
      assert.equal(p.ratingSource,personal?'data/creator-ratings.js':'data/VINTAGE-RATINGS.md');
      assert.equal(p.ratingEdition,undefined);
      if(!personal)assert.match(p.ratingReason,/editorial individual/);
    }
  }
  const base={id:'franz-roth',ovr:84,atributos:{ataque:70,meio:80,defesa:60}};
  const other=applyHistoricalFifaRating(base,'bayern-1975');
  assert.equal(other.ovr,84);assert.deepEqual(other.atributos,base.atributos);
});

test('world greats stay exceptional while regular starters use a lower, varied scale',()=>{
  const legends=[['bayern-1974','franz-beckenbauer',94],['bayern-1974','gerd-muller',94],
    ['ajax-1972','johan-cruyff',95],['napoli-1987','diego-maradona',95],
    ['flamengo-1981','zico',94],['juventus-1985','michel-platini',94],
    ['milan-1989','marco-van-basten',93]];
  for(const [squad,id,ovr] of legends)assert.equal(player(squad,id).ovr,ovr);
  const regulars=[['bayern-1974','rainer-zobel',75],['milan-1989','angelo-colombo',74],
    ['juventus-1985','massimo-briaschi',76],['flamengo-1981','antonio-nunes-lico',76]];
  for(const [squad,id,ovr] of regulars)assert.equal(player(squad,id).ovr,ovr);
  const players=vintage.flatMap(s=>s.jogadores),mean=players.reduce((sum,p)=>sum+p.ovr,0)/players.length;
  assert.ok(mean>=79&&mean<=82,`Vintage mean ${mean}`);
  assert.ok(players.filter(p=>p.ovr>=90).length<players.length*.08);
  assert.ok(new Set(players.map(p=>p.ovr)).size>20);
  // Falcão is reviewed for each season, rather than receiving his career peak everywhere.
  assert.equal(player('internacional-1976','paulo-roberto-falcao').ovr,89);
  assert.equal(player('roma-1983','paulo-roberto-falcao').ovr,90);
  // Already modestly rated players are not subjected to another decade-wide reduction.
  assert.equal(player('psv-1988','edward-linskens').ovr,70);
});

test('the before/after audit has 250 reductions, no increases and all personal edits intact',()=>{
  const audit=JSON.parse(fs.readFileSync(new URL('../data/release-rating-audit.json',import.meta.url),'utf8'));
  const rows=audit.rows.filter(row=>row.reviewSource==='data/VINTAGE-RATINGS.md');
  assert.equal(rows.length,275);
  assert.equal(rows.filter(row=>row.currentOvr<row.previousOvr).length,250);
  for(const row of rows){
    assert.ok(row.currentOvr<=row.previousOvr);
    assert.equal(player(row.squadId,row.playerId).ovr,row.creatorOvr??row.currentOvr);
    assert.ok(row.year>=1970&&row.year<1990);
  }
  let personal=0;
  for(const [squad,ratings]of Object.entries(CREATOR_RATINGS_BY_SQUAD))for(const [id,review]of Object.entries(ratings)){
    personal++;assert.equal(player(squad,id).ovr,IMPORTED_OVR_BY_SQUAD[squad]?.[id]?.ovr??review.ovr);
    assert.equal(player(squad,id).ratingKind,'creator-review');
  }
  assert.equal(personal,92);
});

test('lowered vintage ratings update simulation attributes and saved picks without losing progress',()=>{
  const base={id:'rainer-zobel',ovr:82,atributos:{ataque:66,meio:81,defesa:76,finalizacao:63,reflexo:20,posicionamento:78}};
  const original=structuredClone(base),updated=applyHistoricalFifaRating(base,'bayern-1974');
  assert.equal(updated.ovr,75);
  for(const [key,value]of Object.entries(base.atributos))assert.equal(updated.atributos[key],value-7);
  assert.deepEqual(base,original);
  assert.deepEqual(applyHistoricalFifaRating(updated,'bayern-1974'),updated);
  const latest=player('bayern-1974','rainer-zobel'),slot=FORMATIONS['4-3-3'].slots.find(s=>positionFit(latest,s)!==null);
  const draft={seed:42,rngState:77,rerolls:2,seen:['bayern-1974'],currentSquadId:'bayern-1974',picks:[{player:base,slot,squadId:'bayern-1974'}]};
  const refreshed=refreshDraftRatings(draft,allSquads);
  assert.deepEqual(refreshed.picks[0].player,latest);
  assert.deepEqual({...refreshed,picks:[]},{...draft,picks:[]});
  assert.deepEqual(draft.picks[0].player,base);
});
