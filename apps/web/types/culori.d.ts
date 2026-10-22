declare module 'culori' {
  export interface Color {
    mode: string
    alpha?: number
    [channel: string]: string | number | undefined
  }

  export interface RgbColor extends Color {
    mode: 'rgb'
    r: number
    g: number
    b: number
  }

  export interface OklchColor extends Color {
    mode: 'oklch'
    l: number
    c: number
    h?: number
  }

  export function parse(value: string): Color | undefined
  export function converter(mode: 'rgb'): (color: Color) => RgbColor | undefined
  export function converter(mode: 'oklch'): (color: Color) => OklchColor | undefined
  export function formatRgb(color: Color): string
  export function formatHsl(color: Color): string
}
