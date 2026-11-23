# ⚔️ Gallisches Dorfduell

Quiz-Battle für die Klausuren (DHBW, Personalisierte Ernährung). Fächer: **Grundlagen der BWL** (102 Fragen), **Software-Ergonomie** (88 Fragen), **Software-Architektur** (94 Fragen).

**Spielen:** https://sieberjasmin25-pixel.github.io/bwl-battle/

Kein Konto, keine Anmeldung: Link öffnen, Namen eingeben, los. Das Handy merkt sich, wer du bist.

## Modi
- 🎯 **Solo · Gemischt** – 15 Fragen aus allen Themen, bevorzugt ungesehene
- 📚 **Solo · Nach Thema** – ein Thema gezielt üben
- ⚔️ **Duelle** – 1 gegen 1 wie Quizduell: 6 Runden à 3 Fragen, abwechselnd Thema wählen, spielen wann man Zeit hat. Gegner:in aus der Rangliste wählen oder per WhatsApp-Link einladen.
- 🔴 **Live-Battle** – viele Handys gleichzeitig (wie Kahoot), Raum mit 4-stelligem Code oder Link
- 👥 **Ein Handy, reihum** – 2–6 Leute an einem Gerät

## Rangliste
Pro Fach und als Gesamtwertung über alle Fächer. Gemeinsam für alle: Gesamtpunkte, Bestwert Gemischt, Duell-Siege, Trefferquote gesamt und pro Thema,
„Wer ist wo am besten?“ und ein Profil pro Person mit Stärken und Schwächen.

## Technik (für später)
- `index.html`, `app.js` – die App · `faecher/<kurz>.js` – ein Fragenpool pro Fach · `firebase-config.js` – Firebase-Projekt
- Speicher: Firebase Firestore (kostenloser Spark-Plan), anonyme Anmeldung. Regeln: `firestore.rules`
- Online über GitHub Pages (Branch `main`, Ordner `/`)
- Tests: `node tests/test.mjs` (Test-Modus, alle Spielmodi) · `node tests/smoke-firebase.mjs` (echte Datenbank)
- Test-Modus ohne Firebase: `index.html?mock=1`

Gut zu wissen: Wer den Link hat, kann mitspielen. Wer ein neues Handy/einen neuen Browser nutzt, startet in der Rangliste neu.
