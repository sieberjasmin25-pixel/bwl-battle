// End-to-End-Test im Test-Modus (?mock=1 → lokaler Speicher statt Firebase).
// Start: node tests/test.mjs   (startet selbst einen kleinen Webserver)
import { createRequire } from "module";
import http from "http"; import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = {".html":"text/html",".js":"text/javascript",".css":"text/css"};
const server = http.createServer((req,res)=>{ const p=path.join(ROOT,decodeURIComponent(new URL(req.url,"http://x").pathname)); const f=p.endsWith("/")?p+"index.html":p;
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{"Content-Type":TYPES[path.extname(f)]||"application/octet-stream"}); res.end(d); }); });
await new Promise(r=>server.listen(0,r));
const URL0 = `http://localhost:${server.address().port}/index.html`;
let fails=0; const ok=(c,m)=>{ console.log((c?"  ✓ ":"  ✗ ")+m); if(!c) fails++; };
const browser = await chromium.launch();
const ctx = await browser.newContext({viewport:{width:390,height:800}});
const errors=[];
async function open(uid,name,extra=""){
  const pg=await ctx.newPage(); pg.on("pageerror",e=>errors.push(uid+": "+e.message)); pg.on("console",m=>{ if(m.type()==="error") errors.push(uid+": "+m.text()); });
  await pg.goto(`${URL0}?mock=1&uid=${uid}${extra}`); await pg.waitForSelector("#conn.on");
  if(name){ await pg.fill("#nick",name); await pg.dispatchEvent("#nick","change"); }
  return pg;
}
// beantwortet die aktuelle Frage (richtig, wenn good=true – über die Fragendaten der Seite)
async function answer(pg,good=true){
  await pg.waitForSelector("#vQuiz:not(.hidden) #actBtn:not(.hidden)"); await pg.waitForFunction(()=>cur&&!cur.answered);
  await pg.evaluate(good=>{
    const q=cur.q;
    if(q.type==="mc"){ const k=cur.shuffled.findIndex(o=>good?o.i===q.a:o.i!==q.a); document.querySelectorAll("#qBody .opt")[k].click(); }
    else if(q.type==="match"){ document.querySelectorAll("#qBody .mitem").forEach((m,k)=>{ const c=good?cur.shuffled[k].c:(cur.shuffled[k].c+1)%q.cats.length; m.querySelectorAll(".mchoices button")[c].click(); }); }
    else { const i=document.getElementById("numIn"); i.value=String(good?q.a:q.a+7).replace(".",","); i.dispatchEvent(new Event("input")); }
  },good);
  await pg.click("#actBtn");
}
const visible=(pg,sel)=>pg.isVisible(sel);

try{
  /* ---------- 1. Solo gemischt ---------- */
  console.log("Solo · Gemischt");
  const A=await open("ua","Anna");
  await A.click("#goMix");
  for(let i=0;i<15;i++){ await answer(A,i%3!==0); await A.waitForFunction(()=>cur&&cur.answered); await A.click("#actBtn"); }
  await A.waitForSelector("#vEnd:not(.hidden)");
  await A.waitForFunction(()=>/Rangliste/.test(document.getElementById("saveState").textContent));
  const rA=await A.evaluate(()=>JSON.parse(localStorage.getItem("mockdb:ranking/ua")));
  ok(rA && rA.mix && rA.mix.best>0 && rA.games===1, "Ergebnis in Rangliste gespeichert ("+(rA&&rA.total)+" P)");
  ok(Object.values(rA.st).reduce((s,v)=>s+v.n,0)===15, "15 Antworten in der Themen-Statistik");

  /* ---------- 2. Solo nach Thema ---------- */
  console.log("Solo · Nach Thema");
  await A.click("#homeBtn"); await A.waitForSelector("#vHome:not(.hidden)");
  await A.click("#goTopics"); await A.click("#topicList button[data-t='14']");
  for(let i=0;i<5;i++){ await answer(A,true); await A.click("#actBtn"); }
  await A.waitForSelector("#vEnd:not(.hidden)");
  await A.waitForFunction(()=>/Rangliste/.test(document.getElementById("saveState").textContent));
  const rA2=await A.evaluate(()=>JSON.parse(localStorage.getItem("mockdb:ranking/ua")));
  ok(rA2.topics.t14 && rA2.topics.t14.best>=500, "Themen-Bestwert gespeichert ("+rA2.topics.t14.best+" P)");
  ok(rA2.st.t14.n>=5 && rA2.st.t14.s>=5, "Themen-Trefferquote BWL-Grundbegriffe = 100 %");

  /* ---------- 3. Duell per Link, 6 Runden ---------- */
  console.log("Duell (wie Quizduell)");
  await A.click("#homeBtn"); await A.click("#goDuels"); await A.click("#duelNewBtn"); await A.click("#dnLink");
  await A.waitForSelector("#vDuel:not(.hidden) #dvGo");
  const did=await A.evaluate(()=>duel.openId);
  const B=await open("ub","Ben",`&duell=${did}`);
  await B.waitForSelector("#inviteCard:not(.hidden) #invGo");
  ok(await B.isVisible("#inviteCard"), "Einladungs-Karte erscheint bei Ben");
  // Anna spielt Runde 1 zuerst (Quizduell-Regel: Herausforderer startet)
  async function playTurn(pg,good){
    await pg.waitForSelector("#vDuel:not(.hidden) #dvGo");
    const label=await pg.textContent("#dvGo");
    await pg.click("#dvGo");
    if(/Thema wählen/.test(label)){ await pg.waitForSelector("#vDuelPick:not(.hidden)"); await pg.click("#dpList button >> nth=0"); }
    for(let i=0;i<3;i++){ await answer(pg,good); await pg.waitForFunction(()=>cur&&cur.answered&&!document.getElementById("actBtn").disabled); await pg.click("#actBtn"); }
    await pg.waitForSelector("#vDuel:not(.hidden)");
  }
  await playTurn(A,true);
  ok(/Link|WhatsApp/.test(await A.textContent("#dvShare")), "Anna sieht Teilen-Buttons für den Link");
  await B.click("#invGo"); await B.waitForSelector("#dvJoin"); await B.click("#dvJoin");
  // abwechselnd spielen bis fertig
  const turnOf=async pg=>pg.evaluate(()=>{ const d=duel.all[duel.openId]; return d?duelNext(d).k:"?"; });
  for(let step=0;step<20;step++){
    await A.waitForTimeout(150);
    const ka=await turnOf(A), kb=await turnOf(B);
    if(ka==="done"&&kb==="done") break;
    if(kb==="play"||kb==="choose") await playTurn(B,step%2===0);
    else if(ka==="play"||ka==="choose") await playTurn(A,true);
    else await A.waitForTimeout(300);
  }
  await A.waitForFunction(()=>{const d=duel.all[duel.openId];return d&&d.status==="done";},null,{timeout:10000});
  ok(true,"Duell nach 6 Runden beendet");
  const dd=await A.evaluate(()=>duel.all[duel.openId]);
  ok(Object.keys(dd.rd).length===6 && [0,1,2,3,4,5].every(r=>dd.ra[r].length===3&&dd.rb[r].length===3), "6 Runden × 3 Fragen für beide gespeichert");
  ok(new Set([].concat(...Object.values(dd.rd).map(x=>x.q))).size===18, "18 verschiedene Fragen im Duell");
  ok([0,2,4].every(r=>dd.rd[r])&&[1,3,5].every(r=>dd.rd[r]), "Themenwahl abwechselnd");
  await A.waitForFunction(()=>{const r=JSON.parse(localStorage.getItem("mockdb:ranking/ua")||"{}");return r.dw&&Object.keys(r.dw).length===1;},null,{timeout:8000});
  await B.waitForFunction(()=>{const r=JSON.parse(localStorage.getItem("mockdb:ranking/ub")||"{}");return r.dw&&Object.keys(r.dw).length===1;},null,{timeout:8000});
  const wa=await A.evaluate(()=>Object.values(JSON.parse(localStorage.getItem("mockdb:ranking/ua")).dw)[0]);
  const wb=await B.evaluate(()=>Object.values(JSON.parse(localStorage.getItem("mockdb:ranking/ub")).dw)[0]);
  ok(wa==="w"&&wb==="l", `Ergebnis: Anna ${wa}, Ben ${wb}`);
  ok(/gewonnen/.test(await A.textContent("#dvStatus")), "Anna sieht „Du hast gewonnen“");

  /* ---------- 4. Gezieltes Duell aus der Rangliste ---------- */
  console.log("Duell aus der Rangliste");
  await B.goto(`${URL0}?mock=1&uid=ub`); await B.waitForSelector("#conn.on"); await B.fill("#nick","Ben");
  await B.click("#goDuels"); await B.click("#duelNewBtn");
  await B.waitForSelector("#dnList button"); await B.click("#dnList button >> nth=0");
  await B.waitForSelector("#vDuel:not(.hidden) #dvGo");
  await playTurn(B,true);
  await A.goto(`${URL0}?mock=1&uid=ua`); await A.waitForSelector("#conn.on"); await A.fill("#nick","Anna");
  await A.waitForSelector("#duelBadge:not(.hidden)");
  ok(/dran/.test(await A.textContent("#duelBadge")), "Anna sieht Badge „du bist dran“ auf der Startseite");

  /* ---------- 5. Rangliste & Profil ---------- */
  console.log("Rangliste & Profil");
  await A.click("#goRank"); await A.waitForSelector("#rankBox table");
  ok((await A.textContent("#rankBox")).includes("Anna"), "Gesamtrangliste zeigt Anna");
  await A.selectOption("#rankSel","duel"); ok((await A.textContent("#rankBox")).includes("1 Sieg"), "Duell-Rangliste zeigt Sieg");
  await A.selectOption("#rankSel","map"); ok((await A.textContent("#rankBox")).includes("👑"), "„Wer ist wo am besten?“ zeigt Themenkönig:innen");
  await A.selectOption("#rankSel","total"); await A.click("#rankBox tr[data-uid='ub']");
  await A.waitForSelector("#vProfile:not(.hidden)");
  ok((await A.textContent("#profName")).includes("Ben") && await A.isVisible("#profDuel"), "Profil von Ben mit Duell-Button");
  ok((await A.textContent("#profTopics")).includes("%"), "Profil zeigt Themen-Trefferquoten");

  /* ---------- 6. Live-Battle mit 3 Handys ---------- */
  console.log("Live-Battle");
  await A.goto(`${URL0}?mock=1&uid=ua`); await A.waitForSelector("#conn.on"); await A.fill("#nick","Anna");
  await A.click("#goLive"); await A.selectOption("#liveTopic","3"); await A.click("#createRoom");
  await A.waitForSelector("#vLobby:not(.hidden)");
  const code=(await A.textContent("#lobCode")).trim();
  ok(/^\d{4}$/.test(code), "Raum-Code "+code);
  await B.goto(`${URL0}?mock=1&uid=ub`); await B.waitForSelector("#conn.on"); await B.fill("#nick","Ben");
  await B.click("#goLive"); await B.waitForSelector(`#openRooms button[data-c='${code}']`);
  ok(true,"Ben sieht den offenen Raum in der Liste"); await B.click(`#openRooms button[data-c='${code}']`);
  const C=await open("uc","Cleo",`&raum=${code}`);
  await C.waitForSelector("#invGo:not([disabled])"); await C.click("#invGo");
  await A.waitForFunction(()=>document.getElementById("lobCount").textContent.startsWith("3"));
  ok(true,"Host sieht 3 Personen im Warteraum");
  await A.click("#lobStart");
  const nQ=5;
  for(let i=0;i<nQ;i++){
    for(const [pg,g] of [[A,true],[B,i%2===0],[C,false]]){ await pg.waitForFunction(i=>live.game&&live.game.status==="q"&&live.game.idx===i&&cur&&!cur.answered,i); await answer(pg,g); }
    await A.waitForSelector("#vReveal:not(.hidden)"); await B.waitForSelector("#vReveal:not(.hidden)"); await C.waitForSelector("#vReveal:not(.hidden)");
    if(i===0) ok(/führt/.test(await B.textContent("#rvLeader")), "Auflösung kommt automatisch, wenn alle geantwortet haben");
    await A.click("#hostNext");
  }
  await A.waitForSelector("#vPodium:not(.hidden)"); await C.waitForSelector("#vPodium:not(.hidden)");
  ok((await C.textContent("#podium")).includes("Anna"), "Siegerehrung bei allen, Anna auf dem Podest");
  await C.waitForFunction(()=>{const r=JSON.parse(localStorage.getItem("mockdb:ranking/uc")||"{}");return r.st&&r.st.t3&&r.st.t3.n===5;});
  ok(true,"Live-Ergebnis zählt in Cleos Themen-Statistik");

  /* ---------- 7. Reihum ---------- */
  console.log("Ein Handy, reihum");
  await C.goto(`${URL0}?mock=1&uid=uc`); await C.waitForSelector("#conn.on");
  await C.click("#goHot"); const ins=await C.$$("#hotNames input"); await ins[0].fill("Mia"); await ins[1].fill("Tom");
  await C.selectOption("#hotTopic","0"); await C.click("#hotStart");
  const nHot=await C.evaluate(()=>hot.ids.length);
  for(let i=0;i<nHot;i++){ for(let p=0;p<2;p++){ await C.click("#passGo"); await answer(C,p===0); await C.click("#actBtn"); } await C.waitForSelector("#vReveal:not(.hidden)"); await C.click("#hostNext"); }
  await C.waitForSelector("#vPodium:not(.hidden)");
  ok((await C.textContent("#podium")).includes("Mia"), "Reihum: Siegerehrung mit Mia");

  /* ---------- 8. Mehrere Fächer (zweites Test-Fach wird eingeschleust) ---------- */
  console.log("Mehrere Fächer");
  const E=await ctx.newPage(); E.on("pageerror",e=>errors.push("E: "+e.message));
  await E.addInitScript(()=>{ const q=[]; for(let i=0;i<8;i++) q.push({id:"x"+i,t:i%2,type:"mc",q:"Testfrage "+i,o:["Richtig","Falsch A","Falsch B","Falsch C"],a:0,e:"Erklärung "+i});
    window.FAECHER=[{kurz:"test",name:"Testfach",kurzname:"Test",icon:"🧪",topics:["Thema A","Thema B"],q}]; });
  await E.goto(`${URL0}?mock=1&uid=ua`); await E.waitForSelector("#conn.on"); await E.fill("#nick","Anna");
  ok(await E.isVisible("#fachCard") && (await E.$$("#fachSel option")).length===2, "Fachauswahl mit 2 Fächern sichtbar");
  const bwlBefore=await E.evaluate(()=>JSON.parse(localStorage.getItem("mockdb:ranking/ua")).total);
  await E.selectOption("#fachSel","test");
  ok((await E.textContent("#lbMini")).includes("Test"), "Startseite zeigt Rangliste des Testfachs");
  await E.click("#goMix");
  for(let i=0;i<8;i++){ await answer(E,true); await E.waitForFunction(()=>cur&&cur.answered&&!document.getElementById("actBtn").disabled); await E.click("#actBtn"); }
  await E.waitForSelector("#vEnd:not(.hidden)"); await E.waitForFunction(()=>/Rangliste/.test(document.getElementById("saveState").textContent));
  const rE=await E.evaluate(()=>JSON.parse(localStorage.getItem("mockdb:ranking/ua")));
  ok(rE.f && rE.f.test && rE.f.test.total>=800 && rE.total===bwlBefore, "Punkte im Testfach getrennt gespeichert, BWL-Punkte unverändert");
  await E.click("#homeBtn"); await E.click("#goRank"); await E.selectOption("#rankSel","all");
  const allTxt=await E.textContent("#rankBox");
  ok(allTxt.includes("Anna") && allTxt.includes("BWL") && allTxt.includes("Test"), "Gesamtwertung über alle Fächer");
  // Duell im Testfach, danach aus BWL heraus öffnen
  await E.goto(`${URL0}?mock=1&uid=ua`); await E.waitForSelector("#conn.on"); await E.fill("#nick","Anna");
  ok(await E.inputValue("#fachSel")==="test", "Zuletzt gewähltes Fach wird gemerkt");
  await E.click("#goDuels"); await E.click("#duelNewBtn"); await E.click("#dnLink");
  await E.waitForSelector("#dvGo"); const tdid=await E.evaluate(()=>duel.openId);
  ok((await E.evaluate(id=>duel.all[id].fach,tdid))==="test", "Duell gehört zum Testfach");
  await E.click("#dvBack"); await E.click("[data-home] >> nth=0").catch(()=>{}); await E.evaluate(()=>{location.hash="";});
  await E.waitForSelector("#vHome:not(.hidden)"); await E.selectOption("#fachSel","bwl");
  await E.click("#goDuels"); await E.waitForSelector(`#duelLists button[data-id='${tdid}']`);
  ok((await E.textContent(`#duelLists button[data-id='${tdid}']`)).includes("Test"), "Duell-Liste zeigt Fach-Markierung");
  await E.click(`#duelLists button[data-id='${tdid}']`); await E.waitForSelector("#vDuel:not(.hidden)");
  ok(await E.inputValue("#fachSel")==="test" && (await E.textContent("#dvFach")).includes("Testfach"), "Öffnen wechselt automatisch ins richtige Fach");

  ok(errors.length===0, "Keine JavaScript-Fehler"+(errors.length?": "+errors.slice(0,5).join(" | "):""));
}catch(e){ console.error(e); fails++; }
await browser.close(); server.close();
console.log(fails?`\n${fails} Test(s) fehlgeschlagen`:"\nAlle Tests bestanden ✅");
process.exit(fails?1:0);
