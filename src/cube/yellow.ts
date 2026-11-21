import { applyMove, applyMoves, faceOf, inverse, pieceSlots, sameMove, SLOTS, type CubeState, type Face, type Move } from 'flatcube'
import { isTwoLayers, middleHint } from './middle'

/**
 * The yellow cross: with the first two layers done, the four edges of the yellow face with yellow on top. Their places
 * round the sides don't matter yet; that is the next step. Yellow is U on the cube, white D.
 *
 * The routine: six turns worked from one side, that side, the side to its right, yellow, the right side back, yellow
 * back, that side back. The yellow edges facing up only ever make a dot (none), an L (two next to each other), a line
 * (two across) or the cross. Worked from the right side, a dot becomes an L, an L a line and a line the cross, so the
 * shape says how many goes are left. No yellow turn is needed to line a shape up: any side can be the one worked from.
 */

const SIDES: Face[] = ['F', 'R', 'B', 'L']
// the side to the right of each side, looking at it from outside with U up, and the side opposite
const RIGHT: Record<Face, Face> = { F: 'R', R: 'B', B: 'L', L: 'F', U: 'U', D: 'D' }
const LEFT: Record<Face, Face> = { F: 'L', L: 'B', B: 'R', R: 'F', U: 'U', D: 'D' }
const OPPOSITE: Record<Face, Face> = { F: 'B', B: 'F', R: 'L', L: 'R', U: 'D', D: 'U' }

// for each side, the slot on U of the yellow edge next to it
const TOP = Object.fromEntries(SIDES.map(x => [x, SLOTS.find(s =>
  s.face === 'U' && pieceSlots(s.index).length === 2 && pieceSlots(s.index).some(o => SLOTS[o].face === x))!.index])) as Record<Face, number>

const turn = (layer: Face, amount: Move['amount'] = 1): Move => ({ layer, amount })

/** The six turns worked from side `x`. */
export const routine = (x: Face): Move[] =>
  [turn(x), turn(RIGHT[x]), turn('U'), turn(RIGHT[x], 3), turn('U', 3), turn(x, 3)]

/** The sides whose yellow edge has yellow on top. */
const up = (state: CubeState) => SIDES.filter(x => faceOf(state[TOP[x]]) === 'U')

export type Shape = 'dot' | 'L' | 'line' | 'cross'

/** The shape the yellow edges facing up make. */
export function shape(state: CubeState): Shape {
  const sides = up(state)
  if (sides.length === 4) return 'cross'
  if (!sides.length) return 'dot'
  return OPPOSITE[sides[0]] === sides[1] ? 'line' : 'L'
}

/** How many goes of six turns a shape is from the cross. */
export const GOES: Record<Shape, number> = { dot: 3, L: 2, line: 1, cross: 0 }

/** The first two layers done and the yellow cross on top. */
export const isYellowCross = (state: CubeState) => isTwoLayers(state) && shape(state) === 'cross'

/**
 * The side to work from, for a shape that isn't the cross: for a line, a side it runs alongside, left to right; for an
 * L, the side that has one arm on the far side and the other on its left; for a dot, any side.
 */
function side(state: CubeState): Face {
  const sides = up(state)
  if (shape(state) === 'line') return SIDES.find(x => sides.includes(RIGHT[x]) && sides.includes(LEFT[x]))!
  if (shape(state) === 'L') return SIDES.find(x => sides.includes(OPPOSITE[x]) && sides.includes(LEFT[x]))!
  return 'F'
}

/**
 * The next turn of six begun from the first two layers, if the last turns are their start. `recent` are the last
 * turns as made, newest last.
 */
function inProgress(state: CubeState, recent: readonly Move[]): Move | null {
  for (let k = Math.min(5, recent.length); k > 0; k--) {
    const tail = recent.slice(-k)
    const before = applyMoves(state, [...tail].reverse().map(inverse))
    if (!isTwoLayers(before) || shape(before) === 'cross') continue
    const moves = routine(side(before))
    if (tail.every((move, j) => sameMove(move, moves[j]))) return moves[k]
  }
  return null
}

/**
 * The next quarter turn of the routine, or null once the yellow cross is made. `recent` are the player's last turns
 * (five are enough), so six turns begun are finished. Without the first two layers it is the middle layer's hint,
 * which makes them first.
 */
export function yellowHint(state: CubeState, recent: readonly Move[] = []): Move | null {
  if (isYellowCross(state)) return null
  const going = inProgress(state, recent)
  if (going) return going
  return isTwoLayers(state) ? routine(side(state))[0] : middleHint(state, recent)
}

/** How many turns it takes to follow `yellowHint` from here to the yellow cross. */
export function yellowTurns(state: CubeState) {
  let turns = 0, recent: Move[] = []
  for (let move = yellowHint(state); move; move = yellowHint(state, recent)) {
    state = applyMove(state, move)
    recent = [...recent, move].slice(-7)
    turns++
  }
  return turns
}

// the shape each level starts from; the last level is any shape but the cross
const LEVEL_SHAPE: Record<number, Shape | null> = { 1: 'line', 2: 'L', 3: 'dot', 4: null }

/**
 * A yellow cross puzzle from a full scramble: it makes the first two layers, then takes the shape for `level` (1 a
 * line, 2 an L, 3 a dot, 4 any shape but the cross), working the routine from random sides and turning yellow at
 * random until it has it.
 */
export function yellowPuzzle(scrambled: () => CubeState, level: number, random = Math.random): CubeState {
  const wanted = LEVEL_SHAPE[level]
  for (;;) {
    let state = scrambled(), recent: Move[] = []
    for (let move = middleHint(state); move; move = middleHint(state, recent)) {
      state = applyMove(state, move)
      recent = [...recent, move].slice(-7)
    }
    for (let tries = 0; tries < 20; tries++) {
      const now = shape(state)
      if (wanted ? now === wanted : now !== 'cross') return state
      state = applyMoves(state, routine(SIDES[Math.floor(random() * 4)]))
      state = applyMove(state, turn('U', (1 + Math.floor(random() * 3)) as Move['amount']))
    }
  }
}
