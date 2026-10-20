import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {allSquads} from '../data/game-squads.js';
const root=new URL('../',import.meta.url);
const sources=JSON.parse(await fs.readFile(new URL('assets/players/sources.json',root),'utf8'));
let framing={players:{}};
try{framing=JSON.parse(await fs.readFile(new URL('assets/players/framing.json',root),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const players=[...new Map(allSquads.flatMap(s=>s.jogadores.map(p=>[p.id,p.nome]))).entries()];
const portraits={};
for(const [id] of players){
  const source=sources.players[id];if(!source)continue;
  if(!source.file.startsWith('assets/players/')||source.file.includes('..'))throw Error('Caminho de retrato inválido: '+id);
  const bytes=await fs.readFile(new URL(source.file,root));
  const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  if(!png&&!jpeg&&!webp)throw Error('Imagem inválida: '+id);
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==source.sha256)throw Error('Arquivo de retrato diferente do registro: '+id);
  const f=framing.players[id];
  if(!f?.face||f.sourceHash!==hash)throw Error('Foto sem enquadramento de rosto verificado: '+id);
  const frame={x:f.x,y:f.y,width:f.width,height:f.height};
  if(frame&&(!Object.values(frame).every(Number.isFinite)||frame.width<=0||frame.height<=0))throw Error('Enquadramento inválido: '+id);
  if(frame.y+frame.height>f.face.y+f.face.height*1.26+0.0001)throw Error('Enquadramento inclui corpo abaixo do pescoço: '+id);
  portraits[id]={src:source.file,type:source.type,...(frame?{frame}:{})};
}
const missing=players.filter(([id])=>!portraits[id]).map(([id,name])=>({id,name}));
await fs.writeFile(new URL('assets/players/missing.json',root),JSON.stringify(missing,null,2)+'\n');
if(missing.length)throw Error(missing.length+' jogadores sem retrato local: '+missing.map(p=>p.id).join(', '));
await fs.writeFile(new URL('data/player-portraits.js',root),'// Generated from verified local image files. See assets/players/sources.json.\nexport const PLAYER_PORTRAITS = '+JSON.stringify(portraits,null,2)+';\n');
console.log(Object.keys(portraits).length+'/'+players.length+' jogadores com retrato local verificado.');
