import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=path.join(process.env.TEMP||process.env.TMP||'.','scorefut-commons-incoming');
const missing=JSON.parse(await fs.readFile(path.join(root,'assets/players/missing.json'),'utf8'));
const slug=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases={
  jorginho:['Jorginho (footballer, born 1964)'],
  'marcio-santos':['Márcio Santos (footballer)'],
  branco:['Branco (footballer)'],
  mazinho:['Mazinho (footballer, born 1965)'],
  felix:['Félix Miéli Venerando'],
  brito:['Brito (footballer, born 1939)'],
  everaldo:['Everaldo (footballer, born 1944)'],
  clodoaldo:['Clodoaldo Tavares de Santana'],
  gerson:['Gérson (footballer, born 1941)'],
  'jose-luis-brown':['José Luis Brown (footballer)'],
  'hector-enrique':['Héctor Enrique (footballer)'],
  'mario-coluna':['Mário Coluna'],
  'jose-pereira':['José Pereira (footballer, born 1931)'],
  'jose-augusto':['José Augusto (footballer, born 1937)'],
  'ivan-lopez':['Iván López (footballer)'],
};
const variants=new Map();
for(const player of missing){
  for(const title of [player.name,...(aliases[player.id]||[])]){
    const key=slug(title);if(!variants.has(key))variants.set(key,[]);variants.get(key).push({id:player.id,name:player.name,title});
  }
}
const api=async(url)=>{
  for(let attempt=0;attempt<8;attempt++){
    const response=await fetch(url,{headers:{'User-Agent':'ScoreFut open portrait importer/1.0 (Wikimedia Commons attribution check)'},signal:AbortSignal.timeout(45_000)});
    if(response.ok)return response.json();
    if(response.status!==429&&response.status<500)throw Error(`Wikimedia returned ${response.status}`);
    const retryAfter=Number(response.headers.get('Retry-After'));
    await new Promise(resolve=>setTimeout(resolve,Math.max(retryAfter*1000,1500*(attempt+1))));
  }
  throw Error('Wikimedia API kept rate limiting requests');
};
const candidates=new Map();
const articles=new Map();
for(const lang of ['en','pt','es','fr','de','it']){
  const titles=[...new Set([...variants.values()].flat().map(v=>v.title))];
  for(let start=0;start<titles.length;start+=45){
    const batch=titles.slice(start,start+45);
    const query=new URLSearchParams({action:'query',format:'json',maxlag:'5',redirects:'1',titles:batch.join('|'),prop:'pageimages|pageprops',piprop:'name|thumbnail',pithumbsize:'600'});
    const data=await api(`https://${lang}.wikipedia.org/w/api.php?${query}`);
    const canonical=new Map();
    for(const pair of [...(data.query?.normalized||[]),...(data.query?.redirects||[])]){
      const key=slug(pair.to);canonical.set(key,[...(canonical.get(key)||[]),slug(pair.from)]);
    }
    for(const page of Object.values(data.query?.pages||{})){
      if(page.missing!==undefined||page.pageprops?.disambiguation!==undefined)continue;
      const keys=[slug(page.title),...(canonical.get(slug(page.title))||[])];
      const matched=keys.flatMap(key=>variants.get(key)||[]);
      for(const player of matched){
        const qid=page.pageprops?.wikibase_item;
        if(qid&&!articles.has(player.id))articles.set(player.id,{qid,article:page.title,language:lang,name:player.name});
        if(page.pageimage&&page.thumbnail?.source&&!candidates.has(player.id))candidates.set(player.id,[{id:player.id,name:player.name,article:page.title,language:lang,file:page.pageimage,qid:qid||null}]);
      }
    }
    if(start%180===0)console.log(`${lang}: consultando ${Math.min(start+batch.length,titles.length)}/${titles.length} nomes`);
    await new Promise(resolve=>setTimeout(resolve,1100));
  }
  console.log(`${lang}: ${candidates.size} jogadores com página e foto`);
}
const qids=[...new Set([...articles.values()].map(a=>a.qid))];
const articleByQid=new Map();
for(const [id,article] of articles){articleByQid.set(article.qid,[...(articleByQid.get(article.qid)||[]),{id,...article}]);}
const wikidataFiles=new Map();
for(let start=0;start<qids.length;start+=45){
  const ids=qids.slice(start,start+45);
  const query=`SELECT ?item ?image WHERE { VALUES ?item { ${ids.map(id=>`wd:${id}`).join(' ')} } ?item wdt:P18 ?image. }`;
  const url=`https://query.wikidata.org/sparql?${new URLSearchParams({query,format:'json'})}`;
  const response=await fetch(url,{headers:{'User-Agent':'ScoreFut open portrait importer/1.0 (Wikidata P18 lookup)','Accept':'application/sparql-results+json'},signal:AbortSignal.timeout(45_000)});
  if(!response.ok)throw Error(`Wikidata SPARQL returned ${response.status}`);
  const data=await response.json();
  for(const row of data.results?.bindings||[]){
    const qid=row.item.value.split('/').pop(),file=decodeURIComponent(row.image.value.split('/').pop());
    if(qid&&file)wikidataFiles.set(qid,file);
  }
  console.log(`Wikidata: consultados ${Math.min(start+ids.length,qids.length)}/${qids.length} itens`);
  await new Promise(resolve=>setTimeout(resolve,1100));
}
for(const [qid,file] of wikidataFiles){
  for(const article of articleByQid.get(qid)||[]){
    const current=candidates.get(article.id)||[];
    if(!current.some(candidate=>candidate.file===file))current.push({...article,file,language:'commons',qid});
    candidates.set(article.id,current);
  }
}
const allCandidates=[...candidates.values()].flat();
const uniqFiles=[...new Set(allCandidates.map(c=>c.file))];
const fileInfo=new Map();
for(let start=0;start<uniqFiles.length;start+=45){
  const batch=uniqFiles.slice(start,start+45).map(file=>`File:${file}`);
  const query=new URLSearchParams({action:'query',format:'json',maxlag:'5',titles:batch.join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'640'});
  const data=await api(`https://commons.wikimedia.org/w/api.php?${query}`);
  for(const page of Object.values(data.query?.pages||{})){
    const info=page.imageinfo?.[0];if(info)fileInfo.set(page.title.replace(/^File:/i,''),info);
  }
  await new Promise(resolve=>setTimeout(resolve,1100));
}
const openLicense=value=>/\b(CC0|CC BY(?:-SA)?(?:\s|$)|public domain|GFDL|GNU Free Documentation License)\b/i.test(value||'');
const clean=value=>(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
await fs.mkdir(temp,{recursive:true});
const accepted=[];
for(const options of candidates.values())for(let index=0;index<options.length;index++){
  const candidate=options[index],info=fileInfo.get(candidate.file),meta=info?.extmetadata||{};
  const license=clean(meta.LicenseShortName?.value);
  if(!info?.thumburl||!openLicense(license))continue;
  const extension=info.thumburl.toLowerCase().match(/\.(jpe?g|png|webp)(?:[?#]|$)/)?.[1]?.replace('jpeg','jpg')||'jpg';
  const target=path.join(temp,`${candidate.id}__${index}.${extension}`);
  const response=await fetch(info.thumburl,{headers:{'User-Agent':'ScoreFut open portrait importer/1.0'}});
  if(!response.ok)continue;
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<4000||bytes.length>12_000_000)continue;
  await fs.writeFile(target,bytes);
  accepted.push({...candidate,filePath:target,extension,sha256:(await import('node:crypto')).createHash('sha256').update(bytes).digest('hex'),source:`https://commons.wikimedia.org/wiki/${encodeURIComponent(`File:${candidate.file}`).replaceAll('%3A',':')}`,imageUrl:info.thumburl,license,licenseUrl:meta.LicenseUrl?.value||'',artist:clean(meta.Artist?.value),description:clean(meta.ImageDescription?.value),mime:info.mime||''});
}
const output=path.join(process.env.TEMP||process.env.TMP||'.','scorefut-commons-candidates.json');
await fs.writeFile(output,JSON.stringify(accepted,null,2));
console.log(`Fotos com licença aberta baixadas para análise: ${accepted.length} arquivos de ${missing.length} jogadores (${wikidataFiles.size} arquivos de Wikidata); catálogo temporário: ${output}`);
