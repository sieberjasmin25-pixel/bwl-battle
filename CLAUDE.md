# BWL-Battle – Hinweise für Claude Code

Quiz-App für eine Studentin (DHBW, Personalisierte Ernährung). Sie schreibt informell auf Deutsch – antworte auf Deutsch, kurz, ohne Fachjargon.
**Grundregel: Vor jeder größeren Änderung fragen und auf ihr OK warten.**

## Aufbau
- `index.html` (Oberfläche + CSS), `app.js` (Logik), `fragen.js` (Fragenpool), `firebase-config.js`, `vendor/firebase-bundle.js` (Firebase SDK, gebündelt)
- Online: GitHub Pages aus `main` → https://sieberjasmin25-pixel.github.io/bwl-battle/
- Firestore-Sammlungen: `ranking/{uid}`, `duels/{id}`, `rooms/{code}` + `rooms/{code}/players/{uid}`. Regeln in `firestore.rules` (Änderungen muss sie selbst in der Firebase-Konsole einfügen).

## Fragen ändern (`fragen.js`)
- Format: `{id, t, type:"mc"|"match"|"num", q, …, e}` – mc: 4 Optionen, `a:0` (wird gemischt); match: `cats` + `items:[[Text,Kat]]`; num: `a`, `tol` (relativ), `unit`.
- `id` stabil lassen, nie umnummerieren. Neue Themen nur **hinten** an `TOPICS` anhängen (Index `t` steckt in der Rangliste).
- Nur Inhalte aus ihren Unterlagen; jede Frage mit Erklärung `e`; keine Namen von Lehrpersonen.

## Vor dem Pushen
`node tests/test.mjs` muss grün sein (Test-Modus mit mehreren simulierten Handys). Optional `node tests/smoke-firebase.mjs` gegen die echte Datenbank (räumt danach auf).
