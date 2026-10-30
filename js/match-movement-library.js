import {hashSeed,mulberry32} from './engine.js?v=set-piece-goals-20261030';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const aliases={GK:'GOL',CB:'ZAG',RB:'LD',LB:'LE',CDM:'VOL',DM:'VOL',CM:'MC',CAM:'MEI',AM:'MEI',RM:'MD',LM:'ME',LW:'PE',RW:'PD',ST:'CA',SS:'SA'};
const exact=new Set(['GOL','ZAG','LD','LE','VOL','MC','MEI','MD','ME','PE','PD','SA','CA']);
export function movementRole(entry){
  const normalize=value=>aliases[value]||value;
  const label=normalize(entry.slot.label);
  if(exact.has(label))return label;
  const position=normalize(entry.slot.position);
  if(!['DEF','MEI','ATA'].includes(position)&&exact.has(position))return position;
  return (entry.player.tags||[]).map(normalize).find(tag=>exact.has(tag))||({DEF:'ZAG',MEI:'MC',ATA:'CA'}[position])||'MC';
}

// Local paths: forward toward the opponent goal, lateral toward the player's wing.
// These are football runs, not random displacement applied to every shirt.
export const MOVEMENT_PATHS=Object.freeze({
  hold:[[0,0],[1,1],[0,-1],[0,0]],
  openBuildUp:[[0,0],[-3,5],[2,9],[1,3]],
  stepOut:[[0,0],[7,-2],[11,-4],[2,0]],
  recycle:[[0,0],[-5,-4],[-3,5],[1,1]],
  overlap:[[0,0],[4,5],[17,8],[23,5],[6,0]],
  underlap:[[0,0],[2,-6],[16,-13],[21,-8],[4,0]],
  wingSupport:[[0,0],[7,3],[12,7],[3,3]],
  invert:[[0,0],[5,-12],[10,-17],[3,-6]],
  offerShort:[[0,0],[-6,-4],[-9,3],[3,1]],
  thirdMan:[[0,0],[-3,4],[6,-3],[17,-8],[3,0]],
  boxToBox:[[0,0],[5,5],[18,-3],[11,-8],[-3,0]],
  halfSpace:[[0,0],[3,-7],[11,-11],[8,-5],[1,0]],
  triangle:[[0,0],[-4,7],[5,11],[7,-2],[0,0]],
  anchor:[[0,0],[-4,-3],[1,5],[3,-3],[0,0]],
  touchline:[[0,0],[5,5],[15,9],[21,7],[4,3]],
  cutInside:[[0,0],[4,5],[12,-8],[19,-18],[6,-4]],
  diagonal:[[0,0],[-2,5],[10,-9],[23,-15],[6,-3]],
  blindSide:[[0,0],[-4,7],[7,10],[19,-7],[5,-3]],
  comeShort:[[0,0],[-12,-5],[-7,5],[6,2],[0,0]],
  channel:[[0,0],[4,9],[17,15],[21,9],[3,3]],
  nearPost:[[0,0],[2,-5],[15,-9],[21,-3],[5,1]],
  farPost:[[0,0],[-2,8],[13,14],[20,5],[5,0]],
  oneTwo:[[0,0],[-5,-4],[3,3],[17,-7],[4,0]],
  pinLine:[[0,0],[4,-4],[7,5],[4,8],[1,0]],
  track:[[0,0],[-5,-3],[-9,3],[-4,1],[0,0]],
  cover:[[0,0],[-5,-6],[-8,-10],[-3,-4],[0,0]],
  intercept:[[0,0],[5,-7],[8,-4],[-3,-2],[0,0]],
  stepPress:[[0,0],[8,-4],[11,2],[-5,0],[0,0]],
  recovery:[[0,0],[-11,4],[-15,-3],[-5,-1],[0,0]],
  screen:[[0,0],[-2,-6],[-4,6],[1,3],[0,0]],
  curvePress:[[0,0],[4,8],[11,4],[8,-5],[-3,0]],
  keeperSupport:[[0,0],[3,-4],[5,3],[1,0]],
  keeperSweep:[[0,0],[3,2],[8,-2],[2,0]],
  keeperSet:[[0,0],[1,-3],[0,3],[-1,0]],
  keeperNearPost:[[0,0],[-1,4],[2,6],[0,0]],
});

const pools={
  GOL:{attack:['keeperSupport','keeperSweep','keeperSet'],defend:['keeperSet','keeperNearPost','keeperSweep']},
  ZAG:{attack:['openBuildUp','stepOut','recycle','hold'],defend:['cover','intercept','track','stepPress']},
  LD:{attack:['overlap','underlap','wingSupport','invert','recycle'],defend:['recovery','track','cover','stepPress']},
  LE:{attack:['overlap','underlap','wingSupport','invert','recycle'],defend:['recovery','track','cover','stepPress']},
  VOL:{attack:['anchor','offerShort','triangle','thirdMan','recycle'],defend:['screen','intercept','cover','stepPress']},
  MC:{attack:['boxToBox','triangle','thirdMan','offerShort','halfSpace'],defend:['screen','track','intercept','curvePress']},
  MEI:{attack:['halfSpace','oneTwo','comeShort','thirdMan','boxToBox'],defend:['curvePress','screen','track','stepPress']},
  ME:{attack:['touchline','underlap','halfSpace','triangle','farPost'],defend:['recovery','track','screen','curvePress']},
  MD:{attack:['touchline','underlap','halfSpace','triangle','farPost'],defend:['recovery','track','screen','curvePress']},
  PE:{attack:['touchline','cutInside','diagonal','comeShort','farPost','oneTwo'],defend:['curvePress','recovery','track','screen']},
  PD:{attack:['touchline','cutInside','diagonal','comeShort','farPost','oneTwo'],defend:['curvePress','recovery','track','screen']},
  SA:{attack:['comeShort','oneTwo','blindSide','halfSpace','channel'],defend:['curvePress','screen','stepPress','track']},
  CA:{attack:['blindSide','channel','nearPost','farPost','comeShort','pinLine','oneTwo'],defend:['curvePress','screen','stepPress','track']},
};
const preferences={
  sweeper:['keeperSweep','keeperSupport'],safeKeeper:['keeperSet','keeperNearPost'],
  ballPlaying:['stepOut','openBuildUp','intercept'],stopper:['hold','cover','stepPress'],
  attackingFullback:['overlap','underlap','invert'],balancedFullback:['wingSupport','recycle','track'],
  anchor:['anchor','screen','recycle'],creator:['triangle','offerShort','halfSpace','comeShort'],
  boxToBox:['boxToBox','thirdMan','intercept'],dribbler:['cutInside','oneTwo','halfSpace'],
  wideRunner:['touchline','diagonal','farPost'],poacher:['blindSide','nearPost','farPost'],
  falseNine:['comeShort','oneTwo','halfSpace'],target:['pinLine','channel','nearPost'],
};

/** Style is inferred from existing game attributes and tags; no invented speed stat. */
export function movementProfile(entry){
  const role=movementRole(entry),player=entry.player;
  const rng=mulberry32(hashSeed(`${player.id||player.nome}:${role}:movement-v2`));
  const stat=name=>{const value=Number(player.atributos?.[name]??player.ovr??70);return clamp(Number.isFinite(value)?value:70,1,99);};
  const attack=stat('ataque'),mid=stat('meio'),defense=stat('defesa'),finish=stat('finalizacao');
  const tags=player.tags||[];
  let style;
  if(role==='GOL')style=mid>42||tags.includes('VOL')?'sweeper':'safeKeeper';
  else if(role==='ZAG')style=mid>defense-7?'ballPlaying':'stopper';
  else if(['LD','LE'].includes(role))style=attack>defense-9?'attackingFullback':'balancedFullback';
  else if(role==='VOL')style=defense>=mid-2?'anchor':'creator';
  else if(role==='MC')style=mid>attack+7?'creator':'boxToBox';
  else if(role==='MEI')style=mid>=attack?'creator':'dribbler';
  else if(['PE','PD','ME','MD'].includes(role))style=mid>attack-3?'dribbler':'wideRunner';
  else style=mid>finish+2?'falseNine':finish>=attack?'poacher':'target';
  return {role,style,mobility:.82+rng()*.38,phase:rng(),period:3.8+rng()*4.2,
    amplitude:.78+rng()*.36,pressure:clamp((defense+stat('posicionamento'))/198,.25,1),
    bend:(rng()-.5)*2,attack,mid,defense};
}

export function chooseMovement(profile,attack,style,random,last){
  const options=pools[profile.role][attack?'attack':'defend'];
  const favored=preferences[profile.style]||[];
  const theme=({counter:['diagonal','channel','boxToBox','recovery'],wide:['touchline','overlap','farPost'],
    overlap:['overlap','halfSpace','nearPost'],underlap:['underlap','invert','oneTwo'],
    central:['thirdMan','halfSpace','oneTwo'],cutback:['nearPost','comeShort','underlap'],
    patient:['triangle','recycle','offerShort'],pressbreak:['comeShort','triangle','openBuildUp']})[style]||[];
  const weights=options.map(name=>(favored.includes(name)?2.4:1)*(theme.includes(name)?2:1)*(name===last ? .12 : 1));
  let roll=random()*weights.reduce((a,b)=>a+b,0);
  return options[weights.findIndex(weight=>(roll-=weight)<0)]||options.at(-1);
}

export function sampleMovement(name,phase){
  const points=MOVEMENT_PATHS[name]||MOVEMENT_PATHS.hold;
  const scaled=clamp(phase,0,1)*(points.length-1),i=Math.min(points.length-2,Math.floor(scaled));
  const f=scaled-i,t=f*f*(3-2*f);
  return {forward:points[i][0]+(points[i+1][0]-points[i][0])*t,lateral:points[i][1]+(points[i+1][1]-points[i][1])*t};
}
