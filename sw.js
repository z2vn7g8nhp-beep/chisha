// 离线缓存：页面优先联网拿最新版（3 秒没响应就用缓存），图标等先用缓存
const C='chisha-v4';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin)return;
  const isPage=req.mode==='navigate'||/\/$|\.html$|\.webmanifest$/.test(url.pathname);
  e.respondWith(caches.open(C).then(async c=>{
    if(isPage){
      const net=fetch(req,{cache:'no-cache'}).then(r=>{if(r.ok)c.put(req,r.clone());return r});
      const timeout=new Promise(res=>setTimeout(res,3000));
      const first=await Promise.race([net.catch(()=>null),timeout]);
      if(first)return first;
      const hit=await c.match(req,{ignoreSearch:true})||await c.match('./index.html');
      return hit||net;
    }
    const hit=await c.match(req,{ignoreSearch:true});
    if(hit)return hit;
    const r=await fetch(req);if(r.ok)c.put(req,r.clone());return r;
  }));
});
