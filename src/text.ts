import type { DrillKind } from './cube/drills'
import type { Drill } from './composables/usePractice'

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** A drill's level in a few words: "2 moves" to undo, "2 petals" or "full scramble" for the lily. */
export const levelName = (kind: DrillKind, level: number) =>
  kind === 'undo' ? plural(level, 'move') : level === 4 ? 'full scramble' : plural(level, 'petal')

export const drillTitle = (d: Drill) => d.kind === 'undo' ? `Undo ${levelName('undo', d.level)}` : `White lily · ${levelName('lily', d.level)}`

/** What the player has done once the drill's goal is reached. */
export const doneTitle = (d: Drill) => `${d.kind === 'undo' ? 'Solved' : 'Lily'} in ${plural(d.moves, 'move')}`
