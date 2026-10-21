import test from 'node:test';
import assert from 'node:assert/strict';
import { allSquads } from '../data/clubs.js';
import {
  FIFA_OVR_BY_SQUAD, FIFA_RATING_SOURCES, MAX_OVR, RATINGS_VERSION,
  SEASON_RATINGS_BY_SQUAD, applyHistoricalFifaRating,
} from '../data/ratings.js';
import {ARCHIVED_RATINGS_BY_SQUAD} from '../data/fifa-archive-ratings.js';
import {MODERN_RATINGS_BY_SQUAD} from '../data/modern-ratings.js';
import { FORMATIONS, positionFit } from '../js/engine.js';
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
    ['bayern-2013','philipp-lahm',87,'FIFA 13'],
    ['barcelona-2011','david-villa',88,'FIFA 11'],
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
  assert.equal(RATINGS_VERSION,8);
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
      const found=squad.jogadores.find(p=>p.id===id);
      assert.equal(SEASON_RATINGS_BY_SQUAD[squadId]?.[id] ? found.archivedRating.ovr : found.ovr,rating.ovr,`${squadId}/${id} archived rating`);
    }
  }
  for(const [squadId,ratings] of Object.entries(MODERN_RATINGS_BY_SQUAD)){
    const squad=allSquads.find(s=>s.id===squadId);
    assert.ok(squad,`${squadId} is missing`);
    for(const [id,rating] of Object.entries(ratings)){
      assert.match(rating.source,/^https:\/\/(?:sofifa\.com\/player\/\d+\/|www\.fifaindex\.com\/players\/|www\.ea\.com\/games\/ea-sports-fc\/ratings\/player-ratings\/)/,`${squadId}/${id} source`);
      const player=squad.jogadores.find(p=>p.id===id);
      assert.ok(player,`${squadId}/${id} is not in the squad`);
      assert.equal(SEASON_RATINGS_BY_SQUAD[squadId]?.[id] ? player.archivedRating.ovr : player.ovr,rating.ovr,`${squadId}/${id} archived rating`);
    }
  }
});

test('exceptional seasons use the reviewed OVR while keeping original EA ratings separate', () => {
  for (const [squadId,id,ovr] of [
    ['milan-2007','kaka',92],
    ['santos-2010','neymar',86],
    ['santos-2011','neymar',88],
    ['barcelona-2015','neymar',92],
    ['barcelona-2009','lionel-messi',94],
    ['barcelona-2011','lionel-messi',96],
    ['barcelona-2015','lionel-messi',95],
    ['manchester-united-2008','cristiano-ronaldo',94],
    ['manchester-united-2009','cristiano-ronaldo',94],
    ['real-madrid-2014','cristiano-ronaldo',95],
    ['real-madrid-2017','cristiano-ronaldo',94],
    ['inter-2010','wesley-sneijder',91],
    ['bayern-2010','thomas-muller',84],
    ['barcelona-2009','sergio-busquets',82],
  ]) assert.equal(player(squadId,id).ovr,ovr,`${squadId}/${id}`);

  for (const [squadId,ratings] of Object.entries(SEASON_RATINGS_BY_SQUAD)) {
    for (const [id,review] of Object.entries(ratings)) {
      const found=player(squadId,id);
      assert.ok(found,`${squadId}/${id} exists`);
      assert.equal(found.ovr,review.ovr,`${squadId}/${id} reviewed OVR`);
      assert.equal(found.ratingKind,'season-review');
      assert.equal(found.ratingSource,review.source);
      assert.equal(found.ratingReason,review.reason);
      assert.equal(found.ratingEdition,undefined,'Editorial OVR must not be labelled as an official EA rating');
      assert.match(review.source,/^https:\/\/(?:www\.santosfc\.com\.br|www\.uefa\.com|inside\.fifa\.com)\//);
      assert.ok(review.reason.length>30);
      assert.ok(Number.isInteger(review.ovr)&&review.ovr<=96);
      const archive=MODERN_RATINGS_BY_SQUAD[squadId]?.[id]??ARCHIVED_RATINGS_BY_SQUAD[squadId]?.[id];
      const originalOvr=archive?.ovr??FIFA_OVR_BY_SQUAD[squadId]?.[id];
      if(originalOvr!==undefined) {
        assert.equal(found.archivedRating.ovr,originalOvr);
        assert.equal(found.archivedRating.source,archive?.source??FIFA_RATING_SOURCES[squadId]);
        assert.match(found.archivedRating.edition,/^(?:FIFA|FC) \d{2}$/);
      }
    }
  }
});

test('a season correction updates simulation attributes without mutating the input', () => {
  const base={id:'kaka',ovr:80,atributos:{ataque:81,meio:82,defesa:49,finalizacao:74,reflexo:15,posicionamento:77}};
  const original=structuredClone(base);
  const corrected=applyHistoricalFifaRating(base,'milan-2007');
  assert.equal(corrected.ovr,92);
  assert.deepEqual(corrected.atributos,{ataque:93,meio:94,defesa:61,finalizacao:86,reflexo:27,posicionamento:89});
  assert.deepEqual(base,original);
  const previouslyArchived=applyHistoricalFifaRating({...base,ratingEdition:'FIFA 07'},'milan-2007');
  assert.equal(previouslyArchived.ratingEdition,undefined);
  assert.deepEqual(applyHistoricalFifaRating(corrected,'milan-2007'),corrected,'Reapplying does not double the attribute increase');
  const otherSeason=applyHistoricalFifaRating(base,'milan-2003');
  assert.equal(otherSeason,base,'No career-wide bonus is applied to other seasons');
});

test('old draft picks receive the revised star ratings without changing skips or positions', () => {
  for (const [squadId,id,oldOvr,expected] of [
    ['milan-2007','kaka',87,92],
    ['santos-2010','neymar',73,86],
    ['barcelona-2011','lionel-messi',90,96],
    ['manchester-united-2008','cristiano-ronaldo',91,94],
  ]) {
    const latest=player(squadId,id);
    const slot=FORMATIONS['4-3-3'].slots.find(s=>positionFit(latest,s)!==null);
    const draft={seed:42,rngState:70,rerolls:2,seen:[squadId],currentSquadId:squadId,picks:[{player:{...latest,ovr:oldOvr},slot,squadId}]};
    const original=structuredClone(draft),updated=refreshDraftRatings(draft,allSquads);
    assert.equal(updated.picks[0].player.ovr,expected,`${squadId}/${id}`);
    assert.deepEqual({...updated,picks:[]},{...draft,picks:[]});
    assert.equal(updated.picks[0].slot,slot);
    assert.deepEqual(draft,original);
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
