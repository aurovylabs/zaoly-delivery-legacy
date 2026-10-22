import {
  IconOverview,
  IconProjects,
  IconGrid,
  IconScroll,
  IconMessage,
  IconCode,
} from '../lib/zaoly-ui'

const navSize = 20

export function NavIconOverview() {
  return <IconOverview size={navSize} />
}

export function NavIconProjects() {
  return <IconProjects size={navSize} />
}

export function NavIconCompositions() {
  return <IconGrid size={navSize} />
}

export function NavIconLibrary() {
  return <IconScroll size={navSize} />
}

export function NavIconKit() {
  return <IconCode size={navSize} />
}

export function NavIconAssistant() {
  return <IconMessage size={navSize} />
}
