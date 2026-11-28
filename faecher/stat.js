// Fragenpool · Statistische Grundlagen der Gesundheitswissenschaften (DHBW, Personalisierte Ernährung, PE25A1)
// Quelle: Transkript Klausurvorbereitung (Dozent), Probeklausur (PDF + ausgearbeitete HTML-Version), Übungsblätter 2 und 3, Formelsammlung mit Anleitung
// Klausur: 120 P (60 deskriptiv, 60 induktiv). Schwerpunkt hier laut Jasmin: Vorgehen, Formel, Umstellen – nur einfache Rechnungen.
(function(){
const TOPICS = [
  "Grundbegriffe","Skalenniveaus","UV/AV & Korrelation","Lagemaße","Quartile & Spannweite","Varianz & Standardabweichung",
  "Schiefe & Kurtosis","Gini-Koeffizient","Rangkorrelation (Spearman)","Wahrscheinlichkeit & Mengen","Laplace & Würfel",
  "Vierfeldertafel & bedingte W.","Baumdiagramm","Kombinatorik","Verteilungen & z-Wert","Konfidenzintervall","t-Tests",
  "Forschung & Gütekriterien"
];
const Q = [
/* ---------- 0 Grundbegriffe ---------- */
{id:"gb1",t:0,type:"mc",q:"Welche zwei großen Teilbereiche hat die Statistik?",
 o:["Deskriptive (beschreibende) und induktive (schließende) Statistik","Qualitative und quantitative Statistik","Wahrscheinlichkeit und Kombinatorik","Stichprobe und Grundgesamtheit"],a:0,
 e:"Das sollst du laut Dozent auf jeden Fall wissen: Deskriptive und induktive Statistik sind die beiden Teile der Statistik. In der Klausur je 60 Punkte."},
{id:"gb2",t:0,type:"match",q:"Deskriptive oder induktive Statistik?",
 cats:["Deskriptive Statistik","Induktive Statistik"],
 items:[["Daten beschreiben, aufbereiten und verdichten (Mittelwert, Diagramme)",0],["Mit Wahrscheinlichkeitstheorie über die Daten hinaus auf die Grundgesamtheit schließen",1],["Konfidenzintervall und t-Test",1],["Gini-Koeffizient und Quartile",0]],
 e:"Deskriptiv = beschreibend für die erhobenen Daten. Induktiv = schließend: von der Stichprobe auf die Grundgesamtheit (Übungsblatt 3, Aufgabe 6)."},
{id:"gb3",t:0,type:"match",q:"Sie untersuchen die Schlafqualität von Nachtschichtarbeitenden mit einem validierten Fragebogen. Ordne zu.",
 cats:["Grundgesamtheit","Merkmalsträger","Merkmal","Merkmalsausprägung"],
 items:[["die Menge aller Nachtschichtarbeitenden in Deutschland",0],["alle Nachtschichtarbeitenden eines Unternehmens, die den Fragebogen ausfüllen",1],["die latente Variable „Schlafqualität“",2],["der individuelle Score einer befragten Person",3]],
 e:"Genau so in der Probeklausur (Aufgabe 9). Dozent: In der Klausur nur die Nummer eintragen, nicht den ganzen Text abschreiben – spart Zeit."},
{id:"gb4",t:0,type:"match",q:"Studie „Wie viele Gramm Zucker essen Studierende pro Tag?“ – ordne zu.",
 cats:["Grundgesamtheit","Merkmalsträger","Merkmal","Merkmalsausprägung"],
 items:[["alle Studierenden der Hochschule",0],["die befragte Studentin Lea",1],["Zuckerkonsum pro Tag",2],["„85 g“",3]],
 e:"Merkmalsträger = wer untersucht wird · Merkmal = was untersucht wird · Merkmalsausprägung = der konkrete Wert · Grundgesamtheit = alle, über die man etwas aussagen will."},
{id:"gb5",t:0,type:"mc",q:"Was unterscheidet eine latente von einer manifesten Variable?",
 o:["Latente Variablen sind nur indirekt über manifeste Merkmale messbar (z. B. Persönlichkeit), manifeste direkt (z. B. Körpergewicht)","Latente Variablen sind immer metrisch, manifeste immer nominal","Manifeste Variablen kann man nicht messen","Latente Variablen gibt es nur in der induktiven Statistik"],a:0,
 e:"Manifest = direkt beobachtbar (Gewicht, Größe). Latent = nur indirekt erfassbar, z. B. „Schlafqualität“ über einen Fragebogen-Score (Übungsblatt 2, Aufgabe 9)."},
{id:"gb6",t:0,type:"mc",q:"Was ist eine Stichprobe?",
 o:["Eine Teilmenge der Grundgesamtheit, an der tatsächlich gemessen wird","Die Menge aller Merkmalsträger","Ein einzelner Messwert","Die Differenz zwischen zwei Mittelwerten"],a:0,
 e:"Von der Stichprobe schließt die induktive Statistik auf die Grundgesamtheit. Achtung bei der Varianz: Stichprobe ÷ (n − 1), Grundgesamtheit ÷ n."},

/* ---------- 1 Skalenniveaus ---------- */
{id:"sk1",t:1,type:"match",q:"Welches Skalenniveau?",
 cats:["Nominal","Ordinal","Metrisch"],
 items:[["Familienstand",0],["Zufriedenheit (sehr unzufrieden … sehr zufrieden)",1],["Körpergröße in cm",2],["Haarfarbe",0],["Bildungsstatus (kein Abschluss … Master)",1],["Einkommen in €",2],["Raucher / Nichtraucher",0],["Anzahl Kinder in einer Schulklasse",2]],
 e:"Nominal = nur unterscheiden · Ordinal = Rangfolge, Abstände nicht gleich · Metrisch = gleiche Abstände, rechnen sinnvoll (mit natürlichem Nullpunkt: doppelt so groß ist sinnvoll)."},
{id:"sk2",t:1,type:"mc",q:"Warum ist „Zufriedenheit (sehr unzufrieden bis sehr zufrieden)“ ordinalskaliert?",
 o:["Die Ausprägungen lassen sich in eine Rangfolge bringen, die Abstände zwischen den Stufen sind aber nicht gleich groß","Weil es nur zwei Ausprägungen gibt","Weil man einen Mittelwert bilden kann","Weil es einen natürlichen Nullpunkt gibt"],a:0,
 e:"Dozent: Skalenniveau nicht nur nennen, sondern begründen. Muster aus der Probeklausur: „… ist ordinal, weil Rangfolge möglich, Abstände nicht gleich.“"},
{id:"sk3",t:1,type:"mc",q:"Warum ist der Familienstand nominalskaliert?",
 o:["Die Kategorien (ledig, verheiratet, …) lassen sich nur unterscheiden – es gibt keine sinnvolle Rangfolge","Weil man die Personen zählen kann","Weil verheiratet „mehr“ ist als ledig","Weil es gleich große Abstände gibt"],a:0,
 e:"Nominal = Etiketten, die wir selbst festlegen. Sinnvoll ist hier nur der Modus."},
{id:"sk4",t:1,type:"mc",q:"Woran erkennst du eine metrische Skala (z. B. Körpergröße in cm)?",
 o:["Gleiche Abstände; mit natürlichem Nullpunkt sind Verhältnisse interpretierbar („doppelt so groß“)","Es gibt nur zwei Kategorien","Man kann die Werte nur ordnen","Die Werte sind Namen"],a:0,
 e:"Körpergröße: absoluter Nullpunkt, 180 cm ist doppelt so groß wie 90 cm → metrisch (verhältnisskaliert)."},
{id:"sk5",t:1,type:"match",q:"Welcher Lagewert ist ab welchem Skalenniveau sinnvoll?",
 cats:["schon ab nominal","ab ordinal","erst metrisch"],
 items:[["Modus",0],["Median",1],["Arithmetisches Mittel",2]],
 e:"Für Haarfarbe gibt es nur einen Modus, für Schulnoten-Ränge einen Median, für Gewicht auch einen Mittelwert."},

/* ---------- 2 UV/AV & Korrelation ---------- */
{id:"uv1",t:2,type:"match",q:"Ordne UV (vermutete Ursache) und AV (vermutete Wirkung) zu.",
 cats:["UV (unabhängige Variable)","AV (abhängige Variable)"],
 items:[["Anzahl Krafttrainingseinheiten pro Woche",0],["Körperfettanteil in %",1],["Zuckerkonsum pro Tag",0],["Anzahl Karies-Stellen",1]],
 e:"UV = Prädiktor, vermutete Ursache. AV = vermutete Wirkung/Reaktion. Dozent: Bei „Zuckerkonsum bei irgendwas“ ist Zucker die UV."},
{id:"uv2",t:2,type:"mc",q:"Sie erhalten r = −0,58 zwischen Krafttraining und Körperfettanteil. Wie deutest du das?",
 o:["Mittlerer bis starker negativer Zusammenhang: mehr Training geht tendenziell mit weniger Körperfett einher – aber keine Kausalität","Starker positiver Zusammenhang – Training verursacht Fettabbau","Kein Zusammenhang, weil r negativ ist","58 % des Körperfetts werden durch Training erklärt"],a:0,
 e:"Vorzeichen = Richtung, Betrag = Stärke. Dozent: „Bei Kausalität sagen Sie bitte nein“ – Drittvariablen wie Ernährung könnten wirken."},
{id:"uv3",t:2,type:"match",q:"Stärke eines Zusammenhangs (nach Cohen, Folie): Ordne den Betrag von r zu.",
 cats:["schwach","mittel","stark"],
 items:[["|r| = 0,2",0],["|r| = 0,4",1],["|r| = 0,78",2],["|r| = 0,12",0]],
 e:"0,1–0,3 schwach · 0,3–0,5 mittel · über 0,5 stark. Das Vorzeichen sagt nur die Richtung."},
{id:"uv4",t:2,type:"mc",q:"Warum darf man aus einer Korrelation keine Kausalität ableiten?",
 o:["Ein Zusammenhang kann durch Drittvariablen entstehen, und die Richtung ist unklar","Weil r immer kleiner als 1 ist","Weil Korrelationen nur für nominale Daten gelten","Weil man dafür die Varianz bräuchte"],a:0,
 e:"Folienbeispiel: Störche und Geburten. Der Satz „Korrelation ≠ Kausalität“ gehört laut Dozent zu jeder Interpretation."},
{id:"uv5",t:2,type:"mc",q:"Was bedeutet r = 0?",
 o:["Kein linearer Zusammenhang","Ein perfekter Zusammenhang","Ein negativer Zusammenhang","Die Daten sind fehlerhaft"],a:0,
 e:"r liegt zwischen −1 und +1: ±1 = perfekter linearer Zusammenhang, 0 = keiner."},

/* ---------- 3 Lagemaße ---------- */
{id:"lm1",t:3,type:"num",q:"Berechne das arithmetische Mittel: 12, 18, 15, 21, 14",a:16,tol:0.003,unit:"",
 e:"Summe 80 ÷ 5 Werte = 16. Nicht sortieren – beim Mittelwert spielt die Reihenfolge keine Rolle."},
{id:"lm2",t:3,type:"mc",q:"Laut Dozent kostet ein Fehler beim arithmetischen Mittel in der Klausur viel Zeit. Welcher?",
 o:["Die Liste vorher zu sortieren – beim Mittelwert ist die Reihenfolge egal","Doppelte Werte mehrfach zu zählen","Durch die Anzahl der Werte zu teilen","Den Taschenrechner zu benutzen"],a:0,
 e:"„Wenn ich einen sehe, der beim arithmetischen Mittel die Liste ordnet …“ – einfach alles addieren und durch n teilen. Doppelte Werte zählen jedes Mal!"},
{id:"lm3",t:3,type:"mc",q:"Urliste: 13, 8, 21, 13, 21, 17, 21, 13, 30. Was ist der Modus?",
 o:["13 und 21 – beide kommen am häufigsten vor (bimodal)","Nur 13","Nur 21","17 – der Wert in der Mitte"],a:0,
 e:"13 und 21 kommen je dreimal vor → zwei Modalwerte (bimodal). Probeklausur Aufgabe 12: „Achten Sie auf Besonderheiten bei der Interpretation des Modus.“"},
{id:"lm4",t:3,type:"num",q:"Bestimme den Median: 22, 8, 15, 10, 12",a:12,tol:0,unit:"",
 e:"Sortieren: 8, 10, 12, 15, 22. n = 5 ungerade → Position (5+1)/2 = 3 → Median = 12."},
{id:"lm5",t:3,type:"num",q:"Bestimme den Median: 6, 14, 9, 20, 11, 16",a:12.5,tol:0.003,unit:"",
 e:"Sortieren: 6, 9, 11, 14, 16, 20. n = 6 gerade → Mittel der Werte an Position 3 und 4: (11 + 14) ÷ 2 = 12,5."},
{id:"lm6",t:3,type:"order",q:"Median bestimmen: Bring die Schritte in die richtige Reihenfolge.",
 items:["Werte sortieren","n zählen","Position bestimmen ((n+1)/2 bzw. die zwei mittleren)","Wert an der Position ablesen"],
 e:"Achtung: Die Formel liefert die Position, nicht den Wert – nie aus der unsortierten Liste ablesen."},
{id:"lm7",t:3,type:"num",q:"Umstellen: 8 Kundinnen kaufen im Schnitt für 45 € ein (x̄ = 45). Wie groß ist die Summe aller Einkäufe Σx (in €)?",a:360,tol:0,unit:"€",
 e:"Dreieck-Trick: x̄ = Σx ÷ n → Σx = x̄ · n = 45 · 8 = 360 €."},

/* ---------- 4 Quartile & Spannweite ---------- */
{id:"qu1",t:4,type:"num",q:"Q1 berechnen – erster Schritt: Wie groß ist m = p/100 · (n + 1) für das 1. Quartil bei n = 5?",a:1.5,tol:0,unit:"",
 e:"m = 25/100 · (5 + 1) = 1,5 → g = 1 (Zahl vor dem Komma), r = 0,5 (Nachkommateil)."},
{id:"qu2",t:4,type:"mc",q:"Für Q1 ergibt sich m = 1,5 bei der sortierten Liste 8, 10, 12, 15, 22. Wie rechnest du Q1 aus?",
 o:["Q1 = (1 − 0,5) · x₍₁₎ + 0,5 · x₍₂₎ = 0,5 · 8 + 0,5 · 10 = 9","Q1 = x₍₁,₅₎ = 8","Q1 = 1,5 · 8 = 12","Q1 = (8 + 22) ÷ 2 = 15"],a:0,
 e:"Q = (1 − r) · x₍g₎ + r · x₍g+1₎. g = 1, r = 0,5. Übungsblatt 2, Aufgabe 2: Q1 = 9, Q3 = 18,5, IQA = 9,5."},
{id:"qu3",t:4,type:"order",q:"Quartil berechnen: Bring die Schritte in die richtige Reihenfolge.",
 items:["Werte sortieren","m = p/100 · (n + 1) berechnen","g (vor dem Komma) und r (Nachkommateil) hinschreiben","In Q = (1 − r) · x₍g₎ + r · x₍g+1₎ einsetzen"],
 e:"g und r hinschreiben gibt schon Teilpunkte. Ist m ganzzahlig, ist Q einfach der Wert an Position m."},
{id:"qu4",t:4,type:"mc",q:"Typischer Fehler beim Quartil: Welcher ist es?",
 o:["Mit n statt n + 1 rechnen","Vorher sortieren","g und r hinschreiben","r dem größeren Wert x₍g+1₎ zuordnen"],a:0,
 e:"Richtig ist m = p/100 · (n + 1). Und r gehört zum größeren Wert x₍g+1₎."},
{id:"qu5",t:4,type:"num",q:"Q1 = 28 und Q3 = 222. Wie groß ist der Interquartilsabstand (IQA)?",a:194,tol:0,unit:"",
 e:"IQA = Q3 − Q1 = 222 − 28 = 194 (Übungsblatt 3, Aufgabe 2). Er beschreibt die Streuung der mittleren 50 %."},
{id:"qu6",t:4,type:"num",q:"Wie groß ist die Spannweite: 14, 28, 55, 71, 151, 222, 234?",a:220,tol:0,unit:"",
 e:"Spannweite R = Maximum − Minimum = 234 − 14 = 220."},
{id:"qu7",t:4,type:"num",q:"Q1 = 9, Q3 = 18,5, IQA = 9,5. Wo liegt die obere Ausreißergrenze Q3 + 1,5 · IQA?",a:32.75,tol:0.002,unit:"",
 e:"18,5 + 1,5 · 9,5 = 18,5 + 14,25 = 32,75. Ein Wert von 22 ist also kein Ausreißer."},

/* ---------- 5 Varianz & Standardabweichung ---------- */
{id:"va1",t:5,type:"mc",q:"Die BMI-Werte ALLER 4 Teilnehmenden einer Studie (Population) liegen vor. Durch was teilst du bei der Varianz?",
 o:["Durch n (Populationsvarianz σ²)","Durch n − 1","Durch n + 1","Durch die Standardabweichung"],a:0,
 e:"Dozent: In der Klausur geht es um die Population – „Sie teilen nicht durch n − 1“. ÷ (n − 1) nur bei einer Stichprobe („zufällig ausgewählt“)."},
{id:"va2",t:5,type:"match",q:"Durch n oder durch n − 1? Achte auf die Formulierung.",
 cats:["÷ n (Population σ²)","÷ (n − 1) (Stichprobe s²)"],
 items:[["„Berechnen Sie die Populationsvarianz“",0],["„Dafür wurden zufällig 8 Kunden ausgewählt“",1],["„alle Mitarbeitenden der Station“",0],["„eine Stichprobe von 20 Personen“",1]],
 e:"Erst lesen: alle / Population → ÷ n. Zufällig ausgewählt / Stichprobe → ÷ (n − 1). (Probeklausur Aufgabe 1 ist eine Stichprobe!)"},
{id:"va3",t:5,type:"num",q:"Populationsvarianz: BMI-Werte 27, 24, 23, 22 (Mittelwert 24). Wie groß ist σ²?",a:3.5,tol:0.003,unit:"",
 e:"Abweichungen: 3, 0, −1, −2 → Quadrate 9, 0, 1, 4 → Summe 14 → σ² = 14 ÷ 4 = 3,5 (Übungsblatt 2, Aufgabe 3). σ = √3,5 ≈ 1,87."},
{id:"va4",t:5,type:"num",q:"Die Varianz beträgt 652,75. Wie groß ist die Standardabweichung? (2 Nachkommastellen)",a:25.55,tol:0.002,unit:"",
 e:"σ = √σ² = √652,75 ≈ 25,55 (Übungsblatt 3, Aufgabe 3)."},
{id:"va5",t:5,type:"order",q:"Varianz berechnen: Bring die Schritte in die richtige Reihenfolge.",
 items:["Mittelwert x̄ (bzw. μ) berechnen","Für jeden Wert xᵢ − x̄ bilden (Kontrolle: Summe = 0)","Abweichungen quadrieren und addieren","Durch n (Population) bzw. n − 1 (Stichprobe) teilen","Für die Standardabweichung die Wurzel ziehen"],
 e:"Reihenfolge der Werte ist egal – nicht sortieren!"},
{id:"va6",t:5,type:"mc",q:"Einkäufe in € → in welcher Einheit stehen Varianz und Standardabweichung?",
 o:["Varianz in €², Standardabweichung in €","Beide in €","Beide in %","Varianz in €, Standardabweichung in €²"],a:0,
 e:"Die Varianz quadriert die Abweichungen → Einheit²; die Wurzel bringt die Standardabweichung zurück in die Originaleinheit."},

/* ---------- 6 Schiefe & Kurtosis ---------- */
{id:"sc1",t:6,type:"match",q:"Schiefe nach Yule/Pearson gᵧ deuten:",
 cats:["rechtsschief (linkssteil)","linksschief (rechtssteil)","symmetrisch"],
 items:[["gᵧ = 0,85",0],["gᵧ = −0,5",1],["gᵧ = 0",2]],
 e:"Positiv = rechtsschief (Mittelwert > Median), negativ = linksschief (Mittelwert < Median), 0 = symmetrisch. Laut Dozent nur deuten, nicht berechnen."},
{id:"sc2",t:6,type:"match",q:"Kurtosis (Wölbung) deuten – Vergleichswert 3:",
 cats:["steilgipflig (spitzer als normal)","wie die Normalverteilung","flachgipflig (breiter)"],
 items:[["Kurtosis = 4,2",0],["Kurtosis = 3",1],["Kurtosis = 2,1",2]],
 e:"> 3 steilgipflig · = 3 normalverteilt · < 3 flachgipflig. Probeklausur: Kurtosis 2,1 → flachgipflig, breiter gestreut."},
{id:"sc3",t:6,type:"mc",q:"Sitzdauer von Büroangestellten: gᵧ = −0,5. Was bedeutet das?",
 o:["Linksschief: Mittelwert < Median – die meisten sitzen lange, wenige deutlich kürzer","Rechtsschief: die meisten sitzen kurz","Symmetrisch verteilt","Die Daten sind fehlerhaft"],a:0,
 e:"Bei linksschiefen Verteilungen ziehen wenige kleine Werte den Mittelwert nach unten."},
{id:"sc4",t:6,type:"mc",q:"Welche Formel ist die Schiefe nach Yule/Pearson?",
 o:["gᵧ = 3 · (x̄ − x̃) ÷ S","gᵧ = (x̄ − μ) ÷ (s ÷ √n)","gᵧ = 1 − 6 · Σd² ÷ (n · (n² − 1))","gᵧ = Σ(xᵢ − x̄)² ÷ n"],a:0,
 e:"Mittelwert minus Median, mal 3, geteilt durch die Standardabweichung. Beispiel Übungsblatt: 3 · (19,24 − 16,9) ÷ 8,25 = 0,85."},

/* ---------- 7 Gini ---------- */
{id:"gi1",t:7,type:"mc",q:"Welche Formel gilt für den korrigierten Gini-Koeffizienten?",
 o:["G* = n ÷ (n − 1) · G","G* = (n − 1) ÷ n · G","G* = G ÷ n","G* = 1 − G"],a:0,
 e:"Korrektur, weil bei kleinem n der Wert 1 sonst nicht erreichbar ist. Dozent: Den korrigierten Gini musst du berechnen und interpretieren können."},
{id:"gi2",t:7,type:"num",q:"Gegeben: G = 0,2368 bei n = 6 Personen. Wie groß ist der korrigierte Gini G*? (4 Nachkommastellen)",a:0.2842,tol:0.003,unit:"",
 e:"G* = 6/5 · 0,2368 = 0,2842 → niedrige Konzentration (Probeklausur Aufgabe 6, Alkoholkonsum)."},
{id:"gi3",t:7,type:"order",q:"Korrigierten Gini berechnen: Bring die Schritte in die richtige Reihenfolge.",
 items:["Werte aufsteigend sortieren, Platz i = 1, 2, 3 …","Σ xᵢ und Σ i · xᵢ bilden","G = 2 · Σ i·xᵢ ÷ (n · Σ xᵢ) − (n + 1) ÷ n","G* = n ÷ (n − 1) · G","Deuten (≤ 0,3 niedrige Konzentration …)"],
 e:"Typische Fehler: nicht sortieren oder die Korrektur vergessen – gefragt ist meist der KORRIGIERTE Wert."},
{id:"gi4",t:7,type:"match",q:"Gini (korrigiert) deuten:",
 cats:["niedrige Konzentration (eher gleich verteilt)","mittlere Konzentration","starke Konzentration"],
 items:[["G* = 0,19",0],["G* = 0,45",1],["G* = 0,85",2],["G* = 0,28",0]],
 e:"Skala: bis 0,3 niedrig · bis 0,7 mittel · darüber stark (Folie/Formelsammlung)."},
{id:"gi5",t:7,type:"mc",q:"Land A hat einen Gini von 0,0, Land B von 0,8. Was stimmt?",
 o:["In A ist das Einkommen perfekt gleich verteilt, in B sehr ungleich (wenige besitzen fast alles)","In A besitzt eine Person alles","In B ist alles gleich verteilt","Beide Länder sind gleich"],a:0,
 e:"0 = alle haben gleich viel, 1 = einer hat alles (Übungsblatt 3, Aufgabe 21)."},
{id:"gi6",t:7,type:"mc",q:"Bei der Gini-Formel G = 2 · Σ i·xᵢ ÷ (n · Σ xᵢ) − (n+1)/n: Was ist i?",
 o:["Der Platz des Werts in der aufsteigend sortierten Liste","Der Wert selbst","Die Häufigkeit","Die Anzahl der Werte"],a:0,
 e:"Darum muss man beim Gini zuerst sortieren: kleinster Wert bekommt i = 1."},

/* ---------- 8 Spearman ---------- */
{id:"sp1",t:8,type:"mc",q:"Welche Formel gilt für die Rangkorrelation nach Spearman?",
 o:["rₛ = 1 − 6 · Σ dᵢ² ÷ (n · (n² − 1))","rₛ = 6 · Σ dᵢ ÷ n","rₛ = Σ dᵢ² ÷ (n − 1)","rₛ = 1 − Σ dᵢ ÷ n²"],a:0,
 e:"„1 −“ nicht vergessen! d = Rangdifferenz. Laut Dozent kommen in der Klausur 5 Personen: n · (n² − 1) = 5 · 24 = 120."},
{id:"sp2",t:8,type:"order",q:"Spearman berechnen: Bring die Schritte in die richtige Reihenfolge.",
 items:["Ränge für Merkmal x vergeben (kleinster Wert = Rang 1)","Ränge für Merkmal y vergeben","dᵢ = Rang x − Rang y bilden (Kontrolle: Σd = 0)","dᵢ² addieren","In rₛ = 1 − 6·Σd² ÷ (n·(n² − 1)) einsetzen und deuten"],
 e:"Tabelle ausfüllen ≈ 3 Punkte, Rest ≈ 6 Punkte (laut Dozent)."},
{id:"sp3",t:8,type:"num",q:"Spearman mit n = 5 Personen, Σ dᵢ² = 6. Wie groß ist rₛ?",a:0.7,tol:0.002,unit:"",
 e:"rₛ = 1 − 6 · 6 ÷ (5 · 24) = 1 − 36/120 = 1 − 0,3 = 0,7 → starker positiver Zusammenhang."},
{id:"sp4",t:8,type:"mc",q:"Bei einem Lauf hat die schnellste Zeit 11,45 s. Welche Platzierung bekommt sie?",
 o:["Platz 1 (kleinste Zeit = bester Platz)","Den letzten Platz","Platz 0","Den mittleren Platz"],a:0,
 e:"Wie in der Probeklausur: Die kleinste Zeit ist Platz 1. Beim Alter bekommt der Jüngste Rang 1."},

/* ---------- 9 Wahrscheinlichkeit & Mengen ---------- */
{id:"wm1",t:9,type:"mc",q:"Was ist ein Laplace-Experiment?",
 o:["Ein Zufallsexperiment, bei dem alle Ergebnisse gleich wahrscheinlich sind (z. B. fairer Würfel)","Ein Experiment ohne Zufall","Ein Experiment mit genau zwei Personen","Ein Experiment, bei dem man zurücklegt"],a:0,
 e:"Dozent: Laplace ist ein Zufallsexperiment mit spezifischen Bedingungen – die gleiche Wahrscheinlichkeit der Elementarereignisse. Keine Lebensgeschichte von Laplace nötig 😉"},
{id:"wm2",t:9,type:"mc",q:"„Bei Laplace ist die Wahrscheinlichkeit der Elementarereignisse egal.“ Stimmt das?",
 o:["Falsch – Voraussetzung ist gerade die Gleichwahrscheinlichkeit der Elementarereignisse","Richtig","Nur bei Münzen richtig","Nur bei mehr als 6 Ergebnissen richtig"],a:0,
 e:"Übungsblatt 3, Aufgabe 18."},
{id:"wm3",t:9,type:"mc",q:"Was bedeutet „A und B sind disjunkt“?",
 o:["Sie schließen sich aus – können nicht gleichzeitig eintreten (A ∩ B = ∅)","Sie treten immer gemeinsam auf","Sie haben die gleiche Wahrscheinlichkeit","Eines ist das Gegenereignis des anderen"],a:0,
 e:"Beispiel: „beide Augenzahlen gleich“ und „Summe = 3“ – das geht nie gleichzeitig."},
{id:"wm4",t:9,type:"multi",q:"Ein fairer Würfel wird einmal geworfen. Welche Ergebnisse gehören zum Ereignis „Augenzahl ist nicht 2“?",
 o:["1","2","3","4","5","6"],c:[0,2,3,4,5],
 e:"Ω = {1, 2, 3, 4, 5, 6} → „nicht 2“ = {1, 3, 4, 5, 6} (Gegenereignis zu {2})."},
{id:"wm5",t:9,type:"multi",q:"Zwei Würfel: A = „beide Augenzahlen gleich“, B = „Summe ist 3“. Welche Paare gehören zu A ∪ B?",
 o:["(1,1)","(2,2)","(1,2)","(2,1)","(1,3)","(3,0)"],c:[0,1,2,3],
 e:"A ∪ B = alle Paare aus A ODER B: (1,1) … (6,6) sowie (1,2), (2,1). (1,3) hat Summe 4, (3,0) gibt es nicht."},
{id:"wm6",t:9,type:"match",q:"Was bedeuten die Zeichen?",
 cats:["A ∪ B","A ∩ B","B \\ A","∅"],
 items:[["A oder B (Vereinigung)",0],["A und B gleichzeitig (Schnittmenge)",1],["B ohne die Elemente von A",2],["leere Menge",3]],
 e:"Probeklausur Aufgabe 3B: A ∪ B, A ∩ B = ∅, B \\ A = B (weil nichts gemeinsam)."},
{id:"wm7",t:9,type:"num",q:"Additionssatz: P(A) = 0,3; P(B) = 0,4; P(A ∩ B) = 0. Wie groß ist P(A ∪ B)?",a:0.7,tol:0.002,unit:"",
 e:"P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = 0,3 + 0,4 − 0 = 0,7 (Übungsblatt 3, Aufgabe 19a)."},
{id:"wm8",t:9,type:"num",q:"Umstellen: P(A) = 0,3; P(C) = 0,5; P(A ∪ C) = 0,7. Wie groß ist P(A ∩ C)?",a:0.1,tol:0.002,unit:"",
 e:"P(A ∩ C) = P(A) + P(C) − P(A ∪ C) = 0,3 + 0,5 − 0,7 = 0,1 (Übungsblatt 3, Aufgabe 19b)."},

/* ---------- 10 Laplace & Würfel ---------- */
{id:"lp1",t:10,type:"num",q:"Zwei Würfel: Wie groß ist die Wahrscheinlichkeit für die Augensumme 11 (in %, 2 Nachkommastellen)?",a:5.56,tol:0.005,unit:"%",
 e:"Günstig: (5,6), (6,5) = 2 von 36 → 2/36 = 5,56 % (Übungsblatt 2, Aufgabe 5)."},
{id:"lp2",t:10,type:"num",q:"Wie viele mögliche Ergebnisse (Paare) gibt es beim Wurf mit zwei Würfeln?",a:36,tol:0,unit:"",
 e:"6 · 6 = 36 Paare – (1,2) und (2,1) zählen getrennt."},
{id:"lp3",t:10,type:"mc",q:"Was ist die Laplace-Formel?",
 o:["P(A) = Anzahl günstiger Ergebnisse ÷ Anzahl möglicher Ergebnisse","P(A) = günstige · mögliche Ergebnisse","P(A) = 1 ÷ günstige Ergebnisse","P(A) = P(A ∩ B) ÷ P(B)"],a:0,
 e:"Steht nicht auf der Formelsammlung – merken! Die letzte Option ist die bedingte Wahrscheinlichkeit."},
{id:"lp4",t:10,type:"num",q:"P(A) = 0,25. Wie groß ist das Gegenereignis P(nicht A)?",a:0.75,tol:0.002,unit:"",
 e:"P(nicht A) = 1 − P(A) = 1 − 0,25 = 0,75."},

/* ---------- 11 Vierfeldertafel ---------- */
{id:"vt1",t:11,type:"num",q:"Vierfeldertafel: Von 40 Veganern kaufen 35 Bio. Wie viele Veganer kaufen NICHT Bio?",a:5,tol:0,unit:"",
 e:"Zeile, in der nur ein Wert fehlt: 40 − 35 = 5. Immer zuerst die Lücke füllen, bei der nur noch ein Wert fehlt."},
{id:"vt2",t:11,type:"num",q:"125 Befragte, davon 40 vegan, 35 vegan UND Bio. Wie groß ist P(Bio | vegan) in %?",a:87.5,tol:0.002,unit:"%",
 e:"Bedingung „vegan“ steht hinter dem Strich → nur die 40 Veganer zählen: 35 ÷ 40 = 87,5 % (Probeklausur Aufgabe 4c)."},
{id:"vt3",t:11,type:"mc",q:"Was bedeutet P(Vegan | Bio)?",
 o:["Wahrscheinlichkeit, vegan zu sein – unter der Bedingung, dass die Person Bio kauft","Wahrscheinlichkeit, Bio zu kaufen, wenn man vegan ist","Wahrscheinlichkeit, vegan UND Bio zu sein","Wahrscheinlichkeit, vegan ODER Bio zu sein"],a:0,
 e:"Die Bedingung steht hinter dem „|“ und kommt in den Nenner. Typischer Fehler: P(A|B) und P(B|A) verwechseln."},
{id:"vt4",t:11,type:"mc",q:"Welche Formel gilt für die bedingte Wahrscheinlichkeit?",
 o:["P(A | B) = P(A ∩ B) ÷ P(B)","P(A | B) = P(A) · P(B)","P(A | B) = P(A) + P(B)","P(A | B) = P(B) ÷ P(A ∩ B)"],a:0,
 e:"Dozent: Die Formel (Schnittmenge geteilt durch die Bedingung) hinschreiben – nur das Ergebnis gibt weniger Punkte."},
{id:"vt5",t:11,type:"num",q:"Umstellen: P(A | B) = 0,4 und P(B) = 0,5. Wie groß ist P(A ∩ B)?",a:0.2,tol:0.002,unit:"",
 e:"Multiplikationssatz: P(A ∩ B) = P(A | B) · P(B) = 0,4 · 0,5 = 0,2."},
{id:"vt6",t:11,type:"order",q:"Vierfeldertafel-Aufgabe: Was machst du in welcher Reihenfolge?",
 items:["Fehlende Zellen füllen (wo nur ein Wert in Zeile/Spalte fehlt)","Kontrolle: Summen passen zur Gesamtzahl","Einfache Wahrscheinlichkeit: Gruppe ÷ alle","Bedingte Wahrscheinlichkeit: Schnitt ÷ Summe der Bedingung"],
 e:"Für das Ausfüllen der Tabelle gibt es eigene Punkte – sauber hinschreiben."},

/* ---------- 12 Baumdiagramm ---------- */
{id:"bd1",t:12,type:"match",q:"Pfadregeln im Baumdiagramm:",
 cats:["multiplizieren","addieren"],
 items:[["Wahrscheinlichkeiten entlang EINES Pfades",0],["Mehrere passende Pfade zusammenfassen",1],["P(1. verdorben UND 2. verdorben)",0],["P(2. Pflaume verdorben) = P(V,V) + P(F,V)",1]],
 e:"Entlang eines Pfades malnehmen, passende Pfade addieren. Kontrolle: alle Pfade zusammen = 1."},
{id:"bd2",t:12,type:"mc",q:"9 Pflaumen, 2 verdorben. Zweimal ziehen OHNE Zurücklegen. Was ist P(V, V)?",
 o:["2/9 · 1/8","2/9 · 2/9","2/9 · 2/8","1/9 · 1/8"],a:0,
 e:"Ohne Zurücklegen: Im zweiten Zug ist eine verdorbene und eine Pflaume insgesamt weniger da → 2/9 · 1/8 = 2/72 ≈ 2,8 %."},
{id:"bd3",t:12,type:"num",q:"Urne mit 3 roten und 7 blauen Kugeln. Zweimal ohne Zurücklegen. Wie groß ist P(rot, rot) in %? (2 Nachkommastellen)",a:6.67,tol:0.005,unit:"%",
 e:"3/10 · 2/9 = 6/90 = 6,67 %."},
{id:"bd4",t:12,type:"num",q:"Zwei unabhängige Ereignisse: P(A) = 0,5 und P(B) = 0,3. Wie groß ist P(A und B)?",a:0.15,tol:0.002,unit:"",
 e:"Bei unabhängigen Ereignissen einfach multiplizieren: 0,5 · 0,3 = 0,15 (Dozent: „da müssen Sie einfach Wahrscheinlichkeiten multiplizieren“)."},
{id:"bd5",t:12,type:"mc",q:"Dozent-Hinweis zum Baumdiagramm: Was gehört zur fertigen Lösung?",
 o:["An jeden Ast die Wahrscheinlichkeit, unter jeden Pfad die Endwahrscheinlichkeit (gern in %) – und dann die konkrete b-Frage beantworten","Nur den Baum zeichnen","Nur das Endergebnis","Den Baum ohne Zahlen"],a:0,
 e:"„Das wär jetzt noch nicht fertig“ – erst wenn die Pfade ausgerechnet und die gestellte Frage beantwortet ist."},

/* ---------- 13 Kombinatorik ---------- */
{id:"ko1",t:13,type:"num",q:"Aus 8 Personen werden 3 für eine Konferenz ausgewählt (Reihenfolge egal, ohne Wiederholung). Wie viele Gruppen gibt es?",a:56,tol:0,unit:"",
 e:"(8 über 3) = 8! ÷ (5! · 3!) = (8 · 7 · 6) ÷ (3 · 2 · 1) = 336 ÷ 6 = 56 (Probeklausur Aufgabe 8)."},
{id:"ko2",t:13,type:"num",q:"Auf wie viele Arten kann man 5 verschiedene Kugeln nacheinander anordnen?",a:120,tol:0,unit:"",
 e:"5! = 5 · 4 · 3 · 2 · 1 = 120 Reihenfolgen."},
{id:"ko3",t:13,type:"match",q:"Welche Formel passt?",
 cats:["n! (alle Reihenfolgen)","n über k (Auswahl ohne Reihenfolge)"],
 items:[["9 Kugeln nacheinander in einer bestimmten Reihenfolge ziehen",0],["3er-Gruppe aus 8 Personen",1],["Sitzordnung von 6 Gästen",0],["6 aus 49 im Lotto",1]],
 e:"Erst fragen: Ist die Reihenfolge wichtig? Wird wiederholt? Taschenrechner: x! und nCr."},
{id:"ko4",t:13,type:"mc",q:"9 unterschiedlich große Kugeln sollen genau der Größe nach gezogen werden. Wie groß ist die Wahrscheinlichkeit?",
 o:["1 ÷ 9! = 1 ÷ 362 880","9 ÷ 362 880","1 ÷ 9","1 ÷ (9 über 3)"],a:0,
 e:"Es gibt 9! = 362 880 Reihenfolgen, genau eine ist gesucht (Übungsblatt 2, Aufgabe 7)."},

/* ---------- 14 Verteilungen & z-Wert ---------- */
{id:"zv1",t:14,type:"num",q:"z-Wert: x = 25, μ = 21, σ = 2,4. Wie groß ist z? (2 Nachkommastellen)",a:1.67,tol:0.004,unit:"",
 e:"z = (x − μ) ÷ σ = 4 ÷ 2,4 ≈ 1,67 → Φ(1,67) = 0,9525: 95,25 % liegen bei 25 oder darunter."},
{id:"zv2",t:14,type:"mc",q:"Gegeben ist σ² = 5,9 (die Varianz!). Was machst du vor der z-Berechnung?",
 o:["Erst die Wurzel ziehen: σ = √5,9 ≈ 2,43","Direkt durch 5,9 teilen","5,9 quadrieren","Durch n teilen"],a:0,
 e:"Übungsblatt 3, Aufgabe 11: z = (37 − 28) ÷ 2,43 ≈ 3,70."},
{id:"zv3",t:14,type:"mc",q:"Φ(1,67) = 0,9525. Wie deutest du das?",
 o:["95,25 % der Werte liegen bei x oder darunter, 4,75 % darüber","95,25 % liegen darüber","Der Mittelwert ist 0,9525","Die Standardabweichung beträgt 95,25"],a:0,
 e:"Φ = Anteil darunter, 1 − Φ = Anteil darüber."},
{id:"zv4",t:14,type:"num",q:"Binomialverteilung: n = 200, p = 0,3. Wie groß ist der Erwartungswert E(X)?",a:60,tol:0,unit:"",
 e:"E(X) = n · p = 200 · 0,3 = 60 (Probeklausur Aufgabe 13)."},
{id:"zv5",t:14,type:"num",q:"Binomialverteilung: n = 200, p = 0,3. Wie groß ist die Varianz?",a:42,tol:0,unit:"",
 e:"Var = n · p · (1 − p) = 200 · 0,3 · 0,7 = 42 → σ = √42 ≈ 6,48."},
{id:"zv6",t:14,type:"num",q:"Umstellen: μ = 100, σ = 15, z = 2. Welcher Wert x gehört dazu?",a:130,tol:0,unit:"",
 e:"z = (x − μ) ÷ σ umgestellt: x = μ + z · σ = 100 + 2 · 15 = 130."},

/* ---------- 15 Konfidenzintervall ---------- */
{id:"ki1",t:15,type:"mc",q:"Ruhepuls von 25 Personen, x̄ = 98, s = 5, Populationsvarianz unbekannt. Welche Formel nimmst du?",
 o:["x̄ ± t(n−1; 1−α/2) · s/√n","x̄ ± z · σ/√n","x̄ ± s","x̄ ± t(n; α) · s"],a:0,
 e:"σ unbekannt → t-Verteilung mit s. Dozent: Konzentrieren Sie sich auf die t-Verteilung."},
{id:"ki2",t:15,type:"match",q:"Was nimmst du aus der t-Tabelle für ein zweiseitiges 95 %-Konfidenzintervall mit n = 25?",
 cats:["Zeile (Freiheitsgrade)","Spalte"],
 items:[["df = n − 1 = 24",0],["1 − α/2 = 0,975",1]],
 e:"Typischer Fehler: Spalte 0,95 statt 0,975 – beim zweiseitigen Intervall wird α halbiert. t(24; 0,975) = 2,064."},
{id:"ki3",t:15,type:"num",q:"Standardfehler: s = 5, n = 25. Wie groß ist s/√n?",a:1,tol:0,unit:"",
 e:"√25 = 5 → 5 ÷ 5 = 1 (Übungsblatt 2, Aufgabe 12)."},
{id:"ki4",t:15,type:"num",q:"x̄ = 98, t = 2,064, Standardfehler = 1. Wie groß ist die OBERE Grenze des Konfidenzintervalls?",a:100.064,tol:0.0003,unit:"",
 e:"98 + 2,064 · 1 = 100,064 ≈ 100,06; untere Grenze 95,936 → KI = [95,94 ; 100,06]."},
{id:"ki5",t:15,type:"order",q:"Konfidenzintervall bestimmen: Bring die Schritte in die richtige Reihenfolge.",
 items:["z oder t? (σ bekannt oder unbekannt)","Tabellenwert holen (t: Zeile n − 1, Spalte 0,975)","Standardfehler s/√n berechnen","Halbbreite = Tabellenwert · Standardfehler","Untere und obere Grenze + Antwortsatz mit „wahrer Mittelwert“"],
 e:"Antwortsatz: „Mit 95 % Wahrscheinlichkeit liegt der wahre mittlere Ruhepuls zwischen … und …“"},
{id:"ki6",t:15,type:"mc",q:"Wie deutest du KI = [100,03 ; 103,97] für den mittleren Ruhepuls?",
 o:["Mit 95 % Vertrauenswahrscheinlichkeit liegt der wahre Mittelwert der Population in diesem Bereich","95 % der Personen haben genau diesen Puls","Der Puls schwankt um 3,94","Der Mittelwert ist sicher 102"],a:0,
 e:"Plausibilität: Der Stichprobenmittelwert 102 liegt genau in der Mitte des Intervalls."},

/* ---------- 16 t-Tests ---------- */
{id:"tt1",t:16,type:"match",q:"Was setzt du beim Einstichproben-t-Test ein? (IQ-Aufgabe der Probeklausur)",
 cats:["μ (vorgegeben)","x̄ (erhoben)","s","n"],
 items:[["„Der Mittelwert für den IQ ist 100“",0],["„… finden einen Mittelwert von 115“",1],["„Standardabweichung 11“",2],["„IQ von 30 Kindern“",3]],
 e:"Laut Dozent die schwierigste Aufgabe: Werte richtig zuordnen – μ ist vorgegeben, x̄ und s stammen aus der Stichprobe."},
{id:"tt2",t:16,type:"mc",q:"Welche Formel hat der Einstichproben-t-Test?",
 o:["t = (x̄ − μ) ÷ (s ÷ √n)","t = (x̄ − μ) · s · √n","t = (x − μ) ÷ σ","t = 1 − 6 · Σd² ÷ (n · (n² − 1))"],a:0,
 e:"Option 3 ist der z-Wert, Option 4 Spearman."},
{id:"tt3",t:16,type:"num",q:"Einstichproben-t-Test: x̄ = 115, μ = 100, Standardfehler s/√n = 2,008. Wie groß ist t? (2 Nachkommastellen)",a:7.47,tol:0.003,unit:"",
 e:"t = 15 ÷ 2,008 ≈ 7,47. Mit t_krit(29; 0,95) = 1,699 → 7,47 > 1,699 → H₀ ablehnen."},
{id:"tt4",t:16,type:"match",q:"Wie viele Freiheitsgrade (df)?",
 cats:["df = n − 1","df = n₁ + n₂ − 2"],
 items:[["Einstichproben-t-Test",0],["t-Test für abhängige Stichproben",0],["t-Test für unabhängige Stichproben",1],["Konfidenzintervall mit t",0]],
 e:"Dozent: „Denken Sie an die Freiheitsgrade“ – bei unabhängigen Stichproben n₁ + n₂ − 2."},
{id:"tt5",t:16,type:"num",q:"t-Test für unabhängige Stichproben mit 22 Frauen und 24 Männern. Wie viele Freiheitsgrade?",a:44,tol:0,unit:"",
 e:"df = 22 + 24 − 2 = 44 → t(44; 0,975) ≈ 2,015."},
{id:"tt6",t:16,type:"mc",q:"Berechnet: t = 1,874. Tabellenwert t_krit = 2,015. Testentscheidung?",
 o:["H₀ beibehalten – 1,874 < 2,015, kein signifikanter Unterschied","H₀ ablehnen","H₁ wird berechnet","Man braucht noch den Mittelwert"],a:0,
 e:"Regel: |t| > t_krit → H₀ ablehnen, sonst beibehalten. Probeklausur Aufgabe 14: Der Unterschied ist rein zufällig."},
{id:"tt7",t:16,type:"match",q:"Welche Spalte der t-Tabelle (α = 5 %)?",
 cats:["einseitig: 0,95","zweiseitig: 0,975"],
 items:[["„signifikant intelligenter als …“",0],["„unterscheidet sich …“",1],["Konfidenzintervall",1],["„signifikant kleiner als …“",0]],
 e:"Gerichtet (größer/kleiner) → einseitig. Ungerichtet (anders) und Konfidenzintervall → zweiseitig. Kein α angegeben → 5 %."},
{id:"tt8",t:16,type:"mc",q:"Eine Kommilitonin fragt: „Muss ich H₁ ausrechnen?“ Was antwortest du?",
 o:["Nein – H₀ und H₁ sind Annahmen, gerechnet wird nur t, dann mit dem Tabellenwert vergleichen","Ja, H₁ = 1 − H₀","Ja, mit der z-Tabelle","Nur bei zweiseitigen Tests"],a:0,
 e:"Dozent: „Sie berechnen weder H₁ noch H₀ – das sind hypothetische Annahmen.“"},
{id:"tt9",t:16,type:"order",q:"Einstichproben-t-Test: Bring die Schritte in die richtige Reihenfolge.",
 items:["H₀ und H₁ formulieren (H₁ = Behauptung)","Werte zuordnen: μ, x̄, s, n","t = (x̄ − μ) ÷ (s/√n) berechnen","t_krit aus der Tabelle: Zeile n − 1, Spalte 0,95 bzw. 0,975","Entscheiden: |t| > t_krit → H₀ ablehnen + Antwortsatz"],
 e:"Beispiel Probeklausur: t = 7,47 > 1,699 → Kinder signifikant intelligenter."},

/* ---------- 17 Forschung & Gütekriterien ---------- */
{id:"fg1",t:17,type:"multi",q:"Was zeichnet eine gute Theorie aus?",
 o:["widerspruchsfrei","so einfach wie möglich formuliert","beschreibt, erklärt oder sagt Phänomene vorher","empirisch bewährt / valide","möglichst kompliziert","nicht überprüfbar"],c:[0,1,2,3],
 e:"Probeklausur Aufgabe 16 – vier Aspekte nennen."},
{id:"fg2",t:17,type:"mc",q:"Was versteht man unter einem Mixed-Methods-Ansatz?",
 o:["Quantitative und qualitative Methoden werden gemeinsam genutzt, um eine Forschungsfrage zu beantworten","Mehrere Statistikprogramme gleichzeitig nutzen","Stichproben mischen","Nur Interviews führen"],a:0,
 e:"Beispiel: Interviews (qualitativ) plus EEG-Messungen (quantitativ)."},
{id:"fg3",t:17,type:"match",q:"Welche Hypothesenart?",
 cats:["Unterschiedshypothese","Zusammenhangshypothese"],
 items:[["Frauen und Männer haben ein unterschiedliches Essverhalten",0],["Je mehr Stress, desto untypischer das Essverhalten",1],["Die Gruppe mit Training hat einen niedrigeren Ruhepuls als die ohne",0],["Laufstrecke und Körperfettanteil hängen zusammen",1]],
 e:"Unterschied = Gruppen unterscheiden sich (→ t-Test). Zusammenhang = Prädiktor hängt mit Kriterium zusammen (→ Korrelation)."},
{id:"fg4",t:17,type:"match",q:"Welches Gütekriterium?",
 cats:["Objektivität","Reliabilität","Validität"],
 items:[["Ergebnis unabhängig davon, wer testet, auswertet und interpretiert",0],["Der Test misst genau, ohne Messfehler (z. B. Cronbachs Alpha)",1],["Der Test misst wirklich das, was er messen soll",2]],
 e:"Validität mit Beispiel kann laut Dozent drankommen (ca. 3 Punkte): z. B. misst ein Schlaf-Fragebogen wirklich Schlafqualität und nicht Stimmung?"},
{id:"fg5",t:17,type:"mc",q:"Wann ist ein Test objektiv?",
 o:["Wenn Material, Durchführung, Auswertung und Interpretation so festgelegt sind, dass jede:r Testleiter:in dasselbe Ergebnis erhält","Wenn er immer genau misst","Wenn er viele Fragen hat","Wenn er online durchgeführt wird"],a:0,
 e:"Objektivität = Unabhängigkeit von Ort, Zeit, Testleiter und Auswerter (Probeklausur Aufgabe 19)."},
{id:"fg6",t:17,type:"match",q:"Validitätsarten (Ergänzung – nicht aus deinen Unterlagen): Ordne zu.",
 cats:["Inhaltsvalidität","Kriteriumsvalidität","Konstruktvalidität"],
 items:[["Deckt der Fragebogen alle wichtigen Bereiche von „Ernährungswissen“ ab?",0],["Stimmt der Test-Score mit einem Außenkriterium überein (z. B. Laborwert)?",1],["Passt der Test zur Theorie des Konstrukts und hängt mit verwandten Tests zusammen?",2]],
 e:"Ergänzung: Diese Einteilung ist in der Methodenlehre üblich, stand aber nicht in deinen Unterlagen. Der Dozent wollte „Validität mit Beispiel, auch andere Stufen“."},
{id:"fg7",t:17,type:"multi",q:"Wie begegnet man einem Self-Selection-Bias schon vorab?",
 o:["Zufällige Stichprobe","Anreize (z. B. Gutscheine), damit auch Desinteressierte teilnehmen","Neutrales Studiendesign, das keine Interessengruppe anspricht","Statistische Gewichtung/Korrektur","Nur Freiwillige mit großem Interesse befragen","Die Stichprobe möglichst klein halten"],c:[0,1,2,3],
 e:"Übungsblatt 3, Aufgabe 7."}
];

/* ===== Varianten: einfache Rechnungen mit neuen Zahlen ===== */
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const int=(r,lo,hi)=>lo+Math.floor(r()*(hi-lo+1));
const de=n=>Number(n).toLocaleString("de-DE",{maximumFractionDigits:4});
const r2=x=>Math.round(x*100)/100;
const VAR = (gen,qv,alt)=>Q.forEach(q=>{ if(gen[q.id]) q.gen=gen[q.id]; if(qv[q.id]) q.qv=qv[q.id]; if(alt[q.id]) q.alt=alt[q.id]; });
const sortN=a=>a.slice().sort((x,y)=>x-y);
VAR({
  lm1: r=>{ const v=[]; for(let i=0;i<5;i++) v.push(int(r,8,40)); const s=v.reduce((a,b)=>a+b,0);
    return {q:`Berechne das arithmetische Mittel: ${v.join(", ")}`, a:s/5, e:`Summe ${v.join(" + ")} = ${s} → ÷ 5 = ${de(s/5)}. Nicht sortieren – beim Mittelwert ist die Reihenfolge egal.`}; },
  lm4: r=>{ const v=[]; while(v.length<5){ const x=int(r,5,60); if(!v.includes(x)) v.push(x); } const s=sortN(v);
    return {q:`Bestimme den Median: ${v.join(", ")}`, a:s[2], e:`Sortiert: ${s.join(", ")}. n = 5 ungerade → Position (5+1)/2 = 3 → Median = ${s[2]}.`}; },
  lm5: r=>{ const v=[]; while(v.length<6){ const x=int(r,4,50); if(!v.includes(x)) v.push(x); } const s=sortN(v), m=(s[2]+s[3])/2;
    return {q:`Bestimme den Median: ${v.join(", ")}`, a:m, e:`Sortiert: ${s.join(", ")}. n = 6 gerade → Mittel der Werte an Position 3 und 4: (${s[2]} + ${s[3]}) ÷ 2 = ${de(m)}.`}; },
  lm7: r=>{ const n=int(r,4,12), m=pick(r,[12,15,18,20,25,30,45,60]);
    return {q:`Umstellen: ${n} Personen haben im Schnitt ${m} Minuten trainiert (x̄ = ${m}). Wie groß ist die Summe aller Minuten Σx?`, a:n*m, unit:"Min.", e:`x̄ = Σx ÷ n → Σx = x̄ · n = ${m} · ${n} = ${n*m}.`}; },
  qu1: r=>{ const n=pick(r,[5,7,9,11,15,19]), p=pick(r,[25,75]), m=p/100*(n+1);
    return {q:`Quartil berechnen – erster Schritt: Wie groß ist m = p/100 · (n + 1) für das ${p===25?"1.":"3."} Quartil bei n = ${n}?`, a:m, e:`m = ${p}/100 · (${n} + 1) = ${de(m)} → g = ${Math.floor(m)}, r = ${de(r2(m-Math.floor(m)))}${m%1?"":" (ganzzahlig → Q ist einfach der Wert an Position "+m+")"}.`}; },
  qu5: r=>{ const q1=int(r,5,40), q3=q1+int(r,10,80);
    return {q:`Q1 = ${q1} und Q3 = ${q3}. Wie groß ist der Interquartilsabstand (IQA)?`, a:q3-q1, e:`IQA = Q3 − Q1 = ${q3} − ${q1} = ${q3-q1}. Streuung der mittleren 50 %.`}; },
  qu6: r=>{ const v=[]; for(let i=0;i<7;i++) v.push(int(r,3,250)); const mx=Math.max(...v), mn=Math.min(...v);
    return {q:`Wie groß ist die Spannweite: ${v.join(", ")}?`, a:mx-mn, e:`Spannweite R = Maximum − Minimum = ${mx} − ${mn} = ${mx-mn}.`}; },
  va3: r=>{ const m=int(r,20,30), d=pick(r,[[-3,-1,1,3],[-2,-1,0,3],[-2,-2,1,3],[-4,0,1,3],[-3,-2,1,4],[-1,-1,0,2]]), v=d.map(x=>m+x);
    const vs=v.slice().sort(()=>r()-0.5), ss=d.reduce((a,x)=>a+x*x,0);
    return {q:`Populationsvarianz: Werte ALLER 4 Teilnehmenden ${vs.join(", ")} (Mittelwert ${m}). Wie groß ist σ²?`, a:ss/4,
      e:`Abweichungen ${vs.map(x=>x-m).join(", ")} → Quadrate ${vs.map(x=>(x-m)**2).join(", ")} → Summe ${ss} → σ² = ${ss} ÷ 4 = ${de(ss/4)}. Population → durch n teilen. σ = √${de(ss/4)} ≈ ${de(r2(Math.sqrt(ss/4)))}.`}; },
  va4: r=>{ const s=pick(r,[3,4,5,6,7,8,9,12,15]), v=s*s;
    return {q:`Die Varianz beträgt ${v}. Wie groß ist die Standardabweichung?`, a:s, e:`σ = √σ² = √${v} = ${s}.`}; },
  gi2: r=>{ const n=pick(r,[4,5,6,8,10]), G=r2(int(r,10,60)/100*1)+0.0, Gs=n/(n-1)*G;
    return {q:`Gegeben: G = ${de(G)} bei n = ${n} Personen. Wie groß ist der korrigierte Gini G*? (2–4 Nachkommastellen)`, a:Math.round(Gs*10000)/10000, tol:0.005,
      e:`G* = n ÷ (n − 1) · G = ${n}/${n-1} · ${de(G)} ≈ ${de(Math.round(Gs*10000)/10000)} → ${Gs<=0.3?"niedrige":Gs<=0.7?"mittlere":"starke"} Konzentration.`}; },
  sp3: r=>{ const n=pick(r,[4,5,5,5]), max=n*(n*n-1)/3, sd=2*int(r,1,Math.floor(max/2)-1), rs=1-6*sd/(n*(n*n-1));
    return {q:`Spearman mit n = ${n} Personen, Σ dᵢ² = ${sd}. Wie groß ist rₛ? (2 Nachkommastellen)`, a:r2(rs), tol:0.01,
      e:`rₛ = 1 − 6 · ${sd} ÷ (${n} · ${n*n-1}) = 1 − ${6*sd}/${n*(n*n-1)} ≈ ${de(r2(rs))} → ${rs>0?"positiver":rs<0?"negativer":"kein"} Zusammenhang, ${Math.abs(rs)>0.5?"stark":Math.abs(rs)>=0.3?"mittel":"schwach"}.`}; },
  lp1: r=>{ const k=pick(r,[2,3,4,5,6,7,8,9,10,11,12]), c=6-Math.abs(k-7), pr=c/36*100;
    const pairs=[]; for(let a=1;a<=6;a++) for(let b=1;b<=6;b++) if(a+b===k) pairs.push(`(${a},${b})`);
    return {q:`Zwei Würfel: Wie groß ist die Wahrscheinlichkeit für die Augensumme ${k} (in %, 2 Nachkommastellen)?`, a:r2(pr), tol:0.005,
      e:`Günstig: ${pairs.join(", ")} = ${c} von 36 → ${c}/36 = ${de(r2(pr))} %.`}; },
  lp4: r=>{ const p=pick(r,[0.1,0.15,0.2,0.25,0.3,0.4,0.45,0.6,0.7,0.85]);
    return {q:`P(A) = ${de(p)}. Wie groß ist das Gegenereignis P(nicht A)?`, a:r2(1-p), e:`P(nicht A) = 1 − ${de(p)} = ${de(r2(1-p))}.`}; },
  vt1: r=>{ const row=int(r,30,90), a=int(r,5,row-5);
    return {q:`Vierfeldertafel: Von ${row} Mensa-Gängern bestellen ${a} auch bei Lieferdiensten. Wie viele Mensa-Gänger bestellen NICHT?`, a:row-a, e:`Zeile, in der nur ein Wert fehlt: ${row} − ${a} = ${row-a}.`}; },
  vt2: r=>{ const b=pick(r,[40,50,60,80,120,125,200]), ab=int(r,Math.round(b*0.1),Math.round(b*0.9)), pr=ab/b*100;
    return {q:`Von ${b} Personen, die Essen bestellen, gehen ${ab} auch in die Mensa. Wie groß ist P(Mensa | bestellt) in %?`, a:r2(pr), tol:0.004,
      e:`Bedingung „bestellt“ steht hinter dem Strich → nur die ${b} Besteller zählen: ${ab} ÷ ${b} = ${de(r2(pr))} %.`}; },
  vt5: r=>{ const a=pick(r,[0.2,0.25,0.4,0.5,0.6,0.8]), b=pick(r,[0.2,0.3,0.4,0.5]);
    return {q:`Umstellen: P(A | B) = ${de(a)} und P(B) = ${de(b)}. Wie groß ist P(A ∩ B)?`, a:Math.round(a*b*1000)/1000, tol:0.003,
      e:`P(A ∩ B) = P(A | B) · P(B) = ${de(a)} · ${de(b)} = ${de(Math.round(a*b*1000)/1000)}.`}; },
  bd3: r=>{ const rot=int(r,2,6), N=rot+int(r,4,10), pr=rot/N*(rot-1)/(N-1)*100;
    return {q:`Urne mit ${rot} roten und ${N-rot} blauen Kugeln. Zweimal ohne Zurücklegen. Wie groß ist P(rot, rot) in %? (2 Nachkommastellen)`, a:r2(pr), tol:0.006,
      e:`${rot}/${N} · ${rot-1}/${N-1} = ${rot*(rot-1)}/${N*(N-1)} ≈ ${de(r2(pr))} %. Ohne Zurücklegen: im 2. Zug eine Kugel weniger.`}; },
  bd4: r=>{ const a=pick(r,[0.2,0.3,0.4,0.5,0.6]), b=pick(r,[0.1,0.3,0.5,0.7]);
    return {q:`Zwei unabhängige Ereignisse: P(A) = ${de(a)} und P(B) = ${de(b)}. Wie groß ist P(A und B)?`, a:Math.round(a*b*100)/100, tol:0.003,
      e:`Unabhängig → multiplizieren: ${de(a)} · ${de(b)} = ${de(Math.round(a*b*100)/100)}.`}; },
  ko1: r=>{ const n=int(r,5,10), k=int(r,2,Math.min(4,n-2)); let c=1; for(let i=0;i<k;i++) c=c*(n-i)/(i+1);
    return {q:`Aus ${n} Personen werden ${k} ausgewählt (Reihenfolge egal, ohne Wiederholung). Wie viele Gruppen gibt es?`, a:Math.round(c),
      e:`(${n} über ${k}) = ${Array.from({length:k},(_,i)=>n-i).join(" · ")} ÷ ${Array.from({length:k},(_,i)=>k-i).join(" · ")} = ${Math.round(c)}.`}; },
  ko2: r=>{ const n=int(r,3,7); let f=1; for(let i=2;i<=n;i++) f*=i;
    return {q:`Auf wie viele Arten kann man ${n} verschiedene Kugeln nacheinander anordnen?`, a:f, e:`${n}! = ${Array.from({length:n},(_,i)=>n-i).join(" · ")} = ${f}.`}; },
  zv1: r=>{ const mu=int(r,20,100), s=pick(r,[2,2.5,4,5,8,10,12]), x=mu+pick(r,[-2,-1,1,2,3])*s/2+pick(r,[0,1]), z=r2((x-mu)/s);
    return {q:`z-Wert: x = ${de(x)}, μ = ${mu}, σ = ${de(s)}. Wie groß ist z? (2 Nachkommastellen)`, a:z, tol:0.01,
      e:`z = (x − μ) ÷ σ = ${de(x-mu)} ÷ ${de(s)} ≈ ${de(z)}.`}; },
  zv4: r=>{ const n=pick(r,[50,80,100,120,200,250]), p=pick(r,[0.1,0.2,0.25,0.3,0.4,0.5]);
    return {q:`Binomialverteilung: n = ${n}, p = ${de(p)}. Wie groß ist der Erwartungswert E(X)?`, a:n*p, e:`E(X) = n · p = ${n} · ${de(p)} = ${de(n*p)}.`}; },
  zv5: r=>{ const n=pick(r,[50,100,200]), p=pick(r,[0.1,0.2,0.3,0.4,0.5]), v=Math.round(n*p*(1-p)*100)/100;
    return {q:`Binomialverteilung: n = ${n}, p = ${de(p)}. Wie groß ist die Varianz?`, a:v, tol:0.003, e:`Var = n · p · (1 − p) = ${n} · ${de(p)} · ${de(r2(1-p))} = ${de(v)}.`}; },
  zv6: r=>{ const mu=pick(r,[50,80,100,120]), s=pick(r,[5,8,10,15,20]), z=pick(r,[-2,-1.5,-1,1,1.5,2,2.5]);
    return {q:`Umstellen: μ = ${mu}, σ = ${s}, z = ${de(z)}. Welcher Wert x gehört dazu?`, a:mu+z*s, e:`x = μ + z · σ = ${mu} + ${de(z)} · ${s} = ${de(mu+z*s)}.`}; },
  ki3: r=>{ const n=pick(r,[16,25,36,49,64,100]), s=pick(r,[2,3,4,5,6,7,8,10,12]), se=s/Math.sqrt(n);
    return {q:`Standardfehler: s = ${s}, n = ${n}. Wie groß ist s/√n? (2 Nachkommastellen)`, a:r2(se), tol:0.006, e:`√${n} = ${Math.sqrt(n)} → ${s} ÷ ${Math.sqrt(n)} = ${de(r2(se))}.`}; },
  ki4: r=>{ const m=int(r,60,120), t=pick(r,[2.064,2.045,2.131,2.093,1.96]), se=pick(r,[0.5,0.8,1,1.2,1.5,2]), up=Math.round((m+t*se)*1000)/1000;
    return {q:`x̄ = ${m}, Tabellenwert = ${de(t)}, Standardfehler = ${de(se)}. Wie groß ist die OBERE Grenze des Konfidenzintervalls?`, a:up, tol:0.0005,
      e:`${m} + ${de(t)} · ${de(se)} = ${de(up)}; untere Grenze ${de(Math.round((m-t*se)*1000)/1000)}.`}; },
  tt3: r=>{ const mu=pick(r,[100,50,70,20]), d=int(r,2,15)*pick(r,[1,1,-1]), se=pick(r,[1.5,2,2.5,3,4]), t=r2(d/se);
    return {q:`Einstichproben-t-Test: x̄ = ${mu+d}, μ = ${mu}, Standardfehler s/√n = ${de(se)}. Wie groß ist t? (2 Nachkommastellen)`, a:t, tol:0.006,
      e:`t = (x̄ − μ) ÷ (s/√n) = ${d} ÷ ${de(se)} ≈ ${de(t)}. Dann mit t_krit vergleichen: |t| > t_krit → H₀ ablehnen.`}; },
  tt5: r=>{ const a=int(r,8,40), b=int(r,8,40);
    return {q:`t-Test für unabhängige Stichproben mit ${a} und ${b} Personen. Wie viele Freiheitsgrade?`, a:a+b-2, e:`df = n₁ + n₂ − 2 = ${a} + ${b} − 2 = ${a+b-2}.`}; }
},{
  uv5:["Welchen Zusammenhang zeigt ein Korrelationskoeffizient von r = 0?"],
  lp3:["Mit welcher Formel berechnest du die Wahrscheinlichkeit beim fairen Würfel (Laplace)?"],
  vt3:["Wie liest man P(Vegan | Bio) richtig?"]
},{
  sk1:"Laut Formelsammlung heißt metrisch mit natürlichem Nullpunkt auch „verhältnisskaliert“; ohne natürlichen Nullpunkt „intervallskaliert“.",
  uv2:"Je nach Folie wird |r| = 0,58 als „mittel bis stark“ oder „stark“ eingeordnet – wichtig sind Richtung, Stärke und der Satz zur Kausalität.",
  fg1:"Die HTML-Probeklausur nennt auch „operationalisierbar und falsifizierbar“."
});
(window.FAECHER=window.FAECHER||[]).push({kurz:"stat", name:"Statistik", kurzname:"Statistik", icon:"📈", topics:TOPICS, q:Q});
})();
