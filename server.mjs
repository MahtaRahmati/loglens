import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./public/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.csv':'text/csv; charset=utf-8','.png':'image/png'};
http.createServer(async(req,res)=>{
  try{
    const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target=path.resolve(root,'.'+(route==='/'?'/index.html':route));
    if(!target.startsWith(root)||!['GET','HEAD'].includes(req.method)) {res.writeHead(403);return res.end('Forbidden');}
    const body=await readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT||4100),'127.0.0.1',()=>console.log(`Workspace: http://127.0.0.1:${process.env.PORT||4100}`));
