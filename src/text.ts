import type { DrillKind } from './cube/drills'
import type { Drill } from './composables/usePractice'

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** A drill's level in a few words: "2 moves" to undo, "2 petals" or "full scramble" for the lily and the cross. */
export const levelName = (kind: DrillKind, level: number) =>
  kind === 'undo' ? plural(level, 'move') : level === (kind === 'lily' ? 4 : 5) ? 'full scramble' : plural(level, 'petal')

export const drillTitle = (d: Drill) =>
  d.kind === 'undo' ? `Undo ${levelName('undo', d.level)}` : `${d.kind === 'lily' ? 'White lily' : 'White cross'} · ${levelName(d.kind, d.level)}`

/** What the player has done once the drill's goal is reached. */
export const doneTitle = (d: Drill) => `${{ undo: 'Solved', lily: 'Lily', cross: 'Cross' }[d.kind]} in ${plural(d.moves, 'move')}`
