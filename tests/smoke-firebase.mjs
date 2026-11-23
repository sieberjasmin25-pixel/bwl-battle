// Kurzer Test gegen die ECHTE Firebase-Datenbank (zwei getrennte Browser = zwei anonyme Nutzer).
// Räumt danach die eigenen Test-Einträge (Rangliste, Duell) wieder auf.
// Start: node tests/smoke-firebase.mjs
import { createRequire } from "module";
import http from "http"; import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = {".html":"text/html",".js":"text/javascript"};
const server = http.createServer((req,res)=>{ const p=path.join(ROOT,decodeURIComponent(new URL(req.url,"http://x").pathname));
  fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{"Content-Type":TYPES[path.extname(p)]||"application/octet-stream"}); res.end(d); }); });
await new Promise(r=>server.listen(0,r));
const URL0=`http://localhost:${server.address().port}/index.html`;
let fails=0; const ok=(c,m)=>{ console.log((c?"  ✓ ":"  ✗ ")+m); if(!c) fails++; };
const proxy = process.env.HTTPS_PROXY ? {server:process.env.HTTPS_PROXY,bypass:"localhost,127.0.0.1"} : undefined;
const browser=await chromium.launch({proxy});
const errors=[];
async function user(name,extra=""){
  const ctx=await browser.newContext({viewport:{width:390,height:800}});
  const pg=await ctx.newPage(); pg.on("pageerror",e=>errors.push(name+": "+e.message));
  await pg.goto(URL0+extra); await pg.waitForSelector("#conn.on,#conn.off",{timeout:30000});
  await pg.fill("#nick","Test-"+name); await pg.dispatchEvent("#nick","change");
  return pg;
}
async function answer(pg){
  await pg.waitForFunction(()=>cur&&!cur.answered&&!document.getElementById("vQuiz").classList.contains("hidden"),null,{timeout:20000});
  await pg.evaluate(()=>{ const q=cur.q; if(q.type==="multi"||q.type==="order"){ __fill(true); return; }
    if(q.type==="mc"){ document.querySelectorAll("#qBody .opt")[cur.shuffled.findIndex(o=>o.i===q.a)].click(); }
    else if(q.type==="match"){ document.querySelectorAll("#qBody .mitem").forEach((m,k)=>m.querySelectorAll(".mchoices button")[cur.shuffled[k].c].click()); }
    else { const i=document.getElementById("numIn"); i.value=String(q.a).replace(".",","); i.dispatchEvent(new Event("input")); } });
  await pg.click("#actBtn");
}
let A,B,did;
try{
  A=await user("Anna"); ok(await A.isVisible("#conn.on"),"Anna: anonym angemeldet & verbunden ("+await A.textContent("#conn")+")");
  B=await user("Ben");  ok(await B.isVisible("#conn.on"),"Ben: verbunden");
  // Solo-Runde Thema → Rangliste
  await A.click("#goTopics"); await A.click("#topicList button[data-t='14']");
  for(let i=0;i<5;i++){ await answer(A); await A.waitForFunction(()=>!document.getElementById("actBtn").disabled); await A.click("#actBtn"); }
  await A.waitForFunction(()=>/gespeichert|Bestwert/.test(document.getElementById("saveState").textContent),null,{timeout:20000});
  ok(true,"Solo-Ergebnis in Firestore gespeichert");
  await B.waitForFunction(()=>rankRows.some(r=>r.nick==="Test-Anna"),null,{timeout:20000});
  ok(true,"Ben sieht Anna live in der Rangliste");
  // Duell per Link
  await A.click("#homeBtn"); await A.click("#goDuels"); await A.click("#duelNewBtn"); await A.click("#dnLink");
  await A.waitForSelector("#dvGo",{timeout:20000}); did=await A.evaluate(()=>duel.openId);
  await A.click("#dvGo"); await A.click("#dpList button >> nth=0");
  for(let i=0;i<3;i++){ await answer(A); await A.waitForFunction(()=>!document.getElementById("actBtn").disabled); await A.click("#actBtn"); }
  await A.waitForSelector("#vDuel:not(.hidden)");
  await B.goto(URL0+"?duell="+did); await B.waitForSelector("#conn.on"); await B.fill("#nick","Test-Ben");
  await B.waitForSelector("#invGo:not([disabled])",{timeout:20000}); await B.click("#invGo");
  await B.waitForSelector("#dvJoin"); await B.click("#dvJoin");
  await B.waitForSelector("#dvGo",{timeout:20000});
  ok(/Runde 1 spielen/.test(await B.textContent("#dvGo")),"Ben hat angenommen und ist mit Runde 1 dran");
  await B.click("#dvGo");
  for(let i=0;i<3;i++){ await answer(B); await B.waitForFunction(()=>!document.getElementById("actBtn").disabled); await B.click("#actBtn"); }
  await A.waitForFunction(()=>{const d=duel.all[duel.openId];return d&&d.rb&&d.rb[0]&&d.rb[0].length===3;},null,{timeout:20000});
  ok(true,"Anna sieht Bens Antworten im Duell (Echtzeit)");
  // Live
  await A.goto(URL0); await A.waitForSelector("#conn.on"); await A.fill("#nick","Test-Anna");
  await A.click("#goLive"); await A.selectOption("#liveTopic","14"); await A.click("#createRoom");
  await A.waitForSelector("#vLobby:not(.hidden)",{timeout:20000}); const code=(await A.textContent("#lobCode")).trim();
  await B.goto(URL0+"?raum="+code); await B.waitForSelector("#conn.on"); await B.fill("#nick","Test-Ben");
  await B.waitForSelector("#invGo:not([disabled])"); await B.click("#invGo");
  await A.waitForFunction(()=>document.getElementById("lobCount").textContent.startsWith("2"),null,{timeout:20000});
  ok(true,"Live-Raum "+code+": Ben ist beigetreten");
  await A.click("#lobStart");
  await answer(A); await answer(B);
  await B.waitForSelector("#vReveal:not(.hidden)",{timeout:20000});
  ok(true,"Live: Auflösung bei Ben angekommen");
  await A.click("#lobLeave").catch(()=>{});
}catch(e){ console.error(e.message.split("\n")[0]); fails++; }
// Aufräumen
for(const pg of [A,B].filter(Boolean)){
  try{ await pg.evaluate(async did=>{ if(live.code) leaveLive(); if(did) await BE.del("duels/"+did).catch(()=>{}); await BE.del("ranking/"+me); },did); }catch(e){}
}
ok(errors.length===0,"Keine JavaScript-Fehler"+(errors.length?": "+errors.join(" | "):""));
await browser.close(); server.close();
console.log(fails?`\n${fails} Problem(e)`:"\nEchte Firebase-Verbindung funktioniert ✅");
process.exit(fails?1:0);
