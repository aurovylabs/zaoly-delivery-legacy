import type { ReactNode } from 'react'
import { paths } from '../lib/paths'

export type FaqQuestion = { question: string; answer: ReactNode }
export type FaqTopic = { id: string; number: string; title: string; questions: FaqQuestion[] }

const faqTopicsDe: FaqTopic[] = [
  {
    id: paths.faq.sections.product,
    number: '01',
    title: 'Produktmodell',
    questions: [
      {
        question: 'Was genau ist Zaoly?',
        answer: <>
          <p>Zaoly ist ein eigenständiger visueller Editor für digitale Oberflächen. Designer gestalten Seiten und Komponenten direkt auf dem Canvas. Aus einer Gestaltung können strukturierte Bausteine mit Varianten und Tokenbindungen werden, die sich als Code an Entwickler weitergeben lassen.</p>
          <p>Der entscheidende Unterschied zu einer reinen Bildvorlage ist die weiterverwendbare Struktur: Layout, Inhalt, Komponentenbezug und ausgewählte Designentscheidungen bleiben für die Umsetzung nachvollziehbar. Das Team muss den Entwurf im Zielprodukt trotzdem prüfen und integrieren.</p>
        </>,
      },
      {
        question: 'Was ist der Unterschied zwischen Projekt, Komposition und Seite?',
        answer: <>
          <p>Ein Projekt organisiert ein Vorhaben in Zaoly. Eine Komposition ist das gespeicherte Designdokument, das du im Editor bearbeitest. Innerhalb einer Komposition können mehrere Seiten liegen, etwa Startseite, Produktseite und Kontakt. Jede Seite hat ihre eigene Struktur auf dem Canvas.</p>
          <p>Masters und ihre Instanzen gehören zum jeweiligen Kompositionsdokument. Ein Projekt ist keine Collection in einem anderen System; du kannst eigenständige Zaoly-Projekte für unterschiedliche Marken, Produkte oder Experimente anlegen.</p>
        </>,
      },
      {
        question: 'Wie wird aus einer ersten Idee ein nutzbarer Baustein?',
        answer: <>
          <p>Du beginnst auf einem Artboard, kombinierst beispielsweise Text, Bild, Button und Layout aus dem Zaoly Kit und bearbeitest die Struktur direkt im Editor. Wiederkehrende Elemente kannst du zu einem Master machen, Varianten anlegen und Farben oder Abstände an Token-Pfade binden.</p>
          <p>Danach prüfst du den Entwurf in der Preview und im Preflight. Für die Umsetzung erzeugst du ein React-Modul oder einen Handoff-Pack. So sehen Entwickler mehr als das fertige Bild: Sie bekommen den Baustein und seinen technischen Kontext.</p>
        </>,
      },
      {
        question: 'Brauche ich andere Produkte oder eine Suite-Verbindung?',
        answer: <>
          <p>Nein. Zaoly arbeitet als eigenständiges Produkt mit eigenem Editor, Projekten, Zaoly Kit, lokalem Token-Pack und lokalen Benutzerkonten. Eine Federation, externe Collection oder ein vorgeschaltetes Brand-Pack ist keine Voraussetzung für den normalen Arbeitsweg.</p>
          <p>Wenn ein Team die Ergebnisse in einer anderen Anwendung verwenden möchte, geschieht das über den Code-Handoff und die Integration in diese Anwendung – nicht über eine automatische Kopplung zwischen Produkten.</p>
        </>,
      },
    ],
  },
  {
    id: paths.faq.sections.editor,
    number: '02',
    title: 'Editor & Kit',
    questions: [
      {
        question: 'Was kann ich im Editor konkret bearbeiten?',
        answer: <>
          <p>Der Editor verbindet Canvas, Seiten, Ebenen und einen Inspector für die Eigenschaften des ausgewählten Elements. Du kannst Bausteine platzieren, Inhalte direkt bearbeiten, Strukturen verschachteln, Ebenen umordnen und die Wirkung auf dem Artboard prüfen. Assets, Kommentare und Komponentenwerkzeuge gehören zum selben Arbeitsbereich.</p>
          <p>Der Entwurf bleibt ein bearbeitbares Dokument mit nachvollziehbarer Struktur. Das ist besonders wichtig, wenn später eine Variante, ein anderer Bildschirm oder ein Entwickler-Handoff daraus entstehen soll.</p>
        </>,
      },
      {
        question: 'Wie funktionieren Desktop, Tablet und Mobile?',
        answer: <>
          <p>Im Editor kannst du zwischen Desktop, Tablet und Mobile wechseln. Die Ansichten verwenden unterschiedliche Artboardbreiten und erlauben gezielte Änderungen für einzelne Breakpoints. So kannst du etwa eine zweispaltige Desktop-Komposition mobil bewusst untereinander anordnen und Abstände oder Größen anpassen.</p>
          <p>Zaoly erzeugt dabei nicht automatisch eine fertige Mobile-Gestaltung aus dem Desktop-Entwurf. Die drei Ansichten helfen dir, responsive Entscheidungen direkt im Design zu treffen und sie später im Handoff sichtbar zu machen.</p>
        </>,
      },
      {
        question: 'Was unterscheidet Kit-Atome, Masters und Instanzen?',
        answer: <>
          <p>Das <a href={paths.routes.kit}>Zaoly Kit</a> liefert Ausgangsbausteine wie Text, Button, Input und Layout. Ein Master ist die wiederverwendbare Definition einer eigenen Komponente innerhalb der geöffneten Komposition. Eine Instanz verweist auf diesen Master und platziert ihn auf einer Seite.</p>
          <p>Änderst du den Master, übernehmen seine Instanzen in dieser Komposition die neue Definition. Das ist keine automatische Live-Verbindung zu Masters in anderen Projekten oder zu bereits exportiertem Code. Für projektübergreifende Nutzung gibt es den bewussten Kit- und React-Handoff.</p>
        </>,
      },
      {
        question: 'Wie funktionieren Varianten?',
        answer: <>
          <p>Ein Master kann mehrere benannte Varianten haben, zum Beispiel „Default“ und „Editorial“. Eine Instanz wählt die passende Variante, während sie weiterhin zu derselben Komponentenfamilie gehört. So lassen sich unterschiedliche Ausprägungen systematisch pflegen, statt jede Karte unabhängig nachzubauen.</p>
          <p>Varianten sind gestaltete Zustände. Zaoly leitet sie nicht automatisch aus beliebigen Eigenschaften oder aus einer fremden Designsystem-Bibliothek ab; du legst fest, welche Struktur und welcher Ausdruck zu einer Variante gehören.</p>
        </>,
      },
      {
        question: 'Wofür ist der Kit Playground gedacht?',
        answer: <>
          <p>Im <a href={paths.routes.kit}>Kit Playground</a> kannst du Kit-Bausteine auswählen, TSX bearbeiten und die Wirkung in einer Live Preview prüfen. Props, Tokenbezüge und der Handoff-Bereich machen ihn auch für Entwickler interessant: Dort lassen sich unter anderem Modul, Import und Installationshinweise ansehen oder kopieren.</p>
          <p>Der Playground ist ein Entwurfs- und Prüfraum. Ein bearbeiteter TSX-Entwurf wird durch das Tippen oder die Preview nicht automatisch als dauerhaftes Paketbauteil veröffentlicht. Dafür ist ein eigener Editor- und Kit-Workflow nötig.</p>
        </>,
      },
    ],
  },
  {
    id: paths.faq.sections.tokens,
    number: '03',
    title: 'Token Studio',
    questions: [
      {
        question: 'Was steckt im lokalen Token-Pack?',
        answer: <>
          <p>Zaoly startet mit einem eigenen Pack für die wichtigsten Designentscheidungen des Kits: unter anderem Farben, Typografie, Abstände, Größen, Radien, Schatten und Bewegungswerte. Neben Rohwerten gibt es semantische Rollen wie <code>color.action.primary</code>. Komponenten binden solche Rollen, damit ein Wert an einer Stelle geändert werden kann.</p>
          <p>Das Pack gehört zu Zaoly. Du brauchst keinen externen Markenservice, um eine Seite zu gestalten oder Tokenbindungen zu verwenden. Das <a href={paths.routes.tokens}>Token Studio</a> ist die zentrale Oberfläche zum Verwalten des lokalen Packs.</p>
        </>,
      },
      {
        question: 'Was bedeuten Override und Custom?',
        answer: <>
          <p>Seed-Werte (mitgeliefertes Ausgangspack) tragen im Katalog keine Herkunftsmarkierung. Bearbeitet ein Admin einen vorhandenen Pfad, erscheint ein lokaler „Override“: Der Pfad bleibt gleich, Zaoly verwendet den neuen Wert. „Custom“ kennzeichnet einen zusätzlich angelegten lokalen Pfad, der nicht Teil des Ausgangspacks war.</p>
          <p>Override und Custom bleiben im Studio sichtbar. Einen Override kannst du auf den Ausgangswert zurücksetzen. So lässt sich eine Marke anpassen, ohne die Grundstruktur des Packs neu aufzubauen.</p>
        </>,
      },
      {
        question: 'Wie detailliert kann ich Tokens bearbeiten?',
        answer: <>
          <p>Das Token Studio bietet je nach Werttyp ein passendes Werkzeug. Bei Farben kannst du beispielsweise HEX, RGB, HSL und OKLCH verwenden. Für Abstände und Größen gibt es eine Skala mit direkter Vorschau und freier Eingabe; Bewegungswerte können über Dauer und Kurve bearbeitet werden.</p>
          <p>Auch abgeleitete Werte sind möglich: Ein Abstand kann einen anderen Token-Pfad referenzieren und daraus berechnet werden. Während du einen Wert einstellst, siehst du seine Wirkung am Beispiel im Studio; gespeichert wird erst mit der entsprechenden Aktion.</p>
        </>,
      },
      {
        question: 'Wie wirkt eine Tokenänderung auf meine Komponenten?',
        answer: <>
          <p>Eine Komponente kann eine Eigenschaft an einen Token-Pfad binden. Wenn beispielsweise zwei Buttons <code>color.action.primary</code> für ihre Aktionsfarbe nutzen, reicht die Änderung dieses einen lokalen Werts. Beim Öffnen oder erneuten Fokussieren lädt der Editor das Pack erneut und stellt beide gebundenen Komponenten mit dem aktuellen Wert dar.</p>
          <p>Ein bereits exportiertes React-Modul und eine externe Anwendung ändern sich dadurch nicht von selbst. Im Handoff werden die Tokenbezüge sichtbar, damit das Entwicklungsteam die Werte im Zielsystem bewusst einbindet.</p>
        </>,
      },
      {
        question: 'Kann ich das Pack als JSON oder CSS nutzen?',
        answer: <>
          <p>Ja. Neben der Kartenansicht gibt es im Token Studio lesbare JSON- und CSS-Ansichten. Du kannst die Ausgaben kopieren oder herunterladen. Das hilft bei Review, Dokumentation und bei der Übergabe der Werte an ein React-Projekt.</p>
          <p>Für einen JSON-Import zeigt Zaoly Admins zuerst eine Vorschau mit neuen, geänderten und ungültigen Einträgen. Erst nach Bestätigung werden gültige lokale Werte angewendet. Die CSS-Ansicht dient zum Export; sie ist kein CSS-Import in das Pack.</p>
        </>,
      },
    ],
  },
  {
    id: paths.faq.sections.collaboration,
    number: '04',
    title: 'Zusammenarbeit & Verlauf',
    questions: [
      {
        question: 'Wer kann an einem Entwurf mitarbeiten?',
        answer: <>
          <p>Eine Komposition hat einen Owner. Der Owner kann sie mit anderen lokalen Zaoly-Nutzern teilen. Mitglieder mit der Rolle „Editor“ dürfen Änderungen vornehmen; „Viewer“ können den Entwurf ansehen, aber nicht bearbeiten. Die Mitgliedschaft bezieht sich auf den freigegebenen Entwurf, nicht auf eine externe Collection.</p>
          <p>Für die Zusammenarbeit brauchen die Beteiligten eigene Zaoly-Konten. Ein öffentlich zugänglicher Link ist kein Ersatz für eine Editor-Mitgliedschaft.</p>
        </>,
      },
      {
        question: 'Wie bleiben Entscheidungen im Team nachvollziehbar?',
        answer: <>
          <p>Team-Präsenz macht sichtbar, wer sich im Arbeitsbereich befindet. Kommentare können sich auf konkrete Elemente beziehen, statt nur allgemein neben einer Datei zu stehen. Das erleichtert Rückfragen zu einem Button, einer Textstelle oder einer Layoutentscheidung.</p>
          <p>Präsenz und Kommentare helfen bei der Abstimmung; sie ersetzen keine fachliche Freigabe. Wenn mehrere Personen denselben Bereich bearbeiten, sollte das Team die Änderungen weiterhin bewusst koordinieren.</p>
        </>,
      },
      {
        question: 'Kann ich einen früheren Stand wiederfinden?',
        answer: <>
          <p>Ja. Benannte Versionsstände halten wichtige Meilensteine einer Komposition fest. Ein älterer Stand kann zur Prüfung schreibgeschützt angesehen und bei Bedarf wiederhergestellt werden. Vor einer Wiederherstellung legt Zaoly eine Sicherung des aktuellen Stands an.</p>
          <p>Davon zu unterscheiden ist Undo/Redo während der laufenden Bearbeitung: Das hilft bei unmittelbaren Schritten in der aktuellen Sitzung. Für bewusst dokumentierte Entscheidungen sind benannte Versionen der bessere Bezugspunkt.</p>
        </>,
      },
      {
        question: 'Ist Zusammenarbeit dasselbe wie automatische Konfliktlösung?',
        answer: <>
          <p>Nein. Rollen, Präsenz, Kommentare und Versionen geben dem Team Orientierung darüber, wer Zugriff hat und wie sich ein Entwurf entwickelt. Sie bedeuten nicht, dass jede gleichzeitige Änderung an derselben Stelle automatisch konfliktfrei zusammengeführt wird.</p>
          <p>Für kritische Komponenten empfiehlt sich ein klarer Review-Schritt: Variante und Tokenbindungen prüfen, einen benannten Stand sichern und erst danach den Handoff an die Entwicklung weitergeben.</p>
        </>,
      },
    ],
  },
  {
    id: paths.faq.sections.handoff,
    number: '05',
    title: 'Übergabe & Qualität',
    questions: [
      {
        question: 'Wie gelangt ein Entwurf in den Entwickler-Handoff?',
        answer: <>
          <p>Im Editor kannst du den Export auf ein ausgewähltes Element, eine ganze Seite oder alle Seiten beziehen. Für wiederverwendbare Web-Komponenten ist der React-Export der zentrale Weg. Er übersetzt die bearbeitete Struktur in ein Modul, das Entwickler lesen, prüfen und in ihre Anwendung übernehmen können.</p>
          <p>Der Handoff aus dem <a href={paths.routes.kit}>Kit Playground</a> hat einen engeren Zweck: Er beschreibt eine Kit-Komponente mit ihren Installations-, Import- und Modulhinweisen. Beide Wege ergänzen sich, aber ein Seitenexport und ein Kit-Baustein sind nicht dasselbe.</p>
        </>,
      },
      {
        question: 'Was ist der Unterschied zwischen „Copy Code“ und „Copy pack“?',
        answer: <>
          <p>„Copy Code“ kopiert das generierte Modul. „Copy pack“ bündelt zusätzlich Kontext für die Übergabe: wofür der Export gedacht ist, den Kit-Bezug, Installations- und Importhinweise, verfügbare Token-CSS-Werte und denselben Modulcode.</p>
          <p>Damit muss ein Entwickler nicht allein aus JSX erschließen, welches Paket gebraucht wird oder welche Tokenpfade zum Entwurf gehören. Der Pack ist eine Arbeitshilfe für die Integration, kein automatischer Commit oder Release in einem fremden Repository.</p>
        </>,
      },
      {
        question: 'Wie nutze ich eine Komponente in einem anderen Projekt?',
        answer: <>
          <p>Der React-Handoff liefert den Startpunkt. Das Entwicklungsteam übernimmt das Modul in das Zielprojekt, richtet die benötigten Kit-Imports und Tokenwerte ein und verbindet die Komponente mit Daten, Routing und Qualitätsregeln der Anwendung. Dieselbe Gestaltung kann so in unterschiedlichen Kontexten weiterarbeiten.</p>
          <p>Ein Master im Zaoly-Editor wird dadurch nicht automatisch zu einem live synchronisierten Master in jedem Projekt. Änderungen an einem Entwurf erfordern einen neuen, bewussten Handoff und eine Prüfung im jeweiligen Zielsystem.</p>
        </>,
      },
      {
        question: 'Was prüfen Preflight und „Ready for eng“?',
        answer: <>
          <p>Der Editor prüft vor der Übergabe unter anderem fehlende Bildbeschreibungen, unbeschriftete Buttons, Kontrastprobleme, zu kleine Touch-Ziele, problematische Tab-Reihenfolgen und fehlende Tokenbindung. „Ready for eng“ bewertet den gewählten Exportbereich und zeigt blockierende Punkte direkt an, damit Designer zum betroffenen Element zurückgehen können.</p>
          <p>Ein grüner Status bedeutet, dass diese automatisierten Prüfungen keine blockierenden Befunde gefunden haben. Er ersetzt weder einen vollständigen Accessibility-Test noch Code Review, Produkttests oder die Freigabe der Zielanwendung.</p>
        </>,
      },
      {
        question: 'Welche technischen Ausgabeformate gibt es?',
        answer: <>
          <p>Der Editor zeigt neben React auch weitere Exportansichten, darunter Tailwind-orientiertes HTML, SwiftUI, HTML und das Szenen-JSON. Sie dienen unterschiedlichen Übergaben und Prüfungen. Für einen direkt anschlussfähigen Kit-Komponenten-Handoff in Webprodukten steht React im Mittelpunkt.</p>
          <p>Andere Frameworks erhalten nicht automatisch dasselbe fertige Modul. Wenn ein Team etwa eine bestehende Komponentenbibliothek außerhalb des unterstützten React-Kit-Pfads nutzt, muss es die Ausgabe an deren Verträge und Laufzeit anpassen.</p>
        </>,
      },
    ],
  },
  {
    id: paths.faq.sections.access,
    number: '06',
    title: 'Zugang & Betrieb',
    questions: [
      {
        question: 'Wie bekomme ich einen Zugang?',
        answer: <>
          <p>Du kannst dir ein Konto selbst anlegen: auf der <a href={paths.routes.register}>Registrierungsseite</a> mit E-Mail und Passwort oder — wenn eingerichtet — mit Google. Danach öffnet sich der Editor. Bestehende Konten melden sich unter <a href={paths.routes.login}>Anmelden</a> an.</p>
          <p>Admins können weiterhin Einladungslinks vergeben. Ein automatischer E-Mail-Versand für Einladungen ist optional und nicht Voraussetzung für die Selbstregistrierung.</p>
        </>,
      },
      {
        question: 'Wer darf Tokens ändern und Entwürfe freigeben?',
        answer: <>
          <p>Das lokale Token-Pack können Admins bearbeiten und importieren. Angemeldete Nutzer können die Werte im Editor verwenden; Änderungen am Pack wirken auf gebundene Komponenten, sobald der Editor die aktuellen Werte lädt.</p>
          <p>Bei einem geteilten Entwurf regeln Owner, Editor und Viewer, wer lesen, bearbeiten oder Mitglieder verwalten darf. Diese Berechtigungen für eine Komposition sind etwas anderes als die Admin-Rolle für die Packverwaltung.</p>
        </>,
      },
      {
        question: 'Wie werden Entwürfe gespeichert?',
        answer: <>
          <p>Zaoly speichert Kompositionen als strukturierte Dokumente mit Seiten, Ebenen, Masters und Kommentaren. Im regulären Mehrbenutzerbetrieb nutzt das Produkt eine eigene Datenbank; für lokale Entwicklung und Tests gibt es einen Datei-Fallback. Nach dem Speichern kann das Dokument erneut geladen und weiterbearbeitet werden.</p>
          <p>Diese Architektur beschreibt die Speicherung im Produkt. Sie ist keine Zusage zu einer bestimmten Verfügbarkeit, automatischen Backups oder zur Synchronisierung mit externen Anwendungen.</p>
        </>,
      },
    ],
  },
]

const faqTopicsEn: FaqTopic[] = [
  {
    id: paths.faq.sections.product, number: '01', title: 'Product model', questions: [
      { question: 'What is Zaoly?', answer: <><p>Zaoly is a standalone visual editor for digital products. Design pages and components on a canvas, give them reusable structure with masters, variants, and token bindings, then hand them to developers as code.</p><p>The handoff makes structure and design decisions easier to understand. Your team still reviews and integrates the output in the target product.</p></> },
      { question: 'How are projects, compositions, and pages related?', answer: <><p>A project organizes a piece of work in Zaoly. A composition is the design document you edit; it can contain several pages, such as a home page, product page, and contact page. Masters and their instances belong to that composition.</p><p>Projects are independent, so you can create as many as you need for different brands, products, or experiments.</p></> },
      { question: 'How does an idea become a reusable building block?', answer: <><p>Start on an artboard, combine Zaoly Kit elements such as text, image, button, and layout, then edit the structure on the canvas. Turn recurring elements into masters, add variants, and bind colors or spacing to token paths.</p><p>Review the result in Preview and Preflight, then create a React module or handoff pack so developers get the component and its technical context.</p></> },
      { question: 'Do I need another product or a suite connection?', answer: <><p>No. Zaoly runs as a standalone product with its own editor, projects, Zaoly Kit, local token pack, and user accounts. Federation or an external collection is not required for the normal workflow.</p><p>To use a result in another application, take the code handoff and integrate it into that application.</p></> },
    ],
  },
  {
    id: paths.faq.sections.editor, number: '02', title: 'Editor & Kit', questions: [
      { question: 'What can I edit in the editor?', answer: <><p>The editor brings together a canvas, pages, layers, and an inspector for the selected element. Place building blocks, edit content, nest and reorder layers, and check the result on an artboard. Assets, comments, and component tools are part of the same workspace.</p><p>Your design remains an editable, structured document—ready for variants, responsive views, and developer handoff.</p></> },
      { question: 'How do desktop, tablet, and mobile views work?', answer: <><p>Switch between artboard widths and make deliberate layout changes for each breakpoint. For example, you can stack a two-column desktop composition on mobile and adjust its spacing and scale.</p><p>Zaoly does not automatically invent a finished mobile design from a desktop layout. The views help you make and communicate those responsive decisions.</p></> },
      { question: 'What are Kit atoms, masters, and instances?', answer: <><p><a href={paths.routes.kit}>Zaoly Kit</a> provides starter elements such as Text, Button, Input, and Layout. A master is your reusable component definition in a composition; an instance places that master on a page.</p><p>Instances in that composition receive master changes. This is not a live link to masters in other projects or to code already exported. Use the Kit and React handoff for reuse beyond the composition.</p></> },
      { question: 'How do named variants work?', answer: <><p>A master can have named variants such as “Default” and “Editorial.” Each instance chooses the variant it needs while remaining part of the same component family.</p><p>Variants are designed states you define. Zaoly does not infer them automatically from arbitrary properties or from a third-party design-system library.</p></> },
      { question: 'What is the Kit Playground for?', answer: <><p>In the <a href={paths.routes.kit}>Kit Playground</a>, select Kit elements, edit TSX, and review the result in a live preview. Props, token references, and handoff details make it useful for developers too.</p><p>A draft in the playground is not automatically published as a permanent package component; that requires the dedicated editor and Kit workflow.</p></> },
    ],
  },
  {
    id: paths.faq.sections.tokens, number: '03', title: 'Token Studio', questions: [
      { question: 'What is in the local token pack?', answer: <><p>The Zaoly pack starts with core design values for the Kit, including colors, typography, spacing, sizes, radii, shadows, and motion. Semantic paths such as <code>color.action.primary</code> let components refer to a role instead of a fixed value.</p><p>The pack is managed in <a href={paths.routes.tokens}>Token Studio</a>; you do not need an external brand service to design or use token bindings.</p></> },
      { question: 'How do overrides and custom tokens work?', answer: <><p>An override changes the value of an existing seed path while keeping its name. A custom token adds a new local path that was not in the seed pack.</p><p>The studio marks both clearly. You can reset an override to its seed value without rebuilding the pack structure.</p></> },
      { question: 'How precisely can I edit token values?', answer: <><p>Token Studio offers tools for each value type. Colors support HEX, RGB, HSL, and OKLCH; spacing and dimensions have a scale with live preview and direct input. Motion values can be adjusted by duration and curve.</p><p>You can also derive a value from another token path. The studio shows the resolved value while you work; changes are saved only when you choose to save.</p></> },
      { question: 'How do token changes reach my components?', answer: <><p>Bind a component property to a token path. If two buttons use <code>color.action.primary</code>, changing that local value updates both when the editor loads the latest pack.</p><p>Already exported React code and external applications do not update by themselves. The handoff exposes token references so developers can connect them in the target system.</p></> },
      { question: 'Can I use the pack as JSON or CSS?', answer: <><p>Yes. Token Studio includes readable Cards, JSON, and CSS views. Copy or download the output for reviews, documentation, or handoff into a React project.</p><p>Admins can preview new, changed, and invalid entries before applying a JSON import. CSS is an export view, not a way to import CSS back into the pack.</p></> },
    ],
  },
  {
    id: paths.faq.sections.collaboration, number: '04', title: 'Collaboration & history', questions: [
      { question: 'Who can work on a design?', answer: <><p>A composition has an owner who can share it with other Zaoly users. Editors can make changes; viewers can inspect the design without editing it. Access applies to the shared composition.</p><p>Each collaborator needs a Zaoly account; a public link is not a substitute for editor access.</p></> },
      { question: 'How can we keep decisions traceable?', answer: <><p>Team presence shows who is in the workspace. Comments can refer to specific elements, and named versions record important milestones.</p><p>These tools support coordination and review; they do not automatically merge every simultaneous edit.</p></> },
      { question: 'Can I recover an earlier version?', answer: <><p>Yes. Open named versions read-only to review earlier milestones, then restore a version when needed. Zaoly creates a backup of the current state before restoring.</p><p>Undo and redo help with recent actions in the current session; named versions are better for documented decisions.</p></> },
      { question: 'Does collaboration automatically resolve editing conflicts?', answer: <><p>No. Roles, presence, comments, and versions help the team understand access and design history, but they do not guarantee that simultaneous changes to the same area merge without conflict.</p><p>For critical components, review the variant and token bindings, save a named version, and then hand the work to development.</p></> },
    ],
  },
  {
    id: paths.faq.sections.handoff, number: '05', title: 'Handoff & quality', questions: [
      { question: 'How does a design reach developer handoff?', answer: <><p>Export a selected element, a whole page, or all pages. For reusable web components, the React export turns the edited structure into a module developers can inspect and integrate.</p><p>The <a href={paths.routes.kit}>Kit Playground</a> offers a focused handoff for Kit components, including package, import, and module guidance.</p></> },
      { question: 'What is the difference between Copy Code and Copy pack?', answer: <><p>Copy Code copies the generated module. Copy pack adds integration context: the Kit dependency, install and import notes, available token CSS values, and the module itself.</p><p>It gives developers a concrete starting point; it does not commit or release code to another repository automatically.</p></> },
      { question: 'What do Preflight and “Ready for eng” check?', answer: <><p>Before handoff, the editor checks issues such as missing image descriptions, unlabeled buttons, contrast, touch target size, tab order, and missing token bindings. “Ready for eng” reports blockers for the selected export scope.</p><p>A clear status means these automated checks found no blockers. It does not replace a full accessibility test, code review, product test, or approval in the target app.</p></> },
      { question: 'How do I use a component in another project?', answer: <><p>The React handoff is the starting point. Developers take the module into the target project, set up Kit imports and token values, and connect the component to the app’s data, routing, and quality rules.</p><p>A Zaoly master does not become a live-synced master in every project. Design changes need a new handoff and review in the target system.</p></> },
      { question: 'Which output formats are available?', answer: <><p>The editor offers React as well as other views, including Tailwind-oriented HTML, SwiftUI, HTML, and scene JSON. These serve different handoff and review needs; React is the primary path for reusable Kit components in web products.</p><p>Other frameworks do not automatically receive the same ready-to-use module. Teams may need to adapt the output to their own component contracts and runtime.</p></> },
    ],
  },
  {
    id: paths.faq.sections.access, number: '06', title: 'Access & operations', questions: [
      { question: 'How do I get access?', answer: <><p>Create an account yourself on the <a href={paths.routes.register}>registration page</a> with email and password, or — when configured — with Google. You then continue into the editor. Existing accounts use <a href={paths.routes.login}>Sign in</a>.</p><p>Admins can still share invitation links. Automatic email delivery for invites is optional and not required for self-registration.</p></> },
      { question: 'Who can change tokens?', answer: <><p>Admins can edit and import the local token pack. Signed-in users can use its values in the editor; bound components pick up current values when those values are loaded.</p><p>Composition roles (owner, editor, viewer) are separate from the admin role for pack management.</p></> },
      { question: 'How are designs stored?', answer: <><p>Zaoly saves compositions as structured documents containing pages, layers, masters, and comments. The standard multi-user setup uses its own database; local development and tests also support a file fallback.</p><p>This describes product storage, not a promise of specific availability, automatic backups, or syncing with external applications.</p></> },
    ],
  },
]

export const faqTopics = faqTopicsDe
export function faqTopicsForLocale(locale: 'de' | 'en'): FaqTopic[] {
  return locale === 'de' ? faqTopicsDe : faqTopicsEn
}
