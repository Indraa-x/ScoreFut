import fs from 'node:fs';
import {CAREER_LEAGUES} from '../data/career-leagues.js';
import {careerPortraitUrl} from '../data/career-2026/player-portraits.js';
const rows=CAREER_LEAGUES.filter(l=>l.id!=='brasileirao').flatMap(l=>l.teams.flatMap(t=>t.jogadores.map(p=>({
  league:l.name,club:t.nome,name:p.nome,id:p.id,ovr:p.ovr,url:careerPortraitUrl(p),
}))));
let index=0,done=0;
const results=[];
async function check(row){
  if(!row.url)return {...row,status:'no-url'};
  for(let attempt=0;attempt<2;attempt++){
    try{
      const response=await fetch(row.url,{method:'HEAD',signal:AbortSignal.timeout(15000)});
      const type=response.headers.get('content-type')??'';
      const status=response.ok&&type.startsWith('image/')?'ok':String(response.status);
      if((response.status===429||response.status>=500)&&attempt===0){await new Promise(r=>setTimeout(r,1200));continue;}
      return {...row,status,http:response.status,type,bytes:Number(response.headers.get('content-length'))||null};
    }catch(error){if(attempt===1)return {...row,status:'network-error',error:error.message};}
  }
}
await Promise.all(Array.from({length:10},async()=>{
  while(index<rows.length){
    const row=rows[index++];
    results.push(await check(row));
    if(++done%200===0)console.log(done+'/'+rows.length);
  }
}));
results.sort((a,b)=>a.league.localeCompare(b.league)||a.club.localeCompare(b.club)||a.name.localeCompare(b.name));
const leagues=[...new Set(rows.map(p=>p.league))].map(league=>({
  league,total:results.filter(p=>p.league===league).length,
  valid:results.filter(p=>p.league===league&&p.status==='ok').length,
  failed:results.filter(p=>p.league===league&&p.status!=='ok').length,
}));
const report={checkedAt:new Date().toISOString(),total:rows.length,leagues,results};
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/european-portrait-audit.json',JSON.stringify(report,null,2));
const failed=results.filter(p=>p.status!=='ok');
fs.writeFileSync('reports/european-portrait-audit.md',
  '# Auditoria das fotos dos jogadores europeus\n\n'+
  'Teste dos links cadastrados no game, por resposta HTTP e tipo de imagem. Um link válido não confirma visualmente a identidade do retrato.\n\n'+
  '| Liga | Jogadores | Links válidos | Com falha |\n|---|---:|---:|---:|\n'+
  leagues.map(l=>`| ${l.league} | ${l.total} | ${l.valid} | ${l.failed} |`).join('\n')+
  '\n\n## Fotos ausentes ou com falha\n\n| Jogador | Clube | Liga | Resultado |\n|---|---|---|---|\n'+
  failed.map(p=>`| ${p.name} | ${p.club} | ${p.league} | ${p.status} |`).join('\n')+'\n');
console.log(JSON.stringify({total:rows.length,valid:rows.length-failed.length,failed:failed.length,leagues,examples:failed.slice(0,15)},null,2));
