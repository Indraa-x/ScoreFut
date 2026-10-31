import fs from 'node:fs';
import path from 'node:path';
import {syncHome} from './prerender-home.mjs';
import {CLUB_LOGOS} from '../data/club-logos.js';
const root=process.cwd(),dist=path.resolve(root,'dist');
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw Error('Unsafe output directory');
syncHome(root);
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
const files=new Set();
function add(name){
 name=name.split('?')[0].split('#')[0].replaceAll('\\','/');
 if(!name||files.has(name)||name.startsWith('../')||path.isAbsolute(name))return;
 const source=path.join(root,name);
 if(!fs.existsSync(source)||!fs.statSync(source).isFile())throw Error('Missing runtime file: '+name);
 files.add(name);
 const extension=path.extname(name);
 if(!['.html','.js','.css','.svg','.webmanifest'].includes(extension))return;
 const text=fs.readFileSync(source,'utf8');
 if(extension==='.js')for(const match of text.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"](\.[^'"]+\.js(?:\?[^'"]*)?)['"]/g))add(path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1])));
 if(extension==='.html')for(const match of text.matchAll(/(?:src|href)=["']([^"']+)["']/g))if(!/^(?:https?:|#|data:)/.test(match[1]))add(match[1]);
 for(const match of text.matchAll(/['"(](assets\/[^'"\s)<>$`]+\.(?:png|jpg|webp|svg|mp3|woff2)(?:\?[^'"\s)<>`]*)?)/g))add(match[1]);
 if(extension==='.css')for(const match of text.matchAll(/url\(['"]?([^'"\s)]+)['"]?\)/g))if(!/^(?:data:|https?:|#)/.test(match[1]))add(path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1])));
}
add('index.html');
for(const logo of Object.values(CLUB_LOGOS))add(logo);
const ui=fs.readFileSync(path.join(root,'js/ui.js'),'utf8');
for(const match of ui.matchAll(/src:'([^']+)'/g))add('assets/home/'+match[1]);
for(const name of ['sitemap.xml','robots.txt','manifest.webmanifest','service-worker.js'])if(fs.existsSync(path.join(root,name)))add(name);
for(const file of files){const target=path.join(dist,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
console.log(`Arquivos estáticos preparados em dist/: ${files.size} arquivos.`);
