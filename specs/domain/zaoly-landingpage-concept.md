# Zaoly Landingpage — Produktkonzept und Layout V20

**Status:** Accepted · Layout V20 · 2026-10-15  
**Product:** Zaoly standalone · **Route:** `/` · **Application:** `/editor`  
**Public deep demos:** `/explore` (+ Kapitel-Unterseiten)

## Positionierung

Zaoly ist der visuelle Editor, mit dem Designer digitale Oberflächen als wiederverwendbare Entwicklerkomponenten gestalten. Die Arbeit bleibt nicht bei einer statischen Vorlage stehen: Struktur, Varianten und Markentokens werden Teil des Bausteins; React-Code und Handoff-Kontext helfen Entwicklern, ihn in Produkte zu übernehmen. Die technische Prüfung und Integration im Zielsystem bleiben möglich und nötig.

Nutzer können ihre Arbeit in beliebig vielen **Zaoly-Projekten** organisieren. Ein Projekt ist keine Plexon Collection. Das **Zaoly Kit** (Paket `@zaoly/site-kit`) stellt die wichtigsten Atome und Komponenten als Ausgangsbasis bereit. Plexon, Brandion, CREATION und andere Suite-Adapter sind für diese Geschichte optional und erscheinen auf der Landingpage nicht als Produktvoraussetzung.

**Leitidee:** Design, das als Komponente weiterlebt.  
**Hero:** Vom Design zur echten Komponente.  
**Subline:** Gestalte visuell auf dem Canvas. Nutze Bausteine aus dem Zaoly Kit, definiere Varianten und Markenwerte und gib Entwicklern React-Code mit dem nötigen Kontext. So wird aus einer Idee ein Baustein, der in weiteren Produkten genutzt werden kann.

## Öffentliche Route und Navigation

1. `GET /` MUST die öffentliche Landingpage rendern; sie darf keine Anmeldung oder konfigurierte Datenbank benötigen. Andere Methoden und alle geschützten App-/API-Routen behalten ihre bisherigen Auth-Regeln.
2. `/editor` MUST der primäre Arbeitsbereich bleiben. Öffentliche Primär-CTAs auf der Landingpage (“Loslegen” / “Get started”) führen über `paths.routes.register` zur Konto-Erstellung; “Anmelden” / “Sign in” führt über `paths.routes.login`. Nach erfolgreicher Registrierung oder Anmeldung landet der Nutzer im Editor. Die Auth-Gate-Logik auf `/editor` leitet unauthentifizierte Besucher zum Login weiter.
3. Landing-Navigation: Produkt, Zaoly Kit, Workflow als Sprungmarken; Anmelden und Editor öffnen als Aktionen. Sämtliche Routen und Assetpfade werden in `apps/web/lib/paths.ts` verwaltet und in `knowledge/paths.md` dokumentiert.
3a. Footer MUST offer a secondary **GitHub** link to the public community repo (`paths.communityGithubRepo` / `communityGithubUrl()` → `aurovylabs/zaoly-delivery`), `target="_blank"` + `rel="noopener noreferrer"`. MUST NOT link the internal Origin tree. MUST NOT promote GitHub as a primary hero CTA (Register remains primary).
4. Die Landingpage benutzt das Zaoly-CD, ohne die dichte AppShell des Editors zu kopieren.
5. Die öffentliche Landingpage MUST vollständig Deutsch und Englisch unterstützen. Ein sichtbarer Sprachschalter MUST `de`/`en` über die gemeinsame Locale-Einstellung wechseln und die Wahl speichern. Navigation, Aktionen, Bild-/Loop-Beschriftungen, Screenreader-Texte und Metadaten MUST zur aktiven Sprache passen. Die Anwendungssprache und die öffentliche Website verwenden dieselben Locale-IDs (`de`, `en`).
6. Die Landingpage MUST einen zweisprachigen Kontaktbereich für Produkt-, Rollout- und Enterprise-Anfragen anbieten. Eine konfigurierte Kontaktadresse kommt aus `NEXT_PUBLIC_ZAOLY_CONTACT_EMAIL`; der bestätigte kanonische Fallback ist zentral in `paths.publicSiteContactEmailDefault` definiert. Der primäre Kontaktweg muss direkt per E-Mail erreichbar sein; ein Formular darf nur erscheinen, wenn ein realer Versandweg implementiert ist.
7. Die öffentliche Produktionsadresse ist `paths.publicSiteOrigin` (`https://zaoly.app`). Betrieb auf demselben Traefik-Host wie `weddy.page`: `knowledge/deploy-weddy-server.md`.

V6 erweitert die Navigation um einen Token-Studio-Anker. Der Link zur Anwendung verwendet `paths.routes.tokens`; die öffentliche Illustration benötigt keine Anmeldung oder Token-API.

## Seitenstruktur V1 (historisch; durch Layout V2 unten ersetzt)

### 1. Hero

Große typografische Aussage auf Creme, Kobalt als präziser Akzent. Rechts eine eigens gestaltete **Produktprinzip-Visualisierung**: eine Komponenten-Komposition auf einer Canvas-Fläche mit sichtbaren Varianten und einem dazugehörigen Code-/Import-Ausschnitt. Sie ist als Illustration zu verstehen, nicht als Screenshot der Laufzeit-App. CTAs: „Editor öffnen“ und „Workflow ansehen“.

### 2. Handoff-These

Ein kurzer Satz führt den Unterschied vor: „Weniger nachbauen. Mehr weiterverwenden.“ Darunter die Kette **Design → Komponente → Produkt**. Keine Behauptung, dass Entwicklerarbeit vollständig entfällt oder beliebige Frameworks ohne Anpassung unterstützt sind.

### 3. Drei Arbeitsschritte

**Gestalten:** Visuell auf dem Canvas aus Atomen und Komponenten bauen.  
**Systematisieren:** Wiederverwendbare Masters, Instanzen, Varianten und Tokens definieren.  
**Verwenden:** React-Modul und Handoff-Informationen in ein Zielprodukt übernehmen; Qualität vor der Übergabe prüfen.

### 4. Zaoly Kit

Ein eigenes visuelles Asset zeigt einen kleinen, präzisen Atom-Baukasten aus Text, Button, Input, Card und Layout; daneben eine daraus zusammengesetzte Komponente. Copy erklärt, dass das Kit Grundlage und gemeinsames Vokabular ist, während Projekte ihre eigenen Komponenten daraus entwickeln. Keine Formulierung setzt Collection-Bindung voraus.

### 5. Projekte und Wiederverwendung

Eine redaktionelle Darstellung zeigt mehrere freie Zaoly-Projekte, die denselben Baustein jeweils in einem anderen Kontext verwenden. Die Botschaft ist Projektfreiheit, nicht eine Suite-Collection-Struktur. Die Seite verlinkt hier nicht auf den alten Collection-Projekt-Hub, solange dieser noch nicht dem eigenständigen Zaoly-Projektmodell entspricht.

### 6. Entwickler-Handoff

Ein dunkler Abschnitt zeigt **dieselbe** Beispiel-Komponente als visuelle Variante und als lesbares React-Modul. Neben Code werden Paket-Import und Tokenkontext gezeigt. Der Produktbeweis basiert auf vorhandenem React/Site-Kit-Export, Copy-Pack und Ready-for-Eng-Check (`specs/domain/code-export-handoff.md`); dauerhaftes Publizieren eigener Komponenten ist eine gesonderte Zaoly-Produktaufgabe und wird in dieser ersten Landingpage nicht als bereits gelöst behauptet.

### 7. Abschluss

„Dein nächster Entwurf kann mehr sein.“ mit klarem „Editor öffnen“-CTA. Keine erfundenen Kennzahlen, Testimonials, Preise oder Integrationen.

## Asset- und Designregeln

- Eigene SVG-Assets unter `apps/web/public/landing/` für die Canvas-Komposition und Kit-Bausteine. Kein Stockfoto und keine simulierten echten App-Screenshots.
- Zaoly-CD: Creme `#F3EEE4`, helle Fläche `#FBF6EC`, Tinte `#1E1B17`, Warmgrau `#2E2A24`, Kobalt `#1F44FF`, Acid `#C6F24A`, Hairline `#C9BCA1`, Radius `0`. Die öffentliche Seite definiert diese festen Markenwerte als lokale CSS-Variablen, damit eine gespeicherte Editor-Dark-Mode-Einstellung das Landing-Design und den Button-Kontrast nicht verändert.
- 造-Siegel und Spectral-/Serif-Wortmarke für Markencharakter; Geist für Bedienung; Mono für Metadaten und Code.
- Offene Flächen, klare Typohierarchie und Wechsel aus Creme- und Warmgrau-Abschnitten. Keine Gradienten oder dekorativen Schatten.
- Assets erhalten aussagekräftige Alternativtexte oder werden als dekorativ markiert. Mobile Reihenfolge, Tastaturfokus, ausreichender Kontrast und `prefers-reduced-motion` MUST funktionieren.

## Akzeptanz

- Öffentliche Root-Seite erreichbar ohne Auth; `/editor` und geschützte APIs bleiben geschützt.
- Headline, CTA, Workflow, Kit und mehrere Zaoly-Projekte sind auf Desktop und Mobilgeräten klar erkennbar.
- Keine Collection-/Plexon-Abhängigkeit in Landing-Copy oder CTA.
- Nur `@zaoly/ui` für gemeinsame interaktive UI-Primitives.
- UI-Smoke, Auth-/Routen-Contract, Specs-Inventar und Web-Build validiert.

## Layout-Neufassung V2 — Spirion-gestützte Richtung

Die erste Umsetzung bleibt als inhaltliche Grundlage erhalten; ihre gleichmäßige Folge aus Split-Hero, Textbändern und drei gleich großen Projektkarten wird ersetzt. Spirion-Captures `cap_40688fc63e114263bdc24b0112a6796a` und `cap_774e0219b049425e972ca6765f8c1d17` dienen ausschließlich als **Strukturreferenzen**: große mediale Eröffnung, extreme Typohierarchie, wechselnde Maßstäbe und asymmetrischer Rhythmus. Fremde Texte, Farben, Formen oder Assets werden nicht übernommen. Die Zaoly-CD-Werte und das eigenständige Produktversprechen haben Vorrang.

1. **Hero als Bühne:** Eine übergroße zweizeilige Botschaft auf Creme eröffnet die Seite. Darunter spannt eine Kobalt-Bühne über die ganze Breite: links eine große Canvas-Komposition, rechts ein versetztes React-Modul. Eine sichtbare Verbindung macht den Übergang von Design zu nutzbarem Code unmittelbar lesbar. Die Illustration bleibt ausdrücklich ein Produktprinzip und kein echter Editor-Screenshot.
2. **These als große typografische Zäsur:** Wenige Worte mit viel freiem Raum ersetzen das bisherige gewöhnliche Textband. Die Kernaussage ist Wiederverwendung statt manueller Übergabe.
3. **Zaoly Kit als explodiertes System:** Atome und Bausteine stehen auf einer Acid-Fläche räumlich verteilt und münden in eine größere Komponente. Kein generisches Dreier-Kartenraster.
4. **Projektfreiheit als Editorial-Layout:** Drei Projektkontexte nutzen denselben Baustein in unterschiedlichen visuellen Größen und Anordnungen. Die Darstellung darf asymmetrisch sein und keine Gleichwertigkeit von Spalten erzwingen.
5. **Handoff als Produktbeweis:** Ein großer dunkler Bereich kombiniert den visuellen Baustein mit lesbarem React-Code, Paketimport, Tokenbezug und Qualitätscheck. Die Aussage bleibt auf React-Zielprojekte begrenzt.
6. **Abschluss als Kobalt-Plakat:** Großflächige Farbe, knappe Aussage und ein eindeutiger Editor-CTA.

Die Seite muss auf Mobilgeräten eine bewusst komponierte lineare Folge ergeben. CTA-Kontrast, Fokus, Textumbrüche und Code-Überlauf werden im Browser geprüft. Die bestehenden SVGs können für die neue Bildsprache vollständig überarbeitet werden; Assetpfade bleiben in `paths.landing.assets` zentralisiert.

## Layout-Verfeinerung V3 — japanische Ruhe

Die V2-Erzählung und ihre klare Produktdemonstration bleiben. Die visuelle Ausführung wird ruhiger und hochwertiger:

- Keine gedrehten Artboards, Sticker, schwebenden Atom-Etiketten oder dekorativen Kreuzzeichen. Produktvisuals stehen rechtwinklig und ruhig auf einem klaren Raster.
- Mehr Negativraum um Hero, Kit, Projektbeispiele und Handoff. Typografie behält Präsenz, aber die Zeilen stehen weniger gedrängt und erhalten weniger versetzte Einzüge.
- Kobalt und Acid werden gezielt eingesetzt. Große cremefarbene und warme neutrale Flächen tragen die Seite; Acid markiert nur eine wichtige Verbindung oder Aktion.
- Pro Abschnitt höchstens eine kleine Orientierungsebene. Wiederholte Nummern, technische Mikro-Labels und rein dekorative Zwischenzeilen entfallen. Beschriftungen innerhalb einer exemplarischen Editor-/Code-Ansicht dürfen bleiben, wenn sie das Produkt erklären.
- Die Projektbeispiele zeigen Wiederverwendung ohne eine dichte Matrix aus Projekt-Metadaten. Die visuelle Variation ist dem gemeinsamen Komponentenprinzip untergeordnet.
- Die Seite muss auch mit reduzierten Ornamenten sofort vermitteln: Canvas → Zaoly Kit → wiederverwendbare React-Komponente.

## Bewegungsprinzip V4 — Produktfunktionen als Loops

Die Landingpage zeigt die Arbeit mit Zaoly in kurzen, selbsterklärenden Schleifen. Bewegung erklärt einen Zustand oder Übergang und darf keine rein dekorative Daueraktivität erzeugen.

1. **Canvas → Komponente:** Ein präziser Auswahlrahmen macht den gestalteten Baustein sichtbar; danach wird das zugehörige React-Modul hervorgehoben. Die Oberfläche bleibt gerade und auf dem Raster.
2. **Zaoly Kit:** Text, Button, Input und Layout werden nacheinander markiert; anschließend erscheint die daraus zusammengesetzte FeatureCard. Das vorhandene SVG bleibt als lesbares Standbild erhalten.
3. **Projektübergreifende Nutzung:** Derselbe Komponentenrahmen wird nacheinander in drei Projektkontexten betont. Die Karten selbst bewegen sich nicht.
4. **Design → Dev:** Eine ruhige Verbindung zwischen visuellem Baustein und Code läuft einmal durch; Codezeilen werden in Gruppen sichtbar. Das Ergebnis bleibt pro Schleife ausreichend lange stehen.

Jeder Loop dauert mehrere Sekunden, hat eine erkennbare Ruhephase und verursacht keine Layoutverschiebung. Keine Drehung, kein Springen, keine Tonspur. Animierte Hilfselemente sind dekorativ und nicht per Tastatur fokussierbar. `prefers-reduced-motion: reduce` zeigt alle Inhalte sofort als vollständiges Standbild. Mobile Layouts bleiben ohne horizontalen Überlauf.

## Bewegungsvertiefung V5 — sichtbare Zustandswechsel

Die Loops zeigen mehr als eine Kontur. Sie machen die jeweilige Funktion in einer kleinen Folge von Zuständen erkennbar, ohne die ruhige Seitenkomposition zu ändern:

- Im Canvas folgt auf die Auswahl eine sichtbare Variantenwahl im Inspector; das React-Modul übernimmt den Variantenbezug. Die Darstellung bleibt eine Illustration des Produktprinzips.
- Im Zaoly Kit erscheint die FeatureCard schrittweise: Bildfläche, Text und Aktion werden nach den Atommarkierungen freigelegt. Der fertige Baustein bleibt am Ende gut lesbar stehen.
- Beim Handoff erscheint nach dem Code ein klarer Abschlusszustand „Bereit für React“. Er beschreibt einen nutzbaren Startpunkt für die Integration, keine automatische Veröffentlichung oder technische Freigabe im Zielsystem.
- Alle Zwischenzustände sind auch auf kleinen Displays verständlich. Bei reduzierter Bewegung sind die finale Variante, die vollständige Kit-Komponente und der React-Status direkt sichtbar.

## Produktvertiefung V6 — Token Studio als eigener Beweis

Das Token Studio erhält zwischen Zaoly Kit und Workflow eine großzügige Bühne. Eine einzelne, rechtwinklige Studio-Ansicht zeigt den lokalen Token-Katalog als Illustration: Farbe, Typografie und Abstand werden nacheinander ausgewählt; ein großer Ausschnitt visualisiert den jeweiligen Wert. Die drei Zustände bleiben jeweils lesbar und kehren ohne Sprung zum Anfang zurück. Die Illustration ist kein Live-Screenshot und verspricht keine automatische Änderung fremder Brandion-Packs.

- Die Copy erklärt das lokale Pack im eigenständigen Zaoly und seine Rolle für konsistente Gestaltung. Sie darf weder Brandion als Voraussetzung darstellen noch einen Push dorthin behaupten.
- Ein CTA führt über `paths.routes.tokens` zum tatsächlichen Token Studio. Die Landingpage erhält dafür einen zentral verwalteten Abschnittsanker in `paths.landing.sections`.
- Die Studio-Ansicht benennt echte Fixture-Pfade und Werte aus dem Token-Katalog, darunter `color.action.primary`, `typography.heading.h1` und `spacing.static.medium`.
- Auf schmalen Viewports wird die Ansicht in eine klare vertikale Folge umgestellt. Bei `prefers-reduced-motion: reduce` ist der Farbzustand vollständig und ohne Animation sichtbar.
- Die bestehende ruhige Typohierarchie bleibt: keine gedrehten Elemente, keine zusätzlichen dekorativen Mikrotexte und kein dichtes Kartenraster.

## Token-Bindung V7 — eine Änderung, mehrere Komponenten

Die Token-Studio-Bühne priorisiert nun die Wirkung einer Änderung auf gebundene Komponenten. Der visuelle Loop zeigt `color.action.primary` als Pfad, eine lokale Wertänderung und zwei Komponentenbeispiele im Zaoly-Editor, deren gebundene Aktionsflächen denselben neuen Farbwert übernehmen. Kein einzelnes Komponentenfeld wird separat editiert. Der initiale Fixture-Wert ist echt; der zweite Wert ist als illustrativer lokaler Override erkennbar. Typografie und Abstand bleiben als weitere Katalogkategorien sichtbar, ohne eigene konkurrierende Animation.

Die Copy erklärt: Tokens werden direkt an Komponenten im Editor gebunden; nach einer Änderung am lokalen Pack bekommen diese beim erneuten Laden oder Fokussieren des Editors den aktuellen Wert. Die Seite darf keine sofortige Aktualisierung exportierter Dateien oder externer Anwendungen behaupten. `prefers-reduced-motion: reduce` zeigt den vollständigen geänderten Zustand als Standbild.

## Produkteinblick V8 — echte App-Aufnahmen

Ergänzend zu den erklärenden Loops zeigt die öffentliche Seite echte Ansichten aus dem eigenständigen Zaoly: den Token-Katalog und das Kit Playground mit Code und Live Preview. Die Aufnahmen stammen aus einer isolierten lokalen Standalone-Instanz mit Fixture-Daten. Weder private Projekte noch Benutzer- oder Kontodaten dürfen in den statischen Assets erscheinen.

- Die Bilder sind als „Echte App-Ansicht · Demodaten“ beschriftet. Ihre Bildunterschriften nennen die tatsächlich sichtbare Funktion; der animierte Token-Loop bleibt als Illustration erkennbar.
- Die Screenshots werden nicht zu einer erfundenen Produktoberfläche montiert oder inhaltlich umgefärbt. Ein redaktioneller Zuschnitt darf Navigation und Produktkontext erhalten und störende Entwicklungsoberfläche ausschließen.
- Die Dateien liegen als lokale Assets unter `apps/web/public/landing/` und werden ausschließlich über `paths.landing.assets` referenziert. Kein externer Bilddienst und keine Laufzeit-Abhängigkeit von einem eingeloggten Account.
- Die Bildflächen sind responsiv, mit sinnvollem Alternativtext und stabilen Abmessungen. Auf kleinen Displays dürfen sie in einem horizontalen Ausschnitt mit Fokussierung auf den relevanten UI-Bereich erscheinen.
- UI-Smoke prüft beide Assets und ihre sichtbare Kennzeichnung; Contract-/Specs-Inventar und Web-Build werden ausgeführt.

## Produktdemonstrationen V9 — Typografie und Komposition

Die Landingpage erhält zwei große, eigenständige Funktionsbühnen. Sie zeigen konkrete Zustandswechsel und werten die Seite als Präsentation eines professionellen Designwerkzeugs auf, ohne die ruhige Zaoly-Bildsprache aufzugeben.

1. **Typografie als System:** Der Loop startet mit der Fixture `typography.heading.h1` (Noto Sans JP, Gewicht 700). Ein klar als lokaler Beispiel-Override gekennzeichneter Zustand wechselt zu einer systemeigenen Serif-Schrift sowie zu Gewicht 400 und einer größeren Darstellung. Zwei an denselben Pfad gebundene Beispielkomponenten übernehmen in der Editor-Vorschau sichtbar die neue Typografie. Der Wechsel wird durch zwei übereinanderliegende, gut lesbare Schriftzustände gezeigt. Es wird weder ein externer Live-Push noch eine sofortige Änderung exportierter Dateien suggeriert.
2. **Layout aus Kit-Atomen:** Eine illustrative Editor-Bühne zeigt Text, Button, Bild und Layout aus dem Zaoly Kit. Dieselben Inhalte werden nacheinander als Split- und als gestapelte Landingpage-Komposition angeordnet. Die Änderung folgt einer bewusst gewählten Layoutvariante (`Grid` / `Stack`); sie ist keine automatische Generierung oder beliebige Umwandlung fremder Seiten. Der fertige Zustand bleibt pro Loop gut sichtbar.

Beide Bühnen sind ausdrücklich Illustrationen; die daneben vorhandenen echten Screenshots bleiben als solche gekennzeichnet und erhalten je eine knappe Beschreibung ihrer sichtbaren Produktfunktion. Die Animationen sind rechtwinklig, ohne dekorative Rotation oder Springen. Bei reduzierter Bewegung zeigt jede Bühne sofort einen vollständigen, sinnvollen Endzustand. Mobil werden die Strukturen lesbar vereinfacht, ohne horizontalen Seitenüberlauf. Die bestehenden Produktversprechen (Stand-alone, Token-Bindung im Editor, React-Handoff, freie Projekte) bleiben unverändert.

## Produktdemonstrationen V10 — Varianten und Breakpoints

Die bestehende Produktstrecke wird um zwei großflächige, ruhige Animationen ergänzt. Sie bleiben klar als Illustrationen gekennzeichnet und verwenden vorhandene Zaoly-Funktionen.

1. **Benannte Master-Varianten:** Eine Beispielkomponente `FeatureCard` zeigt die benannten Zustände `Default` und `Editorial`. Ein sichtbarer Variantenwahlschalter wechselt gleichzeitig die Vorschau und den markierten Zustand. Die Szene illustriert die Variantenstruktur aus `specs/domain/site-kit-compositions.md`; sie behauptet weder einen automatischen Publish-Vorgang noch einen bereits erfolgten Sync zu externen Produkten.
2. **Breakpoint-Komposition:** Dieselbe Beispielseite erscheint bei den im Editor vorhandenen Desktop- und Mobile-Breakpoints (1440 und 390 CSS-Pixel). Im Loop ändert sich der aktive Breakpoint; Überschrift, Bildfläche und Aktion nehmen je eine bewusst gestaltete Anordnung an. Die Bühne behauptet keine automatische Generierung eines Mobile-Layouts aus dem Desktop-Layout. Beide Zustände bleiben lang genug lesbar.

Die Animationen haben einen vollständigen Endzustand für `prefers-reduced-motion: reduce`. Auf schmalen Viewports werden Bedienrahmen und Beispielseite verkleinert oder gestapelt, ohne die horizontale Dokumentbreite zu überschreiten. UI-Smoke, Kit-Contract, Specs-Inventar und Build prüfen die Ergänzung.

## Editor-Positionierung V11 — vollständiger Arbeitsbereich

Die Landingpage MUSS den eigenständigen `/editor` früh als umfassenden Designarbeitsplatz zeigen. Nach der Marken-These erscheint eine große, ausdrücklich illustrative Editor-Bühne, bevor die einzelnen Kit-, Token- und Handoff-Funktionen vertieft werden. Die Bühne hat eine erkennbare Topbar, Seiten-/Ebenenstruktur, Canvas-Artboard und Inspector und MUSS als Illustration gekennzeichnet sein. Ein ruhiger Loop wechselt zwischen drei **Linsen**: Canvas (Ebenen, direkte Auswahl, Inspect), Masters (Komponenten/Masters, Varianten, Token-Bindung) und Preflight (Preflight/Export-Kontext). Die Labels sollten an reale Workspace-Begriffe anbinden und keine erfundenen Produkt-Modi vortäuschen. Es handelt sich um redaktionelle Ausschnitte vorhandener Funktionen, nicht um einen authentischen Laufzeit-Screenshot oder eine Behauptung automatischer UI-Umschaltung.

Eine kurze, großzügig gesetzte Capability-Folge macht den Umfang konkret: Seiten, Ebenen, Artboards und Breakpoints; Kit-Atome, Masters, Varianten und Tokens; Asset Library, Team-Präsenz, Kommentare und benannte Versionen; Preview, A11y-Preflight und React-Handoff. Aussagen bleiben an bestehende Editor- und Contract-Spezifikationen gebunden. Weder simultanes konfliktfreies Dokument-Merging noch eine automatische Veröffentlichung in fremde Systeme wird versprochen. Der primäre CTA führt wie bisher über `paths.routes.editor` zum Editor.

Die Oberfläche bleibt rechtwinklig, ruhig und lesbar. In der mobilen Ansicht wird die Editor-Illustration in einen fokussierten Canvas-/Inspector-Ausschnitt überführt; keine winzige, unlesbare Desktop-Miniatur. Der reduzierte Bewegungsmodus zeigt einen vollständigen editorischen Endzustand. UI-Smoke, Specs-Inventar, Contract-Checks und Build validieren die neue Sektion.

## Editor-Capabilities V12 — vier visuelle Beweise

Die vier Capability-Punkte **Gestalten**, **Systematisieren**, **Zusammenarbeiten** und **Weitergeben** werden als großzügiges Zweispaltenraster statt als reine Textzeilen gezeigt. Jede Fläche enthält eine eigene, klar als Illustration erkennbare Produktvisualisierung: Canvas mit Seiten-/Ebenenauswahl; Kit-Atome mit Master, Variante und Token; Team-Präsenz, Kommentar und benannter Versionsstand; Preflight mit anschließendem React-Modul. Die vier Beispiele zeigen vorhandene Funktionen, ohne eine automatische Weitergabe oder konfliktfreie gleichzeitige Bearbeitung zu behaupten.

Die Flächen haben gleiche visuelle Wertigkeit und eine ruhige typografische Hierarchie. Auf breiten Displays stehen zwei Spalten mit ausreichend Raum für lesbare UI-Ausschnitte; unterhalb der Tablet-Schwelle folgen sie einspaltig. Die Loops sind kurz, haben erkennbare Endzustände und verzichten auf Rotation und dekorative Bewegung. `prefers-reduced-motion: reduce` zeigt jede Visualisierung in einem verständlichen vollständigen Zustand. UI-Smoke und Build decken die Ergänzung ab.

## Token-Studio-Vertiefung V13 — Werte bearbeiten

Unter der bestehenden Token-Bindungsbühne zeigt eine neue, großzügige Produktstrecke drei konkrete Bearbeitungsabläufe aus dem eigenständigen `/tokens`-Hub. Die Szenen sind Illustrationen nach `specs/domain/zaoly-token-studio.md` und keine authentischen Screenshots.

1. **Farbe im Edit-Dock:** Die Karte `color.action.primary` ist ausgewählt. Der seitliche Bearbeitungsbereich zeigt die tatsächlich unterstützten Formate HEX, RGB, HSL und OKLCH. Ein Beispielentwurf ändert den Fixture-Wert `#1F44FF` auf `#7457D8`; die Kartenmedien-Vorschau übernimmt den Entwurf. Nach einem sichtbaren Speichern wechselt die Kennzeichnung von Fixture zu lokalem Override. Revert bleibt als vorhandene Aktion erkennbar. Die Illustration zeigt keinen Live-Push in andere Produkte.
2. **Maß am Endlos-Rad:** `spacing.static.medium` startet bei `1rem`. Das feste Mittelzeichen bleibt stehen, die Skala bewegt sich auf einen illustrativen Entwurf von `1.5rem`; die ausgewählte Karte zeigt den Abstand in ihrer Vorschau. Freie Texteingabe bleibt als Alternative sichtbar. Die Szene behauptet nicht, dass das Rad um den Anfangswert herum zyklisch umspringt.
3. **Abgeleiteter Wert:** Ein Beispiel für `spacing.gap.modules` nutzt im selben Digitalwert-Feld `calc({spacing.static.medium} * 2)`. Die Auflösung mit dem Fixture-Basiswert wird als `2rem` angezeigt. Das Beispiel ist lokal, referenziert einen anderen Pfad und erzeugt keinen Zyklus.

Eine knappe Zeile verweist auf die echten Hub-Ansichten Cards, JSON und CSS sowie Copy/Download; der JSON-Import mit Vorschau ist eine Admin-Aktion. Die drei Szenen sind responsiv, ohne unlesbare Desktop-Verkleinerung. Reduzierte Bewegung zeigt den gespeicherten Farb-Override, den gewählten Radwert und den aufgelösten Compose-Wert als vollständige Zustände. UI-Smoke, Specs-Inventar, Kit-Contract und Build werden ausgeführt.

## Workflow V14 — ein Baustein in drei Zuständen

Die bisherige dreizeilige Workflow-Liste wird durch eine zusammenhängende, großformatige Produktvisualisierung ersetzt. Der Abschnitt zeigt **dieselbe FeatureCard** in drei unmittelbar lesbaren Zuständen: als ausgewählten Entwurf auf dem Canvas, als Master mit benannter Variante und gebundenem Token, schließlich als React-Modul mit Integrationshinweis. Die Darstellung ist eine Illustration vorhandener Funktionen, kein Screenshot und keine Behauptung einer automatischen Veröffentlichung in andere Systeme.

- Auf breiten Displays bilden drei gleichwertige Szenen einen horizontalen Weg. Eine einzige ruhige Verbindung führt den Blick von links nach rechts; der großzügige Titel und kurze Beschreibungen stehen außerhalb der produktnahen Visualisierung. Die Szenen sind rechtwinklig und verzichten auf gedrehte Flächen sowie dekorative Mikrotexte.
- Die erste Szene zeigt Ebenen, Artboard und Auswahlrahmen. Die zweite zeigt `FeatureCard`, die Variante `Primary` und die Bindung an `color.action.primary`. Die dritte zeigt einen konkreten React-Import und eine lesbare Komponentensignatur als Startpunkt für die Entwicklung.
- Ein dezenter Loop betont nacheinander die drei Zustände und die Verbindung. Die Inhalte selbst bleiben durchgehend sichtbar; es gibt keine Layoutverschiebung. Bei `prefers-reduced-motion: reduce` ist der vollständige Weg sofort als Standbild erkennbar.
- Auf kleinen Displays stehen die Szenen untereinander und bleiben als eigenständige, gut lesbare Ausschnitte sichtbar. Der Abschnitt bleibt über den zentralen Workflow-Anker erreichbar.
- UI-Smoke prüft drei Visualisierungen, die korrekte Reihenfolge, den Tokenpfad und React-Handoff. Specs-Inventar, Kit-Contract und Build werden ausgeführt.

## Produkteinblick V15 — Multi-Breakpoint Editor (echte App-Aufnahme)

Die Breakpoint-Sektion und der Produkt-Einblick zeigen eine **echte** Editor-Aufnahme mit nebeneinanderliegenden Desktop-, Tablet- und Mobile-Artboards derselben Landing-Composition (Compare / Multi-Breakpoint).

- Asset: `paths.landing.assets.editorBreakpointsApp` → `apps/web/public/landing/editor-breakpoints-app.jpg` (Fixture-/Demodaten, keine privaten Nutzerdaten).
- Kennzeichnung wie V8: „Echte App-Ansicht · Demodaten“. Alternativtext benennt Multi-Breakpoint / Compare.
- Copy erklärt bewusstes Gestalten über Breakpoints und die parallele Ansicht — keine automatische Layout-Generierung.
- Die illustrative `BreakpointLoop`-Bühne darf unter dem Screenshot bleiben; der Screenshot ist der primäre Beweis.
- Öffentliche Distribution (README) darf dasselbe Motiv unter `docs/images/zaoly-editor-breakpoints.jpg` führen.
- UI-Smoke prüft Asset-Pfad, Datei auf Disk und sichtbare Caption; Specs-Inventar und Build.

## Erlebnis-Verdichtung V16 — kürzer, erlebbarer

Die öffentliche Landingpage verdichtet die Merkmalsstrecke aus V8–V15. Ziel: weniger lineare Feature-Abschnitte, mehr ein durchgängiges Produkterlebnis. Detailtiefe bleibt über `/editor`, `/kit`, `/tokens`, FAQ und Kontakt erreichbar.

## Erlebnis V17 — kompakt auf `/`, Tiefe auf `/explore`

V17 trennt **Vorschau** und **Vertiefung**:

1. **`/` (compact)** — Die sticky Erlebnis-Bühne bleibt, wird aber dichter (kürzere Kapitel-Marker, kompaktere Stage-Höhen, reduzierte Sekundär-Controls). Kern-Klicks bleiben (Modi, Hotspots, Tabs). Jedes Kapitel MUST einen Deep-Link auf die passende Explore-Unterseite anbieten (`paths.routes.exploreChapter`).
2. **`/explore` (hub)** — Öffentliche, auth-freie Übersicht der fünf interaktiven Kapitel. MUST NOT die authentifizierten App-Hubs `/kit` und `/tokens` ersetzen.
3. **`/explore/:chapter` (deep)** — Eine Unterseite pro Kapitel (`editor` | `kit` | `tokens` | `screens` | `path`) mit voller Interaktionsdichte plus zusätzlichen Deep-Controls. GET ist öffentlich (`isPublicPath`).

### Compact vs Deep

| Density | Wo | Pflicht |
|---------|-----|---------|
| `compact` | `/` Erlebnis-Bühne | Kern-Interaktion + Tour + Statuschip; Sekundär-Controls MAY versteckt sein |
| `deep` | `/explore/:chapter` | Alle Compact-Controls + Deep-Extras (Editor: Grid/Pin/Saved; Kit: Reset/Checkliste; Tokens: Copy-Pfad; Screens: Chrome/Orientation; Weg: scrubbare Steps + Autoplay) |

App-Routen `/editor`, `/kit`, `/tokens` bleiben Produktflächen nach Login; Explore ist Marketing-Demo only.

## Klarheit V18 — Demo vs App, ehrliche Chrome, echte CTAs

1. **Demo vs App MUST getrennt sein.** Öffentliche Demos (`/`, `/explore`, `/explore/:chapter`) MUST als Demo/Illustration gekennzeichnet sein. Links in die authentifizierten Hubs (`/editor`, `/kit`, `/tokens`) MUST als App-Ziel erkennbar sein und MAY einen kurzen Login-Hinweis tragen (Copy, nicht Modal). Gleicher Produktname in Nav/Footer DARF nicht zwei unterschiedliche Welten ohne Kennzeichnung öffnen.
2. **Editor-Bühne MUST keine erfundenen Produkt-Modi vortäuschen.** Die drei Linsen MUST an reale Workspace-Begriffe anbinden (`Canvas` · `Masters` · `Preflight`) und MUST sichtbar als Illustration gekennzeichnet sein. Sie ersetzen nicht die echten Left-Rail-Tabs Components ‖ Layers ‖ Tokens.
3. **Projekt-Mosaik MUST keine Fake-CTAs zeigen.** Dekorative Projektkarten DÜRFEN keine klickbar wirkenden Links ohne `href` tragen. Ein echter Abschnitt-CTA (Register oder Explore) ist erlaubt.
4. Experience-Captions MUST primär den Explore-Deep-Link (Demo) und sekundär den App-Link führen — Reihenfolge und Labels machen den Unterschied lesbar.

## Orientierung V19 — Header-Demos, Beispiel-Master, Kit Playground-lite

1. **Header-Anker Kit/Tokens MUST als Demo gekennzeichnet sein** (z. B. `Kit · Demo` / `Tokens · Demo`), weil sie Hash-Panels auf `/` öffnen — nicht die App-Hubs. Footer/App-CTAs behalten die App-Kennzeichnung aus V18.
2. **`FeatureCard` ist Marketing-Beispiel, kein Seed-Atom.** Sichtbare Labels MUST „Beispiel-Master“ / „Example master“ tragen (Hero-Inspect, Editor-/Weg-/Handoff-Illustrationen). Der Seed-Katalog bleibt die Quelle der Wahrheit für Kit-Atome.
3. **Deep Kit (`/explore/kit`) MUST eine Playground-lite-Triade** zeigen: Atom-Katalog · Live-Vorschau · kurzer TSX-Snippet (`import { Atom } from '@zaoly/site-kit'`). Compact MAY den TSX-Pane weglassen. Das ersetzt nicht den authentifizierten Kit Playground.

## Vergleich V20 — Vorteile / Nachteile, optimistisch auf Zaoly

1. Die **Hauptseite `/`** MUST einen Vergleich zu **Figma**, **Framer**, **Penpot**, **Sketch** und **Webflow** zeigen (Anker `paths.landing.sections.compare`) — direkt nach dem Hero, nicht erst auf `/explore`.
2. Darstellung MUST eine **HTML-Tabelle** sein (Tools als Spalten; Zeilen: Job · Vorteile · Nachteile · Am besten, wenn). Zaoly-Spalte MUST hervorgehoben sein.
3. Ton MAY optimistisch für Zaolys Job (Design → React-Baustein) sein; Nachteile der anderen DÜRFEN auf diese Lücke zeigen. Nachteile von Zaoly MUST ehrlich bleiben, MAY aber als bewusste Trade-offs formuliert sein.
4. MUST NOT erfundene Feature-Siege, Preise oder „wir ersetzen Figma/Webflow“-Claims.
5. Daten leben zentral in `apps/web/lib/landing/compare.ts` · Knowledge `knowledge/zaoly-competitive-positioning.md`.

### Seitenstruktur (verbindlich)

1. **Hero** — Marke, eine Headline, eine kurze Subline, Primär-CTA Register und Sekundär-CTA Login. Canvas→Code-Bühne bleibt die dominante Visualisierung.
2. **Vergleich** — Vorteile/Nachteile-**Tabelle** vs Figma / Framer / Penpot / Sketch / Webflow (Zaoly-Spalte hervorgehoben). Direkt unter dem Hero auf `/`. Anker `paths.landing.sections.compare`.
3. **These** — kurze typografische Zäsur (Wiederverwendung statt Nachbau) mit der Kette Design → Komponente → Produkt. Anker `paths.landing.sections.product`.
4. **Erlebnis-Bühne** — ein sticky Produkt-Stage mit **fünf Kapiteln**, die per Scroll (Intersection) und per Tablist umschalten:
   - Editor (Canvas / Masters / Preflight — Illustration)
   - Zaoly Kit (Anker `kit`)
   - Token Studio (Anker `tokens`)
   - Screens (echte Multi-Breakpoint-Aufnahme + illustrative Breakpoint-Loop)
   - Weg (Workflow-Illustration Design → System → React; Anker `workflow`)
5. **Einblick** — drei echte App-Aufnahmen (Token Studio, Kit Playground, Multi-Breakpoint) in einem kompakten Raster, jeweils als „Echte App-Ansicht · Demodaten“.
6. **Projekte** — drei Kontexte, dieselbe Komponentenidee.
7. **Handoff** — visuelle Komponente neben React-Modul.
8. **Kontakt** und **Abschluss-CTA**, Footer inkl. Community-GitHub.

### Was bewusst entfällt als eigene Vollabschnitte

Die früheren Einzelbühnen Varianten, Token-Craft (Farbe/Rad/Compose), Typografie-Loop, Composition-Loop und das vierteilige Capability-Kartenraster bleiben als Produktfunktionen gültig, erscheinen auf der Landingpage aber nicht mehr als eigene Vollhöhen-Abschnitte. Ihre Aussagen dürfen in Kapitel-Copy und Deep-Links (`/tokens`, `/kit`, `/editor`) weiterleben. Die zugehörigen Illustrationskomponenten dürfen im Repo bleiben, müssen aber nicht auf `/` gemountet sein.

### Erlebnis-Regeln

- Pro Kapitel höchstens eine dominante Visualisierung und kurze Copy (ein Job).
- Sticky Stage ist die Primärfläche; Kapitel-Copy bleibt knapp unter der Bühne. Scroll-Marker steuern den aktiven Tab, ohne eine zweite Textspalte zu füllen.
- Tablist ist tastaturbedienbar (`role="tablist"` / `tab` / `tabpanel`). Scroll-Umschaltung aktualisiert den aktiven Tab.
- Jede Bühne MUST mindestens eine **klickbare Interaktion** anbieten (Editor-Modi, Kit-Atome, Token-Override, Breakpoint-Tabs, Workflow-Schritte). Interaktive Zustände nutzen `data-*` und pausieren CSS-Loops (`is-interactive`).
- Die Kit-Bühne MUST den **Atom-Katalog** des Zaoly Kits zeigen (Content, Form, Media, Layout, Data — abgeleitet vom Seed in `packages/site-kit` / `lib/landing/kit-atoms.ts`), nicht nur eine einzelne FeatureCard-Assembly. Interaktion: Kategorie wählen, Atom fokussieren, und den Schritt **Page** zeigen, der erklärt, warum Layout-Atome (`Stack` / `Grid` / `Container`) die Basis für vollständige Seiten sind. Compact MAY Kategorien + Page verkürzen; Deep MUST den vollen Katalog, die Layout-Vorschau und einen TSX-Snippet (Playground-lite) anbieten.
- Editor-Bühne MUST als Illustration gekennzeichnet sein; Linsen `Canvas` / `Masters` / `Preflight`; plus Seitenwechsel (Home/Contact), Zoom (Deep), Canvas-Hotspots, Layer-Auswahl und Inspector-Fokus (Deep).
- Token-Bühne MUST Katalogwechsel, Farbswatches, Typo-/Abstand-Skalen und klickbare gebundene Karten (inkl. „Beide hervorheben“) anbieten.
- Screens MUST Desktop/Tablet/Mobile (Zonen + Tabs), Compare-Modus und Cycle-Tap auf der Illustration anbieten.
- Weg MUST Tabs, Progress-Rail, klickbare Szene-Details und einen expliziten Weiter-Button anbieten. Sichtbarer Statuschip (`aria-live`) spiegelt den aktuellen Zustand.
- Die Erlebnis-Bühne MUST eine optionale **Tour abspielen**-Aktion anbieten (`apps/web/lib/landing/experience-tour.ts`). Die Tour durchläuft die Kapitel mit kurzen Beats (inkl. Tablet) und stoppt bei manueller Interaktion oder am Ende.
- `prefers-reduced-motion: reduce` zeigt sinnvolle Endzustände; Interaktionen und Tour bleiben erreichbar (längeres Tour-Intervall).
- Keine erfundenen Kennzahlen, Testimonials oder Suite-Voraussetzungen.
- UI-Smoke, Specs-Inventar und Build prüfen die verdichtete Struktur (Kapitel-Anker, Interaktionen, Screenshots, Handoff, Kontakt, Register-CTA).
