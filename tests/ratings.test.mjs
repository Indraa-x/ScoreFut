import test from 'node:test';
import assert from 'node:assert/strict';
import { allSquads } from '../data/clubs.js';
import {
  FIFA_OVR_BY_SQUAD, FIFA_RATING_SOURCES, MAX_OVR, RATINGS_VERSION,
} from '../data/ratings.js';
import {ARCHIVED_RATINGS_BY_SQUAD} from '../data/fifa-archive-ratings.js';
import {MODERN_RATINGS_BY_SQUAD} from '../data/modern-ratings.js';
import { FORMATIONS } from '../js/engine.js';
import { refreshDraftRatings } from '../js/draft.js';

const players = allSquads.flatMap(s => s.jogadores);
const player = (squadId, id) => allSquads.find(s=>s.id===squadId).jogadores.find(p=>p.id===id);

test('historical ratings no longer cluster at 94', () => {
  const mean = players.reduce((sum,p)=>sum+p.ovr,0)/players.length;
  assert.ok(mean>=77 && mean<=82, `Average OVR ${mean}`);
  assert.ok(players.filter(p=>p.ovr<80).length>=players.length*.2);
  assert.ok(players.filter(p=>p.ovr>=90).length<=players.length*.1);
  assert.ok(players.filter(p=>p.ovr>=94).length<=players.length*.01);
  assert.ok(players.every(p=>Number.isInteger(p.ovr)&&p.ovr>=40&&p.ovr<=MAX_OVR));
  assert.ok(players.every(p=>Object.values(p.atributos).every(a=>Number.isInteger(a)&&a>=1&&a<=99)));
});

test('ratings backed by an archived FIFA edition match the published OVR', () => {
  for (const [squad,id,ovr,edition] of [
    ['arsenal-2006','thierry-henry',92,'FIFA 06'],
    ['bayern-2013','franck-ribery',90,'FIFA 13'],
    ['barcelona-2011','lionel-messi',90,'FIFA 11'],
    ['barcelona-2011','xavi',87,'FIFA 11'],
    ['real-madrid-2017','cristiano-ronaldo',94,'FIFA 17'],
    ['real-madrid-2017','toni-kroos',88,'FIFA 17'],
    ['real-madrid-2017','luka-modric',89,'FIFA 17'],
    ['liverpool-2019','virgil-van-dijk',89,'FIFA 19'],
    ['liverpool-2019','mohamed-salah',89,'FIFA 19'],
    ['liverpool-2019','alisson',87,'FIFA 19'],
    ['liverpool-2020','virgil-van-dijk',91,'FIFA 20'],
    ['liverpool-2020','alisson',90,'FIFA 20'],
    ['chelsea-2021','ngolo-kante',88,'FIFA 21'],
    ['chelsea-2021','kai-havertz',85,'FIFA 21'],
    ['manchester-city-2021','kevin-de-bruyne',91,'FIFA 21'],
    ['manchester-city-2021','oleksandr-zinchenko',80,'FIFA 21'],
    ['chelsea-2012','juan-mata',86,'FIFA 12'],
    ['chelsea-2012','frank-lampard',84,'FIFA 12'],
    ['manchester-city-2023','erling-haaland',90,'FIFA 23'],
    ['manchester-city-2024','rodri',90,'FC 24'],
    ['liverpool-2025','virgil-van-dijk',90,'FC 25'],
  ]) {
    const found=player(squad,id);
    assert.equal(found.ovr,ovr,`${squad}/${id}`);
    assert.equal(found.ratingEdition,edition,`${squad}/${id} edition`);
    assert.equal(found.ratingSource,MODERN_RATINGS_BY_SQUAD[squad]?.[id]?.source??ARCHIVED_RATINGS_BY_SQUAD[squad]?.[id]?.source??FIFA_RATING_SOURCES[squad],`${squad}/${id} source`);
  }
  assert.equal(RATINGS_VERSION,7);
});

test('ratings from FIFA 21 through FC 26 use the exact player and edition source',()=>{
  for(const [squadId,id,ovr,edition] of [
    ['manchester-city-2021','kevin-de-bruyne',91,'FIFA 21'],
    ['manchester-city-2023','erling-haaland',90,'FIFA 23'],
    ['napoli-2023','victor-osimhen',83,'FIFA 23'],
    ['liverpool-2025','mohamed-salah',91,'FC 25'],
    ['tottenham-2025','dejan-kulusevski',84,'FC 25'],
  ]) {
    const selectedSquad=allSquads.find(s=>s.id===squadId);
    const found=selectedSquad.jogadores.find(p=>p.id===id);
    const exact=MODERN_RATINGS_BY_SQUAD[squadId][id];
    assert.equal(found.ovr,ovr,`${squadId}/${id}`);
    assert.equal(found.ratingEdition,edition,`${squadId}/${id} edition`);
    assert.equal(found.ratingSource,exact.source,`${squadId}/${id} source`);
    assert.match(found.ratingSource,/^https:\/\/(?:sofifa\.com\/player\/|www\.fifaindex\.com\/players\/|www\.ea\.com\/games\/ea-sports-fc\/ratings\/player-ratings\/)/);
  }
});

test('every imported exact OVR has a source and names a player in that squad', () => {
  assert.deepEqual(
    Object.keys(FIFA_OVR_BY_SQUAD).sort(),
    Object.keys(FIFA_RATING_SOURCES).sort(),
  );
  for (const [squadId,ratings] of Object.entries(FIFA_OVR_BY_SQUAD)) {
    assert.match(FIFA_RATING_SOURCES[squadId],/^https:\/\/fifaindex\.com\//,squadId);
    const squad=allSquads.find(s=>s.id===squadId);
    for (const id of Object.keys(ratings)) {
      assert.ok(squad.jogadores.some(p=>p.id===id),`${squadId}/${id} is not in the squad`);
    }
  }
  for(const [squadId,ratings] of Object.entries(ARCHIVED_RATINGS_BY_SQUAD)){
    const squad=allSquads.find(s=>s.id===squadId);
    assert.ok(squad,`${squadId} is missing`);
    for(const [id,rating] of Object.entries(ratings)){
      assert.match(rating.source,/^https:\/\/www\.fifaindex\.com\/player\//,`${squadId}/${id} source`);
      assert.ok(squad.jogadores.some(p=>p.id===id),`${squadId}/${id} is not in the squad`);
      assert.equal(squad.jogadores.find(p=>p.id===id).ovr,rating.ovr,`${squadId}/${id} rating`);
    }
  }
  for(const [squadId,ratings] of Object.entries(MODERN_RATINGS_BY_SQUAD)){
    const squad=allSquads.find(s=>s.id===squadId);
    assert.ok(squad,`${squadId} is missing`);
    for(const [id,rating] of Object.entries(ratings)){
      assert.match(rating.source,/^https:\/\/(?:sofifa\.com\/player\/\d+\/|www\.fifaindex\.com\/players\/|www\.ea\.com\/games\/ea-sports-fc\/ratings\/player-ratings\/)/,`${squadId}/${id} source`);
      const player=squad.jogadores.find(p=>p.id===id);
      assert.ok(player,`${squadId}/${id} is not in the squad`);
      assert.equal(player.ovr,rating.ovr,`${squadId}/${id} rating`);
    }
  }
});

test('each archived edition uses the same year as its ScoreFut season', () => {
  for (const [squadId,source] of Object.entries(FIFA_RATING_SOURCES)) {
    const seasonYear=Number(squadId.match(/-(\d{4})$/)?.[1])%100;
    const editionYear=Number(source.match(/(?:fifa|fc)(\d{2})$/)?.[1]);
    assert.equal(editionYear,seasonYear,`${squadId} must use its same-year FIFA/FC edition`);
  }
  assert.equal(FIFA_RATING_SOURCES['arsenal-2004'],undefined);
});

test('unarchived seasons use an explicit editorial fallback, without the old 94 ceiling', () => {
  const unarchived=player('real-madrid-2002','zinedine-zidane');
  assert.equal(unarchived.ovr,91);
  assert.equal(unarchived.ratingSource,undefined);
  const recentUnarchived=player('inter-2024','lautaro-martinez');
  assert.equal(recentUnarchived.ratingSource,undefined);
});

test('a saved draft refreshes the current season OVR and keeps its state intact', () => {
  const latest=player('inter-2024','lautaro-martinez');
  const slot=FORMATIONS['4-3-3'].slots.find(s=>s.id==='ca');
  const draft={seed:42,rngState:70,rerolls:2,seen:['inter-2024'],currentSquadId:'chelsea-2012',selectedId:null,picks:[{player:{...latest,ovr:96},slot,squadId:'inter-2024',clubId:'inter',clubName:'Inter de Milão',ano:2024}]};
  const original=structuredClone(draft),updated=refreshDraftRatings(draft,allSquads);
  assert.equal(updated.picks[0].player.ovr,89);
  assert.equal(updated.picks[0].slot,slot);
  assert.deepEqual({...updated,picks:[]},{...draft,picks:[]});
  assert.deepEqual({...updated.picks[0],player:null},{...draft.picks[0],player:null});
  assert.deepEqual(draft,original);
});
