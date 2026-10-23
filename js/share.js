import { competitionName } from '../data/competitions.js?v=euro-20261023';

export function resultText(record) {
  return `⚽ ScoreFut · ${record.teamName}\n${record.champion?'🏆 Campeão!':record.stageLabel}\n${record.picks.length} jogadores · ${record.formation}\nForça ${Math.round(record.strength)} · ${record.goalsFor} gols marcados · ${record.goalsAgainst} sofridos\n${competitionName(record.mode)} · ${record.date}`;
}
export async function copyResult(record) {
  const text=resultText(record);
  if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return;}catch{}}
  const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('Copiar não está disponível neste navegador.');
}
/** All eleven names fit in two columns; old five-player results still export. */
export function resultCanvas(record) {
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=460+Math.ceil(record.picks.length/2)*90;
  const ctx=canvas.getContext('2d'),height=canvas.height;
  const accent=record.mode==='quick'?'#ffbb36':'#39c67d';
  let titleColor=record.champion?'#f5b301':'#f2f5f3';
  if(record.mode==='quick'){titleColor=ctx.createLinearGradient(70,0,930,0);titleColor.addColorStop(0,'#ffdc58');titleColor.addColorStop(.55,'#ffae26');titleColor.addColorStop(1,'#f47424');}
  ctx.fillStyle='#0a0d0c';ctx.fillRect(0,0,1000,height);ctx.strokeStyle='#27312c';ctx.lineWidth=2;ctx.strokeRect(30,30,940,height-60);
  ctx.font='bold 34px Inter,sans-serif';ctx.fillStyle='#f2f5f3';ctx.fillText('Score',65,89);ctx.fillStyle='#39c67d';ctx.fillText('Fut',166,89);
  ctx.font='16px Inter,sans-serif';ctx.fillStyle='#a0aaa4';ctx.textAlign='right';ctx.fillText(record.date,935,86);ctx.textAlign='center';
  ctx.font='bold 42px Inter,sans-serif';ctx.fillStyle=titleColor;ctx.fillText(record.champion?`CAMPEÃO · ${competitionName(record.mode).toUpperCase()}`:record.stageLabel.toUpperCase(),500,175,860);
  ctx.font='24px Inter,sans-serif';ctx.fillStyle='#f2f5f3';ctx.fillText(`${record.teamName} · ${record.formation}`,500,220);
  [[Math.round(record.strength),'FORÇA'],[record.goalsFor,'GOLS MARCADOS'],[record.goalsAgainst,'GOLS SOFRIDOS']].forEach(([n,l],i)=>{ctx.font='bold 42px Inter,sans-serif';ctx.fillStyle=accent;ctx.fillText(n,220+i*280,292);ctx.font='12px Inter,sans-serif';ctx.fillStyle='#a0aaa4';ctx.fillText(l,220+i*280,319);});
  record.picks.forEach((pick,i)=>{
    const x=65+(i%2)*455,y=380+Math.floor(i/2)*90;
    ctx.fillStyle='#1a2220';ctx.fillRect(x,y-28,415,74);ctx.fillStyle=accent;ctx.textAlign='center';ctx.font='bold 13px Inter,sans-serif';ctx.fillText(pick.slot.label,x+32,y+1);
    ctx.textAlign='left';ctx.fillStyle='#f2f5f3';ctx.font='bold 17px Inter,sans-serif';ctx.fillText(pick.player.nome,x+66,y,292);
    ctx.fillStyle='#a0aaa4';ctx.font='12px Inter,sans-serif';ctx.fillText(`${pick.clubName} · ${pick.ano}`,x+66,y+24,292);
    ctx.textAlign='right';ctx.fillStyle='#f2f5f3';ctx.font='bold 20px Inter,sans-serif';ctx.fillText(pick.player.ovr,x+400,y+4);
  });
  ctx.textAlign='center';ctx.font='14px Inter,sans-serif';ctx.fillStyle='#a0aaa4';ctx.fillText(`${record.picks.length} jogadores · ${competitionName(record.mode)}`,500,height-50);
  return canvas;
}
export function downloadResult(record) {
  resultCanvas(record).toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`scorefut-${record.date}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);},'image/png');
}
