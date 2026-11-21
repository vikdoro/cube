import type { DrillKind } from './cube/drills'
import type { Drill } from './composables/usePractice'

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// what a drill's level counts, and the level that is a full scramble instead
const COUNTS: Record<Exclude<DrillKind, 'yellow'>, string> = { undo: 'move', lily: 'petal', cross: 'petal', corners: 'corner', middle: 'edge' }
const FULL_SCRAMBLE: Record<Exclude<DrillKind, 'yellow'>, number | null> = { undo: null, lily: 4, cross: 5, corners: 5, middle: 5 }
// the yellow cross counts no pieces: each level is the shape it starts from
const SHAPES = ['a line', 'an L', 'a dot', 'any shape']

/**
 * A drill's level in a few words: "2 moves" to undo, "2 petals", "2 corners", "2 edges" or "full scramble"; for the
 * yellow cross the shape it starts from, "an L" or "any shape".
 */
export const levelName = (kind: DrillKind, level: number) =>
  kind === 'yellow' ? SHAPES[level - 1] : level === FULL_SCRAMBLE[kind] ? 'full scramble' : plural(level, COUNTS[kind])

const TITLES: Record<Exclude<DrillKind, 'undo'>, string> = {
  lily: 'White lily', cross: 'White cross', corners: 'White corners', middle: 'Middle layer', yellow: 'Yellow cross',
}

export const drillTitle = (d: Drill) =>
  d.kind === 'undo' ? `Undo ${levelName('undo', d.level)}` : `${TITLES[d.kind]} · ${levelName(d.kind, d.level)}`

/** What the player has done once the drill's goal is reached. */
export const doneTitle = (d: Drill) => `${{ undo: 'Solved', lily: 'Lily', cross: 'Cross', corners: 'Corners', middle: 'Middle layer', yellow: 'Yellow cross' }[d.kind]} in ${plural(d.moves, 'move')}`
