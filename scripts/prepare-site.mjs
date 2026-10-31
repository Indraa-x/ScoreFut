import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
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
for(const match of ui.matchAll(/src:'([^']+)'/g)){add('assets/home/'+match[1]);add('assets/home/'+match[1].split('?')[0].replace(/\.png$/,'.webp'));}
for(const name of ['sitemap.xml','robots.txt','manifest.webmanifest','service-worker.js'])if(fs.existsSync(path.join(root,name)))add(name);
for(const file of files){const target=path.join(dist,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
console.log(`Arquivos estáticos preparados em dist/: ${files.size} arquivos.`);

// Preserve stylesheet cascade order; all sheets live under css/, so relative URLs stay valid.
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const sheets=[...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"?]+)(?:\?[^"]*)?"\s*>/g)];
const digest=value=>createHash('sha256').update(value).digest('hex').slice(0,12);
const assetMap=Object.fromEntries([...files].filter(f=>f.startsWith('assets/')).map(f=>[f,`${f}?v=${digest(fs.readFileSync(path.join(dist,f)))}`]));
fs.writeFileSync(path.join(dist,'js/asset-url.js'),`const assets=${JSON.stringify(assetMap)};export const assetUrl=path=>assets[path.split('?')[0]]||path;\n`);
const bundle=sheets.map(([,name])=>`/* ${name} */\n${fs.readFileSync(path.join(dist,name),'utf8')}`).join('\n').replace(/url\(['"]?([^'"\s)]+)['"]?\)/g,(full,url)=>{const file=path.posix.normalize(path.posix.join('css',url.split('?')[0]));return assetMap[file]?`url("${url.split('?')[0]}?v=${assetMap[file].split('?v=')[1]}")`:full;});
const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,12);
const cssName=`css/game.${hash(bundle)}.css`;
fs.writeFileSync(path.join(dist,cssName),bundle);
let first=true;
html=html.replace(/<link\s+rel="stylesheet"\s+href="([^"?]+)(?:\?[^"]*)?"\s*>/g,()=>{if(!first)return '';first=false;return `<link rel="stylesheet" href="${cssName}">`;});
for(const [,name]of sheets)fs.rmSync(path.join(dist,name));
// One hash over the module graph also invalidates parents when only a child changes.
const modules=[...files].filter(name=>name.endsWith('.js')).sort();
const graphHash=hash(modules.map(name=>name+'\n'+fs.readFileSync(path.join(dist,name),'utf8')).join('\n'));
for(const name of modules){let source=fs.readFileSync(path.join(dist,name),'utf8');source=source.replace(/((?:from\s*|import\s*\(\s*|import\s*)['"])(\.[^'"]+\.js)(?:\?[^'"]*)?(['"])/g,(_,prefix,file,quote)=>`${prefix}${file}?v=${graphHash}${quote}`);fs.writeFileSync(path.join(dist,name),source);}
html=html.replace(/((?:src|srcset|href)=")(assets\/[^"?]+)(?:\?[^"]*)?"/g,(_,prefix,file)=>`${prefix}${assetMap[file]||file}"`);
html=html.replace(/(src="(?:js\/)[^"?]+)(?:\?[^"]*)?"/g,`$1?v=${graphHash}"`);
fs.writeFileSync(path.join(dist,'index.html'),html);
console.log(`CSS único: ${cssName}. Hash dos módulos: ${graphHash}.`);
