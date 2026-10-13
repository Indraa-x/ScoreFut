/* Four featured European editions add more variety to the Champions draft.
 * Their lineups follow UEFA match records; ratings and attributes remain editorial.
 */
import { recalibratePlayer } from './ratings.js';

const clamp = value => Math.max(1, Math.min(99, Math.round(value)));
const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const profiles = {
  GOL: [-61,-48,-5,-69,1,-1], ZAG: [-28,-19,1,-34,-64,0],
  LD: [-12,-6,-2,-24,-65,-2], LE: [-12,-6,-2,-24,-65,-2],
  VOL: [-14,0,-3,-21,-66,-2], MC: [-7,1,-15,-14,-66,-3],
  MEI: [-1,1,-30,-8,-67,-2], MD: [-3,0,-25,-11,-67,-3], ME: [-3,0,-25,-11,-67,-3],
  PE: [1,-8,-38,-3,-68,-2], PD: [1,-8,-38,-3,-68,-2],
  SA: [1,-9,-37,0,-68,-1], CA: [1,-22,-42,2,-68,0],
};
const keys = ['ataque','meio','defesa','finalizacao','reflexo','posicionamento'];
const p = (name, tags, ovr, shirt = '') => {
  const positions = Array.isArray(tags) ? tags : tags.split('/');
  const profile = profiles[positions[0]];
  const player = { id:slug(name), nome:name, camisa:String(shirt), tags:positions, ovr,
    atributos:Object.fromEntries(keys.map((key,index)=>[key,clamp(ovr+profile[index])])), destaque:'' };
  return recalibratePlayer(player);
};
const season = (ano, conquistas, jogadores) => ({ano,conquistas,jogadores});
const club = (id,nome,monograma,cores,ano,conquistas,jogadores) => ({id,nome,monograma,cores,temporadas:[season(ano,conquistas,jogadores)]});

export const championsAdditions = [
  club('celtic','Celtic','CEL',['#008b5a','#ffffff'],1967,'Campeão da Copa dos Campeões da Europa',[
    p('Ronnie Simpson',['GOL'],84), p('Jim Craig',['LD'],82), p('Billy McNeill',['ZAG'],86),
    p('John Clark',['ZAG'],83), p('Tommy Gemmell',['LE'],87), p('Bertie Auld',['VOL'],84),
    p('Bobby Murdoch',['MC'],87), p('Jimmy Johnstone',['PD'],90), p('Willie Wallace',['ME'],84),
    p('Steve Chalmers',['CA'],84), p('Bobby Lennox',['PE','SA'],85),
  ]),
  club('marseille','Olympique de Marseille','OM',['#1599d0','#ffffff'],1993,'Campeão da Champions League',[
    p('Fabien Barthez',['GOL'],90), p('Jocelyn Angloma',['LD'],87), p('Basile Boli',['ZAG'],87),
    p('Marcel Desailly',['ZAG','VOL'],91), p('Éric Di Meco',['LE'],83), p('Jean-Jacques Eydelie',['VOL'],80),
    p('Franck Sauzée',['MC'],89), p('Didier Deschamps',['VOL','MC'],89), p('Abedi Pelé',['MEI','PE'],90),
    p('Alen Bokšić',['CA'],90), p('Rudi Völler',['CA'],89),
  ]),
  club('psv','PSV Eindhoven','PSV',['#ed1c24','#ffffff'],1988,'Campeão da Copa dos Campeões da Europa',[
    p('Hans van Breukelen',['GOL'],90), p('Eric Gerets',['LD'],89), p('Ivan Nielsen',['ZAG'],84),
    p('Ronald Koeman',['ZAG'],92), p('Jan Heintze',['LE'],82), p('Søren Lerby',['VOL'],87),
    p('Berry van Aerle',['MD','LD'],83), p('Gerald Vanenburg',['MEI','MD'],89), p('Edward Linskens',['MC'],80),
    p('Wim Kieft',['CA'],87), p('Hans Gillhaus',['CA'],80),
  ]),
  club('roma','Roma','ROM',['#8f1d36','#f5a432'],2007,'Quartas de final da Champions League',[
    p('Doni',['GOL'],84), p('Marco Cassetti',['LD'],83), p('Philippe Mexès',['ZAG'],87),
    p('Christian Panucci',['ZAG','LD'],88), p('Cristian Chivu',['LE','ZAG'],87), p('Daniele De Rossi',['VOL'],91),
    p('Simone Perrotta',['MC','MEI'],87), p('Rodrigo Taddei',['MEI','MD'],85), p('Christian Wilhelmsson',['MD','PD'],82),
    p('Mancini',['PE','SA'],88), p('Francesco Totti',['CA','SA'],94),
  ]),
];
