# Gallisches Dorfduell – Hinweise für Claude Code

Quiz-App für eine Studentin (DHBW, Personalisierte Ernährung). Sie schreibt informell auf Deutsch – antworte auf Deutsch, kurz, ohne Fachjargon.
**Grundregel: Vor jeder größeren Änderung fragen und auf ihr OK warten.**

## Aufbau
- `index.html` (Oberfläche + CSS), `app.js` (Logik), `faecher/<kurz>.js` (ein Fragenpool pro Fach), `firebase-config.js`, `vendor/firebase-bundle.js` (Firebase SDK, gebündelt)
- Online: GitHub Pages aus `main` → https://sieberjasmin25-pixel.github.io/bwl-battle/
- Firestore-Sammlungen: `ranking/{uid}` (BWL-Werte oben, weitere Fächer unter `f.<kurz>`), `duels/{id}` und `rooms/{code}` (Feld `fach`, fehlt = bwl), `rooms/{code}/players/{uid}`. Regeln in `firestore.rules` (Änderungen muss sie selbst in der Firebase-Konsole einfügen).

## Neues Fach
1. Unterlagen komplett lesen, Klausurrelevanz klären (Dozenten-Hinweise zählen am meisten), Themen + Fragenzahl vorschlagen → **auf OK warten**.
2. `faecher/<kurz>.js` nach dem Muster von `faecher/bwl.js` anlegen: `(function(){ const TOPICS=[…]; const Q=[…]; (window.FAECHER=window.FAECHER||[]).push({kurz, name, kurzname, icon, topics:TOPICS, q:Q}); })();`
   `kurz` nur a–z/0–9, nie wieder ändern (steckt in Rangliste/Duellen). IDs mit eigenem Kürzel, damit sie sich nicht mit anderen Fächern überschneiden.
3. In `index.html` eine `<script src="faecher/<kurz>.js">`-Zeile ergänzen. Firebase-Regeln müssen dafür NICHT geändert werden.

## Fragen ändern (`faecher/<kurz>.js`)
- Format: `{id, t, type:"mc"|"match"|"num", q, …, e}` – mc: 4 Optionen, `a:0` (wird gemischt); match: `cats` + `items:[[Text,Kat]]`; num: `a`, `tol` (relativ), `unit`.
- `id` stabil lassen, nie umnummerieren. Neue Themen nur **hinten** an `TOPICS` anhängen (Index `t` steckt in der Rangliste).
- Nur Inhalte aus ihren Unterlagen; jede Frage mit Erklärung `e`; keine Namen von Lehrpersonen.

## Vor dem Pushen
`python3 tools/stamp.py` ausführen (Versionsnummer an alle Skripte + Anzeige „Version: …“ auf der Startseite – sonst laden Handys alte Dateien aus dem Cache).
`node tests/test.mjs` muss grün sein (Test-Modus mit mehreren simulierten Handys). Optional `node tests/smoke-firebase.mjs` gegen die echte Datenbank (räumt danach auf).
