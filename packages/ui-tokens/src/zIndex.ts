/** Stacking scale — Layer 0 web-system. */
export const zIndex = {
  dropdown: 1000,
  sticky: 1100,
  /** Floating NavRail — above sticky page chrome, below modal/dialog overlays. */
  navRail: 1200,
  modal: 1400,
  popover: 1500,
  toast: 1600,
} as const

export type ZIndexToken = keyof typeof zIndex
