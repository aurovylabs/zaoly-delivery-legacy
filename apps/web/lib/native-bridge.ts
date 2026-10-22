import type { CompositionScene } from '@zaoly/contracts'

export type CreationNativeCommand =
  | { type: 'zoom_in' }
  | { type: 'zoom_out' }
  | { type: 'zoom_reset' }
  | { type: 'zoom_fit' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'delete' }
  | { type: 'duplicate' }
  | { type: 'select_all' }
  | { type: 'toggle_inspector' }
  | { type: 'toggle_layers' }
  | { type: 'load_scene'; scene: CompositionScene }
  | { type: 'request_scene_export' }

export type CreationNativeEvent =
  | {
      type: 'scene_updated'
      sceneId: string
      name: string
      dirty: boolean
      selectedId: string | null
      selectedIds: string[]
      scene: CompositionScene
    }
  | {
      type: 'editor_ready'
      version: string
    }

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        creationNative?: {
          postMessage: (message: CreationNativeEvent) => void
        }
      }
    }
    __ZAOLY_NATIVE_BRIDGE__?: {
      dispatchCommand: (cmd: CreationNativeCommand) => void
    }
  }
}

export function isRunningInNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(window.webkit?.messageHandlers?.creationNative)
}

export function notifyNativeApp(event: CreationNativeEvent): void {
  if (typeof window === 'undefined') return
  try {
    window.webkit?.messageHandlers?.creationNative?.postMessage(event)
  } catch (err) {
    console.warn('[CreationNativeBridge] Failed to post message to native host', err)
  }
}
