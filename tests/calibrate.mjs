/** node tests/calibrate.mjs --matches=20000 --out=qa/calibration-stage1.json
 * --campaigns=1000 includes each competition/difficulty/strength cell.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {allSquads} from '../data/game-squads.js';
import {FORMATIONS,calculateTeam,simulateMatch,mulberry32,SIMULATION_SETTINGS,LEGACY_SIMULATION_SETTINGS,simulationSettings,calibrateChampionship,squadTeam} from '../js/engine.js';
const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const runs=Number(args.matches)||20000,seed=7312026;
if(!Number.isInteger(runs)||runs<1)throw new Error('matches must be a positive integer');
export function auditTeam(id,ovr,formation='4-3-3',isUser=false){
 const lineup=FORMATIONS[formation].slots.map((slot,i)=>({slot,clubId:`${id}-${i}`,squadId:`${id}-${i}`,player:{id:id+'-'+i,nome:id+' '+i,tags:[slot.label],ovr,atributos:Object.fromEntries(['ataque','meio','defesa','finalizacao','reflexo','posicionamento'].map(k=>[k,ovr]))}}));
 return {id,name:id,lineup,strength:calculateTeam(lineup),formation,isUser};
}
const rows=[],start=performance.now();
const levels=args.levels?args.levels.split(','):['Casual','Normal','Realista'];
for(const [model,settings]of [...(args.legacy==='0'?[]:[['v5',LEGACY_SIMULATION_SETTINGS]]),...levels.map(level=>[level,simulationSettings(level)])]){
 if(!args['campaigns-only'])for(const user of [true,false])for(const gap of [0,5,10,15,20]){
  const strong=auditTeam('strong',85+gap/2,'4-3-3',user),weak=auditTeam('weak',85-gap/2);
  let w=0,d=0,l=0,goals=0,high=0,zero=0;
  for(let i=0;i<runs;i++){
   const swap=i%2,[home,away]=swap?[weak,strong]:[strong,weak];
   const r=simulateMatch(home,away,mulberry32(seed+i),{settings});
   w+=r.winnerId==='strong';l+=r.winnerId==='weak';d+=!r.winnerId;
   const total=r.homeGoals+r.awayGoals;goals+=total;high+=total>=5;zero+=total===0;
  }
  rows.push({model,kind:user?'user':'ai',gap,runs,w:100*w/runs,d:100*d/runs,l:100*l/runs,goals:goals/runs,high:100*high/runs,zero:100*zero/runs});
 }
}
const campaigns=[];
const candidates=args.campaigns?new Map(allSquads.map(s=>[s.id,squadTeam(s)])):null;
if(args.campaigns)for(const mode of ['world-cup','champions','copa-do-brasil'])for(const [model,settings]of [...(args.legacy==='0'?[]:[['v5',LEGACY_SIMULATION_SETTINGS]]),...levels.map(level=>[level,simulationSettings(level)])]){
 const cells=calibrateChampionship(allSquads,{runs:Number(args.campaigns),strengths:[86,94],seed,settings,mode,candidateTeams:candidates});campaigns.push(...cells.map(c=>({mode,model,...c})));console.error(mode,model,JSON.stringify(cells));
}
const formations=[];
if(args.formations){
 const count=Number(args.formations),settings=simulationSettings('Realista');
 for(const formation of Object.keys(FORMATIONS)){
  let titles=0,total=0;
  const a=auditTeam('a',85,formation);
  for(const other of Object.keys(FORMATIONS).filter(n=>n!==formation)){
   const b=auditTeam('b',85,other);
   for(let i=1;i<=count;i++){const r=simulateMatch(i%2?a:b,i%2?b:a,mulberry32(i),{knockout:true,settings});titles+=r.winnerId==='a';total++;}
  }
  formations.push({formation,runs:total,wins:titles,winRate:100*titles/total});
 }
}
const output={seed,runs,node:process.version,engineSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../js/engine.js',import.meta.url))).digest('hex'),datasetSha256:crypto.createHash('sha256').update(JSON.stringify(allSquads)).digest('hex'),settings:SIMULATION_SETTINGS,matches:rows,campaigns,formations,seconds:(performance.now()-start)/1000};
console.table(rows);if(campaigns.length)console.table(campaigns);
const destination=args.out||'qa/calibration-current.json';fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(output,null,2)+'\n');
