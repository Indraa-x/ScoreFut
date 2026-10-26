const LEDGER_VERSION=1;
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const titleCount=history=>history.filter(record=>record.champion===true).length;
const longestWinningStreak=history=>{
  let current=0,best=0;
  for(const record of history){
    current=record.champion===true?current+1:0;
    best=Math.max(best,current);
  }
  return best;
};
const trailingWinningStreak=history=>{
  let current=0;
  for(let index=history.length-1;index>=0&&history[index].champion===true;index--)current++;
  return current;
};
const wonMode=(history,mode)=>history.some(record=>record.champion===true&&record.mode===mode)?1:0;

const definitions=[
  {id:'first-campaign',name:'Primeira campanha',description:'Finalize sua primeira competição.',icon:'ball',target:1,progress:history=>history.length},
  {id:'three-campaigns',name:'Ritmo de jogo',description:'Complete três campanhas.',icon:'play',target:3,progress:history=>history.length},
  {id:'ten-campaigns',name:'Colecionador',description:'Complete dez campanhas.',icon:'users',target:10,progress:history=>history.length},
  {id:'first-title',name:'Primeira taça',description:'Conquiste seu primeiro título.',icon:'trophy',target:1,progress:titleCount},
  {id:'three-titles',name:'Tricampeão',description:'Conquiste três títulos.',icon:'star',target:3,progress:titleCount},
  {id:'five-titles',name:'Dinastia',description:'Conquiste cinco títulos.',icon:'flame',target:5,progress:titleCount},
  {id:'three-win-streak',name:'Em sequência',description:'Vença três campanhas seguidas.',icon:'bolt',target:3,progress:longestWinningStreak},
  {id:'world-cup-title',name:'Campeão do mundo',description:'Seja campeão da Copa do Mundo.',icon:'trophy',target:1,progress:history=>wonMode(history,'world-cup')},
  {id:'champions-title',name:'Noite dos campeões',description:'Conquiste a Champions League.',icon:'star',target:1,progress:history=>wonMode(history,'champions')},
  {id:'brazil-title',name:'Glória brasileira',description:'Conquiste a Copa do Brasil.',icon:'shield',target:1,progress:history=>wonMode(history,'copa-do-brasil')}
];

const targets=Object.fromEntries(definitions.map(({id,target})=>[id,target]));
const supportedLedger=ledger=>isRecord(ledger)&&(!Object.hasOwn(ledger,'version')||ledger.version===LEDGER_VERSION)?ledger:null;
const recordId=record=>isRecord(record)&&Object.hasOwn(record,'id')&&typeof record.id==='string'&&record.id.trim()&&record.id.length<=256?record.id:null;

function ledgerProgress(ledger){
  const saved=supportedLedger(ledger);
  if(!saved)return {};
  if(Object.hasOwn(saved,'progress'))return isRecord(saved.progress)?saved.progress:{};
  // Older local progress snapshots may be a map without a version wrapper.
  return Object.hasOwn(saved,'version')?{}:saved;
}

function ledgerMetadata(ledger){
  const saved=supportedLedger(ledger),metadata={};
  if(!saved)return metadata;
  if(Object.hasOwn(saved,'currentStreak')&&Number.isSafeInteger(saved.currentStreak)&&saved.currentStreak>=0)metadata.currentStreak=saved.currentStreak;
  if(Object.hasOwn(saved,'lastRecordId')&&recordId({id:saved.lastRecordId}))metadata.lastRecordId=saved.lastRecordId;
  return metadata;
}

function cappedProgress(value,target){
  return typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(target,Math.floor(value))):0;
}

/** Pure snapshot merge: progress can advance, and an earned medal never relocks. */
export function updateAchievementLedger(records=[],ledger=null){
  const history=Array.isArray(records)?records.filter(isRecord):[];
  const saved=ledgerProgress(ledger);
  const metadata=ledgerMetadata(ledger);
  if(history.length){
    if(!Object.hasOwn(metadata,'currentStreak'))metadata.currentStreak=trailingWinningStreak(history);
    const lastId=recordId(history.at(-1));
    if(!Object.hasOwn(metadata,'lastRecordId')&&lastId)metadata.lastRecordId=lastId;
  }
  return {version:LEDGER_VERSION,progress:Object.fromEntries(definitions.map(achievement=>[
    achievement.id,
    Math.max(cappedProgress(achievement.progress(history),achievement.target),cappedProgress(Object.hasOwn(saved,achievement.id)?saved[achievement.id]:0,achievement.target))
  ])),...metadata};
}

/** Commit a new completed campaign before the detailed history is pruned. */
export function recordAchievementProgress(record,recordsBefore=[],ledger=null){
  const saved=updateAchievementLedger(recordsBefore,ledger);
  if(!isRecord(record))return saved;
  const id=recordId(record),previous=ledgerMetadata(ledger);
  if(id&&(previous.lastRecordId===id||(Array.isArray(recordsBefore)&&recordsBefore.some(item=>recordId(item)===id))))return saved;
  const progress={...saved.progress};
  const advance=id=>{progress[id]=Math.min(targets[id],progress[id]+1);};
  for(const id of ['first-campaign','three-campaigns','ten-campaigns'])advance(id);
  const won=record.champion===true;
  if(won){
    for(const id of ['first-title','three-titles','five-titles'])advance(id);
    const modeAchievement={'world-cup':'world-cup-title',champions:'champions-title','copa-do-brasil':'brazil-title'};
    if(Object.hasOwn(record,'mode')&&typeof record.mode==='string'&&Object.hasOwn(modeAchievement,record.mode))progress[modeAchievement[record.mode]]=1;
  }
  const currentStreak=won?Math.min(Number.MAX_SAFE_INTEGER,(saved.currentStreak||0)+1):0;
  progress['three-win-streak']=Math.max(progress['three-win-streak'],Math.min(targets['three-win-streak'],currentStreak));
  return {version:LEDGER_VERSION,progress,currentStreak,...(id?{lastRecordId:id}:{})};
}

export function achievementsFor(records=[],ledger=null){
  const saved=updateAchievementLedger(records,ledger);
  return definitions.map(({progress,...achievement})=>{
    const value=saved.progress[achievement.id];
    return {...achievement,value,target:achievement.target,unlocked:value>=achievement.target};
  });
}

export function achievementSummary(records=[],ledger=null){
  const achievements=achievementsFor(records,ledger);
  return {unlocked:achievements.filter(item=>item.unlocked).length,total:achievements.length};
}
