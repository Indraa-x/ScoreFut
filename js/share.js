import { competitionName } from '../data/competitions.js';
import {CLUB_LOGOS} from '../data/club-logos.js';
import {assetUrl} from './asset-url.js';
const exportLogos={...CLUB_LOGOS,user:'assets/my-team-crest.svg'};

export function resultText(record) {
  return `⚽ ScoreFut · ${record.teamName}\n${record.champion?'🏆 Campeão!':record.stageLabel}\n${record.picks.length} jogadores · ${record.formation}\nForça ${Math.round(record.strength)} · ${record.goalsFor} gols marcados · ${record.goalsAgainst} sofridos\n${competitionName(record.mode)} · ${record.date}`;
}
export async function copyResult(record) {
  const text=resultText(record);
  if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return;}catch{}}
  const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('Copiar não está disponível neste navegador.');
}
/** Only completed user fixtures are exported; never invent missing legacy results. */
export function resultFixtures(record){
  const tournament=record.tournament;
  return (tournament?.userMatches || []).filter(match=>match.result).map(match=>{
    const team=id=>tournament.teams?.find(row=>row.id===id);
    return {...match,home:team(match.homeId),away:team(match.awayId)};
  });
}

/** A self-contained campaign poster, with the saved positions and actual results. */
export function resultCanvas(record,{images=new Map()}={}) {
  const picks=record.picks || [],matches=resultFixtures(record);
  const lineupHeight=Math.max(620,picks.length*56+24),campaignY=410+lineupHeight+48;
  const canvas=document.createElement('canvas');canvas.width=1000;
  canvas.height=campaignY+70+Math.max(1,matches.length)*82+100;
  const ctx=canvas.getContext('2d'),accent='#69d6a6',ink='#edf5f0',muted='#a4b6ac';
  const text=(value,x,y,size=18,color=ink,weight=500,align='left',width)=>{
    ctx.fillStyle=color;ctx.font=`${weight} ${size}px Inter,sans-serif`;ctx.textAlign=align;
    let label=String(value??'');
    if(width)while(label.length>1&&ctx.measureText(label).width>width)label=label.slice(0,-2)+'…';
    ctx.fillText(label,x,y);
  };
  const box=(x,y,w,h,fill='#19241e',stroke='#304338',radius=14)=>{
    ctx.beginPath();ctx.roundRect(x,y,w,h,radius);ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  };
  const crest=(clubId,x,y,size=30)=>{
    const image=images.get(exportLogos[clubId]);
    if(!image)return;
    const scale=Math.min(size/image.naturalWidth,size/image.naturalHeight);
    ctx.drawImage(image,x+(size-image.naturalWidth*scale)/2,y+(size-image.naturalHeight*scale)/2,image.naturalWidth*scale,image.naturalHeight*scale);
  };
  ctx.fillStyle='#101713';ctx.fillRect(0,0,1000,canvas.height);
  const gradient=ctx.createLinearGradient(0,0,1000,340);
  gradient.addColorStop(0,'#214735');gradient.addColorStop(1,'#14251e');
  box(28,28,944,330,gradient,null,20);
  text('SCORE',60,85,30,ink,900);text('FUT',166,85,30,accent,900);
  text(record.date,940,80,15,muted,500,'right');
  text(competitionName(record.mode).toUpperCase(),60,126,15,accent,800);
  text(record.teamName,60,184,43,ink,800,'left',880);
  text(record.champion?'Campeão':record.stageLabel || 'Fim de campanha',60,222,21,record.champion?'#f2ce69':muted,600,'left',880);
  [[Math.round(record.strength),'FORÇA GERAL'],[record.goalsFor,'GOLS MARCADOS'],[record.goalsAgainst,'GOLS SOFRIDOS'],[record.played,'JOGOS']].forEach(([n,label],i)=>{
    const x=60+i*225;
    text(n,x,286,36,accent,800);text(label,x,314,12,muted,700);
  });
  text('SUA ESCALAÇÃO',40,391,15,accent,800);
  text(record.formation,450,391,18,ink,800,'right');
  text('JOGADORES E ÉPOCAS',492,391,15,muted,700);
  box(40,410,410,lineupHeight,'#163f2a',null);
  const px=58,py=432,pw=374,ph=lineupHeight-44;
  ctx.save();ctx.beginPath();ctx.roundRect(40,410,410,lineupHeight,14);ctx.clip();
  for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#1a5035':'#1d593b';ctx.fillRect(px,py+i*ph/8,pw,ph/8);}
  ctx.strokeStyle='#9dccab80';ctx.lineWidth=1.5;ctx.strokeRect(px,py,pw,ph);
  ctx.beginPath();ctx.moveTo(px,py+ph/2);ctx.lineTo(px+pw,py+ph/2);ctx.stroke();
  ctx.beginPath();ctx.arc(px+pw/2,py+ph/2,pw*.14,0,Math.PI*2);ctx.stroke();
  for(const [y,direction]of [[py,1],[py+ph,-1]]){
    ctx.strokeRect(px+pw*.22,y,pw*.56,direction*ph*.15);
    ctx.strokeRect(px+pw*.36,y,pw*.28,direction*ph*.06);
  }
  picks.forEach((pick,i)=>{
    const slot=pick.slot || {},x=px+pw*(slot.x??50)/100,y=py+ph*(slot.y??50)/100;
    ctx.beginPath();ctx.arc(x,y,19,0,Math.PI*2);ctx.fillStyle=slot.position==='GOL'?'#f2ce69':'#ecf6ee';ctx.fill();
    text(pick.player.ovr,x,y+6,17,'#153c28',800,'center');
    text(`${i+1}. ${slot.label || ''}`,x,y+35,12,ink,700,'center');
  });ctx.restore();
  picks.forEach((pick,i)=>{
    const y=410+i*56;
    box(476,y,484,51,'#19241e',null,8);
    text(i+1,494,y+30,13,muted,600);crest(pick.clubId,520,y+10,30);
    text(pick.player.nome,562,y+22,17,ink,700,'left',302);
    text(`${pick.slot?.label || ''} · ${pick.clubName || ''} · ${pick.ano??''}`,562,y+41,12,muted,500,'left',302);
    text(pick.player.ovr,941,y+32,23,accent,800,'right');
  });
  text('CAMINHO NA COMPETIÇÃO',40,campaignY,15,accent,800);
  text(`${matches.length} partidas`,960,campaignY,14,muted,500,'right');
  matches.forEach((match,i)=>{
    const y=campaignY+24+i*82,r=match.result;
    box(40,y,920,74);
    text(match.stageLabel || 'Partida',60,y+20,12,muted,600,'left',660);
    if(r.penalties)text(`Pênaltis ${r.penalties[0]} – ${r.penalties[1]}`,940,y+20,12,'#f2ce69',600,'right');
    const name=(team,id)=>id===record.tournament.userTeamId?record.teamName:team?.nome || team?.name || 'Time';
    crest(match.home?.clubId,60,y+31,30);crest(match.away?.clubId,910,y+31,30);
    text(name(match.home,match.homeId),104,y+45,17,ink,700,'left',300);
    text(match.home?.ano || (match.homeId===record.tournament.userTeamId?'Seu time':''),104,y+63,12,muted);
    text(`${r.homeGoals} – ${r.awayGoals}`,500,y+48,24,accent,800,'center');
    text(name(match.away,match.awayId),896,y+45,17,ink,700,'right',300);
    text(match.away?.ano || (match.awayId===record.tournament.userTeamId?'Seu time':''),896,y+63,12,muted,500,'right');
  });
  if(!matches.length)text('Os resultados das partidas não estão disponíveis neste registro.',60,campaignY+68,17,muted);
  if(record.topScorer)text(`Artilheiro do time: ${record.topScorer.nome} · ${record.topScorer.goals} gols`,40,canvas.height-65,16,ink,600,'left',920);
  text('SCOREFUT · CLUBES E SELEÇÕES HISTÓRICAS',40,canvas.height-32,12,muted,700);
  return canvas;
}

export async function downloadResult(record) {
  if(!record)return;
  await document.fonts?.ready;
  const ids=[...(record.picks || []).map(p=>p.clubId),...(record.tournament?.teams || []).map(t=>t.clubId)];
  const images=new Map();
  await Promise.all([...new Set(ids.map(id=>exportLogos[id]).filter(Boolean))].map(src=>new Promise(resolve=>{
    const image=new Image();image.crossOrigin='anonymous';
    const timer=setTimeout(resolve,4000);
    image.onload=()=>{clearTimeout(timer);images.set(src,image);resolve();};image.onerror=()=>{clearTimeout(timer);resolve();};
    image.src=assetUrl(src);
  })));
  const canvas=resultCanvas(record,{images});
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('Não foi possível gerar a imagem. Tente novamente.');
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`scorefut-${String(record.date || 'campanha').replace(/[^\w-]/g,'-')}.png`;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
