import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
for(const name of ['index.html','css','js','data','assets']) fs.cpSync(path.join(root,name),path.join(root,'dist',name),{recursive:true});
const manifestPath=path.join(root,'.openai','hosting.json');
if(fs.existsSync(manifestPath)){const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));manifest.static={directory:'dist'};fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');}
console.log('Arquivos estáticos preparados em dist/.');
