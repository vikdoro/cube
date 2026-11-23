import type { DrillKind } from './cube/drills'
import type { Drill } from './composables/usePractice'

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const TITLES: Record<DrillKind, string> = {
  lily: 'White lily', cross: 'White cross', corners: 'White corners', middle: 'Middle layer', yellow: 'Yellow cross', edges: 'Yellow edges',
}

export const drillTitle = (d: Drill) => TITLES[d.kind]

/** What the player has done once the drill's goal is reached. */
export const doneTitle = (d: Drill) => `${{ lily: 'Lily', cross: 'Cross', corners: 'Corners', middle: 'Middle layer', yellow: 'Yellow cross', edges: 'Yellow edges' }[d.kind]} in ${plural(d.moves, 'move')}`
