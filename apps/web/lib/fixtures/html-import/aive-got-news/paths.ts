/**
 * AI've Got News — canonical paths & brand literals.
 * Knowledge: knowledge/aive-got-news-newsletter.md
 * Fixtures: apps/web/lib/fixtures/html-import/aive-got-news/
 *
 * Replace `#…` hrefs with live internal URLs before Listmonk send.
 * Do not invent FQDNs in HTML — keep them here.
 */
export const aiveGotNewsPaths = {
  fixturesDir: 'apps/web/lib/fixtures/html-import/aive-got-news',
  issue01CreationHtml: 'apps/web/lib/fixtures/html-import/aive-got-news/issue-01.html',
  listmonkTemplate: 'apps/web/lib/fixtures/html-import/aive-got-news/listmonk-template.html',
  listmonkBodyIssue01: 'apps/web/lib/fixtures/html-import/aive-got-news/listmonk-body-issue-01.html',
  sectionPattern: 'apps/web/lib/fixtures/html-import/aive-got-news/section-pattern.html',
  knowledge: 'knowledge/aive-got-news-newsletter.md',
  designerBrief:
    'attachments/AIveGotNews_Designer_Brief.md (Cursor chat) · Listmonk HTML email',
  /** Anchor keys used in fixtures until live URLs are confirmed */
  anchors: {
    linkHub: '#link-hub',
    udg4all: '#udg4all',
    teamsChannel: '#teams-channel',
    seedsForm: '#seeds-form',
    seedsPipeline: '#seeds-pipeline',
    skillsGuide: '#skills-guide',
    baseline: '#baseline',
    profileSkill: '#profile-skill',
  },
  /**
   * Operator-filled live URLs (leave empty until Caro confirms).
   * When set, swap anchors in template/body before deploy.
   */
  liveUrls: {
    linkHub: '',
    udg4all: '',
    teamsChannel: '',
    seedsForm: '',
    seedsPipeline: '',
  },
  brand: {
    paper: '#f8f6f0',
    paper2: '#ffffff',
    ink: '#0f172a',
    inkSoft: '#334155',
    muted: '#64748b',
    line: '#e2e0d8',
    accent: '#1f44ff',
    blue: '#3080ff',
    green: '#00ca55',
    pink: '#d5108a',
    wash: '#efeee9',
    sectionTitle: '#000000',
  },
  listmonk: {
    messageUrlTag: '{{ MessageURL }}',
    unsubscribeUrlTag: '{{ UnsubscribeURL }}',
    trackViewTag: '{{ TrackView }}',
    contentSlot: '{{ template "content" . }}',
  },
  issue01: {
    number: '01',
    dateLabel: '16 September 2026',
    dateShort: '16 Sep 2026',
  },
} as const

export type AiveGotNewsPaths = typeof aiveGotNewsPaths
