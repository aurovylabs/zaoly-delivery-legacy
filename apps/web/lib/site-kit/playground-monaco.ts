/**
 * Monaco setup for Kit Playground TSX (SK-V9).
 * Spec: `specs/domain/site-kit-playground.md`
 */
import type { Monaco } from '@monaco-editor/react'

/** Silence missing-module / JSX false positives; enable React JSX emit for highlighting. */
export function configurePlaygroundMonaco(monaco: Monaco): void {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
  })
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: true,
  })
}

export const PLAYGROUND_MONACO_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 13,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'off' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  formatOnPaste: true,
  renderLineHighlight: 'line' as const,
  smoothScrolling: true,
  padding: { top: 8, bottom: 8 },
}
