import { applyMove, applyMoves, faceOf, inverse, pieceSlots, sameMove, SLOTS, type CubeState, type Face, type Move } from 'flatcube'
import { isYellowCross, yellowHint } from './yellow'

/**
 * The yellow edges: with the yellow cross made, each yellow edge's other colour on the side of that colour. The
 * corners don't matter yet. Yellow is U on the cube, white D.
 *
 * The routine: turn yellow until two edges match their sides. Two next to each other: work from the side that has one
 * of them opposite it and the other on its right, with nine turns: the right side, yellow, the right side back, yellow,
 * the right side, yellow twice, the right side back, yellow. That puts all four in. Two across: the same nine turns
 * from any side leave a pair next to each other to find with yellow. If yellow alone lines all four up, it is only a
 * yellow turn.
 */

const SIDES: Face[] = ['F', 'R', 'B', 'L']
// the side to the right of each side, looking at it from outside with U up, and the side opposite
const RIGHT: Record<Face, Face> = { F: 'R', R: 'B', B: 'L', L: 'F', U: 'U', D: 'D' }
const OPPOSITE: Record<Face, Face> = { F: 'B', B: 'F', R: 'L', L: 'R', U: 'D', D: 'U' }

// for each side, its sticker on the yellow edge next to it
const SIDE = Object.fromEntries(SIDES.map(x => [x, SLOTS.find(s =>
  s.face === x && pieceSlots(s.index).length === 2 && pieceSlots(s.index).some(o => SLOTS[o].face === 'U'))!.index])) as Record<Face, number>

const turn = (layer: Face, amount: Move['amount'] = 1): Move => ({ layer, amount })

/** The nine turns worked from side `x`, the double yellow turn as two quarters so the hint can draw each. */
export const routine = (x: Face): Move[] => {
  const r = RIGHT[x]
  return [turn(r), turn('U'), turn(r, 3), turn('U'), turn(r), turn('U'), turn('U'), turn(r, 3), turn('U')]
}

/** The sides whose yellow edge matches them. */
const matching = (state: CubeState) => SIDES.filter(x => faceOf(state[SIDE[x]]) === x)

/** `n` yellow quarter turns applied to `state`. */
const yellowTurned = (state: CubeState, n: number) => applyMoves(state, Array.from({ length: n }, () => turn('U')))

export type Order = 'lined' | 'next' | 'across'

/**
 * How far the yellow edges are from home, whatever yellow's turn: 'lined' if yellow alone lines all four up, 'next' if
 * it can make a pair next to each other match, else 'across' (only a pair across ever matches).
 */
export function order(state: CubeState): Order {
  const counts = [0, 1, 2, 3].map(n => matching(yellowTurned(state, n)))
  if (counts.some(m => m.length === 4)) return 'lined'
  return counts.some(m => m.length === 2 && OPPOSITE[m[0]] !== m[1]) ? 'next' : 'across'
}

/** How many goes of nine turns an order is from home. */
export const GOES: Record<Order, number> = { lined: 0, next: 1, across: 2 }

/** The first two layers, the yellow cross and every yellow edge on its own side. */
export const isYellowEdges = (state: CubeState) => isYellowCross(state) && matching(state).length === 4

/**
 * The sides the nine turns may be worked from as things stand, with no yellow turn first: for a pair next to each
 * other the one side with them opposite and on its right; for a pair across, any side; else none.
 */
function sides(state: CubeState): Face[] {
  const m = matching(state)
  if (m.length !== 2) return []
  if (OPPOSITE[m[0]] === m[1]) return SIDES
  return SIDES.filter(x => m.includes(RIGHT[x]) && m.includes(OPPOSITE[x]))
}

/**
 * The yellow turn that lines the edges up best, the shorter way: all four if yellow alone can, else the nearest pair
 * next to each other, else the nearest pair across. Null if they're already as good as they get.
 */
function yellowTurn(state: CubeState): Move | null {
  const at = [0, 1, 2, 3].map(n => matching(yellowTurned(state, n)))
  const good = [
    (m: Face[]) => m.length === 4,
    (m: Face[]) => m.length === 2 && OPPOSITE[m[0]] !== m[1],
    (m: Face[]) => m.length === 2,
  ]
  for (const test of good) {
    const n = [0, 1, 3, 2].find(n => test(at[n]))
    if (n !== undefined) return n === 0 ? null : turn('U', n === 3 ? 3 : 1)
  }
  return null
}

/**
 * The next turn of nine begun from the yellow cross, if the last turns are their start. `recent` are the last turns as
 * made, newest last.
 */
function inProgress(state: CubeState, recent: readonly Move[]): Move | null {
  for (let k = Math.min(8, recent.length); k > 0; k--) {
    const tail = recent.slice(-k)
    const before = applyMoves(state, [...tail].reverse().map(inverse))
    if (!isYellowCross(before) || isYellowEdges(before)) continue
    for (const x of sides(before)) {
      const moves = routine(x)
      if (tail.every((move, j) => sameMove(move, moves[j]))) return moves[k]
    }
  }
  return null
}

/**
 * The next quarter turn of the routine, or null once the yellow edges are home. `recent` are the player's last turns
 * (eight are enough), so nine turns begun are finished. Without the yellow cross it is the yellow cross's hint, which
 * makes it first.
 */
export function edgesHint(state: CubeState, recent: readonly Move[] = []): Move | null {
  if (isYellowEdges(state)) return null
  const going = inProgress(state, recent)
  if (going) return going
  if (!isYellowCross(state)) return yellowHint(state, recent)
  const lineUp = yellowTurn(state)
  if (lineUp) return lineUp
  return routine(sides(state)[0])[0]
}

/** How many turns it takes to follow `edgesHint` from here to the yellow edges home. */
export function edgesTurns(state: CubeState) {
  let turns = 0, recent: Move[] = []
  for (let move = edgesHint(state); move; move = edgesHint(state, recent)) {
    state = applyMove(state, move)
    recent = [...recent, move].slice(-9)
    turns++
  }
  return turns
}

// the order each level starts from; the last level is either
const LEVEL_ORDER: Record<number, Order | null> = { 1: 'next', 2: 'across', 3: null }

/**
 * A yellow edges puzzle from a full scramble: it makes the yellow cross, then takes the order for `level` (1 a pair
 * next to each other, 2 a pair across, 3 either), working the routine from random sides until it has it, and turns
 * yellow at random so the pair has to be found.
 */
export function edgesPuzzle(scrambled: () => CubeState, level: number, random = Math.random): CubeState {
  const wanted = LEVEL_ORDER[level]
  for (;;) {
    let state = scrambled(), recent: Move[] = []
    for (let move = yellowHint(state); move; move = yellowHint(state, recent)) {
      state = applyMove(state, move)
      recent = [...recent, move].slice(-7)
    }
    for (let tries = 0; tries < 20; tries++) {
      const now = order(state)
      if (wanted ? now === wanted : now !== 'lined') return yellowTurned(state, Math.floor(random() * 4))
      state = applyMoves(state, routine(SIDES[Math.floor(random() * 4)]))
      state = yellowTurned(state, Math.floor(random() * 4))
    }
  }
}
