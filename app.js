"use strict";
/* =====================================================================
   Gallisches Dorfduell – mehrere Fächer; je Fach Solo, Duelle (wie Quizduell),
   Live-Battle, Reihum und Rangliste (+ Gesamtwertung über alle Fächer). Speicher: Firebase Firestore (anonyme Anmeldung).
   ?mock=1 → lokaler Test-Speicher (localStorage) statt Firebase.
   ===================================================================== */
const APP = "Gallisches Dorfduell";
const FAECHER = window.FAECHER||[];
const G = "dorf_";                 // geräteweite Einstellungen (Name, Fach)
let FACH=null, Q=[], TOPICS=[], QBY={}, P="kb_quiz_";   // aktuelles Fach – siehe selectFach()
const fachBy = k => FAECHER.find(f=>f.kurz===(k||"bwl"))||FAECHER[0];
const $ = id => document.getElementById(id);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pl = (n,one,many) => fmt(n)+" "+(Math.round(Number(n)||0)===1?one:many);
const fmt = n => Math.round(Number(n)||0).toLocaleString("de-DE");
const LS = {get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const shuffle = (a,rnd=Math.random) => {a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const TIME = {mc:30, match:75, num:0, multi:45, order:60};   // 0 = ohne Zeitlimit (Rechenaufgaben)
const TYPE_LABEL = {mc:"Multiple Choice", match:"Zuordnung", num:"Rechnen", multi:"Mehrfachauswahl", order:"Reihenfolge"};
const ROUND = 15;
const SHAPES = ["▲","◆","●","■"], SHCOL = ["var(--k0)","var(--k1)","var(--k2)","var(--k3)"];
const tkey = i => "t"+i;
const BASE = location.origin + location.pathname;
const PARAMS = new URLSearchParams(location.search);
$("appTitle").textContent="⚔️ "+APP;

/* ================= SPEICHER (Firebase oder Test-Speicher) ================= */
const BE = (()=>{
  const useMock = PARAMS.has("mock") || !window.FB || !window.FIREBASE_CONFIG;
  const api = {mode:useMock?"mock":"firebase", ok:false, uid:null, error:null};
  if(useMock){
    const K="mockdb:"; const subs=new Set();
    const read=p=>{try{return JSON.parse(localStorage.getItem(K+p))}catch(e){return null}};
    const fire=()=>subs.forEach(s=>s.run());
    const write=(p,v)=>{ if(v==null) localStorage.removeItem(K+p); else localStorage.setItem(K+p,JSON.stringify(v)); setTimeout(fire,0); };
    addEventListener("storage",e=>{ if(!e.key||e.key.startsWith(K)) fire(); });
    const later=v=>new Promise(r=>setTimeout(()=>r(v),5));
    const setPath=(o,path,v)=>{const ks=path.split(".");let c=o;ks.slice(0,-1).forEach(k=>{if(typeof c[k]!=="object"||c[k]===null)c[k]={};c=c[k];});c[ks[ks.length-1]]=v;};
    const listColl=coll=>{const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(K+coll+"/")&&!k.slice((K+coll+"/").length).includes("/")){out.push(Object.assign({id:k.slice((K+coll+"/").length)},read(k.slice(K.length))));}}return out;};
    const match=(d,w)=>{const v=d[w[0]];return w[1]==="=="?v===w[2]:w[1]==="array-contains"?Array.isArray(v)&&v.includes(w[2]):true;};
    Object.assign(api,{
      init(){ let u=PARAMS.get("uid")||LS.get("mockuid"); if(!u){u="u"+Math.random().toString(36).slice(2,10);LS.set("mockuid",u);} api.uid=u; api.ok=true; return later(u); },
      get:p=>later(read(p)),
      set:(p,d)=>{write(p,JSON.parse(JSON.stringify(d)));return later();},
      update:(p,patch)=>{const d=read(p); if(!d) return Promise.reject({code:"not-found"}); Object.entries(patch).forEach(([k,v])=>setPath(d,k,JSON.parse(JSON.stringify(v===undefined?null:v)))); write(p,d); return later();},
      del:p=>{write(p,null);return later();},
      onDoc(p,cb){const s={last:undefined,run(){const v=localStorage.getItem(K+p);if(v!==s.last){s.last=v;cb(v?JSON.parse(v):null);}}};subs.add(s);setTimeout(()=>s.run(),0);return()=>subs.delete(s);},
      onQuery(coll,wheres,lim,cb){const s={last:undefined,run(){const rows=listColl(coll).filter(d=>wheres.every(w=>match(d,w))).slice(0,lim);const j=JSON.stringify(rows);if(j!==s.last){s.last=j;cb(rows);}}};subs.add(s);setTimeout(()=>s.run(),0);return()=>subs.delete(s);}
    });
    return api;
  }
  let fs=null;
  Object.assign(api,{
    init(){
      return new Promise((resolve)=>{
        let done=false;
        const fin=(uid,err)=>{ if(done) return; done=true; api.uid=uid; api.ok=!!uid; api.error=err||null; resolve(uid); };
        setTimeout(()=>fin(null,"timeout"),15000);
        try{
          const app=FB.initializeApp(window.FIREBASE_CONFIG); api.app=app;
          fs=FB.initializeFirestore(app,{experimentalAutoDetectLongPolling:true,ignoreUndefinedProperties:true});
          const auth=FB.getAuth(app);
          const off=FB.onAuthStateChanged(auth,u=>{ if(u){ off(); fin(u.uid); } });
          FB.signInAnonymously(auth).catch(e=>fin(null,e&&e.code||"auth"));
        }catch(e){ fin(null,e&&e.message||"init"); }
      });
    },
    get:async p=>{const s=await FB.getDoc(FB.doc(fs,p)); return s.exists()?s.data():null;},
    set:(p,d)=>FB.setDoc(FB.doc(fs,p),d),
    update:(p,patch)=>FB.updateDoc(FB.doc(fs,p),patch),
    del:p=>FB.deleteDoc(FB.doc(fs,p)),
    onDoc:(p,cb,err)=>FB.onSnapshot(FB.doc(fs,p),s=>cb(s.exists()?s.data():null),e=>{console.warn(e);err&&err(e);}),
    onQuery:(coll,wheres,lim,cb,err)=>FB.onSnapshot(FB.query(FB.collection(fs,coll),...wheres.map(w=>FB.where(w[0],w[1],w[2])),FB.limit(lim)),
      s=>cb(s.docs.map(d=>Object.assign({id:d.id},d.data()))),e=>{console.warn(e);err&&err(e);})
  });
  return api;
})();
let me=null; // eigene (anonyme) ID

/* ================= VIEWS + ZURÜCK-BUTTON ================= */
const VIEWS = ["vHome","vTopics","vCatalog","vRank","vProfile","vDuels","vDuelNew","vDuel","vDuelPick","vLive","vLobby","vQuiz","vReveal","vPodium","vEnd","vHot","vPass"];
function show(v){VIEWS.forEach(x=>$(x).classList.toggle("hidden",x!==v));window.scrollTo(0,0);}
function go(v,hash){show(v); if(hash!==undefined && location.hash.replace("#","")!==hash){ location.hash=hash; }}
const isShown = v => !$(v).classList.contains("hidden");

/* ---------- Schutz: laufende Runde nicht aus Versehen verlassen ---------- */
// Hashes, zu denen eine laufende Runde selbst wechselt (kein Verlassen)
const ROUND_HASHES = new Set(["solo","battle","lobby","siegerehrung","reihum-spiel","duell-spiel"]);
function activeRound(){
  if(typeof solo!=="undefined" && solo && !solo.done && cur) return "solo";
  if(typeof duel!=="undefined" && duel.playing) return "duel";
  if(typeof hot!=="undefined" && hot && !hot.done) return "hot";
  if(typeof live!=="undefined" && live.code && live.game && live.game.status!=="end") return live.game.status==="lobby"?"lobby":"live";
  return null;
}
function ask(title,text,buttons){
  return new Promise(res=>{
    $("askTitle").textContent=title; $("askTxt").textContent=text;
    const box=$("askBtns"); box.innerHTML="";
    buttons.forEach(b=>{ const el=document.createElement("button"); el.className=b.primary?"btn":"btn2"; el.textContent=b.label; el.dataset.v=b.value;
      if(!b.primary){ el.style.background="transparent"; el.style.color="#fff"; el.style.borderColor="rgba(255,255,255,.55)"; }
      el.onclick=()=>{ $("askOv").classList.add("hidden"); res(b.value); }; box.appendChild(el); });
    $("askOv").classList.remove("hidden");
    setTimeout(()=>{ const f=box.querySelector("button"); if(f) f.focus(); },30);
  });
}
let lastHash=location.hash.replace("#",""), navBypass=false, asking=false;
const HANDLED = new Set(["","start","themen","katalog","rangliste","duelle","duell","live","profil"]);
window.addEventListener("hashchange",e=>{
  const h=location.hash.replace("#","");
  if(navBypass){ navBypass=false; lastHash=h; return; }
  const kind=activeRound();
  if(kind && !ROUND_HASHES.has(h) && h!==lastHash){
    e.stopImmediatePropagation();
    navBypass=true; location.hash=lastHash;      // erst mal zurück in die Runde
    confirmLeave(kind,h); return;
  }
  lastHash=h;
});
async function confirmLeave(kind,target){
  if(asking) return; asking=true;
  let choice;
  try{
    if(kind==="lobby" && live.isHost){
      choice=await ask("Warteraum verlassen?","Du bist Host. Lass den Raum offen und komm später über „Live-Battle“ zurück – oder schließ ihn für alle.",
        [{label:"Hier bleiben",value:"stay",primary:true},{label:"Raum offen lassen",value:"keep"},{label:"Raum schließen",value:"leave"}]);
    } else {
      const t={solo:["Runde abbrechen?","Diese Runde wird dann nicht gewertet."],
        duel:["Duell-Runde unterbrechen?","Die gerade offene Frage zählt dann als falsch. Den Rest der Runde kannst du später weiterspielen."],
        hot:["Runde abbrechen?","Der Spielstand von allen geht verloren."],
        live:["Live-Battle verlassen?", live.isHost?"Du bist Host – das Battle endet dann für alle.":"Du kannst später mit demselben Namen wieder beitreten, deine Punkte bleiben."],
        lobby:["Warteraum verlassen?","Du kannst später wieder beitreten."]}[kind];
      choice=await ask(t[0],t[1],[{label:"Weiterspielen",value:"stay",primary:true},{label:kind==="duel"?"Unterbrechen":"Ja, abbrechen",value:"leave"}]);
    }
  } finally{ asking=false; }
  if(choice==="stay") return;
  if(kind==="solo"){ stopQuiz(); }
  else if(kind==="hot"){ hot=null; stopQuiz(); }
  else if(kind==="duel"){ stopQuiz(); duel.playing=null; }
  else { leaveLive({keepOpen:choice==="keep"}); }
  if(!HANDLED.has(target) || (target==="duell"&&!duel.openId)) target="";
  location.hash=target;
  if(location.hash.replace("#","")===target && target===""){ show("vHome"); renderHome(); }
}
window.addEventListener("beforeunload",e=>{ if(activeRound()){ e.preventDefault(); e.returnValue=""; } });

window.addEventListener("hashchange",()=>{
  const h=location.hash.replace("#","");
  if(h===""||h==="start"){ leaveAll(); show("vHome"); renderHome(); }
  else if(h==="themen"){ stopQuiz(); show("vTopics"); renderTopics(); }
  else if(h==="katalog" && catTopic!=null){ show("vCatalog"); renderCatalog(); }
  else if(h==="rangliste"){ show("vRank"); renderRank(); }
  else if(h==="duelle"){ stopQuiz(); duel.openId=null; duel.playing=null; show("vDuels"); renderDuelList(); }
  else if(h==="duell" && duel.openId){ stopQuiz(); duel.playing=null; show("vDuel"); renderDuel(); }
  else if(h==="live" && !live.code){ stopQuiz(); show("vLive"); watchOpenRooms(); }
});
function leaveAll(){ hot=null; stopQuiz(); duel.openId=null; duel.playing=null; if(live.code) leaveLive(); if(live.unOpen){ live.unOpen(); live.unOpen=null; } }
document.querySelectorAll("[data-home]").forEach(b=>b.onclick=()=>{location.hash="";});

/* ================= FORTSCHRITT (schon gesehen, pro Gerät) ================= */
let progress = {seen:{},wrong:{}};
/* ================= FACH WECHSELN ================= */
function selectFach(kurz){
  const f=fachBy(kurz); if(FACH===f) return;
  FACH=f; Q=f.q; TOPICS=f.topics; QBY={}; Q.forEach(q=>QBY[q.id]=q); P="kb_"+f.kurz+"_";
  LS.set(G+"fach",f.kurz);
  progress={seen:{},wrong:{}}; try{ const p=JSON.parse(LS.get(P+"progress")||"null"); if(p&&p.seen) progress=p; }catch(e){}
  document.title=APP+" · "+f.name;
  $("appSub").textContent=FAECHER.length>1?FAECHER.length+" Fächer · lernen, duellieren, gewinnen":f.name+" · "+Q.length+" Fragen · "+TOPICS.length+" Themen";
  $("fachSel").innerHTML=FAECHER.map(x=>`<option value="${esc(x.kurz)}">${esc(x.icon||"📚")} ${esc(x.name)} · ${x.q.length} Fragen</option>`).join("");
  $("fachSel").value=f.kurz;
  const nCalc=Q.filter(q=>q.type==="num").length, hasCalc=nCalc>=MIN_CALC;
  $("goCalc").classList.toggle("hidden",!hasCalc);
  $("goCalcTxt").textContent=`Nur Rechenaufgaben – ${nCalc} Stück in diesem Fach`;
  const topicOpts=`<option value="mix">🎯 Gemischt – 15 Fragen aus allen Themen</option>`+(hasCalc?`<option value="calc">🧮 Nur Rechnen (${nCalc} Aufgaben)</option>`:"")+TOPICS.map((t,i)=>`<option value="${i}">📚 ${esc(t)} (${Q.filter(q=>q.t===i).length} Fragen)</option>`).join("");
  $("liveTopic").innerHTML=topicOpts; $("hotTopic").innerHTML=topicOpts;
  const modes=(FAECHER.length>1?[["all","🌍 Alle Fächer · Gesamtpunkte"]]:[]).concat([
    ["total","🏅 Gesamtpunkte "+f.kurzname],["mix","🎯 Bestwert Solo Gemischt"]].concat(hasCalc?[["calc","🧮 Bestwert Nur Rechnen"]]:[]).concat([["endlos","♾️ Bestwert Endlos"],["blitz","⚡ Bestwert Blitzrunde"],["pruefung","📝 Bestwert Klausur-Simulation"]]).concat([["duel","⚔️ Duell-Siege"],["acc","🧠 Trefferquote gesamt"],["map","🗺️ Wer ist wo am besten?"]
  ])).concat(TOPICS.map((t,i)=>["t"+i,"📚 "+t]));
  const old=$("rankSel").value;
  $("rankSel").innerHTML=modes.map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join("");
  if(modes.some(m=>m[0]===old)) $("rankSel").value=old;
  $("rankH").textContent="🏆 Rangliste · "+f.kurzname;
  if(typeof rankRaw!=="undefined" && rankLoaded) rankRows=fachRows();
}
function markSeen(id,ok){ progress.seen[id]=(progress.seen[id]||0)+1; if(!ok) progress.wrong[id]=(progress.wrong[id]||0)+1; else if(progress.wrong[id]) progress.wrong[id]=Math.max(0,progress.wrong[id]-1); LS.set(P+"progress",JSON.stringify(progress)); }
function rankQ(q){ const s=progress.seen[q.id]||0, w=progress.wrong[q.id]||0; return s*10 - w*4 + Math.random()*3; }
/* ---------- Varianten: neue Zahlen / andere Formulierung (gleicher seed = gleiche Variante) ---------- */
function qInst(base,seed){
  if(!base || (!base.gen && !base.qv) || seed==null) return base;
  const r=seeded(String(seed)+"|"+base.id), q=Object.assign({},base);
  if(base.qv){ const all=[base.q].concat(base.qv); q.q=all[Math.floor(r()*all.length)]; }
  if(base.gen) Object.assign(q,base.gen(r));
  return q;
}
const newSeed = () => Math.random().toString(36).slice(2,9);
const resQ = r => qInst(QBY[r.id], r.seed);
const altHtml = q => q&&q.alt ? `<div class="small" style="margin-top:8px"><b>✔ Auch richtig:</b> ${esc(q.alt)}</div>` : "";
const MIN_CALC = 3;   // ab so vielen Rechenaufgaben gibt es den Modus „Nur Rechnen“
function topicLabel(topic,f){ f=f||FACH; return topic==="mix"?"🎯 Gemischt":topic==="calc"?"🧮 Nur Rechnen":topic==="wrong"?"❌ Falsche nochmal":topic==="endlos"?"♾️ Endlos":topic==="blitz"?"⚡ Blitzrunde":topic==="pruefung"?"📝 Klausur-Simulation":"📚 "+(f.topics[+topic]||""); }
const wrongQs = () => Q.filter(q=>(progress.wrong[q.id]||0)>0);
function pickRound(topic,n,tset){   // tset: Set mit Themen-Indizes (eigene Auswahl) oder null = alle Themen
  n=n||ROUND;
  const pool = tset ? Q.filter(q=>tset.has(q.t)) : Q;
  const tl = tset ? [...tset] : TOPICS.map((_,i)=>i);
  if(topic==="endlos") return shuffle(pool.map(q=>q.id));
  if(topic==="blitz") return shuffle(pool.filter(q=>q.type==="mc").map(q=>q.id)).slice(0,ROUND);
  if(topic==="pruefung") return pickRound("mix",20,tset);
  if(topic==="wrong") return shuffle(pool.filter(q=>(progress.wrong[q.id]||0)>0).map(q=>q.id)).slice(0,ROUND);
  if(topic==="calc") return shuffle(pool.filter(q=>q.type==="num").sort((a,b)=>rankQ(a)-rankQ(b)).slice(0,ROUND).map(q=>q.id));
  if(topic!=="mix"){ const t=+topic; return shuffle(Q.filter(q=>q.t===t).sort((a,b)=>rankQ(a)-rankQ(b)).slice(0,ROUND).map(q=>q.id)); }
  const chosen=[]; const used=new Set();
  shuffle(tl).forEach(t=>{const c=pool.filter(q=>q.t===t).sort((a,b)=>rankQ(a)-rankQ(b))[0]; if(c&&chosen.length<n){chosen.push(c.id);used.add(c.id);}});
  pool.filter(q=>!used.has(q.id)).sort((a,b)=>rankQ(a)-rankQ(b)).slice(0,n-chosen.length).forEach(q=>chosen.push(q.id));
  return shuffle(chosen);
}

/* ================= HOME ================= */
const nickEl=$("nick"); nickEl.value=LS.get(G+"nick")||LS.get("kb_bwl_nick")||"";
function nick(){return nickEl.value.trim().slice(0,20)}
function updName(){
  document.querySelectorAll(".needname").forEach(b=>b.disabled=!nick()||(b.classList.contains("needonline")&&!BE.ok));
  renderInvite();
}
nickEl.addEventListener("input",()=>{LS.set(G+"nick",nick());updName();});
nickEl.addEventListener("change",()=>{ const r=myRank(); if(r&&nick()&&r.nick!==nick()) saveRank(d=>{}); });
$("fachSel").onchange=()=>{ selectFach($("fachSel").value); renderHome(); };
nickEl.addEventListener("keydown",e=>{ if(e.key==="Enter") nickEl.blur(); });
function renderHome(){
  const seen=Q.filter(q=>progress.seen[q.id]).length;
  $("coverage").textContent=`Fortschritt auf diesem Handy: ${seen} von ${Q.length} Fragen gesehen`+(seen===Q.length?" – alles abgedeckt! 💪":"");
  $("covBar").style.width=(seen/Q.length*100)+"%";
  const nw=wrongQs().length;
  $("goWrong").classList.toggle("hidden",!nw);
  $("goWrongTxt").textContent=`${nw} ${nw===1?"Frage":"Fragen"}, die du zuletzt falsch hattest – richtig beantwortet fliegen sie raus`;
  updName(); renderMini(); renderDuelBadge();
}
function setConn(state,text){ const c=$("conn"); c.className="status "+state; c.lastChild.textContent=text; }
$("goMix").onclick=()=>startSolo("mix");
$("goTopics").onclick=()=>openCfg("normal",false);
$("goWrong").onclick=()=>startSolo("wrong");
$("goEndlos").onclick=()=>openCfg("endlos",true);
$("goBlitz").onclick=()=>openCfg("blitz",true);
$("goPruef").onclick=()=>openCfg("pruefung",true);
$("endWrong").onclick=()=>startSolo("wrong");
$("goCalc").onclick=()=>startSolo("calc");
$("goRank").onclick=()=>{go("vRank","rangliste");renderRank();};
$("goMe").onclick=()=>openProfile(me);
$("goDuels").onclick=()=>{go("vDuels","duelle");renderDuelList();};
$("goLive").onclick=()=>{go("vLive","live"); $("joinMsg").textContent=""; watchOpenRooms();};
/* ---------- Runde zusammenstellen: Modus + Themen ---------- */
const cfg={mode:"normal",sel:new Set()};
const CFG_MODES=[["normal","▶ Normal"],["endlos","♾️ Endlos"],["blitz","⚡ Blitz"],["pruefung","📝 Klausur"],["calc","🧮 Nur Rechnen"],["wrong","❌ Falsche"]];
function openCfg(mode,all){ cfg.mode=mode; cfg.sel=new Set(all?TOPICS.map((_,i)=>i):[]); go("vTopics","themen"); renderTopics(); }
function cfgArgs(){   // → [Modus/Thema für startSolo, Themen-Set oder null]
  const ts=new Set([...cfg.sel].filter(i=>i<TOPICS.length)), all=ts.size===TOPICS.length, m=cfg.mode;
  if(m==="normal") return ts.size===1?[String([...ts][0]),null]:all?["mix",null]:["mix",ts];
  return [m, all?null:ts];
}
$("selAll").onclick=()=>{ cfg.sel=new Set(TOPICS.map((_,i)=>i)); renderTopics(); };
$("selNone").onclick=()=>{ cfg.sel=new Set(); renderTopics(); };
$("cfgStart").onclick=()=>{ const [t,ts]=cfgArgs(); if(cfg.sel.size) startSolo(t,ts); };
function renderTopics(){
  const r=myRank()||{};
  cfg.sel=new Set([...cfg.sel].filter(i=>i<TOPICS.length));
  $("modeChips").innerHTML=CFG_MODES.map(([v,l])=>`<button role="radio" aria-checked="${cfg.mode===v}" class="${cfg.mode===v?"sel":""}" data-m="${v}">${l}</button>`).join("");
  $("modeChips").querySelectorAll("button").forEach(b=>b.onclick=()=>{ cfg.mode=b.dataset.m; renderTopics(); });
  const n=cfg.sel.size; let len=0;
  if(n){ const [t,ts]=cfgArgs(); len=pickRound(t,null,ts).length; }
  $("cfgStart").disabled=!n||!len;
  $("cfgInfo").textContent= !n ? "Bitte mindestens ein Thema ankreuzen." : !len ? "Keine passenden Fragen in dieser Auswahl – anderen Modus oder mehr Themen wählen."
    : `${topicLabel(cfg.mode==="normal"?"mix":cfg.mode).replace("🎯 Gemischt","▶ Normal")} · ${n} ${n===1?"Thema":"Themen"} · ${len} Fragen`+(n<TOPICS.length&&!(cfg.mode==="normal"&&n===1)?" · eigene Auswahl: zählt in die Statistik, nicht als Bestwert":"");
  $("topicList").innerHTML=TOPICS.map((t,i)=>{const qs=Q.filter(q=>q.t===i), s=qs.filter(q=>progress.seen[q.id]).length;
    const best=((r.topics||{})[tkey(i)]||{}).best;
    const on=cfg.sel.has(i);
    return `<div class="trow"><button data-t="${i}" class="${on?"on":""}" role="checkbox" aria-checked="${on}"><span class="ck">${on?"☑":"☐"}</span><span style="flex:1"><b>${esc(t)}</b><br><span class="muted small">${qs.length} Fragen · ${s} gesehen${best!=null?` · Bestwert ${fmt(best)} P`:""}</span></span></button><button class="eye" data-cat="${i}" aria-label="Alle Fragen zu ${esc(t)} ansehen"><span style="font-size:1.2rem">👁</span><span class="small">Fragen</span></button></div>`}).join("");
  $("topicList").querySelectorAll("button[data-t]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.t; if(cfg.sel.has(i)) cfg.sel.delete(i); else cfg.sel.add(i); renderTopics(); });
  $("topicList").querySelectorAll("button[data-cat]").forEach(b=>b.onclick=()=>openCatalog(+b.dataset.cat));
}
/* ---------- Alle Fragen eines Themas ansehen ---------- */
let catTopic=null, catAllOpen=false;
function openCatalog(t){ catTopic=t; catAllOpen=false; go("vCatalog","katalog"); renderCatalog(); }
function renderCatalog(){
  const t=catTopic, qs=Q.filter(q=>q.t===t);
  $("catTitle").textContent="👁 "+TOPICS[t];
  $("catSub").textContent=`${qs.length} Fragen · Tippe auf eine Frage, um Lösung und Erklärung zu sehen.`;
  $("catOpenAll").textContent=catAllOpen?"Alle Lösungen zuklappen":"Alle Lösungen zeigen";
  const typ=q=>({mc:"Auswahl",match:"Zuordnung",num:"Rechnen",multi:"Mehrfach",order:"Reihenfolge"})[q.type]||"";
  $("catList").innerHTML=qs.map((q,i)=>{
    const st=(progress.wrong[q.id]||0)>0?" · ❌ zuletzt falsch":progress.seen[q.id]?" · ✓ gesehen":"";
    let ans="";
    if(q.type==="mc") ans=`<ul>${q.o.map((o,k)=>`<li class="${k===q.a?"ok":""}">${k===q.a?"✅ ":""}${esc(o)}</li>`).join("")}</ul>`;
    else if(q.type==="multi") ans=`<p class="small" style="margin:4px 0">Alle richtigen:</p><ul>${q.o.map((o,k)=>`<li class="${q.c.includes(k)?"ok":""}">${q.c.includes(k)?"✅ ":"✗ "}${esc(o)}</li>`).join("")}</ul>`;
    else if(q.type==="order") ans=`<ol>${q.items.map(t=>`<li>${esc(t)}</li>`).join("")}</ol>`;
    else if(q.type==="match") ans=`<ul>${q.items.map(it=>`<li>${esc(it[0])} → <b>${esc(q.cats[it[1]])}</b></li>`).join("")}</ul>`;
    else ans=`<p style="margin:4px 0"><b>Lösung: ${esc(numText(q))}</b></p>`;
    return `<details class="catq" ${catAllOpen?"open":""}><summary><span class="tg">${i+1} · ${typ(q)}</span><b>${esc(q.q)}</b></summary><div class="ans">${ans}<p class="small muted" style="margin:6px 0 0">${esc(q.e)}</p>${altHtml(q)}${q.gen?`<p class="small" style="margin:6px 0 0">🔢 Im Spiel kommt diese Aufgabe jedes Mal mit neuen Zahlen.</p>`:""}${q.qv?`<p class="small" style="margin:6px 0 0">🔀 Wird auch so gefragt: ${q.qv.map(esc).join(" · ")}</p>`:""}${st?`<p class="small" style="margin:6px 0 0">${st.slice(3)}</p>`:""}</div></details>`;
  }).join("");
}
$("catBack").onclick=()=>{ location.hash="themen"; };
$("catPlay").onclick=()=>startSolo(String(catTopic));
$("catOpenAll").onclick=()=>{ catAllOpen=!catAllOpen; renderCatalog(); };

/* ================= FRAGEN-RENDERER (gemeinsam) ================= */
let cur=null;
function renderQuestion(q, opts){
  if(cur) clearInterval(cur.timerId);
  cur={q,sel:null,matchSel:null,answered:false,onDone:opts.onDone,deadline:opts.deadline,limit:opts.noTime?0:(opts.limit!=null?opts.limit:TIME[q.type]),paused:false};
  $("tBar").parentElement.classList.toggle("hidden",!cur.limit);
  show("vQuiz");
  $("qCount").textContent=opts.label; $("qTopic").textContent=TOPICS[q.t];
  $("qType").textContent = TYPE_LABEL[q.type]||"";
  $("qText").textContent=q.q; $("qFb").innerHTML=""; $("qScore").textContent=fmt(opts.score||0);
  $("actBtn").classList.remove("hidden"); $("liveWait").classList.add("hidden"); $("hostReveal").classList.add("hidden");
  $("pauseBtn").classList.toggle("hidden",!opts.canPause||!cur.limit);
  const body=$("qBody"); body.innerHTML="";
  if(q.type==="mc"){
    cur.shuffled = opts.order ? opts.order.map(i=>({t:q.o[i],i})) : shuffle(q.o.map((t,i)=>({t,i})));
    const box=document.createElement("div"); box.className="opts";
    cur.shuffled.forEach((o,k)=>{const b=document.createElement("button");b.className="opt";
      b.innerHTML=`<span class="sh" style="background:${SHCOL[k]}">${SHAPES[k]}</span><span></span>`; b.lastChild.textContent=o.t;
      b.onclick=()=>{if(cur.answered)return;cur.sel=k;[...box.children].forEach((c,j)=>c.classList.toggle("sel",j===k));upd();};box.appendChild(b);});
    body.appendChild(box);
  } else if(q.type==="multi"){
    cur.shuffled=shuffle(q.o.map((t,i)=>({t,i}))); cur.msel=new Set();
    const hint=document.createElement("p"); hint.className="muted small"; hint.style.margin="0 0 8px"; hint.textContent="☑️ Mehrere Antworten sind richtig – wähle alle passenden aus."; body.appendChild(hint);
    const box=document.createElement("div"); box.className="opts"; box.id="multiBox";
    cur.shuffled.forEach((o,k)=>{ const b=document.createElement("button"); b.className="opt"; b.setAttribute("role","checkbox"); b.setAttribute("aria-checked","false");
      b.innerHTML=`<span class="ck">☐</span><span></span>`; b.lastChild.textContent=o.t;
      b.onclick=()=>{ if(cur.answered) return; if(cur.msel.has(k)) cur.msel.delete(k); else cur.msel.add(k); drawMulti(); upd(); }; box.appendChild(b); });
    body.appendChild(box);
  } else if(q.type==="order"){
    do{ cur.shuffled=shuffle(q.items.map((t,i)=>({t,i}))); } while(q.items.length>1 && cur.shuffled.every((x,k)=>x.i===k));
    cur.seq=[];
    const hint=document.createElement("p"); hint.className="muted small"; hint.style.margin="0 0 8px"; hint.textContent="🔢 Tippe die Schritte in der richtigen Reihenfolge an. Nochmal tippen nimmt ihn (und alle danach) zurück."; body.appendChild(hint);
    const box=document.createElement("div"); box.className="opts"; box.id="orderBox";
    cur.shuffled.forEach((o,k)=>{ const b=document.createElement("button"); b.className="opt";
      b.innerHTML=`<span class="num empty"></span><span></span>`; b.lastChild.textContent=o.t;
      b.onclick=()=>{ if(cur.answered) return; const pos=cur.seq.indexOf(k); if(pos>=0) cur.seq=cur.seq.slice(0,pos); else cur.seq.push(k); drawOrder(); upd(); }; box.appendChild(b); });
    body.appendChild(box);
  } else if(q.type==="match"){
    cur.shuffled = shuffle(q.items.map((it,i)=>({t:it[0],c:it[1],i}))); cur.matchSel=cur.shuffled.map(()=>null);
    const box=document.createElement("div"); box.className="match";
    cur.shuffled.forEach((it,k)=>{const d=document.createElement("div");d.className="mitem";
      const p=document.createElement("p");p.textContent=it.t;d.appendChild(p);
      const ch=document.createElement("div");ch.className="mchoices";
      q.cats.forEach((c,ci)=>{const b=document.createElement("button");b.textContent=c;
        b.onclick=()=>{if(cur.answered)return;cur.matchSel[k]=ci;[...ch.children].forEach((x,j)=>x.classList.toggle("sel",j===ci));upd();};ch.appendChild(b);});
      d.appendChild(ch);box.appendChild(d);});
    body.appendChild(box);
  } else {
    const r=document.createElement("div");r.className="row";
    r.innerHTML=`<input id="numIn" inputmode="decimal" type="text" placeholder="Ergebnis eingeben" autocomplete="off">${q.unit?`<span class="chip">${esc(q.unit)}</span>`:""}`;
    body.appendChild(r); const inp=$("numIn"); inp.addEventListener("input",upd);
    inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!$("actBtn").disabled)$("actBtn").click();});
  }
  $("actBtn").textContent="Antwort abgeben"; upd();
  tick(); cur.timerId=setInterval(tick,200);
}
function drawMulti(){ [...$("multiBox").children].forEach((b,k)=>{ const on=cur.msel.has(k); b.classList.toggle("sel",on); b.firstChild.textContent=on?"☑":"☐"; b.setAttribute("aria-checked",on); }); }
function drawOrder(){ [...$("orderBox").children].forEach((b,k)=>{ const p=cur.seq.indexOf(k); b.classList.toggle("sel",p>=0); b.firstChild.textContent=p>=0?p+1:""; b.firstChild.classList.toggle("empty",p<0); }); }
// nur für automatische Tests: aktuelle Frage richtig (good) oder falsch ausfüllen
window.__fill=good=>{ const q=cur.q;
  if(q.type==="multi"){ cur.msel=new Set(); cur.shuffled.forEach((o,k)=>{ const c=q.c.includes(o.i); if(good?c:!c) cur.msel.add(k); }); drawMulti(); }
  else if(q.type==="order"){ const idx=cur.shuffled.map((o,k)=>({o,k})).sort((a,b)=>a.o.i-b.o.i).map(x=>x.k); cur.seq=good?idx:idx.slice().reverse(); drawOrder(); }
  upd(); };
function parseNum(s){s=String(s).trim().replace(/\s|€|%/g,""); if(!s)return NaN;
  if(/,/.test(s)) s=s.replace(/\./g,"").replace(",","."); else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,""); return Number(s);}
function upd(){
  if(!cur) return;
  if(cur.answered){ $("actBtn").disabled=!cur.next; return; }
  const q=cur.q; let ok=false;
  if(q.type==="mc") ok=cur.sel!==null; else if(q.type==="multi") ok=cur.msel.size>0; else if(q.type==="order") ok=cur.seq.length===q.items.length; else if(q.type==="match") ok=cur.matchSel.every(v=>v!==null); else ok=!isNaN(parseNum(($("numIn")||{}).value||""));
  $("actBtn").disabled=!ok;
}
function timeLeft(){ if(!cur) return 0; if(cur.paused) return cur.pausedLeft/1000; return Math.max(0,(cur.deadline-Date.now())/1000); }
function tick(){
  if(!cur) return;
  if(!cur.limit){ $("tLeft").textContent="⏱ ohne Zeitlimit"; return; }
  const left=timeLeft();
  $("tBar").style.width=Math.min(100,left/cur.limit*100)+"%"; $("tLeft").textContent=Math.ceil(left)+" s";
  if(!cur.answered && !cur.paused && left<=0){ submit(true); }
}
function score(){
  const q=cur.q; let frac=0, choice=null;
  if(q.type==="mc"){ if(cur.sel!==null){choice=cur.shuffled[cur.sel].i; frac=choice===q.a?1:0;} }
  else if(q.type==="multi"){ let hits=0,bad=0; cur.msel.forEach(k=>{ if(q.c.includes(cur.shuffled[k].i)) hits++; else bad++; }); frac=(hits===q.c.length&&!bad)?1:Math.max(0,(hits-bad)/q.c.length); }
  else if(q.type==="order"){ const n=cur.seq.filter((k,p)=>cur.shuffled[k].i===p).length; frac=n/q.items.length; }
  else if(q.type==="match"){ let n=0; cur.shuffled.forEach((it,k)=>{if(cur.matchSel[k]===it.c)n++;}); frac=n/q.items.length; }
  else { const v=parseNum(($("numIn")||{}).value||""); const tol=q.tol?Math.abs(q.a)*q.tol:0;
    if(!isNaN(v)&&Math.abs(v-q.a)<=Math.max(tol,1e-9)) frac=1;
    else if(!isNaN(v)&&q.a!==0&&Math.abs(v-q.a)<=Math.abs(q.a)*0.05) frac=0.5;   // knapp daneben (≤ 5 %) = teilweise
  }
  const pts = frac===1 ? 100 : frac>0 ? 50 : 0;   // richtig 100 · teilweise 50 · falsch 0 – kein Zeitbonus
  return {frac:Math.round(frac*1000)/1000,pts,choice};
}
function givenText(){
  const q=cur.q;
  if(q.type==="mc") return cur.sel!==null?cur.shuffled[cur.sel].t:"keine Antwort";
  if(q.type==="multi") return [...cur.msel].map(k=>cur.shuffled[k].t).join(" · ")||"keine Antwort";
  if(q.type==="order") return cur.seq.map((k,p)=>(p+1)+". "+cur.shuffled[k].t).join(" → ")||"keine Antwort";
  if(q.type==="match") return cur.shuffled.map((it,k)=>it.t+" → "+(cur.matchSel[k]!=null?q.cats[cur.matchSel[k]]:"–")).join(" · ");
  const v=(($("numIn")||{}).value||"").trim(); return v?v+(q.unit?" "+q.unit:""):"keine Antwort";
}
function sadPop(emo){
  const el=document.createElement("div"); el.className="sadpop"; el.textContent=emo; el.setAttribute("aria-hidden","true");
  document.body.appendChild(el); setTimeout(()=>el.remove(),1500);
}
function numText(q){ return (q.a%1?q.a.toLocaleString("de-DE"):fmt(q.a))+(q.unit?" "+q.unit:""); }
function showSolution(res,timeout){
  const q=cur.q, box=$("qBody").firstChild; let detail="";
  if(q.type==="mc"){ cur.shuffled.forEach((o,k)=>{if(o.i===q.a)box.children[k].classList.add("right");else if(k===cur.sel)box.children[k].classList.add("wrong");}); detail="Richtig: "+q.o[q.a]; }
  else if(q.type==="multi"){ const mb=$("multiBox"); let n=0;
      cur.shuffled.forEach((o,k)=>{ const c=q.c.includes(o.i), s=cur.msel.has(k), b=mb.children[k]; if(c&&s){b.classList.add("right");n++;} else if(s) b.classList.add("wrong"); else if(c) b.classList.add("miss"); });
      detail=`${n} von ${q.c.length} richtigen gefunden · gestrichelt = übersehen. Richtig: ${q.c.map(i=>q.o[i]).join(" · ")}`; }
  else if(q.type==="order"){ const ob=$("orderBox");
      cur.shuffled.forEach((o,k)=>{ const p=cur.seq.indexOf(k), g=p===o.i, b=ob.children[k]; b.classList.add(g?"right":"wrong");
        if(!g){ const s=document.createElement("span"); s.className="small"; s.style.marginLeft="auto"; s.innerHTML="→ <b>Platz "+(o.i+1)+"</b>"; b.appendChild(s); } });
      detail="Richtige Reihenfolge: "+q.items.map((t,i)=>(i+1)+". "+t).join(" → "); }
  else if(q.type==="match"){ let n=0; cur.shuffled.forEach((it,k)=>{const g=cur.matchSel[k]===it.c;if(g)n++;box.children[k].classList.add(g?"right":"wrong");
      if(!g){const s=document.createElement("p");s.className="small";s.style.margin="6px 0 0";s.innerHTML="→ richtig: <b>"+esc(q.cats[it.c])+"</b>";box.children[k].appendChild(s);}});
      detail=`${n} von ${q.items.length} richtig zugeordnet`; }
  else { $("numIn").disabled=true; detail=(res.frac===0.5?"Knapp daneben (höchstens 5 % Abweichung) – Rundung oder Rechenweg prüfen. ":"")+"Richtig: "+numText(q); }
  const good=res.frac===1, part=res.frac>0&&res.frac<1;
  const head= timeout&&res.frac===0?"⏰ Zeit abgelaufen":good?"✅ Richtig!":part?"🟡 Teilweise richtig":"❌ Leider falsch";
  $("qFb").innerHTML=`<div class="fb ${good?"ok":"bad"}"><b>${head} · +${res.pts} P</b><div class="small" style="margin-bottom:6px">${esc(detail)}</div>${esc(q.e)}${altHtml(q)}</div>`;
  if(good) confetti(60); else sadPop(part?"😕":"😢");
}
function submit(timeout){
  if(!cur||cur.answered) return;
  cur.answered=true; clearInterval(cur.timerId);
  const res=score(); cur.onDone(res,timeout);
}
$("actBtn").onclick=()=>{ if(!cur) return; if(!cur.answered) submit(false); else if(cur.next){ const n=cur.next; cur.next=null; $("actBtn").disabled=true; n(); } };
function stopQuiz(){ if(cur) clearInterval(cur.timerId); cur=null; solo=null; $("pauseOv").classList.add("hidden"); $("prevBtn").classList.add("hidden"); $("peekOv").classList.add("hidden"); }

/* ================= SOLO ================= */
let solo=null, lastSoloTopic="mix", lastSoloSet=null;
let soloNoTime = LS.get(G+"notime")==="1";
function setNoTime(v){ soloNoTime=!!v; LS.set(G+"notime",soloNoTime?"1":"0"); $("noTime").checked=$("noTime2").checked=soloNoTime; }
$("noTime").onchange=e=>setNoTime(e.target.checked); $("noTime2").onchange=e=>setNoTime(e.target.checked);
setNoTime(soloNoTime);
function startSolo(topic,tset){
  LS.set(G+"nick",nick()); lastSoloTopic=topic; lastSoloSet=tset||null;
  const ids=pickRound(topic,null,tset||null); if(!ids.length) return;
  solo={topic, tset:tset||null, ids, idx:0, score:0, res:[], seed:newSeed()};
  location.hash="solo"; soloQ();
}
function soloQ(){
  const seed=solo.seed+":"+solo.idx, q=qInst(QBY[solo.ids[solo.idx]],seed);
  const T=solo.topic, lim=soloNoTime||q.type==="num" ? 0 : T==="blitz" ? 10 : TIME[q.type];
  const streak=solo.res.filter(r=>r.frac===1).length;
  $("prevBtn").classList.toggle("hidden",solo.idx<1||T==="pruefung");
  renderQuestion(q,{label:T==="endlos"?`Frage ${solo.idx+1} · Serie ${streak} 🔥`:`Frage ${solo.idx+1}/${solo.ids.length}`,score:solo.score,canPause:T!=="blitz",deadline:lim?Date.now()+lim*1000:0,limit:lim,
    onDone:(res,timeout)=>{ solo.score+=res.pts; solo.res.push({id:q.id,seed,frac:res.frac,pts:res.pts,given:givenText(),timeout}); markSeen(q.id,res.frac===1);
      if(T==="wrong" && res.frac===1){ progress.wrong[q.id]=0; LS.set(P+"progress",JSON.stringify(progress)); }
      $("qScore").textContent=fmt(solo.score);
      if(T==="pruefung"){   // Klausur-Simulation: Auflösung erst am Ende
        $("qBody").querySelectorAll("button,input").forEach(el=>el.disabled=true);
        $("qFb").innerHTML=`<div class="fb ok"><b>${timeout?"⏰ Zeit abgelaufen – ":""}Antwort gespeichert ✓</b>Die Auflösung gibt es am Ende – wie in der Klausur.</div>`;
      } else showSolution(res,timeout);
      const over = T==="endlos" && res.frac<1;
      $("actBtn").textContent= !over && solo.idx+1<solo.ids.length?"Weiter →":"Auswertung anzeigen";
      cur.next=()=>{ if(over){ soloEnd(); return; } solo.idx++; if(solo.idx<solo.ids.length) soloQ(); else soloEnd(); }; upd(); }});
}
$("pauseBtn").onclick=()=>{
  if(live.code){ if(live.isHost) hostPause(); return; }
  if(!cur) return;
  if(!cur.answered){ cur.pausedLeft=Math.max(0,cur.deadline-Date.now()); cur.paused=true; }
  $("pauseTitle").textContent="Pause"; $("pauseTxt").textContent="Die Zeit ist angehalten, die Frage ist versteckt."; $("resumeBtn").classList.remove("hidden"); $("pauseOv").classList.remove("hidden");
};
$("resumeBtn").onclick=()=>{
  if(live.code&&live.isHost){ hostResume(); return; }
  $("pauseOv").classList.add("hidden");
  if(cur&&cur.paused){ cur.deadline=Date.now()+cur.pausedLeft; cur.paused=false; }
};
/* ---------- Vorherige Fragen der Runde ansehen (nur lesen) ---------- */
let peekIdx=0, peekPaused=false;
function openPeek(){
  if(!solo||!solo.res.length) return;
  peekPaused=false;
  if(cur && !cur.answered && !cur.paused){ cur.pausedLeft=Math.max(0,cur.deadline-Date.now()); cur.paused=true; peekPaused=true; }
  peekIdx = cur&&cur.answered ? solo.res.length-2 : solo.res.length-1;
  if(peekIdx<0) peekIdx=solo.res.length-1;
  renderPeek(); $("peekOv").classList.remove("hidden"); $("peekOv").scrollTop=0;
}
function renderPeek(){
  const r=solo.res[peekIdx], q=resQ(r);
  $("peekTitle").textContent=`Frage ${peekIdx+1} von ${solo.ids.length}`; $("peekTopic").textContent=TOPICS[q.t];
  $("peekQ").textContent=q.q;
  const good=r.frac===1, part=r.frac>0&&r.frac<1;
  $("peekMine").innerHTML=`<div class="fb ${good?"ok":"bad"}"><b>${good?"✅ Richtig":part?"🟡 Teilweise richtig":r.timeout&&!r.frac?"⏰ Zeit abgelaufen":"❌ Falsch"} · +${r.pts} P</b><div class="small">Deine Antwort: ${esc(r.given||"–")}</div></div>`;
  $("peekSol").innerHTML=`<b style="color:var(--ok)">Lösung:</b> ${esc(solText(q))}`;
  $("peekExp").innerHTML=esc(q.e)+altHtml(q);
  const maxIdx = solo.res.length-1;
  $("peekPrev").disabled=peekIdx<=0; $("peekNext").disabled=peekIdx>=maxIdx;
}
$("prevBtn").onclick=openPeek;
$("peekPrev").onclick=()=>{ if(peekIdx>0){ peekIdx--; renderPeek(); } };
$("peekNext").onclick=()=>{ if(peekIdx<solo.res.length-1){ peekIdx++; renderPeek(); } };
$("peekClose").onclick=()=>{
  $("peekOv").classList.add("hidden");
  if(peekPaused && cur && cur.paused){ cur.deadline=Date.now()+cur.pausedLeft; cur.paused=false; }
  peekPaused=false;
};
async function soloEnd(){
  if(cur) clearInterval(cur.timerId);
  const s=solo; s.done=true; $("prevBtn").classList.add("hidden"); go("vEnd","ergebnis");
  $("endWrong").textContent=`❌ Falsche nochmal üben (${wrongQs().length})`; $("endWrong").classList.toggle("hidden",!wrongQs().length);
  const right=s.res.filter(r=>r.frac===1).length, max=s.ids.length*100;
  $("endMode").textContent = topicLabel(s.topic) + (s.tset ? " · "+(s.tset.size===1?TOPICS[[...s.tset][0]]:s.tset.size+" Themen") : "");
  $("endScore").textContent=fmt(s.score)+" P"; $("endDetail").textContent= s.topic==="endlos" ? `${right} richtig in Folge 🔥 (von ${s.ids.length} Fragen${s.tset?" in deiner Auswahl":" im Fach"})` : `${right}/${s.ids.length} komplett richtig · max. ${fmt(max)} P`;
  renderTopicStats(s.res,$("topicBox")); renderReview(s.res,$("reviewBox"));
  $("copyState").textContent=""; $("saveState").textContent= BE.ok?"Wird in der Rangliste gespeichert …":"Offline – nicht in der Rangliste gespeichert.";
  let newBest=false;
  const ok=await saveRank(d=>{
    if(s.topic!=="wrong" && !s.tset){   // eigene Themen-Auswahl: nur Statistik   // „Falsche nochmal“ zählt nur in die Statistik, nicht als Bestwert
      const k=s.topic==="mix"?null:tkey(s.topic); const prev=(k?d.topics[k]:d.mix)||{};
      newBest = s.score>(Number(prev.best)||0);
      const entry={best:Math.max(Number(prev.best)||0,s.score),last:s.score,runs:(Number(prev.runs)||0)+1};
      if(k) d.topics[k]=entry; else d.mix=entry;
    }
    addStats(d,s.res); d.games=(d.games||0)+1;
  });
  if(ok && s.tset) $("saveState").textContent="✓ In der Statistik gespeichert (eigene Auswahl – kein Bestwert).";
  else if(ok) $("saveState").textContent = newBest ? "🏆 Neuer Bestwert in der Rangliste!" : "✓ In der Rangliste gespeichert.";
  else if(BE.ok) $("saveState").textContent="Speichern hat nicht geklappt – Internet prüfen.";
  confetti(newBest?260:140);
}
function renderTopicStats(res,el){
  const by={}; res.forEach(r=>{const t=TOPICS[QBY[r.id].t];(by[t]=by[t]||{s:0,n:0});by[t].s+=r.frac;by[t].n++;});
  el.innerHTML=Object.entries(by).sort((a,b)=>a[1].s/a[1].n-b[1].s/b[1].n).map(([t,v])=>topicBar(t,Math.round(v.s/v.n*100),"")).join("");
}
function topicBar(label,p,extra){
  const cls=p>=75?"":p>=50?"mid":"low";
  return `<div class="topicrow"><div class="row"><span>${esc(label)}</span><b>${p==null?"–":p+" %"}</b></div><div class="bar ${cls}"><div style="width:${p||0}%"></div></div>${extra?`<div class="muted small">${extra}</div>`:""}</div>`;
}
function solText(q){ if(q.type==="multi") return q.c.map(i=>q.o[i]).join(" · "); if(q.type==="order") return q.items.map((t,i)=>(i+1)+". "+t).join(" → ");
  return q.type==="mc"? q.o[q.a] : q.type==="num"? numText(q) : q.items.map(it=>it[0]+" → "+q.cats[it[1]]).join(" · "); }
function renderReview(res,el){
  const wrong=res.filter(r=>r.frac<1);
  el.innerHTML= wrong.length? wrong.map(r=>{const q=resQ(r);
    return `<div class="review"><span class="chip">${esc(TOPICS[q.t])}</span><p style="margin:6px 0"><b>${esc(q.q)}</b></p><p class="small" style="margin:0 0 4px"><b style="color:var(--ok)">Lösung:</b> ${esc(solText(q))}</p><p class="small muted" style="margin:0">${esc(q.e)}</p></div>`}).join("") : "<p>Keine Fehler – stark! 💪</p>";
}
$("againBtn").onclick=()=>startSolo(lastSoloTopic,lastSoloSet);
$("homeBtn").onclick=()=>{location.hash="";};
$("podHome").onclick=()=>{location.hash="";};
$("copyBtn").onclick=()=>shareText(`⚔️ ${APP} · ${FACH.kurzname} (${$("endMode").textContent}): ${nick()} hat ${$("endScore").textContent} – ${$("endDetail").textContent}. Schlag mich! 😎 ${BASE}`,$("copyState"));
async function shareText(txt,stateEl){
  try{ if(navigator.share){ await navigator.share({text:txt}); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(txt); if(stateEl) stateEl.textContent="Kopiert – ab in die Gruppe damit!"; }
  catch(e){ if(stateEl) stateEl.textContent=txt; }
}
function waLink(txt){ return "https://wa.me/?text="+encodeURIComponent(txt); }

/* ================= RANGLISTE ================= */
// Ein Dokument ranking/{uid} pro Person: BWL-Werte oben (wie bisher), weitere Fächer unter f.<kurz>
let rankRaw=[], rankRows=[], rankLoaded=false;   // rankRows = Sicht auf das aktuelle Fach
const myRank = () => rankRows.find(r=>r.id===me);
function blankRank(){ return Object.assign({nick:"",at:0},normFach({})); }
function normFach(d){ d=d||{}; return {total:Number(d.total)||0,games:Number(d.games)||0,mix:d.mix||null,topics:Object.assign({},d.topics||{}),st:Object.assign({},d.st||{}),dw:Object.assign({},d.dw||{})}; }
function fachData(raw,kurz){ return (kurz||"bwl")==="bwl" ? normFach(raw) : normFach(((raw||{}).f||{})[kurz]); }
function allTotal(raw){ return FAECHER.reduce((s,f)=>s+fachData(raw,f.kurz).total,0); }
function fachRows(kurz){ return rankRaw.map(r=>Object.assign({id:r.id,nick:r.nick||"",at:Number(r.at)||0},fachData(r,kurz||FACH.kurz))); }
function addStats(d,res){ res.forEach(r=>{ const q=QBY[r.id]; if(!q) return; const k=tkey(q.t); const s=d.st[k]||{n:0,s:0};
  d.st[k]={n:s.n+1,s:Math.round((s.s+(Number(r.frac)||0))*1000)/1000}; d.total+=Number(r.pts)||0; }); }
let rankChain=Promise.resolve();
function saveRank(mut,kurz){
  kurz=kurz||FACH.kurz;
  const run=async()=>{
    if(!BE.ok||!me) return false;
    try{ const raw=(await BE.get("ranking/"+me))||{}; const d=fachData(raw,kurz); mut(d);
      const out=Object.assign({},raw);
      if(kurz==="bwl") Object.assign(out,d); else out.f=Object.assign({},raw.f||{},{[kurz]:d});
      out.nick=nick()||raw.nick||"?"; out.at=Date.now();
      await BE.set("ranking/"+me,out); return true; }catch(e){ console.warn(e); return false; }
  };
  const p=rankChain.then(run); rankChain=p.catch(()=>{}); return p;
}
function acc(r,k){ const s=k?(r.st||{})[k]:Object.values(r.st||{}).reduce((a,v)=>({n:a.n+(v.n||0),s:a.s+(v.s||0)}),{n:0,s:0}); return s&&s.n?{p:Math.round(s.s/s.n*100),n:s.n}:{p:null,n:0}; }
function duelRec(r){ const v=Object.values(r.dw||{}); return {w:v.filter(x=>x==="w").length,l:v.filter(x=>x==="l").length,d:v.filter(x=>x==="d").length}; }
const MINN = 3;
$("rankSel").onchange=renderRank;
function rankList(mode){
  if(mode==="all") return rankRaw.filter(r=>r.nick).map(r=>({r:{id:r.id,nick:r.nick},t:allTotal(r),parts:FAECHER.map(f=>({f,t:fachData(r,f.kurz).total})).filter(x=>x.t>0)}))
    .filter(x=>x.t>0).sort((a,b)=>b.t-a.t).map(x=>({r:x.r,v:fmt(x.t)+" P",sub:x.parts.map(p=>p.f.kurzname+" "+fmt(p.t)).join(" · ")}));
  const rows=rankRows.filter(r=>r.nick);
  if(mode==="total") return rows.filter(r=>r.total>0).sort((a,b)=>b.total-a.total).map(r=>({r,v:fmt(r.total)+" P",sub:pl(r.games||0,"Runde","Runden")}));
  if(["calc","endlos","blitz","pruefung"].includes(mode)){ const k="t"+mode; return rows.filter(r=>r.topics[k]&&r.topics[k].best!=null).sort((a,b)=>b.topics[k].best-a.topics[k].best).map(r=>({r,v:fmt(r.topics[k].best)+" P",sub:`${r.topics[k].runs||1}× gespielt`})); }
  if(mode==="mix") return rows.filter(r=>r.mix&&r.mix.best!=null).sort((a,b)=>b.mix.best-a.mix.best).map(r=>({r,v:fmt(r.mix.best)+" P",sub:`${r.mix.runs||1}× gespielt`}));
  if(mode==="duel") return rows.map(r=>({r,d:duelRec(r)})).filter(x=>x.d.w+x.d.l+x.d.d>0).sort((a,b)=>b.d.w-a.d.w||a.d.l-b.d.l||b.d.d-a.d.d).map(x=>({r:x.r,v:pl(x.d.w,"Sieg","Siege"),sub:`${x.d.w} S · ${x.d.d} U · ${x.d.l} N`}));
  if(mode==="acc") return rows.map(r=>({r,a:acc(r)})).filter(x=>x.a.n>=5).sort((a,b)=>b.a.p-a.a.p||b.a.n-a.a.n).map(x=>({r:x.r,v:x.a.p+" %",sub:pl(x.a.n,"Antwort","Antworten")}));
  if(/^t\d+$/.test(mode)) return rows.map(r=>({r,a:acc(r,mode),b:((r.topics||{})[mode]||{}).best})).filter(x=>x.a.n>=1||x.b!=null)
    .sort((a,b)=>((b.a.n>=MINN?b.a.p:-1)-(a.a.n>=MINN?a.a.p:-1))||((b.b||0)-(a.b||0))).map(x=>({r:x.r,v:x.a.p!=null?x.a.p+" %":"–",sub:pl(x.a.n,"Antwort","Antworten")+(x.b!=null?` · Bestwert ${fmt(x.b)} P`:"")+(x.a.n<MINN?" · noch zu wenige":"")}));
  return [];
}
function rankTable(list,limit){
  if(!list.length) return `<p class="muted">Noch keine Einträge – sei die oder der Erste!</p>`;
  const myPos=list.findIndex(x=>x.r.id===me);
  let shown=list.slice(0,limit||list.length);
  const rowHtml=(x,i)=>`<tr class="click ${x.r.id===me?"me":""}" data-uid="${esc(x.r.id)}"><td>${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td><td>${esc(x.r.nick)}<div class="muted small">${esc(x.sub||"")}</div></td><td class="num"><b>${esc(x.v)}</b></td></tr>`;
  let html=`<table><tr><th>#</th><th>Name</th><th class="num">Wert</th></tr>`+shown.map(rowHtml).join("");
  if(limit && myPos>=limit) html+=rowHtml(list[myPos],myPos);
  return html+`</table>`;
}
function bindRankClicks(el){ el.querySelectorAll("tr[data-uid]").forEach(tr=>tr.onclick=()=>openProfile(tr.dataset.uid)); }
function renderMini(){
  const el=$("lbMini");
  if(!BE.ok){ el.innerHTML=`<p class="muted">${rankLoaded||BE.error?"Keine Verbindung zur Rangliste – Solo und „Ein Handy, reihum“ funktionieren trotzdem.":"Rangliste wird geladen …"}</p>`; return; }
  el.innerHTML=`<p class="muted small" style="margin:0 0 4px">🏅 Gesamtpunkte · ${esc(FACH.kurzname)}</p>`+rankTable(rankList("total"),5); bindRankClicks(el);
}
function renderRank(){
  const mode=$("rankSel").value, box=$("rankBox");
  const hints={all:"Alle Punkte aus allen Fächern zusammen.",total:"Alle Punkte in diesem Fach aus Solo-Runden, Duellen und Live-Battles.",mix:"Bester Punktestand in einer Solo-Runde „Gemischt“ (15 Fragen).",
    duel:"Gewonnene Duelle. S = Sieg, U = Unentschieden, N = Niederlage.",acc:"Anteil richtiger Antworten über alle Modi (ab 5 Antworten).",
    map:"Für jedes Thema: wer die höchste Trefferquote hat (ab "+MINN+" Antworten im Thema).",endlos:"Beste Endlos-Runde (bis zum ersten Fehler).",blitz:"Beste Blitzrunde (15 Fragen, 10 s).",pruefung:"Beste Klausur-Simulation (20 Fragen).",calc:"Bester Punktestand in einer Solo-Runde „Nur Rechnen“."};
  $("rankHint").textContent= hints[mode] || "Trefferquote in diesem Thema über alle Modi – Bestwert = beste Solo-Runde in diesem Thema.";
  if(!BE.ok){ box.innerHTML=`<p class="muted">Keine Verbindung zur Rangliste.</p>`; return; }
  if(mode==="map"){
    const rows=rankRows.filter(r=>r.nick);
    box.innerHTML=`<div class="stars">`+TOPICS.map((t,i)=>{ const k=tkey(i);
      const best=rows.map(r=>({r,a:acc(r,k)})).filter(x=>x.a.n>=MINN).sort((a,b)=>b.a.p-a.a.p||b.a.n-a.a.n)[0];
      return `<div><span>${esc(t)}</span>${best?`<span class="click" data-uid="${esc(best.r.id)}" style="cursor:pointer">👑 <b>${esc(best.r.nick)}</b> · ${best.a.p} %</span>`:`<span class="muted">noch offen</span>`}</div>`;}).join("")+`</div>`;
    box.querySelectorAll("[data-uid]").forEach(s=>s.onclick=()=>openProfile(s.dataset.uid)); return;
  }
  box.innerHTML=rankTable(rankList(mode)); bindRankClicks(box);
}
let profileUid=null;
function openProfile(uid){
  if(!uid) return;
  profileUid=uid;
  go("vProfile","profil"); renderProfile();
}
$("profBack").onclick=()=>{ history.back(); };
window.addEventListener("hashchange",()=>{ if(location.hash==="#profil"&&profileUid){ show("vProfile"); renderProfile(); } });
function renderProfile(){
  const r=rankRows.find(x=>x.id===profileUid) || (profileUid===me?Object.assign({id:me},blankRank(),{nick:nick()}):null);
  if(!r){ $("profName").textContent="Unbekannt"; return; }
  const isMe=r.id===me, a=acc(r), dr=duelRec(r);
  $("profName").textContent=(isMe?"📊 ":"👤 ")+(r.nick||"?")+(isMe?" (du)":"");
  const raw=rankRaw.find(x=>x.id===r.id);
  const perFach = FAECHER.length>1&&raw ? " · Alle Fächer: "+fmt(allTotal(raw))+" P" : "";
  $("profSub").textContent=`${FACH.kurzname}: ${fmt(r.total)} Punkte · ${pl(r.games||0,"Runde","Runden")} · Trefferquote ${a.p!=null?a.p+" %":"–"} · Duelle ${dr.w} S / ${dr.d} U / ${dr.l} N`+perFach;
  $("profDuel").classList.toggle("hidden",isMe||!BE.ok||!nick());
  $("profDuel").onclick=()=>createDuel(r.id,r.nick);
  const ts=TOPICS.map((t,i)=>({t,i,a:acc(r,tkey(i))}));
  const known=ts.filter(x=>x.a.n>=MINN);
  const strong=known.slice().sort((x,y)=>y.a.p-x.a.p).filter(x=>x.a.p>=60).slice(0,3);
  const weak=known.slice().sort((x,y)=>x.a.p-y.a.p).filter(x=>x.a.p<80&&!strong.includes(x)).slice(0,3);
  const line=x=>topicBar(x.t,x.a.p,pl(x.a.n,"Antwort","Antworten"));
  $("profStrong").innerHTML=strong.length?strong.map(line).join(""):`<p class="muted small">Noch nicht genug gespielt (ab ${MINN} Antworten pro Thema).</p>`;
  $("profWeak").innerHTML=weak.length?weak.map(line).join(""):`<p class="muted small">${known.length?"Keine Schwachstellen in Sicht 💪":"Noch nicht genug gespielt."}</p>`;
  $("profTopics").innerHTML=ts.map(x=>topicBar(x.t,x.a.p,x.a.n?pl(x.a.n,"Antwort","Antworten")+(((r.topics||{})[tkey(x.i)]||{}).best!=null?` · Bestwert ${fmt(r.topics[tkey(x.i)].best)} P`:""):"noch nicht gespielt")).join("");
}
function startRankWatch(){
  const to=setTimeout(()=>{ if(!rankLoaded) $("lbState").textContent="lädt langsam …"; },10000);
  BE.onQuery("ranking",[],500,rows=>{ clearTimeout(to); rankLoaded=true; $("lbState").textContent=""; rankRaw=rows; rankRows=fachRows();
      renderMini(); if(isShown("vRank")) renderRank(); if(isShown("vProfile")) renderProfile(); if(isShown("vTopics")) renderTopics(); if(isShown("vDuelNew")) renderDuelNew();
      duelsRecordResults(); },
    ()=>{ clearTimeout(to); $("lbState").textContent="nicht erreichbar"; });
}

/* ================= DUELLE (wie Quizduell) ================= */
const DR=6, DQ=3;
const duel={mine:[],openList:[],all:{},openId:null,playing:null,unsub:[],closing:new Set()};
function hashStr(s){ let h=2166136261; for(const c of s){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function seeded(seed){ let a=hashStr(seed); return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const who = (d,uid) => d.a===uid?"a":d.b===uid?"b":null;
const ansOf = (d,w,r) => (((d["r"+w]||{})[r])||[]);
const chooser = (d,r) => r%2===0?d.a:d.b;
const opName = d => (d.a===me?d.bn:d.an)||"???";
function duelTotals(d,w){ let c=0,p=0; for(let r=0;r<DR;r++) ansOf(d,w,r).forEach(x=>{ if(x.f===1)c++; p+=Number(x.p)||0; }); return {c,p}; }
function bothDone(d){ for(let r=0;r<DR;r++){ if(ansOf(d,"a",r).length<DQ||ansOf(d,"b",r).length<DQ) return false; } return true; }
function duelNext(d){
  const w=who(d,me);
  if(d.status==="done") return {k:"done"};
  if(!w) return d.status==="open"?{k:"join"}:{k:"none"};
  for(let r=0;r<DR;r++){
    if(ansOf(d,w,r).length>=DQ) continue;
    if(d.status==="open" && r>0) return {k:"waitjoin",r};
    if((d.rd||{})[r]) return {k:"play",r};
    if(chooser(d,r)===me) return {k:"choose",r};
    return {k:"wait",r};
  }
  return {k:"waitfinish"};
}
function duelResult(d){
  const w=who(d,me); if(!w) return null; const o=w==="a"?"b":"a";
  if(d.gaveUp) return d.gaveUp===me?"l":"w";
  const A=duelTotals(d,w), B=duelTotals(d,o);
  return A.c>B.c?"w":A.c<B.c?"l":A.p>B.p?"w":A.p<B.p?"l":"d";
}
function duelsWatch(){
  duel.unsub.forEach(u=>u()); duel.unsub=[];
  duel.unsub.push(BE.onQuery("duels",[["p","array-contains",me]],100,rows=>{ duel.mine=rows; duelsChanged(); }));
  duel.unsub.push(BE.onQuery("duels",[["status","==","open"]],50,rows=>{ duel.openList=rows; duelsChanged(); }));
}
function duelsChanged(){
  duel.all={}; (duel.openList||[]).concat(duel.mine).forEach(d=>duel.all[d.id]=d);
  // fertige Duelle abschließen (wer zuletzt spielt oder wer es zuerst sieht)
  duel.mine.forEach(d=>{ if(d.status==="active"&&bothDone(d)&&!duel.closing.has(d.id)){ duel.closing.add(d.id); BE.update("duels/"+d.id,{status:"done",up:Date.now(),by:me}).catch(()=>{}); } });
  duelsRecordResults();
  renderDuelBadge();
  if(isShown("vDuels")) renderDuelList();
  if(isShown("vDuel") && duel.openId && !duel.playing) renderDuel();
  if(isShown("vHome")) renderInvite();
}
let recording=false;
async function duelsRecordResults(){
  if(recording||!rankLoaded) return; const raw=rankRaw.find(x=>x.id===me)||{};
  const todo=duel.mine.filter(d=>d.status==="done"&&who(d,me)&&!fachData(raw,d.fach).dw[d.id]);
  if(!todo.length) return; recording=true;
  try{ for(const k of new Set(todo.map(d=>d.fach||"bwl"))){ await saveRank(x=>{ todo.filter(d=>(d.fach||"bwl")===k).forEach(d=>{ x.dw[d.id]=duelResult(d); }); },k); } } finally{ recording=false; }
}
function renderDuelBadge(){
  const n=duel.mine.filter(d=>{const k=duelNext(d).k;return k==="play"||k==="choose";}).length;
  $("duelBadge").textContent=n+"× du bist dran"; $("duelBadge").classList.toggle("hidden",!n);
}
function duelLine(d){
  const n=duelNext(d), w=who(d,me);
  let st="", go=false;
  if(n.k==="choose"||n.k==="play"){ st=`Runde ${n.r+1}/${DR} – du bist dran!`; go=true; }
  else if(n.k==="wait") st=`Runde ${n.r+1}/${DR} – ${opName(d)} ist dran`;
  else if(n.k==="waitjoin") st="Wartet, bis jemand den Link öffnet";
  else if(n.k==="waitfinish") st=`${opName(d)} spielt noch die letzte Runde`;
  else if(n.k==="join") st="Offene Herausforderung";
  else if(n.k==="done"){ const r=duelResult(d); st= d.gaveUp?(d.gaveUp===me?"Aufgegeben":"Gegner:in hat aufgegeben"):""; st=(r==="w"?"🏆 Gewonnen":r==="l"?"Verloren":"🤝 Unentschieden")+(st?" · "+st:""); }
  let score="";
  if(w){ const o=w==="a"?"b":"a"; score=`${duelTotals(d,w).c} : ${duelTotals(d,o).c}`; }
  const name = w ? opName(d) : (d.an||"?");
  const fl = FAECHER.length>1 ? `<span class="chip">${esc(fachBy(d.fach).icon||"")} ${esc(fachBy(d.fach).kurzname)}</span> ` : "";
  return `<button data-id="${esc(d.id)}"><span>${fl}<b>${w?"vs ":"⚔️ "}${esc(name)}</b><br><span class="st ${go?"go":""}">${esc(st)}</span></span><b>${esc(score)}</b></button>`;
}
function renderDuelList(){
  const mine=duel.mine.slice().sort((a,b)=>(b.up||0)-(a.up||0));
  const turn=mine.filter(d=>{const k=duelNext(d).k;return k==="play"||k==="choose";});
  const waiting=mine.filter(d=>{const k=duelNext(d).k;return k==="wait"||k==="waitjoin"||k==="waitfinish";});
  const done=mine.filter(d=>d.status==="done").slice(0,15);
  const open=(duel.openList||[]).filter(d=>d.a!==me&&Date.now()-(d.at||0)<14*864e5).sort((a,b)=>(b.at||0)-(a.at||0));
  const sec=(title,list,empty)=>`<div class="card"><h2>${title}</h2>${list.length?`<div class="dlist">${list.map(duelLine).join("")}</div>`:`<p class="muted small" style="margin:0">${empty}</p>`}</div>`;
  $("duelLists").innerHTML= sec("🔥 Du bist dran",turn,"Gerade nichts zu tun.")+sec("⏳ Warte auf Gegner:in",waiting,"Keine laufenden Duelle.")+
    (open.length?sec("🙋 Offene Herausforderungen",open,""):"")+sec("✅ Beendet",done,"Noch keine beendeten Duelle.");
  $("duelLists").querySelectorAll("button[data-id]").forEach(b=>b.onclick=()=>openDuel(b.dataset.id));
}
$("duelNewBtn").onclick=()=>{ go("vDuelNew","duell-neu"); $("dnMsg").textContent=""; $("dnSearch").value=""; renderDuelNew(); };
$("dnBack").onclick=()=>{ location.hash="duelle"; };
$("dnSearch").oninput=renderDuelNew;
function renderDuelNew(){
  const f=$("dnSearch").value.trim().toLowerCase();
  const list=rankRows.filter(r=>r.id!==me&&r.nick&&(!f||r.nick.toLowerCase().includes(f))).sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,40);
  $("dnList").innerHTML=list.length?list.map(r=>{const a=acc(r);return `<button data-uid="${esc(r.id)}"><span><b>${esc(r.nick)}</b><br><span class="st">${fmt(r.total)} P${a.p!=null?" · "+a.p+" % richtig":""}</span></span><span>⚔️</span></button>`;}).join("")
    :`<p class="muted small" style="margin:0">${f?"Niemand gefunden.":"Noch niemand in der Rangliste – lade per Link ein!"}</p>`;
  $("dnList").querySelectorAll("button").forEach(b=>b.onclick=()=>{ const r=rankRows.find(x=>x.id===b.dataset.uid); createDuel(r.id,r.nick); });
}
$("dnLink").onclick=()=>createDuel(null,"");
async function createDuel(opp,oppNick){
  if(!BE.ok||!nick()) return;
  const id=Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
  const d={fach:FACH.kurz,a:me,an:nick(),b:opp||null,bn:oppNick||"",p:opp?[me,opp]:[me],status:opp?"active":"open",rd:{},ra:{},rb:{},at:Date.now(),up:Date.now(),by:me};
  try{ await BE.set("duels/"+id,d); }catch(e){ $("dnMsg").textContent="Duell konnte nicht erstellt werden – Internet prüfen."; return; }
  duel.all[id]=Object.assign({id},d); if(!duel.mine.find(x=>x.id===id)) duel.mine.push(duel.all[id]);
  openDuel(id);
}
function openDuel(id){ duel.openId=id; duel.playing=null; go("vDuel","duell"); renderDuel(); }
$("dvBack").onclick=()=>{ location.hash="duelle"; };
function duelLink(d){ return BASE+"?duell="+encodeURIComponent(d.id); }
function renderDuel(){
  const d=duel.all[duel.openId];
  if(!d){ $("dvStatus").innerHTML=`<div class="note">Duell wird geladen …</div>`; $("dvRounds").innerHTML=""; $("dvShare").innerHTML=""; loadDuelOnce(duel.openId); return; }
  if((d.fach||"bwl")!==FACH.kurz) selectFach(d.fach);
  const w=who(d,me), o=w==="a"?"b":"a", n=duelNext(d);
  $("dvFach").textContent=(FACH.icon||"")+" "+FACH.name;
  const opN = w? opName(d) : (d.bn||"?");
  $("dvMe").textContent= w?"Du":d.an; $("dvOp").textContent= w?opN:"?";
  const A=w?duelTotals(d,w):{c:0,p:0}, B=w?duelTotals(d,o):{c:0,p:0};
  // Gegner-Ergebnisse nur für Runden zeigen, die man selbst schon gespielt hat (wie Quizduell)
  let opShownC=0, opShownP=0;
  for(let r=0;r<DR;r++){ if(!w||ansOf(d,w,r).length>=DQ||d.status==="done") ansOf(d,o,r).forEach(x=>{ if(x.f===1)opShownC++; opShownP+=Number(x.p)||0; }); }
  $("dvMeSc").textContent=A.c; $("dvOpSc").textContent=w?opShownC:"–";
  $("dvMePt").textContent=fmt(A.p)+" P"; $("dvOpPt").textContent=w?fmt(opShownP)+" P":"";
  let st="", btn="";
  if(n.k==="join"){ st=`<div class="card"><h2>⚔️ ${esc(d.an)} fordert dich heraus!</h2><p class="muted small">6 Runden à 3 Fragen. Ihr wählt abwechselnd das Thema.</p>${nick()?`<button class="btn" id="dvJoin">Annehmen & los</button>`:`<p class="note">Gib zuerst auf der Startseite deinen Namen ein.</p><button class="btn2" id="dvToHome">Zur Startseite</button>`}</div>`; }
  else if(n.k==="none"){ st=`<div class="note">Dieses Duell läuft schon zwischen ${esc(d.an)} und ${esc(d.bn)}.</div>`; }
  else if(n.k==="choose"){ btn=`<button class="btn" id="dvGo">Runde ${n.r+1}: Thema wählen & spielen</button>`; }
  else if(n.k==="play"){ const t=d.rd[n.r].t; btn=`<button class="btn" id="dvGo">Runde ${n.r+1} spielen · ${esc(TOPICS[t])}</button>`; }
  else if(n.k==="wait"){ st=`<div class="wait card"><span class="dot"></span><span>${esc(opN)} ist dran (Runde ${n.r+1}). Du kannst die Seite schließen – du siehst es hier, wenn du wieder dran bist.</span></div>`; }
  else if(n.k==="waitjoin"){ st=`<div class="note">Schick den Link an deine:n Gegner:in. Wer ihn zuerst öffnet, spielt gegen dich.</div>`; }
  else if(n.k==="waitfinish"){ st=`<div class="wait card"><span class="dot"></span><span>Du bist fertig! ${esc(opN)} spielt noch die letzte Runde.</span></div>`; }
  else if(n.k==="done"){ const r=duelResult(d);
    st=`<div class="leader" style="text-align:center">${r==="w"?"🏆 Du hast gewonnen!":r==="l"?`${esc(opN)} hat gewonnen`:"🤝 Unentschieden!"}${d.gaveUp?(d.gaveUp===me?" (aufgegeben)":" (Gegner:in hat aufgegeben)"):""}</div>`;
    btn=`<button class="btn" id="dvRematch">🔁 Revanche</button>`; }
  $("dvStatus").innerHTML=st+btn;
  // Runden-Übersicht
  const mk=(arr,hide)=>{ let h=""; for(let i=0;i<DQ;i++){ const x=arr[i]; h+= !x?`<span class="mk q"></span>`: hide?`<span class="mk q">?</span>`: `<span class="mk ${x.f===1?"y":x.f>0?"h":"n"}">${x.f===1?"✓":x.f>0?"½":"✗"}</span>`; } return h; };
  let rh="";
  for(let r=0;r<DR;r++){
    const rd=(d.rd||{})[r]; const mine=w?ansOf(d,w,r):[], theirs=w?ansOf(d,o,r):[];
    const hide = w && mine.length<DQ && d.status!=="done";
    rh+=`<div class="rnd"><div class="marks">${mk(mine,false)}</div><div class="mid"><b>Runde ${r+1}</b>${rd?esc(TOPICS[rd.t]):"–"}</div><div class="marks r">${mk(theirs,hide)}</div></div>`;
  }
  $("dvRounds").innerHTML=`<div class="row between small muted" style="padding:0 4px"><span>Du</span><span>${esc(w?opN:"")}</span></div>`+rh;
  // Teilen
  const txt = n.k==="waitjoin" ? `⚔️ ${nick()} fordert dich im ${APP} (${FACH.kurzname}) heraus! Hier annehmen: ${duelLink(d)}`
            : `⚔️ Du bist im ${APP} (${FACH.kurzname}) gegen ${nick()} dran! ${duelLink(d)}`;
  const showShare = w && d.status!=="done" && (n.k==="waitjoin"||n.k==="wait"||n.k==="waitfinish");
  $("dvShare").innerHTML = showShare ? `<div class="share"><a class="btn" style="display:grid;place-items:center;text-decoration:none;border-radius:12px;min-height:48px" href="${esc(waLink(txt))}" target="_blank" rel="noopener">WhatsApp</a><button class="btn2" id="dvCopy">${n.k==="waitjoin"?"Link kopieren":"Erinnern (Link)"}</button></div><p class="muted small" id="dvCopyState"></p>` : "";
  if($("dvCopy")) $("dvCopy").onclick=()=>shareText(txt,$("dvCopyState"));
  if($("dvJoin")) $("dvJoin").onclick=()=>joinDuel(d);
  if($("dvToHome")) $("dvToHome").onclick=()=>{location.hash="";};
  if($("dvGo")) $("dvGo").onclick=()=> n.k==="choose"?openPick(d,n.r):playDuelRound(d,n.r);
  if($("dvRematch")) $("dvRematch").onclick=()=>createDuel(w==="a"?d.b:d.a, opN);
  $("dvGiveUp").classList.toggle("hidden",!(w&&(d.status==="active"||d.status==="open")));
}
$("dvGiveUp").onclick=async()=>{
  const d=duel.all[duel.openId]; if(!d) return;
  if(d.status==="open"){ if(confirm("Offene Herausforderung löschen?")){ try{ await BE.del("duels/"+d.id); }catch(e){} location.hash="duelle"; } return; }
  if(!confirm("Wirklich aufgeben? Das Duell zählt dann als Niederlage.")) return;
  try{ await BE.update("duels/"+d.id,{status:"done",gaveUp:me,up:Date.now(),by:me}); }catch(e){}
};
const loadingDuels={};
function loadDuelOnce(id){
  if(loadingDuels[id]) return; loadingDuels[id]=true;
  const un=BE.onDoc("duels/"+id,data=>{
    if(!data){ if(duel.openId===id) $("dvStatus").innerHTML=`<div class="note">Dieses Duell gibt es nicht (mehr).</div>`; return; }
    duel.all[id]=Object.assign({id},data);
    if(duel.openId===id && isShown("vDuel") && !duel.playing) renderDuel();
    if(isShown("vHome")) renderInvite();
  });
  duel.unsub.push(un);
}
async function joinDuel(d){
  try{ await BE.update("duels/"+d.id,{b:me,bn:nick(),p:[d.a,me],status:"active",up:Date.now(),by:me}); }
  catch(e){ $("dvStatus").insertAdjacentHTML("beforeend",`<p class="small" style="color:var(--bad)">Annehmen hat nicht geklappt – vielleicht war jemand schneller.</p>`); return; }
  if(pendingDuel===d.id){ pendingDuel=null; history.replaceState(null,"",location.pathname+location.hash); }
}
function openPick(d,r){
  const used=new Set(Object.values(d.rd||{}).map(x=>x.t));
  const rnd=seeded(d.id+"/pick/"+r);
  let pool=shuffle(TOPICS.map((_,i)=>i).filter(i=>!used.has(i)),rnd); if(pool.length<3) pool=pool.concat(shuffle(TOPICS.map((_,i)=>i).filter(i=>used.has(i)),rnd));
  const offer=pool.slice(0,3);
  $("dpTitle").textContent=`Runde ${r+1}: Thema wählen`;
  $("dpList").innerHTML=offer.map(t=>`<button data-t="${t}"><span><b>${esc(TOPICS[t])}</b><br><span class="muted small">${Q.filter(q=>q.t===t).length} Fragen im Pool</span></span><span>›</span></button>`).join("");
  $("dpList").querySelectorAll("button").forEach(b=>b.onclick=async()=>{
    $("dpList").querySelectorAll("button").forEach(x=>x.disabled=true);
    const t=+b.dataset.t;
    const usedQ=new Set([].concat(...Object.values(d.rd||{}).map(x=>x.q||[])));
    let qs=shuffle(Q.filter(q=>q.t===t&&!usedQ.has(q.id)),Math.random).map(q=>q.id);
    if(qs.length<DQ) qs=qs.concat(shuffle(Q.filter(q=>q.t===t&&!qs.includes(q.id))).map(q=>q.id));
    const rd={t,q:qs.slice(0,DQ)};
    try{ await BE.update("duels/"+d.id,{["rd."+r]:rd,up:Date.now(),by:me}); }catch(e){ alert("Speichern hat nicht geklappt – Internet prüfen."); go("vDuel","duell"); renderDuel(); return; }
    d.rd=Object.assign({},d.rd,{[r]:rd}); playDuelRound(d,r);
  });
  go("vDuelPick","duell-thema");
}
$("dpBack").onclick=()=>{ location.hash="duell"; };
function playDuelRound(d,r){
  const w=who(d,me); const rd=d.rd[r];
  const arr=ansOf(d,w,r).slice();
  duel.playing={id:d.id,r};
  location.hash="duell-spiel";
  const res=[];
  const nextQ=async()=>{
    const i=arr.length;
    if(i>=DQ){ // Runde fertig
      duel.playing=null;
      await saveRank(x=>{ addStats(x,res); });
      if(isShown("vQuiz")||location.hash==="#duell-spiel"){ location.hash="duell"; show("vDuel"); renderDuel(); }
      return;
    }
    const q=qInst(QBY[rd.q[i]], d.id+":"+r+":"+i);
    // Platzhalter speichern: wer die Frage sieht und abbricht, bekommt 0 Punkte
    arr.push({f:0,p:0});
    try{ await BE.update("duels/"+d.id,{["r"+w+"."+r]:arr,up:Date.now(),by:me}); }catch(e){}
    renderQuestion(q,{label:`Runde ${r+1} · Frage ${i+1}/${DQ} · vs ${opName(d)}`,score:arr.reduce((s,x)=>s+(x.p||0),0),canPause:false,deadline:Date.now()+TIME[q.type]*1000,
      onDone:async(rs,timeout)=>{
        arr[i]={f:rs.frac,p:rs.pts}; res.push({id:q.id,frac:rs.frac,pts:rs.pts}); markSeen(q.id,rs.frac===1);
        $("qScore").textContent=fmt(arr.reduce((s,x)=>s+(x.p||0),0)); showSolution(rs,timeout);
        $("actBtn").disabled=true;
        try{ await BE.update("duels/"+d.id,{["r"+w+"."+r]:arr,up:Date.now(),by:me}); }catch(e){}
        $("actBtn").textContent= i+1<DQ?"Weiter →":"Runde abschließen";
        cur.next=nextQ; upd();
      }});
  };
  nextQ();
}
window.addEventListener("hashchange",()=>{ if(location.hash==="#duell-spiel"&&!duel.playing){ location.hash="duell"; } });

/* ---------- Einladung per Link (?duell=… / ?raum=…) ---------- */
let pendingDuel=PARAMS.get("duell"), pendingRoom=PARAMS.get("raum");
function renderInvite(){
  const el=$("inviteCard");
  if(pendingDuel){
    const d=duel.all[pendingDuel];
    if(BE.ok && !d) loadDuelOnce(pendingDuel);
    let html;
    if(d && who(d,me)){ html=`<h2>⚔️ Duell gegen ${esc(opName(d))}</h2><button class="btn" id="invGo">Zum Duell</button>`; }
    else if(d && d.status!=="open"){ html=`<h2>⚔️ Duell-Link</h2><p class="muted small" style="margin:0">Diese Herausforderung hat schon jemand anderes angenommen.</p>`; }
    else html=`<h2>⚔️ ${d?esc(d.an)+" fordert dich heraus!":"Du wurdest zu einem Duell eingeladen!"}</h2><p class="muted small" style="margin:0 0 10px">${nick()?"":"Gib unten deinen Namen ein, dann geht's los."}</p><button class="btn" id="invGo" ${nick()&&BE.ok&&d?"":"disabled"}>Duell ansehen & annehmen</button>`;
    el.innerHTML=html; el.classList.remove("hidden");
    if($("invGo")) $("invGo").onclick=()=>openDuel(pendingDuel);
  } else if(pendingRoom){
    el.innerHTML=`<h2>🔴 Einladung zum Live-Battle</h2><p class="muted small" style="margin:0 0 10px">Raum ${esc(pendingRoom)}${nick()?"":" – gib unten zuerst deinen Namen ein"}</p><button class="btn" id="invGo" ${nick()&&BE.ok?"":"disabled"}>Beitreten</button>`;
    el.classList.remove("hidden");
    $("invGo").onclick=()=>{ const c=pendingRoom; pendingRoom=null; history.replaceState(null,"",location.pathname); el.classList.add("hidden"); go("vLive","live"); joinRoom(c); };
  } else el.classList.add("hidden");
}

/* ================= LIVE-BATTLE (über Firestore) ================= */
const MAXP=40, STALE=25000;
const live={code:null,gid:null,isHost:false,game:null,players:[],skew:0,lastW:0,shownIdx:-1,phase:null,myAns:{},myScore:0,
  hostTimer:null,hbTimer:null,unG:null,unP:null,seenLocal:{},lastSig:{},lastGameAt:0,saved:false,unOpen:null};
function watchOpenRooms(){
  if(live.unOpen) live.unOpen();
  // Räume im Warteraum bleiben gelistet, bis der Host sie schließt oder das Spiel startet
  live.unOpen=BE.onQuery("rooms",[["status","==","lobby"]],50,rows=>{
    const fresh=rows.slice().sort((a,b)=>((b.host===me)-(a.host===me))||((b.wAt||0)-(a.wAt||0)));
    $("openRooms").innerHTML=fresh.length?`<p class="muted small" style="margin:0 0 8px">Offene Räume:</p><div class="dlist">`+fresh.map(r=>{const f=fachBy(r.fach); const mine=r.host===me; const off=!mine&&Date.now()-(r.hb||r.wAt||0)>90000;
      return `<button data-c="${esc(r.code)}"><span><b>${mine?"⭐ Dein Raum":esc(r.hostNick||"?")}</b> · Raum ${esc(r.code)}<br><span class="st">${esc(f.icon||"")} ${esc(f.kurzname)} · ${esc(topicLabel(r.topic,f))}${off?" · Host gerade offline":""}</span></span><span>${mine?"Fortsetzen ›":"Beitreten ›"}</span></button>`;}).join("")+`</div><div style="height:12px"></div><p class="muted small" style="margin:0 0 8px">Oder Code eingeben:</p>`:"";
    $("openRooms").querySelectorAll("button").forEach(b=>b.onclick=()=>joinRoom(b.dataset.c));
  });
}
function liveMsg(t){ $("joinMsg").textContent=t; }
const roomPath = () => "rooms/"+live.code;
const myPlayerPath = () => roomPath()+"/players/"+me;
$("createRoom").onclick=async()=>{
  if(!BE.ok) return; $("createRoom").disabled=true; liveMsg("Raum wird erstellt …");
  try{
    for(let tries=0;tries<8;tries++){
      const code=String(1000+Math.floor(Math.random()*9000));
      const ex=await BE.get("rooms/"+code);
      if(ex && (ex.status==="lobby" || Date.now()-(ex.wAt||0)<6*3600e3)) continue;  // offene Räume nie überschreiben
      const gid=Math.random().toString(36).slice(2,10);
      const g={fach:FACH.kurz,code,gid,pushed:false,host:me,hostNick:nick(),topic:$("liveTopic").value,status:"lobby",qids:[],orders:{},idx:-1,endsAt:0,pausedLeft:null,wAt:Date.now(),hb:Date.now()};
      await BE.set("rooms/"+code,g);
      Object.assign(live,{code,gid,isHost:true,myAns:{},myScore:0,saved:false});
      await BE.set(myPlayerPath(),{gid,nick:nick(),score:0,ans:{},seen:Date.now(),left:false});
      liveMsg(""); enterLive(); return;
    }
    liveMsg("Kein freier Raum gefunden – bitte nochmal versuchen.");
  }catch(e){ console.warn(e); liveMsg("Raum konnte nicht erstellt werden – Internet prüfen."); }
  finally{ $("createRoom").disabled=false; }
};
$("joinRoom").onclick=()=>{ const c=$("joinCode").value.trim(); liveMsg(""); if(!/^\d{4}$/.test(c)){ liveMsg("Bitte den 4-stelligen Code eingeben."); return; } joinRoom(c); };
async function joinRoom(code){
  if(!BE.ok||!nick()){ liveMsg("Bitte zuerst auf der Startseite deinen Namen eingeben."); return; }
  liveMsg("Verbinde …"); $("joinRoom").disabled=true;
  try{
    const g=await BE.get("rooms/"+code);
    if(!g||g.status==="closed"){ liveMsg("Kein offener Raum mit diesem Code gefunden."); return; }
    if(g.status==="end"){ liveMsg("Dieses Battle ist schon vorbei."); return; }
    selectFach(g.fach);
    live.code=code; live.gid=g.gid; live.isHost=g.host===me;
    const old=await BE.get(myPlayerPath());
    if(old&&old.gid===g.gid){ live.myAns=old.ans||{}; live.myScore=Number(old.score)||0; await BE.update(myPlayerPath(),{nick:nick(),seen:Date.now(),left:false}); }
    else{ live.myAns={}; live.myScore=0; await BE.set(myPlayerPath(),{gid:g.gid,nick:nick(),score:0,ans:{},seen:Date.now(),left:false}); }
    live.saved=false; liveMsg(""); enterLive();
  }catch(e){ console.warn(e); live.code=null; liveMsg("Beitreten hat nicht geklappt – Internet prüfen."); }
  finally{ $("joinRoom").disabled=false; }
}
function enterLive(){
  if(live.unOpen){ live.unOpen(); live.unOpen=null; }
  live.shownIdx=-1; live.phase=null; live.players=[]; live.seenLocal={}; live.lastSig={}; live.lastGameAt=Date.now();
  live.unG=BE.onDoc(roomPath(),g=>{
    if(!g){ return; }
    if(g.gid!==live.gid){ lostHost("Der Raum wurde neu vergeben."); return; }
    if(g.wAt!==live.lastW){ live.lastW=g.wAt; if(!live.isHost) live.skew=g.wAt-Date.now(); }
    live.lastGameAt=Date.now(); live.game=g;
    if(g.status==="closed"){ lostHost("Der Host hat den Raum geschlossen."); return; }
    onGame();
  });
  live.unP=BE.onQuery(roomPath()+"/players",[],100,rows=>{
    const now=Date.now();
    rows.forEach(p=>{ const sig=(p.seen||0)+"|"+JSON.stringify(p.ans||{})+"|"+p.left; if(live.lastSig[p.id]!==sig){ live.lastSig[p.id]=sig; live.seenLocal[p.id]=now; } });
    live.players=rows.filter(p=>p.gid===live.gid);
    onPlayers();
  });
  clearInterval(live.hbTimer);
  live.hbTimer=setInterval(()=>{
    if(!live.code) return;
    BE.update(myPlayerPath(),{seen:Date.now()}).catch(()=>{});
    if(live.isHost) BE.update(roomPath(),{hb:Date.now()}).catch(()=>{});
    else if(Date.now()-live.lastGameAt>35000 && live.game && live.game.status!=="end") showHostGone();
    if(live.isHost) live.lastGameAt=Date.now();
  },8000);
  if(live.isHost){ clearInterval(live.hostTimer); live.hostTimer=setInterval(hostLoop,500); }
}
function showHostGone(){
  const t="⚠️ Der Host ist gerade nicht erreichbar. Warte kurz – oder verlasse den Raum über ‹ Zurück.";
  $("liveWaitTxt").textContent=t; $("rvWaitTxt").textContent=t;
  $("lobWaitTxt").textContent="Der Host ist gerade nicht online – der Raum bleibt offen. Sobald der Host zurück ist, kann's losgehen.";
}
function playerOn(p){ if(p.left) return false; if(p.id===me) return true; return Date.now()-(live.seenLocal[p.id]||0)<STALE; }
function lostHost(text){
  const g=live.game; leaveLive();
  if(g&&g.status==="end") return;
  go("vLive","live"); liveMsg(text); watchOpenRooms();
}
function leaveLive(opts){
  const keepOpen=!!(opts&&opts.keepOpen);   // Host verlässt den Warteraum, Raum bleibt offen
  const code=live.code, wasHost=live.isHost, g=live.game;
  clearInterval(live.hostTimer); clearInterval(live.hbTimer);
  if(live.unG) live.unG(); if(live.unP) live.unP();
  if(code && BE.ok && !keepOpen){
    BE.update("rooms/"+code+"/players/"+me,{left:true}).catch(()=>{});
    if(wasHost && g && g.status!=="end") BE.update("rooms/"+code,{status:"closed",wAt:Date.now()}).catch(()=>{});
  }
  Object.assign(live,{code:null,gid:null,isHost:false,game:null,players:[],shownIdx:-1,phase:null,myAns:{},myScore:0,unG:null,unP:null,lastW:0});
  if(cur) clearInterval(cur.timerId); cur=null; $("pauseOv").classList.add("hidden");
}
$("lobLeave").onclick=()=>{ if(live.isHost){ confirmLeave("lobby",""); return; } leaveLive(); location.hash=""; };
const localDeadline = g => live.isHost ? g.endsAt : g.endsAt - live.skew;
function sortedPlayers(){ return live.players.filter(p=>!p.left||(p.score||0)>0).slice().sort((a,b)=>(b.score||0)-(a.score||0)); }
function hostWrite(patch){ const g=Object.assign({},live.game,patch,{wAt:Date.now()}); live.game=g; onGame(); return BE.update(roomPath(),Object.assign({},patch,{wAt:g.wAt})).catch(e=>console.warn(e)); }
function onPlayers(){
  if(!live.code) return;
  const ps=live.players, on=ps.filter(playerOn);
  $("lobCount").textContent=on.length+(on.length===1?" Person":" Personen");
  $("lobPlayers").innerHTML=ps.filter(p=>!p.left).map(p=>`<span style="${playerOn(p)?"":"opacity:.45"}">${playerOn(p)?"🟢 ":"⚪ "}${p.id===me?"⭐ ":""}${esc(p.nick||"?")}${live.game&&p.id===live.game.host?" 👑":""}</span>`).join("")||`<span class="muted">Noch niemand da</span>`;
  const g=live.game; if(!g) return;
  if(g.status==="q"){ const n=on.filter(p=>p.ans&&p.ans[g.idx]).length; $("liveWaitTxt").textContent=`Antwort gespeichert – ${n}/${on.length} haben geantwortet …`; }
  if(g.status==="reveal"||g.status==="end") renderBoards();
}
function onGame(){
  const g=live.game; if(!g||!live.code) return;
  const isH=live.isHost;
  if(g.status==="lobby"){
    if(location.hash!=="#lobby") go("vLobby","lobby"); else show("vLobby");
    $("lobCode").textContent=g.code; $("lobTopic").textContent=FACH.kurzname+" · "+topicLabel(g.topic)+" · Host: "+(g.hostNick||"");
    const link=BASE+"?raum="+g.code, txt=`🔴 Live-Battle im ${APP} (${FACH.kurzname})! Komm in Raum ${g.code}: ${link}`;
    $("lobShare").innerHTML=`<a class="btn" style="display:grid;place-items:center;text-decoration:none;border-radius:12px;min-height:48px" href="${esc(waLink(txt))}" target="_blank" rel="noopener">WhatsApp</a><button class="btn2" id="lobCopy">Link kopieren</button>`;
    $("lobCopy").onclick=()=>shareText(txt,null);
    $("lobStart").classList.toggle("hidden",!isH); $("lobWait").classList.toggle("hidden",isH);
    $("lobLeave").textContent= isH ? "Warteraum verlassen / Raum schließen" : "Raum verlassen";
    if(!isH && Date.now()-(g.hb||g.wAt||0)<35000) $("lobWaitTxt").textContent="Warte, bis der Host startet …";
    onPlayers(); return;
  }
  if(g.status==="q"){
    const q=qInst(QBY[g.qids[g.idx]],g.gid+":"+g.idx);
    if(live.shownIdx!==g.idx || live.phase!=="q"){
      live.shownIdx=g.idx; live.phase="q";
      if(location.hash!=="#battle") location.hash="battle";
      const already=live.myAns[g.idx];
      renderQuestion(q,{label:`Frage ${g.idx+1}/${g.qids.length} · Live`,score:live.myScore,canPause:isH,deadline:localDeadline(g),order:(g.orders||{})[g.idx],
        onDone:async(res)=>{
          const a={f:res.frac,p:res.pts,c:res.choice==null?null:res.choice};
          live.myAns[g.idx]=a; live.myScore+=res.pts; $("qScore").textContent=fmt(live.myScore);
          markSeen(q.id,res.frac===1);
          $("actBtn").classList.add("hidden"); $("liveWait").classList.remove("hidden"); $("hostReveal").classList.toggle("hidden",!isH);
          try{ await BE.update(myPlayerPath(),{["ans."+g.idx]:a,score:live.myScore,seen:Date.now()}); }catch(e){}
        }});
      if(already){ cur.answered=true; clearInterval(cur.timerId); $("actBtn").classList.add("hidden"); $("liveWait").classList.remove("hidden"); $("hostReveal").classList.toggle("hidden",!isH); }
    }
    if(cur){ if(g.pausedLeft!=null){ cur.paused=true; cur.pausedLeft=g.pausedLeft;
        $("pauseTitle").textContent="Pause"; $("pauseTxt").textContent= isH?"Die Zeit ist für alle angehalten.":"Der Host hat pausiert – gleich geht's weiter.";
        $("resumeBtn").classList.toggle("hidden",!isH); $("pauseOv").classList.remove("hidden"); }
      else { cur.paused=false; cur.deadline=localDeadline(g); $("pauseOv").classList.add("hidden"); } }
    return;
  }
  if(g.status==="reveal"){
    if(live.phase!=="reveal"+g.idx){ live.phase="reveal"+g.idx; if(cur) clearInterval(cur.timerId); $("pauseOv").classList.add("hidden");
      if(!live.myAns[g.idx]){ live.myAns[g.idx]={f:0,p:0,c:null}; markSeen(g.qids[g.idx],false); BE.update(myPlayerPath(),{["ans."+g.idx]:live.myAns[g.idx]}).catch(()=>{}); }
      renderReveal(); show("vReveal");
      if(live.myAns[g.idx].f===1) confetti(70); else sadPop(live.myAns[g.idx].f>0?"😕":"😢");
    }
    renderBoards(); return;
  }
  if(g.status==="end"){
    if(live.phase!=="end"){ live.phase="end"; if(cur) clearInterval(cur.timerId); $("pauseOv").classList.add("hidden"); show("vPodium");
      if(location.hash!=="#siegerehrung") location.hash="siegerehrung";
      $("liveReviewH").textContent="❌ Fehler zum Nachlernen";
      const res=g.qids.map((id,i)=>({id,seed:g.gid+":"+i,frac:(live.myAns[i]||{}).f||0,pts:(live.myAns[i]||{}).p||0})); renderReview(res,$("liveReview"));
      if(!live.saved){ live.saved=true; saveRank(d=>{ addStats(d,res); d.games=(d.games||0)+1; }); }
      clearInterval(live.hostTimer); clearInterval(live.hbTimer);
      setTimeout(()=>confetti(320),150); }
    renderBoards();
  }
}
function renderReveal(){
  const g=live.game, q=qInst(QBY[g.qids[g.idx]],g.gid+":"+g.idx), mine=live.myAns[g.idx]||{f:0,p:0};
  $("rvCount").textContent=`Frage ${g.idx+1}/${g.qids.length}`; $("rvTopic").textContent=TOPICS[q.t]; $("rvQ").textContent=q.q;
  const good=mine.f===1, part=mine.f>0&&mine.f<1;
  $("rvMine").innerHTML=`<div class="fb ${good?"ok":"bad"}"><b>${good?"✅ Richtig!":part?"🟡 Teilweise richtig":"❌ Leider falsch"} · +${mine.p} P</b></div>`;
  $("rvAns").innerHTML=`<p class="small" style="margin:10px 0 0"><b style="color:var(--ok)">Lösung:</b> ${esc(solText(q))}</p>`;
  $("rvExp").innerHTML=esc(q.e)+altHtml(q); $("rvWaitTxt").textContent="Der Host startet gleich die nächste Frage …";
  $("hostNext").classList.toggle("hidden",!live.isHost); $("rvWait").classList.toggle("hidden",live.isHost);
  $("hostNext").textContent = g.idx+1<g.qids.length ? "Nächste Frage →" : "🏆 Siegerehrung";
}
function boardTable(list,meId){ return `<table><tr><th>#</th><th>Name</th><th class="num">Punkte</th></tr>`+list.map((p,i)=>`<tr class="${p.id===meId?"me":""}"><td>${i===0?"👑":i+1}</td><td>${esc(p.nick||"?")}</td><td class="num">${fmt(p.score||0)}</td></tr>`).join("")+`</table>`; }
function renderBoards(){
  const g=live.game; if(!g) return; const ps=sortedPlayers();
  if(g.status==="reveal"){
    const q=QBY[g.qids[g.idx]];
    if(q.type==="mc"){ const ord=(g.orders||{})[g.idx]||q.o.map((_,i)=>i); const n=ps.length||1;
      $("rvDist").innerHTML=ord.map((oi,k)=>{const c=ps.filter(p=>p.ans&&p.ans[g.idx]&&p.ans[g.idx].c===oi).length;
        return `<div class="dl"><span class="sh" style="width:22px;height:22px;border-radius:6px;display:grid;place-items:center;color:#fff;background:${SHCOL[k]}">${SHAPES[k]}</span><div class="db"><div style="width:${c/n*100}%;background:${SHCOL[k]}"></div></div><b>${c}</b>${oi===q.a?" ✅":""}</div>`}).join(""); }
    else { const n=ps.filter(p=>p.ans&&p.ans[g.idx]&&p.ans[g.idx].f===1).length; $("rvDist").innerHTML=`<p class="small muted" style="margin:6px 0 0">${n} von ${ps.length} komplett richtig</p>`; }
    const lead=ps[0]; $("rvLeader").textContent = lead ? `👑 ${lead.nick||"?"} führt mit ${fmt(lead.score||0)} Punkten!` : "";
    const myPos=ps.findIndex(p=>p.id===me);
    $("rvBoard").innerHTML=boardTable(ps.slice(0,5),me)+(myPos>4?`<p class="small" style="margin:8px 0 0">Du: Platz ${myPos+1} mit ${fmt(ps[myPos].score||0)} P</p>`:"");
  }
  if(g.status==="end"){
    const cell=(x,cls,place)=>x?`<div class="${cls}">${place}<br>${esc(x.nick||"?")}<small>${fmt(x.score||0)} P</small></div>`:`<div class="${cls}" style="opacity:.25">${place}</div>`;
    $("podium").innerHTML=cell(ps[1],"p2","🥈")+cell(ps[0],"p1","🥇")+cell(ps[2],"p3","🥉");
    $("finalBoard").innerHTML=boardTable(ps,me);
  }
}
$("lobStart").onclick=async()=>{
  const g=live.game; const qids=pickRound(g.topic);
  const orders={}; qids.forEach((id,i)=>{const q=QBY[id]; if(q.type==="mc") orders[i]=shuffle(q.o.map((_,k)=>k));});
  live.myAns={}; live.myScore=0;
  await BE.update(myPlayerPath(),{ans:{},score:0,seen:Date.now()}).catch(()=>{});
  const first=QBY[qids[0]];
  hostWrite({status:"q",qids,orders,idx:0,endsAt:TIME[first.type]?Date.now()+TIME[first.type]*1000:0,pausedLeft:null});
};
function hostGoReveal(){ if(live.game.status!=="q") return; hostWrite({status:"reveal",pausedLeft:null}); }
$("hostReveal").onclick=hostGoReveal;
$("hostNext").onclick=()=>{
  if(hot){ hotNext(); return; }
  const g=live.game; if(!g) return;
  if(g.idx+1<g.qids.length){ const q=QBY[g.qids[g.idx+1]]; hostWrite({status:"q",idx:g.idx+1,endsAt:TIME[q.type]?Date.now()+TIME[q.type]*1000:0,pausedLeft:null}); }
  else hostWrite({status:"end"});
};
function hostPause(){ const g=live.game; if(g.status!=="q"||g.pausedLeft!=null||!g.endsAt) return; hostWrite({pausedLeft:Math.max(0,g.endsAt-Date.now())}); }
function hostResume(){ const g=live.game; if(g.pausedLeft==null){ $("pauseOv").classList.add("hidden"); return; } hostWrite({endsAt:Date.now()+g.pausedLeft,pausedLeft:null}); }
function hostLoop(){
  const g=live.game; if(!live.isHost||!g||g.status!=="q"||g.pausedLeft!=null) return;
  const on=live.players.filter(playerOn);
  const all=on.length>0 && on.every(p=>(p.id===me?live.myAns:p.ans||{})[g.idx]);
  if(all || (g.endsAt && Date.now()>g.endsAt+1500)) hostGoReveal();   // ohne Zeitlimit: warten, bis alle geantwortet haben
}

/* ================= REIHUM (ein Handy) ================= */
let hot=null, hotNames=[];
try{ hotNames=JSON.parse(LS.get(G+"hot_names")||LS.get("kb_bwl_hot_names")||"null")||[]; }catch(e){}
if(hotNames.length<2) hotNames=[nick()||"",""];
function renderHotNames(){
  const box=$("hotNames"); box.innerHTML="";
  hotNames.forEach((n,i)=>{
    const r=document.createElement("div"); r.className="row";
    const inp=document.createElement("input"); inp.type="text"; inp.maxLength=16; inp.placeholder=`Spieler:in ${i+1}`; inp.value=n;
    inp.setAttribute("aria-label",`Name Spieler:in ${i+1}`); inp.oninput=()=>{hotNames[i]=inp.value;};
    r.appendChild(inp);
    if(hotNames.length>2){ const x=document.createElement("button"); x.textContent="✕"; x.setAttribute("aria-label","Entfernen"); x.style.minWidth="48px";
      x.onclick=()=>{hotNames.splice(i,1);renderHotNames();}; r.appendChild(x); }
    box.appendChild(r);
  });
  $("hotAdd").disabled=hotNames.length>=6;
}
$("goHot").onclick=()=>{ go("vHot","reihum"); $("hotMsg").textContent=""; renderHotNames(); };
$("hotAdd").onclick=()=>{ if(hotNames.length<6){ hotNames.push(""); renderHotNames(); const ins=$("hotNames").querySelectorAll("input"); ins[ins.length-1].focus(); } };
$("hotStart").onclick=()=>{
  const names=hotNames.map(n=>n.trim()).filter(Boolean);
  if(names.length<2){ $("hotMsg").textContent="Bitte mindestens 2 Namen eintragen."; return; }
  LS.set(G+"hot_names",JSON.stringify(names));
  const topic=$("hotTopic").value;
  hot={names,topic,seed:newSeed(),ids:pickRound(topic),qi:0,pi:0,scores:names.map(()=>0),res:names.map(()=>[]),curRes:[]};
  go("vPass","reihum-spiel"); hotPass();
};
function hotTable(highlight){
  const order=hot.names.map((n,i)=>({n,i,s:hot.scores[i]})).sort((a,b)=>b.s-a.s);
  return `<table><tr><th>#</th><th>Name</th><th class="num">Punkte</th></tr>`+
    order.map((r,k)=>`<tr class="${r.i===highlight?"me":""}"><td>${k===0&&r.s>0?"👑":k+1}</td><td>${esc(r.n)}</td><td class="num">${fmt(r.s)}</td></tr>`).join("")+`</table>`;
}
function hotPass(){
  show("vPass");
  $("passInfo").textContent=`Frage ${hot.qi+1}/${hot.ids.length} · ${TOPICS[QBY[hot.ids[hot.qi]].t]}`;
  $("passName").textContent=hot.names[hot.pi];
  $("passBoard").innerHTML = hot.qi>0 ? `<h2>Zwischenstand</h2>`+hotTable(hot.pi) : `<p class="muted small" style="margin:0">Reihenfolge: ${hot.names.map(esc).join(" → ")}</p>`;
}
$("passGo").onclick=()=>{
  const q=qInst(QBY[hot.ids[hot.qi]],hot.seed+":"+hot.qi), pi=hot.pi, last=pi+1>=hot.names.length;
  renderQuestion(q,{label:`Frage ${hot.qi+1}/${hot.ids.length} · ${hot.names[pi]}`,score:hot.scores[pi],canPause:true,deadline:Date.now()+TIME[q.type]*1000,
    onDone:(res,timeout)=>{
      hot.scores[pi]+=res.pts; hot.res[pi].push({id:q.id,frac:res.frac}); hot.curRes[pi]=res;
      $("qScore").textContent=fmt(hot.scores[pi]);
      $("qBody").querySelectorAll("button,input").forEach(el=>el.disabled=true);
      $("qFb").innerHTML=`<div class="fb ok"><b>${timeout?"⏰ Zeit abgelaufen – ":""}Antwort gespeichert ✓</b>Ob's richtig war, siehst du bei der Auflösung, wenn alle dran waren.</div>`;
      $("actBtn").textContent = last ? "Auflösung zeigen" : `Handy an ${hot.names[pi+1]} weitergeben →`;
      cur.next=()=>{ if(!last){ hot.pi++; hotPass(); } else hotReveal(); }; upd();
    }});
};
function hotReveal(){
  const q=qInst(QBY[hot.ids[hot.qi]],hot.seed+":"+hot.qi); if(cur) clearInterval(cur.timerId);
  markSeen(q.id, hot.curRes.every(r=>r&&r.frac===1));
  show("vReveal");
  $("rvCount").textContent=`Frage ${hot.qi+1}/${hot.ids.length}`; $("rvTopic").textContent=TOPICS[q.t]; $("rvQ").textContent=q.q;
  $("rvMine").innerHTML=`<div class="dist">`+hot.names.map((n,i)=>{const r=hot.curRes[i]||{frac:0,pts:0};
    const ic=r.frac===1?"✅":r.frac>0?"🟡":"❌"; return `<div class="dl"><span>${ic}</span><b style="flex:1">${esc(n)}</b><span>+${r.pts} P</span></div>`;}).join("")+`</div>`;
  $("rvAns").innerHTML=`<p class="small" style="margin:12px 0 0"><b style="color:var(--ok)">Lösung:</b> ${esc(solText(q))}</p>`;
  $("rvDist").innerHTML=""; $("rvExp").innerHTML=esc(q.e)+altHtml(q);
  const best=Math.max(...hot.scores), leaders=hot.names.filter((n,i)=>hot.scores[i]===best);
  $("rvLeader").textContent = best<=0 ? "Noch hat niemand Punkte – weiter geht's!" : leaders.length>1 ? `🤝 Gleichstand an der Spitze: ${leaders.join(" & ")} mit ${fmt(best)} Punkten!` : `👑 ${leaders[0]} führt mit ${fmt(best)} Punkten!`;
  $("rvBoard").innerHTML=hotTable(-1);
  $("hostNext").classList.remove("hidden"); $("rvWait").classList.add("hidden");
  $("hostNext").textContent = hot.qi+1<hot.ids.length ? "Nächste Frage →" : "🏆 Siegerehrung";
  if(hot.curRes.some(r=>r&&r.frac===1)) confetti(70);
}
function hotNext(){ hot.qi++; hot.pi=0; hot.curRes=[]; if(hot.qi<hot.ids.length) hotPass(); else hotEnd(); }
function hotEnd(){
  hot.done=true;
  show("vPodium"); if(location.hash!=="#siegerehrung") location.hash="siegerehrung";
  const ps=hot.names.map((n,i)=>({nick:n,score:hot.scores[i]})).sort((a,b)=>b.score-a.score);
  const cell=(x,cls,place)=>x?`<div class="${cls}">${place}<br>${esc(x.nick)}<small>${fmt(x.score)} P</small></div>`:`<div class="${cls}" style="opacity:.25">${place}</div>`;
  $("podium").innerHTML=cell(ps[1],"p2","🥈")+cell(ps[0],"p1","🥇")+cell(ps[2],"p3","🥉");
  $("finalBoard").innerHTML=hotTable(-1);
  $("liveReviewH").textContent="❌ Hier lag mindestens eine:r daneben";
  const res=hot.ids.map((id,qi)=>({id,seed:hot.seed+":"+qi,frac:Math.min(...hot.res.map(r=>(r[qi]||{frac:0}).frac))}));
  renderReview(res,$("liveReview"));
  setTimeout(()=>confetti(320),150);
}

/* ================= PUSH-BENACHRICHTIGUNGEN ================= */
// Token + Einstellungen liegen in push/{uid}. Verschickt wird von einem GitHub-Hintergrunddienst (tools/push/send.mjs).
const pushSt={doc:null,reg:null};
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const isStandalone=()=>{ try{ return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true; }catch(e){ return false; } };
function pushMsg(t){ $("pushMsg").textContent=t; }
async function pushInit(){
  if(!BE.ok) return;
  $("pushCard").classList.remove("hidden");
  try{ pushSt.doc=await BE.get("push/"+me); }catch(e){ pushSt.doc=null; }
  const d=pushSt.doc||{};
  $("pushDuel").checked=d.duel!==false; $("pushLive").checked=d.live!==false;
  const active=!!d.token && (BE.mode==="mock" || (typeof Notification!=="undefined" && Notification.permission==="granted"));
  $("pushOn").textContent= active ? "Benachrichtigungen neu verbinden" : "Benachrichtigungen erlauben";
  if(active){ pushMsg("✓ Auf diesem Handy aktiv. Benachrichtigungen kommen mit ein paar Minuten Verzögerung."); if(BE.mode!=="mock") pushRegister(false); }
  else if(BE.mode!=="mock" && !window.FIREBASE_VAPID){ pushMsg("Benachrichtigungen werden gerade eingerichtet – bald verfügbar."); $("pushOn").disabled=true; }
  else if(isIOS && !isStandalone()){ pushMsg("📱 iPhone: Tippe unten in Safari auf „Teilen“ → „Zum Home-Bildschirm“ und öffne die App dann von dort. Danach kannst du sie hier einschalten."); $("pushOn").disabled=true; }
  else pushMsg("Du wirst benachrichtigt, wenn du im Duell dran bist oder jemand ein Live-Battle startet.");
}
async function pushRegister(ask){
  if(!("serviceWorker" in navigator) || typeof Notification==="undefined") throw new Error("nosupport");
  if(!(await FB.msgSupported())) throw new Error("nosupport");
  if(ask){ const perm=await Notification.requestPermission(); if(perm!=="granted") throw new Error("denied"); }
  else if(Notification.permission!=="granted") return null;
  pushSt.reg = pushSt.reg || await navigator.serviceWorker.register("sw.js");
  await navigator.serviceWorker.ready;
  const token=await FB.getToken(FB.getMessaging(BE.app),{vapidKey:window.FIREBASE_VAPID,serviceWorkerRegistration:pushSt.reg});
  if(token && pushSt.doc && pushSt.doc.token!==token){ await BE.update("push/"+me,{token,at:Date.now()}).catch(()=>{}); pushSt.doc.token=token; }
  return token;
}
async function pushSave(patch){
  if(!BE.ok||!me) return;
  const base={duel:$("pushDuel").checked,live:$("pushLive").checked,nick:nick()||"",at:Date.now()};
  const doc=Object.assign({token:(pushSt.doc||{}).token||""},base,patch||{});
  await BE.set("push/"+me,doc); pushSt.doc=doc;
}
$("pushOn").onclick=async()=>{
  $("pushOn").disabled=true; pushMsg("Einen Moment …");
  try{
    const token = BE.mode==="mock" ? "mock-"+me : await pushRegister(true);
    if(!token) throw new Error("notoken");
    await pushSave({token});
    $("pushOn").textContent="Benachrichtigungen neu verbinden";
    pushMsg("✓ Eingeschaltet! Benachrichtigungen kommen mit ein paar Minuten Verzögerung.");
  }catch(e){
    console.warn(e);
    pushMsg( e&&e.message==="denied" ? "Du hast Benachrichtigungen nicht erlaubt. Du kannst das in den Browser-Einstellungen für diese Seite ändern."
      : e&&e.message==="nosupport" ? (isIOS?"📱 Auf dem iPhone geht das nur, wenn die App über „Teilen → Zum Home-Bildschirm“ installiert ist (ab iOS 16.4).":"Dieser Browser unterstützt leider keine Benachrichtigungen. Probier Chrome.")
      : "Das hat nicht geklappt – bitte später noch einmal versuchen.");
  }finally{ $("pushOn").disabled=false; }
};
$("pushDuel").onchange=$("pushLive").onchange=()=>{ if(pushSt.doc) pushSave().then(()=>pushMsg("✓ Gespeichert.")).catch(()=>{}); };

/* ================= KONFETTI ================= */
const cv=$("conf"), cx=cv.getContext("2d"); let parts=[], anim=null;
function confetti(n){
  try{ if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches) return; }catch(e){}
  cv.width=innerWidth; cv.height=innerHeight;
  const cols=["#e21b3c","#1368ce","#d89e00","#26890c","#c98a2b","#7cc4b5","#ff6fb5"];
  for(let i=0;i<n;i++) parts.push({x:cv.width/2+(Math.random()-.5)*cv.width*.6,y:-10-Math.random()*cv.height*.3,vx:(Math.random()-.5)*6,vy:2+Math.random()*4,
    r:4+Math.random()*5,c:cols[i%cols.length],a:Math.random()*6,va:(Math.random()-.5)*.3,life:0});
  if(!anim) anim=requestAnimationFrame(step);
}
function step(){
  cx.clearRect(0,0,cv.width,cv.height);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.06;p.vx*=.99;p.a+=p.va;p.life++;
    cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.fillStyle=p.c;cx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);cx.restore();});
  parts=parts.filter(p=>p.y<cv.height+20&&p.life<400);
  anim = parts.length? requestAnimationFrame(step) : (cx.clearRect(0,0,cv.width,cv.height),null);
}

/* ================= START ================= */
if(location.hash) history.replaceState(null,"",location.pathname+location.search);
selectFach(PARAMS.get("fach")||LS.get(G+"fach")||"bwl");
$("fachCard").classList.toggle("hidden",FAECHER.length<2);
renderHome();
BE.init().then(uid=>{
  me=uid;
  if(!uid){ setConn("off","Keine Verbindung zur Rangliste – Solo & Reihum gehen trotzdem"); renderHome(); return; }
  setConn("on", BE.mode==="mock"?"Test-Modus (nur dieses Gerät)":"Verbunden – Rangliste, Duelle & Live aktiv");
  startRankWatch(); duelsWatch(); renderHome(); pushInit();
  if(pendingDuel) loadDuelOnce(pendingDuel);
});
