// Run with: node server.js
// Small built-in Node server for the site and shared guestbook.
const http = require('http');
const fs = require('fs');
const path = require('path');
const appRoot = __dirname;
const root = path.join(appRoot, 'public');
const dataDir = path.join(appRoot, 'data');
const dataFile = path.join(dataDir, 'guestbook.json');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mp3':'audio/mpeg', '.jpg':'image/jpeg', '.png':'image/png', '.gif':'image/gif', '.webp':'image/webp', '.mp4':'video/mp4', '.webm':'video/webm', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml' };
function readEntries(){ try { return JSON.parse(fs.readFileSync(dataFile,'utf8')).filter(item=>String(item.name||'').toUpperCase()!=='DEADPIXEL'); } catch { return []; } }
function send(res,status,type,body){res.writeHead(status,{'Content-Type':type,'X-Content-Type-Options':'nosniff'});res.end(body);}
function json(res,status,obj){send(res,status,'application/json; charset=utf-8',JSON.stringify(obj));}
function saveEntries(items){fs.mkdirSync(dataDir,{recursive:true});fs.writeFileSync(dataFile,JSON.stringify(items,null,2));}
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/guestbook' && req.method==='GET') return json(res,200,readEntries());
  if(url.pathname==='/api/guestbook' && req.method==='POST'){
    let body=''; req.on('data',chunk=>{body+=chunk;if(body.length>10000){req.destroy();}});
    req.on('end',()=>{try{const input=JSON.parse(body);const name=String(input.name||'').trim().slice(0,30);const message=String(input.message||'').trim().slice(0,300);if(!name||!message)return json(res,400,{error:'Name and message are required.'});if(name.toUpperCase()==='DEADPIXEL')return json(res,400,{error:'That name is taken.'});const d=new Date();const item={name,message,date:(d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(-2)};const all=readEntries();all.unshift(item);saveEntries(all.slice(0,5000));json(res,201,item);}catch{return json(res,400,{error:'Invalid entry.'});}});
    return;
  }
  if(req.method!=='GET' && req.method!=='HEAD') return send(res,405,'text/plain; charset=utf-8','Method not allowed');
  let pathname=decodeURIComponent(url.pathname);if(pathname==='/')pathname='/index.html';
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep))return send(res,403,'text/plain; charset=utf-8','Forbidden');
  fs.readFile(file,(err,data)=>{if(err){return fs.readFile(path.join(root,'404.html'),(fallbackErr,page)=>{if(fallbackErr)return send(res,404,'text/plain; charset=utf-8','404 - page not found');res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();res.end(page);});}res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();res.end(data);});
});
const port=Number(process.env.PORT)||3000;
server.listen(port,'0.0.0.0',()=>console.log('AFTERHOURS is running on port '+port));
