import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost');const relative=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||relative.split('/').some(x=>x.startsWith('.'))){res.writeHead(403);res.end();return;}if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Arquivo não encontrado.');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);}catch{res.writeHead(400);res.end();}}).listen(port,'127.0.0.1',()=>console.log(`ScoreFut: http://127.0.0.1:${port}`));
