/** Scripted walkthrough for the public landing experience stage. */

export type LandingExperienceChapter = 'editor' | 'kit' | 'tokens' | 'screens' | 'path'

export type ExperienceTourFrame =
  | { chapter: 'editor'; step: 'design' | 'system' | 'check' }
  | { chapter: 'kit'; step: 'content' | 'form' | 'media' | 'layout' | 'data' | 'page' }
  | { chapter: 'tokens'; step: 'before' | 'after' }
  | { chapter: 'screens'; step: 'desktop' | 'tablet' | 'mobile' }
  | { chapter: 'path'; step: 'design' | 'system' | 'code' }

/** Compact tour for `/` — fewer beats, same five chapters. */
export const EXPERIENCE_TOUR_COMPACT: ExperienceTourFrame[] = [
  { chapter: 'editor', step: 'design' },
  { chapter: 'editor', step: 'system' },
  { chapter: 'editor', step: 'check' },
  { chapter: 'kit', step: 'content' },
  { chapter: 'kit', step: 'layout' },
  { chapter: 'kit', step: 'page' },
  { chapter: 'tokens', step: 'before' },
  { chapter: 'tokens', step: 'after' },
  { chapter: 'screens', step: 'desktop' },
  { chapter: 'screens', step: 'mobile' },
  { chapter: 'path', step: 'design' },
  { chapter: 'path', step: 'code' },
]

/** Full cinematic tour for deep explore surfaces. */
export const EXPERIENCE_TOUR: ExperienceTourFrame[] = [
  { chapter: 'editor', step: 'design' },
  { chapter: 'editor', step: 'system' },
  { chapter: 'editor', step: 'check' },
  { chapter: 'kit', step: 'content' },
  { chapter: 'kit', step: 'form' },
  { chapter: 'kit', step: 'media' },
  { chapter: 'kit', step: 'layout' },
  { chapter: 'kit', step: 'data' },
  { chapter: 'kit', step: 'page' },
  { chapter: 'tokens', step: 'before' },
  { chapter: 'tokens', step: 'after' },
  { chapter: 'screens', step: 'desktop' },
  { chapter: 'screens', step: 'tablet' },
  { chapter: 'screens', step: 'mobile' },
  { chapter: 'path', step: 'design' },
  { chapter: 'path', step: 'system' },
  { chapter: 'path', step: 'code' },
]

export const EXPERIENCE_TOUR_INTERVAL_MS = 1600
export const EXPERIENCE_TOUR_INTERVAL_REDUCED_MS = 2400
