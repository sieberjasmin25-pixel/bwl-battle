// Reine Entscheidungslogik für Push-Nachrichten (ohne Firebase, damit testbar).
// Gleiche Duell-Regeln wie in app.js (duelNext / chooser / ansOf).
export const DR = 6, DQ = 3;
const ansOf = (d, w, r) => (((d["r" + w] || {})[r]) || []);
const chooser = (d, r) => (r % 2 === 0 ? d.a : d.b);

const FACH_NAME = { bwl: "BWL", ergo: "Ergonomie", arch: "Architektur" };
export const fachName = k => FACH_NAME[k || "bwl"] || k;

/** Wer muss in einem laufenden Duell gerade etwas tun? → [{uid, r, kind:"play"|"choose"}] */
export function mustAct(d) {
  if (!d || d.status !== "active") return [];
  const out = [];
  for (const [w, uid] of [["a", d.a], ["b", d.b]]) {
    if (!uid) continue;
    for (let r = 0; r < DR; r++) {
      if (ansOf(d, w, r).length >= DQ) continue;
      if ((d.rd || {})[r]) out.push({ uid, r, kind: "play" });
      else if (chooser(d, r) === uid) out.push({ uid, r, kind: "choose" });
      break;   // nur die erste offene Runde zählt; sonst wartet die Person
    }
  }
  return out;
}

/** Duell-Pushs, die jetzt fällig sind (noch nicht verschickt, nicht an die Person, die gerade selbst gespielt hat). */
export function duelPushes(d, now = Date.now(), maxAgeMs = 24 * 3600e3) {
  if (!d || (d.up || 0) < now - maxAgeMs) return [];
  const sent = d.pushSent || {};
  return mustAct(d)
    .filter(x => x.uid !== d.by)
    .map(x => ({ ...x, key: `${x.r}:${x.kind}` }))
    .filter(x => sent[x.uid] !== x.key)
    .map(x => {
      const opp = x.uid === d.a ? (d.bn || "Dein:e Gegner:in") : (d.an || "Dein:e Gegner:in");
      const fresh = x.r === 0 && x.uid === d.b;
      return {
        uid: x.uid, key: x.key, tag: "duell-" + d.id,
        title: fresh ? "⚔️ Neue Herausforderung!" : "⚔️ Du bist dran!",
        body: fresh ? `${opp} fordert dich im Duell heraus · ${fachName(d.fach)}`
          : x.kind === "choose" ? `Runde ${x.r + 1} gegen ${opp}: Du wählst das Thema · ${fachName(d.fach)}`
          : `${opp} hat gespielt – Runde ${x.r + 1} wartet auf dich · ${fachName(d.fach)}`,
        path: `?duell=${encodeURIComponent(d.id)}`
      };
    });
}

/** Live-Räume, die angekündigt werden sollen, und an wen. */
export function livePushes(rooms, pushDocs, now = Date.now(), freshMs = 15 * 60e3) {
  const out = [];
  for (const r of rooms) {
    if (r.status !== "lobby" || r.pushed === true) continue;
    if (now - (r.hb || r.wAt || 0) > freshMs) continue;
    const to = pushDocs.filter(p => p.live !== false && p.token && p.id !== r.host).map(p => p.id);
    out.push({
      room: r.code || r.id, to, tag: "live-" + (r.code || r.id),
      title: "🔴 Live-Battle startet!",
      body: `${r.hostNick || "Jemand"} hat einen Raum geöffnet · ${fachName(r.fach)} · Raum ${r.code || r.id}`,
      path: `?raum=${encodeURIComponent(r.code || r.id)}`
    });
  }
  return out;
}
