/* Featured European clubs add more variety to the Champions draft.
 * Lineups follow club and competition records; ratings use the shared scale.
 */
import { recalibratePlayer } from './ratings.js?v=recent-club-eras-20261029';

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
const p = (name, tags, ovr, shirt = '', id = slug(name), currentScale = false) => {
  const positions = Array.isArray(tags) ? tags : tags.split('/');
  const profile = profiles[positions[0]];
  const player = { id, nome:name, camisa:String(shirt), tags:positions, ovr,
    atributos:Object.fromEntries(keys.map((key,index)=>[key,clamp(ovr+profile[index])])), destaque:'' };
  return currentScale ? player : recalibratePlayer(player);
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

// Additional seasons use conservative estimates on the current OVR scale.
// Lineups and honors are documented in data/CHAMPIONS-TEMPORADAS.md.
const h = (name,tags,ovr,shirt='',id) => p(name,tags,ovr,shirt,id,true);
const extraSeasons = {
 celtic: [
  season(1970,'Campeão escocês e vice-campeão europeu',[
   h('Evan Williams','GOL',77,1), h('David Hay','LD/VOL',81,2), h('Billy McNeill','ZAG',85,5),
   h('Jim Brogan','ZAG',79,6), h('Tommy Gemmell','LE',84,3), h('Bobby Murdoch','MC',85,4),
   h('Bertie Auld','MC/VOL',82,10), h('Jimmy Johnstone','PD',88,7), h('Willie Wallace','SA/MEI',82,8),
   h('John Hughes','CA/PE',81,9), h('Bobby Lennox','PE/SA',84,11),
  ]),
  season(2003,'Vice-campeão da Copa da UEFA',[
   h('Rab Douglas','GOL',77,20), h('Joos Valgaeren','ZAG',78,5), h('Bobo Baldé','ZAG',80,6),
   h('Johan Mjällby','ZAG/VOL',80,35), h('Didier Agathe','MD/LD',79,17), h('Alan Thompson','ME/LE',81,8),
   h('Paul Lambert','VOL/MC',82,14), h('Neil Lennon','VOL',80,18), h('Stiliyan Petrov','MC/MEI',82,19),
   h('Henrik Larsson','CA/SA',89,7), h('Chris Sutton','CA',82,9),
  ]),
 ],
 marseille: [
  season(1991,'Campeão francês e vice-campeão europeu',[
   h('Pascal Olmeta','GOL',80,1), h('Manuel Amoros','LD/MD',85,2), h('Basile Boli','ZAG',84,4),
   h('Mozer','ZAG',85,5,'carlos-mozer'), h('Bernard Casoni','ZAG',80,7), h('Éric Di Meco','LE/ME',80,3),
   h('Bruno Germain','VOL',79,6), h('Laurent Fournier','MC/MD',80,11), h('Chris Waddle','PD/MEI',88,8),
   h('Abedi Pelé','MEI/PE',87,10), h('Jean-Pierre Papin','CA',91,9),
  ]),
  season(2010,'Campeão francês e da Copa da Liga',[
   h('Steve Mandanda','GOL',84,30), h('Laurent Bonnart','LD',78,24), h('Souleymane Diawara','ZAG',81,21),
   h('Stéphane Mbia','ZAG/VOL',82,17), h('Gabriel Heinze','LE/ZAG',83,19), h('Édouard Cissé','VOL',78,6),
   h('Benoît Cheyrou','MC',81,7), h('Lucho González','MC/MEI',84,8), h('Mathieu Valbuena','PD/MEI',81,28),
   h('Mamadou Niang','PE/CA',84,11), h('Brandão','CA',79,9,'brandao-evaeverson-lemos-da-silva'),
  ]),
 ],
 psv: [
  season(2005,'Dobradinha holandesa e semifinal da Champions',[
   h('Gomes','GOL',82,1,'heurelho-gomes'), h('André Ooijer','LD/ZAG',82,2),
   h('Alex','ZAG',84,4,'alex-rodrigo-dias-da-costa'), h('Wilfred Bouma','ZAG',81,5), h('Lee Young-pyo','LE',81,3),
   h('Mark van Bommel','MC/VOL',86,6), h('Johann Vogel','VOL',80,14), h('Phillip Cocu','MC/VOL',86,8),
   h('Park Ji-sung','PD/MEI/MC',83,7), h('Jefferson Farfán','PE/PD',81,17), h('Jan Vennegoor of Hesselink','CA',81,9),
  ]),
  season(2007,'Campeão holandês e quartas da Champions',[
   h('Gomes','GOL',84,1,'heurelho-gomes'), h('Jan Kromkamp','LD',78,2),
   h('Alex','ZAG',85,4,'alex-rodrigo-dias-da-costa'), h('Manuel da Costa','ZAG',76,14), h('Carlos Salcido','LE/ZAG',80,23),
   h('Timmy Simons','VOL/ZAG',80,6), h('Phillip Cocu','MC/VOL',84,8), h('Edison Méndez','MC/MD',79,16),
   h('Ibrahim Afellay','PD/MEI',80,20), h('Jefferson Farfán','PE/PD',83,17), h('Arouna Koné','CA',80,10),
  ]),
 ],
 roma: [
  season(2001,'Campeã italiana',[
   h('Francesco Antonioli','GOL',82,1), h('Jonathan Zebina','ZAG/LD',78,2), h('Walter Samuel','ZAG',87,19),
   h('Antônio Carlos','ZAG',82,3,'antonio-carlos-zago'), h('Cafu','LD/MD',89,15), h('Vincent Candela','LE/ME',85,32),
   h('Emerson','VOL',86,11,'emerson-ferreira-da-rosa'), h('Damiano Tommasi','MC/VOL',83,17),
   h('Francesco Totti','MEI/SA',91,10), h('Gabriel Batistuta','CA',90,18), h('Vincenzo Montella','CA',86,9),
  ]),
  season(2018,'Semifinalista da Champions League',[
   h('Alisson','GOL',85,1), h('Alessandro Florenzi','LD/MD',82,24), h('Kostas Manolas','ZAG',84,44),
   h('Federico Fazio','ZAG',81,20), h('Juan Jesus','ZAG/LE',77,5), h('Aleksandar Kolarov','LE/ME',83,11),
   h('Daniele De Rossi','VOL',83,16), h('Kevin Strootman','MC/VOL',83,6), h('Radja Nainggolan','MEI/MC',86,4),
   h('Patrik Schick','CA/PD',77,14), h('Edin Džeko','CA',85,9),
  ]),
 ],
};
for(const club of championsAdditions) club.temporadas.push(...extraSeasons[club.id]);
