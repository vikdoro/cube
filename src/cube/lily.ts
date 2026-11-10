import { applyMove, FACES, faceOf, permutation, pieceSlots, SLOTS, type CubeState, type Move } from './model'

/**
 * The white lily: the four white edges around the yellow centre, white facing the same way as the yellow, whatever the
 * corners do. It is the first step of the beginner method, and only the four white edge stickers matter for it.
 * Yellow is U on the cube, white D; face turns never move the centres, so the yellow face is always U.
 */

const QUARTER_TURNS: Move[] = FACES.flatMap(layer => [{ layer, amount: 1 }, { layer, amount: 3 }] as Move[])

// the slots of edge stickers, and the white ones by their sticker ids
const EDGE_SLOTS = SLOTS.filter(s => pieceSlots(s.index).length === 2).map(s => s.index)
const WHITE_EDGES = EDGE_SLOTS.filter(id => faceOf(id) === 'D')
const PETAL_SLOTS = EDGE_SLOTS.filter(slot => SLOTS[slot].face === 'U')

// where the white edge stickers sit, as one number: the four slots sorted, in base 54
const keyOf = (slots: number[]) => [...slots].sort((a, b) => a - b).reduce((k, s) => k * 54 + s, 0)
const slotsOf = (key: number) => [0, 0, 0, 0].map(() => { const s = key % 54; key = Math.floor(key / 54); return s })

// quarter turns away from the lily of every way the white edges can lie: 10 626 of them, found once by search
const distance = (() => {
  const dist = new Map([[keyOf(PETAL_SLOTS), 0]])
  let frontier = [keyOf(PETAL_SLOTS)]
  for (let d = 1; frontier.length; d++) {
    const next: number[] = []
    for (const key of frontier) {
      for (const move of QUARTER_TURNS) {
        const perm = permutation(move), k = keyOf(slotsOf(key).map(s => perm[s]))
        if (!dist.has(k)) { dist.set(k, d); next.push(k) }
      }
    }
    frontier = next
  }
  return dist
})()

const whiteSlots = (state: CubeState) => EDGE_SLOTS.filter(slot => WHITE_EDGES.includes(state[slot]))

/** The fewest quarter turns to the lily. */
export const lilyDistance = (state: CubeState) => distance.get(keyOf(whiteSlots(state)))!

export const isLily = (state: CubeState) => lilyDistance(state) === 0

/** How many white edges are already in place around the yellow centre. */
export const petals = (state: CubeState) => PETAL_SLOTS.filter(slot => WHITE_EDGES.includes(state[slot])).length

/** A quarter turn that brings the lily one turn closer, or null once it is made. */
export function lilyHint(state: CubeState): Move | null {
  const d = lilyDistance(state)
  return d ? QUARTER_TURNS.find(move => lilyDistance(applyMove(state, move)) === d - 1)! : null
}

/**
 * A lily puzzle from a full scramble: with `toPlace` 1–3 it stops partway along a shortest way to the lily, where that
 * many petals are still to place (a quarter turn moves at most one petal, so the count steps through every number on
 * the way); with 4 it is the scramble as it is.
 */
export function lilyPuzzle(scrambled: () => CubeState, toPlace: number): CubeState {
  for (;;) {
    let state = scrambled()
    if (isLily(state)) continue
    if (toPlace === 4) return state
    if (petals(state) > 4 - toPlace) continue
    let found: CubeState | null = null
    for (let move = lilyHint(state); move; move = lilyHint(state)) {
      if (petals(state) === 4 - toPlace) found = state
      state = applyMove(state, move)
    }
    if (found) return found
  }
}
