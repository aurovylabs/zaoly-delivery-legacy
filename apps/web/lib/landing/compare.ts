/**
 * Landing comparison — pros/cons per tool, optimistic on Zaoly’s job.
 * knowledge/zaoly-competitive-positioning.md · specs/domain/zaoly-landingpage-concept.md V20
 */

export type CompareToolId = 'zaoly' | 'figma' | 'framer' | 'penpot' | 'sketch' | 'webflow'

export type CompareLocaleLine = { de: string; en: string }

export type CompareProfile = {
  id: CompareToolId
  name: string
  /** Short job line under the name */
  job: CompareLocaleLine
  pros: CompareLocaleLine[]
  cons: CompareLocaleLine[]
  /** Optimistic “pick when…” for the visitor */
  pickWhen: CompareLocaleLine
  highlight?: boolean
}

export const COMPARE_PROFILES: readonly CompareProfile[] = [
  {
    id: 'zaoly',
    name: 'Zaoly',
    highlight: true,
    job: {
      de: 'Web-UI → wiederverwendbare React-Komponente',
      en: 'Web UI → reusable React component',
    },
    pros: [
      {
        de: 'Visuelles Gestalten landet als React-Modul + Tokens in eurem Code — weniger Nachbau.',
        en: 'Visual work lands as a React module + tokens in your codebase — less rebuilding.',
      },
      {
        de: 'Kit-Atome, lokales Token Studio und Breakpoint-Compare sind Produktkern, nicht Plugin.',
        en: 'Kit atoms, local Token Studio, and breakpoint compare are product core — not a plugin.',
      },
      {
        de: 'Community-Source und Self-Host: ihr behaltet Kontrolle über Stack und Betrieb.',
        en: 'Community source and self-host: you keep control of stack and operations.',
      },
      {
        de: 'Kein Site-Hosting-Lock-in — der Baustein lebt in eurem Produkt weiter.',
        en: 'No site-hosting lock-in — the building block keeps living in your product.',
      },
    ],
    cons: [
      {
        de: 'Kein Figma-Maßstab an Multiplayer und Plugin-Ökosystem — bewusst Fokus auf den Baustein.',
        en: 'Not Figma-scale multiplayer or plugin ecosystem — deliberate focus on the building block.',
      },
      {
        de: 'Publiziert keine Marketing-URL für euch — Integration in euer Produkt bleibt der Schritt.',
        en: 'Doesn’t publish a marketing URL for you — integrating into your product stays the step.',
      },
      {
        de: 'Kein CMS/Commerce — dafür klarer Weg Design → Komponente für Enterprise-Web.',
        en: 'No CMS/commerce — instead a clear path from design → component for enterprise web.',
      },
    ],
    pickWhen: {
      de: 'Wenn Design und Entwicklung denselben React-Baustein brauchen — nicht nur Specs oder eine Site.',
      en: 'When design and engineering need the same React building block — not just specs or a site.',
    },
  },
  {
    id: 'figma',
    name: 'Figma',
    job: {
      de: 'UI design, Collaboration, Inspect/Dev Mode',
      en: 'UI design, collaboration, Inspect/Dev Mode',
    },
    pros: [
      {
        de: 'Marktführer für kollaboratives UI-Design und Prototyping.',
        en: 'Market leader for collaborative UI design and prototyping.',
      },
      {
        de: 'Dev Mode und Ökosystem liefern Specs, Assets und Agent-Anbindung.',
        en: 'Dev Mode and ecosystem deliver specs, assets, and agent hooks.',
      },
    ],
    cons: [
      {
        de: 'Ergebnis bleibt oft Spec/Snippet — die echte Produktkomponente wird danach neu gebaut.',
        en: 'Outcome is often still a spec/snippet — the real product component gets rebuilt afterward.',
      },
      {
        de: 'Geschlossenes Produkt; euer Code und euer Hosting bleiben getrennte Welten.',
        en: 'Closed product; your code and hosting stay separate worlds.',
      },
    ],
    pickWhen: {
      de: 'Wenn ihr zuerst breit entwerfen und kollaborieren wollt — und Handoff als Spec akzeptiert.',
      en: 'When you want to design and collaborate broadly first — and accept handoff as specs.',
    },
  },
  {
    id: 'framer',
    name: 'Framer',
    job: {
      de: 'Design ist die veröffentlichte Website',
      en: 'Design is the published website',
    },
    pros: [
      {
        de: 'Sehr schnell von Canvas zu einer polierten, gehosteten Site.',
        en: 'Very fast from canvas to a polished, hosted site.',
      },
      {
        de: 'Starke Motion und Marketing-Ästhetik out of the box.',
        en: 'Strong motion and marketing aesthetics out of the box.',
      },
    ],
    cons: [
      {
        de: 'Optimiert für die Framer-Site — nicht für React-Bausteine in eurem Produktcode.',
        en: 'Optimized for the Framer site — not React building blocks in your product code.',
      },
      {
        de: 'Hosting und Plattformbindung sind Teil des Deals.',
        en: 'Hosting and platform lock-in are part of the deal.',
      },
    ],
    pickWhen: {
      de: 'Wenn die Website selbst das Produkt ist — Landing, Portfolio, Kampagne.',
      en: 'When the website itself is the product — landing, portfolio, campaign.',
    },
  },
  {
    id: 'penpot',
    name: 'Penpot',
    job: {
      de: 'Open-source Design + SVG/CSS Inspect',
      en: 'Open-source design + SVG/CSS inspect',
    },
    pros: [
      {
        de: 'Echt open source und self-hostbar — volle Datenkontrolle.',
        en: 'Truly open source and self-hostable — full data control.',
      },
      {
        de: 'Web-nahe Inspect-Formate (SVG/CSS) ohne proprietäre Datei.',
        en: 'Web-native inspect formats (SVG/CSS) without a proprietary file.',
      },
    ],
    cons: [
      {
        de: 'Bleibt ein Design-/Inspect-Tool — kein React-Kit- und Token-Handoff in euer Produkt.',
        en: 'Remains a design/inspect tool — not a React kit and token handoff into your product.',
      },
      {
        de: 'Ökosystem und Enterprise-Workflows sind schmaler als bei Figma.',
        en: 'Ecosystem and enterprise workflows are narrower than Figma’s.',
      },
    ],
    pickWhen: {
      de: 'Wenn offenes Design und Self-Host Priorität haben — und Code-Export sekundär ist.',
      en: 'When open design and self-host are the priority — and code export is secondary.',
    },
  },
  {
    id: 'sketch',
    name: 'Sketch',
    job: {
      de: 'Mac-native UI design + Libraries',
      en: 'Mac-native UI design + libraries',
    },
    pros: [
      {
        de: 'Schnelle, fokussierte Mac-App für erfahrene UI-Teams.',
        en: 'Fast, focused Mac app for experienced UI teams.',
      },
      {
        de: 'Stabile Libraries und etablierte Mac-Workflows.',
        en: 'Solid libraries and established Mac workflows.',
      },
    ],
    cons: [
      {
        de: 'Mac-only und schwächere Live-Collaboration als browserbasierte Tools.',
        en: 'Mac-only and weaker live collaboration than browser-based tools.',
      },
      {
        de: 'Handoff hängt an Plugins/Specs — nicht an eurem React-Baustein.',
        en: 'Handoff leans on plugins/specs — not your React building block.',
      },
    ],
    pickWhen: {
      de: 'Wenn euer Team bereits tief in Sketch auf dem Mac verwurzelt ist.',
      en: 'When your team is already deeply rooted in Sketch on the Mac.',
    },
  },
  {
    id: 'webflow',
    name: 'Webflow',
    job: {
      de: 'Visual site builder + CMS / Commerce',
      en: 'Visual site builder + CMS / commerce',
    },
    pros: [
      {
        de: 'Starkes CMS und Commerce — Inhalte und Shop ohne separates Backend.',
        en: 'Strong CMS and commerce — content and shop without a separate backend.',
      },
      {
        de: 'Visuell bauen und direkt hosten oder exportieren.',
        en: 'Build visually and host or export directly.',
      },
    ],
    cons: [
      {
        de: 'Die Site ist das System — nicht eure Produkt-React-Komponenten.',
        en: 'The site is the system — not your product React components.',
      },
      {
        de: 'Plattform- und Hosting-Bindung; Enterprise-Code-Reuse ist nicht der Kern.',
        en: 'Platform and hosting lock-in; enterprise code reuse isn’t the core.',
      },
    ],
    pickWhen: {
      de: 'Wenn CMS, Commerce und eine gehostete Marketing-Site das Ziel sind.',
      en: 'When CMS, commerce, and a hosted marketing site are the goal.',
    },
  },
] as const

/** Zaoly first, then peers — for optimistic scanning. */
export const COMPARE_TOOLS = COMPARE_PROFILES.map((profile) => ({
  id: profile.id,
  name: profile.name,
  highlight: profile.highlight,
}))
