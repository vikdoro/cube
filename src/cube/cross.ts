import { applyMove, FACES, faceOf, permutation, pieceSlots, SLOTS, type CubeState, type Move } from '@tadacube/engine'
import { lilyHint, petals } from './lily'

/**
 * The white cross: the four white edges on the white face, each on the side of its own colour. It finishes the first
 * step of the beginner method, and only the four white edges matter for it. Yellow is U on the cube, white D, and the
 * sides are F, R, B and L.
 *
 * The routine: turn U until a petal's second colour is over the side of that colour, then turn that side twice. A
 * position where every white edge is home or a petal is "settled"; the routine works from settled positions.
 */

const QUARTER_TURNS: Move[] = FACES.flatMap(layer => [{ layer, amount: 1 }, { layer, amount: 3 }] as Move[])

// the white edges as their white sticker ids, and each one's other sticker
const WHITE_EDGES = SLOTS.filter(s => s.face === 'D' && pieceSlots(s.index).length === 2).map(s => s.index)
const OTHER = WHITE_EDGES.map(id => pieceSlots(id).find(slot => slot !== id)!)

const EDGE_SLOTS = SLOTS.filter(s => pieceSlots(s.index).length === 2).map(s => s.index)
const PETAL_SLOTS = EDGE_SLOTS.filter(slot => SLOTS[slot].face === 'U')

const isHome = (state: CubeState, i: number) => state[WHITE_EDGES[i]] === WHITE_EDGES[i] && state[OTHER[i]] === OTHER[i]
const isPetal = (state: CubeState, i: number) => SLOTS[state.indexOf(WHITE_EDGES[i])].face === 'U'
const isMatched = (state: CubeState, i: number) => SLOTS[state.indexOf(OTHER[i])].face === faceOf(OTHER[i])

const edges = [0, 1, 2, 3]

/** How many white edges are home, in both stickers' own slots. */
export const dropped = (state: CubeState) => edges.filter(i => isHome(state, i)).length

/** The four white edges are home. */
export const isCross = (state: CubeState) => dropped(state) === 4

/** Every white edge is home or a petal. */
export const isSettled = (state: CubeState) => edges.every(i => isHome(state, i) || isPetal(state, i))

// where the white edges sit, as one number: each white sticker's place among the 24 edge slots, in base 24
const EDGE_INDEX = EDGE_SLOTS.reduce((index, slot, i) => { index[slot] = i; return index }, new Uint8Array(54))
const keyOf = (slots: readonly number[]) => slots.reduce((k, slot) => k * 24 + EDGE_INDEX[slot], 0)
const positionOf = (state: CubeState) => keyOf(WHITE_EDGES.map(id => state.indexOf(id)))

let table: Uint8Array | null = null

/**
 * Quarter turns away from a settled position of every way the white edges can lie: 190 080 of them, found by one
 * search outwards from the 209 settled ones. Built on first use, not at load.
 */
function distances() {
  if (table) return table
  const dist = new Uint8Array(24 ** 4).fill(255)
  let frontier: number[] = []
  const place = (i: number, slots: number[]) => {
    if (i === 4) { const key = keyOf(slots); dist[key] = 0; frontier.push(key); return }
    for (const slot of [WHITE_EDGES[i], ...PETAL_SLOTS]) if (!slots.includes(slot)) place(i + 1, [...slots, slot])
  }
  place(0, [])
  // each quarter turn as a map of edge places, so the search below needs no arrays
  const moves = QUARTER_TURNS.map(move => EDGE_SLOTS.map(slot => EDGE_INDEX[permutation(move)[slot]]))
  for (let d = 1; frontier.length; d++) {
    const next: number[] = []
    for (const key of frontier) {
      for (const to of moves) {
        const k = to[Math.floor(key / 13824)] * 13824 + to[Math.floor(key / 576) % 24] * 576 + to[Math.floor(key / 24) % 24] * 24 + to[key % 24]
        if (dist[k] === 255) { dist[k] = d; next.push(k) }
      }
    }
    frontier = next
  }
  return table = dist
}

/** The fewest quarter turns to a settled position. */
export const settleDistance = (state: CubeState) => isSettled(state) ? 0 : distances()[positionOf(state)]

/**
 * The next quarter turn of the routine, or null once the cross is made. From a settled position: a quarter turn of a
 * matched petal's side (always the same way round), else of U towards the nearest match. Otherwise: a turn that gets
 * one closer to a settled position, preferring one that brings an edge home, so a drop begun is finished.
 */
export function crossHint(state: CubeState): Move | null {
  if (isCross(state)) return null
  if (isSettled(state)) {
    const matched = edges.find(i => isPetal(state, i) && isMatched(state, i))
    if (matched !== undefined) return { layer: faceOf(OTHER[matched]), amount: 1 }
    const turned = (amount: 1 | 3): Move => ({ layer: 'U', amount })
    const turnsTo = (move: Move) => edges.some(i => isPetal(applyMove(state, move), i) && isMatched(applyMove(state, move), i))
    return turnsTo(turned(1)) ? turned(1) : turnsTo(turned(3)) ? turned(3) : turned(1)
  }
  const d = settleDistance(state), home = dropped(state)
  const closer = QUARTER_TURNS.map(move => applyMove(state, move))
    .map((next, i) => ({ move: QUARTER_TURNS[i], next }))
    .filter(({ next }) => settleDistance(next) === d - 1)
  return (closer.find(({ next }) => dropped(next) > home) ?? closer[0]).move
}

/** How many turns it takes to follow `crossHint` from here to the cross. */
export function routineTurns(state: CubeState) {
  let turns = 0
  for (let move = crossHint(state); move; move = crossHint(state)) { state = applyMove(state, move); turns++ }
  return turns
}

/**
 * A cross puzzle from a full scramble: with `toDrop` 1–4 it makes the lily, then follows the routine until that many
 * petals are left to drop (4 is the lily itself); with 5 it is the scramble as it is. Never a made cross.
 */
export function crossPuzzle(scrambled: () => CubeState, toDrop: number): CubeState {
  for (;;) {
    let state = scrambled()
    if (isCross(state)) continue
    if (toDrop === 5) return state
    for (let move = lilyHint(state); move; move = lilyHint(state)) state = applyMove(state, move)
    for (; !isCross(state); state = applyMove(state, crossHint(state)!)) {
      if (isSettled(state) && petals(state) === toDrop) return state
    }
  }
}
