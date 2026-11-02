import {FORMATIONS,hashSeed,SIMULATION_SETTINGS} from './engine.js';
import {createDraft,DEFAULT_REROLLS} from './draft.js';
import {squadsForMode} from '../data/competitions.js';

const modes={M:'world-cup',B:'copa-do-brasil',C:'champions'};
const formations=['4-3-3','4-4-2','4-2-3-1','4-2-4','3-5-2','5-3-2','4-5-1','3-4-3'];
const token=number=>number.toString(36).toUpperCase();
const checksum=body=>token(hashSeed('ScoreFut challenge 1|'+body)).padStart(7,'0');
const invalid=()=>new Error('Código de desafio inválido. Confira se você copiou o código inteiro.');
const rulesRevision=()=>token(hashSeed(JSON.stringify({settings:SIMULATION_SETTINGS,skips:DEFAULT_REROLLS,formations:FORMATIONS})));
const modeKeys=Object.keys(modes),combinationCount=modeKeys.length*formations.length,seedCount=0x10000;
const shortSignature=(payload,squads,mode)=>hashSeed(`ScoreFut challenge 2|${payload}|${challengeRosterRevision(squads,mode)}|${SIMULATION_SETTINGS.modelVersion}|${rulesRevision()}`)%1296;

/** Fingerprint the ordered, playable pool; no user data goes into the code. */
export function challengeRosterRevision(squads,mode){
  const pool=squadsForMode(squads,mode);
  if(!pool.length)throw new Error('Não foi possível carregar os elencos deste desafio.');
  return token(hashSeed(JSON.stringify(pool.map(s=>[s.id,s.clubId,s.ano,s.jogadores.map(p=>[p.id,p.nome,p.tags,p.ovr,p.camisa,p.atributos])]))));
}

/** Six base36 characters: four for seed/choices and two for compatibility/error detection. */
export function createChallenge({mode,formation,seed},squads){
  const modeKey=Object.keys(modes).find(key=>modes[key]===mode),index=formations.indexOf(formation);
  if(!modeKey||index<0||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw invalid();
  const payload=(seed%seedCount)*combinationCount+modeKeys.indexOf(modeKey)*formations.length+index;
  return decodeChallenge(token(payload).padStart(4,'0')+token(shortSignature(payload,squads,mode)).padStart(2,'0'));
}

export function decodeChallenge(input){
  if(typeof input!=='string'||input.length>400)throw invalid();
  let code=input.trim();
  if(/^https?:\/\//i.test(code)){
    try{code=new URL(code).searchParams.get('desafio') || '';}catch{throw invalid();}
  }
  code=code.toUpperCase();
  if(/^[0-9A-Z]{6}$/.test(code)){
    const payload=parseInt(code.slice(0,4),36),signature=parseInt(code.slice(4),36);
    if(payload>=seedCount*combinationCount)throw invalid();
    const choice=payload%combinationCount;
    return {version:2,code,mode:modes[modeKeys[Math.floor(choice/formations.length)]],formation:formations[choice%formations.length],seed:Math.floor(payload/combinationCount),signature};
  }
  // Keep previously shared links and saved drafts compatible with the original format.
  const parts=code.match(/^SF1-([MBC])([0-7])-([0-9A-Z]{1,7})-([0-9A-Z]{1,7})-([0-9A-Z]{1,2})-([0-9A-Z]{1,7})-([0-9A-Z]{7})$/);
  if(!parts)throw invalid();
  const [,modeKey,index,seedToken,rosterRevision,modelToken,rules,check]=parts;
  const seed=parseInt(seedToken,36),modelVersion=parseInt(modelToken,36);
  if(seed>0xffffffff||token(seed)!==seedToken||token(modelVersion)!==modelToken||checksum(code.slice(0,code.lastIndexOf('-')))!==check)throw invalid();
  return {version:1,code,mode:modes[modeKey],formation:formations[Number(index)],seed,rosterRevision,modelVersion,rulesRevision:rules};
}

export function validateChallenge(input,squads){
  const challenge=decodeChallenge(typeof input==='string'?input:input?.code);
  const compatible=challenge.version===2
    ? challenge.signature===shortSignature(parseInt(challenge.code.slice(0,4),36),squads,challenge.mode)
    : challenge.modelVersion===SIMULATION_SETTINGS.modelVersion&&challenge.rulesRevision===rulesRevision()&&challenge.rosterRevision===challengeRosterRevision(squads,challenge.mode);
  if(!compatible){
    throw new Error('Este desafio foi criado com outra versão dos elencos ou das regras. Peça um novo código para jogar em condições iguais.');
  }
  return challenge;
}

export function createChallengeDraft(input,squads,date){
  const challenge=validateChallenge(input,squads);
  return {...createDraft(challenge.seed,date,challenge.mode),challenge};
}

export function validateChallengeDraft(draft,formation,squads){
  const challenge=validateChallenge(draft.challenge,squads);
  if(draft.seed!==challenge.seed||draft.mode!==challenge.mode||formation!==challenge.formation)throw new Error('A competição e a formação deste desafio precisam ser mantidas.');
  return challenge;
}

export function challengeTournamentSeed(input){
  return hashSeed('ScoreFut challenge tournament|'+decodeChallenge(typeof input==='string'?input:input?.code).code);
}

export function challengeLink(code,base){
  const url=new URL(base);url.search='';url.hash='home';url.searchParams.set('desafio',decodeChallenge(code).code);return url.href;
}
