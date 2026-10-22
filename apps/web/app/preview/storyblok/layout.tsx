import type { ReactNode } from 'react'
import '@zaoly/site-kit/styles.css'

/** Minimal chrome for Storyblok iframe preview — no AppShell. Spec: storyblok-preview.md */
export default function StoryblokPreviewLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
