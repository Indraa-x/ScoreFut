import fs from 'node:fs/promises';
import {allSquads} from '../data/clubs.js';
const root=new URL('../',import.meta.url),sources=JSON.parse(await fs.readFile(new URL('assets/players/sources.json',root),'utf8'));
let framing={players:{}};try{framing=JSON.parse(await fs.readFile(new URL('assets/players/framing.json',root),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const players=[...new Map(allSquads.flatMap(s=>s.jogadores.map(p=>[p.id,p.nome]))).entries()];
const portraits={};
for(const [id,name] of players){
  const s=sources.players[id];if(!s)continue;
  const bytes=await fs.readFile(new URL(s.file,root));if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('PNG inválido: '+id);
  const f=framing.players[id],frame=f?.sourceHash===s.sha256?{x:f.x,y:f.y,width:f.width,height:f.height}:null;
  if(frame&&(!Object.values(frame).every(Number.isFinite)||frame.width<=0||frame.height<=0))throw Error('Enquadramento inválido: '+id);
  portraits[id]={src:s.file,type:s.type,...(frame?{frame}:{})};
}
await fs.writeFile(new URL('data/player-portraits.js',root),'// Generated from verified, locally saved PNGs. See assets/players/sources.json.\nexport const PLAYER_PORTRAITS = '+JSON.stringify(portraits,null,2)+';\n');
await fs.writeFile(new URL('assets/players/missing.json',root),JSON.stringify(players.filter(([id])=>!portraits[id]).map(([id,name])=>({id,name})),null,2));
console.log(`${Object.keys(portraits).length}/${players.length} jogadores com retrato PNG local.`);
