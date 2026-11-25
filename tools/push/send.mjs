// Verschickt fällige Push-Nachrichten. Läuft als GitHub Action (.github/workflows/push.yml) alle paar Minuten.
// Braucht die Umgebungsvariable FIREBASE_SERVICE_ACCOUNT (JSON des Firebase-Dienstkontos, als GitHub-Secret).
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { duelPushes, livePushes } from "./logic.mjs";

const APP_URL = process.env.APP_URL || "https://sieberjasmin25-pixel.github.io/bwl-battle/";
const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!sa) { console.log("FIREBASE_SERVICE_ACCOUNT fehlt – nichts zu tun."); process.exit(0); }
initializeApp({ credential: cert(JSON.parse(sa)) });
const db = getFirestore();
const fcm = getMessaging();
const now = Date.now();

const pushDocs = (await db.collection("push").get()).docs.map(d => ({ id: d.id, ...d.data() }));
const byUid = Object.fromEntries(pushDocs.map(p => [p.id, p]));
let sent = 0, failed = 0;

async function send(uid, msg) {
  const p = byUid[uid];
  if (!p || !p.token) return false;
  try {
    await fcm.send({
      token: p.token,
      data: { title: msg.title, body: msg.body, url: APP_URL + msg.path, tag: msg.tag || "" },
      webpush: { headers: { Urgency: "high", TTL: "21600" } }
    });
    sent++; return true;
  } catch (e) {
    failed++;
    const code = e && e.code || "";
    console.log("Fehler bei", uid, code);
    if (/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) {
      await db.doc("push/" + uid).update({ token: "" }).catch(() => {});
      p.token = "";
    }
    return false;
  }
}

// ---- Duelle: du bist dran ----
const duels = await db.collection("duels").where("up", ">", now - 24 * 3600e3).get();
for (const doc of duels.docs) {
  const d = { id: doc.id, ...doc.data() };
  for (const m of duelPushes(d, now)) {
    const pref = byUid[m.uid];
    if (pref && pref.duel !== false) await send(m.uid, m);
    // als erledigt markieren, auch ohne Token – sonst würde es bei jedem Lauf erneut versucht
    await doc.ref.update({ ["pushSent." + m.uid]: m.key });
  }
}

// ---- Live-Battles: neuer Raum ----
const rooms = (await db.collection("rooms").where("status", "==", "lobby").get()).docs.map(d => ({ id: d.id, ...d.data() }));
for (const m of livePushes(rooms, pushDocs, now)) {
  for (const uid of m.to) await send(uid, m);
  await db.doc("rooms/" + m.room).update({ pushed: true });
}

console.log(`Fertig: ${sent} verschickt, ${failed} fehlgeschlagen.`);
