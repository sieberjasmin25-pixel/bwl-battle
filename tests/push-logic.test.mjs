// Tests für die Push-Entscheidungslogik. Start: node tests/push-logic.test.mjs
import { mustAct, duelPushes, livePushes } from "../tools/push/logic.mjs";
let fails = 0; const ok = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const now = Date.now();
const three = [{ f: 1, p: 100 }, { f: 0, p: 0 }, { f: 1, p: 100 }];
const base = { id: "d1", a: "A", an: "Anna", b: "B", bn: "Ben", fach: "ergo", status: "active", rd: {}, ra: {}, rb: {}, up: now, by: "A" };

console.log("Push-Logik");
// 1) gezielte Herausforderung, noch nichts gespielt: Anna muss wählen – aber sie hat es selbst gerade erstellt
let d = { ...base };
ok(JSON.stringify(mustAct(d)) === JSON.stringify([{ uid: "A", r: 0, kind: "choose" }]), "Neues Duell: Anna wählt Runde 1");
ok(duelPushes(d, now).length === 0, "Kein Push an die Person, die gerade selbst gehandelt hat");
// 2) Anna hat Runde 1 gewählt und gespielt → Ben ist dran (neue Herausforderung)
d = { ...base, rd: { 0: { t: 1, q: ["x", "y", "z"] } }, ra: { 0: three } };
let p = duelPushes(d, now);
ok(p.length === 1 && p[0].uid === "B" && /Herausforderung/.test(p[0].title) && p[0].path === "?duell=d1", "Anna fertig → Ben bekommt „Neue Herausforderung“");
// 3) schon verschickt → nicht doppelt
ok(duelPushes({ ...d, pushSent: { B: p[0].key } }, now).length === 0, "Gleicher Stand → kein zweiter Push");
// 4) Ben spielt Runde 1 und wählt Runde 2, spielt sie → Anna ist dran (Runde 2 spielen)
d = { ...d, by: "B", rd: { 0: d.rd[0], 1: { t: 2, q: ["a", "b", "c"] } }, rb: { 0: three, 1: three }, pushSent: { B: p[0].key } };
p = duelPushes(d, now);
ok(p.length === 1 && p[0].uid === "A" && /Runde 2/.test(p[0].body) && /Ben/.test(p[0].body), "Ben fertig → Anna: „Ben hat gespielt – Runde 2 wartet“");
// 5) Ben hat Runde 1 gespielt, aber Runde 2 noch nicht gewählt → Ben muss wählen, Anna wartet
d = { ...base, by: "B", rd: { 0: { t: 1, q: [] } }, ra: { 0: three }, rb: { 0: three } };
ok(JSON.stringify(mustAct(d)) === JSON.stringify([{ uid: "B", r: 1, kind: "choose" }]), "Zwischenstand: Ben wählt Runde 2, Anna wartet");
ok(duelPushes(d, now).length === 0, "…und Ben hat gerade selbst gespielt → kein Push");
// 6) beendet / offen / alt
ok(duelPushes({ ...d, status: "done", by: "A" }, now).length === 0, "Beendetes Duell → kein Push");
ok(duelPushes({ ...base, status: "open", b: null }, now).length === 0, "Offene Herausforderung (Link) → kein Push");
ok(duelPushes({ ...d, by: "A", up: now - 30 * 3600e3 }, now).length === 0, "Älter als 24 Std. → kein Push");

// Live
const rooms = [
  { id: "1234", code: "1234", status: "lobby", host: "A", hostNick: "Anna", fach: "bwl", pushed: false, hb: now - 30e3 },
  { id: "2222", code: "2222", status: "lobby", host: "B", pushed: true, hb: now },
  { id: "3333", code: "3333", status: "lobby", host: "B", pushed: false, hb: now - 3600e3 },
  { id: "4444", code: "4444", status: "q", host: "B", pushed: false, hb: now }
];
const docs = [{ id: "A", token: "t1", live: true }, { id: "B", token: "t2", live: true }, { id: "C", token: "t3", live: false }, { id: "D", token: "", live: true }];
const lp = livePushes(rooms, docs, now);
ok(lp.length === 1 && lp[0].room === "1234", "Nur neue, frische Räume im Warteraum werden angekündigt");
ok(JSON.stringify(lp[0].to) === JSON.stringify(["B"]), "Empfänger: alle mit „Live“ an und Token – nicht der Host, nicht wer es ausgeschaltet hat");
ok(/Anna/.test(lp[0].body) && /BWL/.test(lp[0].body) && lp[0].path === "?raum=1234", "Text nennt Host, Fach und Raum, Link öffnet den Raum");

console.log(fails ? `\n${fails} Test(s) fehlgeschlagen` : "\nPush-Logik: alle Tests bestanden ✅");
process.exit(fails ? 1 : 0);
