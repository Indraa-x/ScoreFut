import test from 'node:test';
import assert from 'node:assert/strict';
import { allSquads } from '../data/clubs.js';
import { BALLON_DOR_WINNERS, MAX_OVR, NON_WINNER_OVR_CAP } from '../data/ratings.js';
import { FORMATIONS } from '../js/engine.js';
import { refreshDraftRatings } from '../js/draft.js';

const players = allSquads.flatMap(s => s.jogadores);
const player = (squadId, id) => allSquads.find(s=>s.id===squadId).jogadores.find(p=>p.id===id);

test('the historical pool separates support players, starters and exceptional stars', () => {
  const mean = players.reduce((sum,p)=>sum+p.ovr,0)/players.length;
  assert.ok(mean>=80 && mean<=86, `Average OVR ${mean}`);
  assert.ok(players.filter(p=>p.ovr<80).length>=players.length*.2);
  assert.ok(players.filter(p=>p.ovr>=90).length<=players.length*.3);
  assert.ok(players.every(p=>Number.isInteger(p.ovr)&&p.ovr>=70&&p.ovr<=MAX_OVR));
  assert.ok(players.every(p=>p.ovr<=NON_WINNER_OVR_CAP||BALLON_DOR_WINNERS.has(p.id)));
  assert.ok(players.every(p=>Object.values(p.atributos).every(a=>Number.isInteger(a)&&a>=1&&a<=99)));
});

test('only Ballon d’Or winners in their prime can reach 96; other elites cap at 94', () => {
  for (const [squad,id,ovr] of [
    ['barcelona-2011','lionel-messi',96],
    ['real-madrid-2017','cristiano-ronaldo',96],
    ['milan-2007','kaka',96],
    ['inter-1998','ronaldo',96],
    ['real-madrid-2002','zinedine-zidane',96],
    ['real-madrid-2017','luka-modric',96],
    ['manchester-city-2024','rodri',96],
    ['psg-2025','ousmane-dembele',96],
    ['arsenal-2004','thierry-henry',94],
    ['vasco-2000','romario',94],
    ['manchester-city-2023','erling-haaland',94],
    ['napoli-1990','diego-maradona',96],
    ['liverpool-2025','mohamed-salah',94],
    ['chelsea-2012','frank-lampard',93],
    ['chelsea-2012','petr-cech',94],
  ]) assert.equal(player(squad,id).ovr,ovr,`${squad}/${id}`);
});

test('ordinary starters are separated from legends and their attributes use the new OVR', () => {
  assert.equal(player('chelsea-2012','juan-mata').ovr,86);
  assert.equal(player('chelsea-2012','ramires').ovr,81);
  assert.equal(player('chelsea-2012','gary-cahill').ovr,81);
  assert.equal(player('inter-2024','lautaro-martinez').ovr,91);
  const defender=player('chelsea-2012','gary-cahill');
  assert.equal(defender.atributos.defesa,defender.ovr+1);
  const midfielder=player('chelsea-2012','juan-mata');
  assert.equal(midfielder.atributos.meio,midfielder.ovr+1);
});

test('a saved draft refreshes the exact edition and keeps picks, slots, draws and seed intact', () => {
  const latest=player('inter-2024','lautaro-martinez');
  const slot=FORMATIONS['4-3-3'].slots.find(s=>s.id==='ca');
  const draft={seed:42,rngState:70,rerolls:2,seen:['inter-2024'],currentSquadId:'chelsea-2012',selectedId:null,picks:[{player:{...latest,ovr:96},slot,squadId:'inter-2024',clubId:'inter',clubName:'Inter de Milão',ano:2024}]};
  const original=structuredClone(draft),updated=refreshDraftRatings(draft,allSquads);
  assert.equal(updated.picks[0].player.ovr,91);
  assert.equal(updated.picks[0].slot,slot);
  assert.deepEqual({...updated,picks:[]},{...draft,picks:[]});
  assert.deepEqual({...updated.picks[0],player:null},{...draft.picks[0],player:null});
  assert.deepEqual(draft,original);
});
