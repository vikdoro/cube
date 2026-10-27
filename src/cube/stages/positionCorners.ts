import { alg, invertAlg, quarterTurns } from '../alg'
import type { Stage } from '../method'
import { applyMoves, faceOf, permutation, pieceSlots, SLOTS, SOLVED, type CubeState, type Move } from '../model'
import { randomTwists, twistMoves, WORK_SLOT } from './twistCorners'

/**
 * Stage 6: the top corners are all in the top layer but in each other's places (and may be twisted).
 * U R U′ L′ U R′ U′ L leaves the front-right top corner and the rest of the cube alone and cycles the other three top
 * corners, twisting them as it goes; stage 7 untwists them afterwards.
 */
export const CYCLE_ALG: readonly Move[] = alg("U R U' L' U R' U' L")

/** The top face's corner stickers: back-left, back-right, front-left, front-right. */
const TOP_CORNERS = [0, 2, 6, 8]
const topCornerSlots = new Set(TOP_CORNERS.flatMap(pieceSlots))

const randomInt = (n: number, random: () => number) => Math.floor(random() * n)

/** Everything but the top corners is solved. */
const restSolved = (state: CubeState) => state.every((id, slot) => topCornerSlots.has(slot) || faceOf(id) === SLOTS[slot].face)

/** The piece at this corner belongs here: its three colours are the three faces around it, twisted or not. */
function inPlace(state: CubeState, slot: number) {
  const slots = pieceSlots(slot)
  const have = slots.map(s => faceOf(state[s])).sort().join()
  const want = slots.map(s => SLOTS[s].face).sort().join()
  return have === want
}

/** The top turn that carries the piece at `slot` to the front-right. */
function turnToFront(slot: number): 1 | 2 | 3 {
  for (const amount of [1, 2, 3] as const) if (permutation({ layer: 'U', amount })[slot] === WORK_SLOT) return amount
  throw new Error(`slot ${slot} is not a top corner`)
}

const isDone = (state: CubeState) => restSolved(state) && TOP_CORNERS.every(slot => inPlace(state, slot))

/** The cycle done with the top turned by `k` quarters first and turned back after: it leaves a different corner alone. */
function cycleFrom(k: number, reverse: boolean): Move[] {
  const cycle = reverse ? invertAlg(CYCLE_ALG) : CYCLE_ALG
  if (!k) return [...cycle]
  const pre = quarterTurns('U', k as 1 | 2 | 3)
  return [...pre, ...cycle, ...invertAlg(pre)]
}

export const positionCorners: Stage = {
  id: 6,
  title: 'Put the last corners in place',
  short: 'Place corners',
  intro: [
    'Only the top corners are left. They are in the top layer but in each other\'s places, and may be twisted too.',
    'One routine cycles three top corners round and leaves the front-right one, ringed, where it is. Its name: U R U′ L′ U R′ U′ L.',
    'Find a corner that is already in its place: its three colours are the three faces around it, even if twisted. Turn only the top to bring it to the ring, do the routine, then turn the top back the way you came.',
    'If no corner is in place yet, do the routine once from anywhere and look again. Once all four are in place, the next step twists them, and the cube is solved.',
    'The moves sit under the board with the next one lit up. Hint draws it on the board.',
  ],
  chunks: [
    { name: 'right up, left down', moves: CYCLE_ALG.slice(0, 4) },
    { name: 'right down, left up', moves: CYCLE_ALG.slice(4) },
  ],
  isDone,
  start(random = Math.random) {
    let state: CubeState
    do {
      const moves: Move[] = []
      for (let i = 1 + randomInt(3, random); i > 0; i--) moves.push(...cycleFrom(randomInt(4, random), random() < 0.5))
      moves.push(...twistMoves(randomTwists(random, true)))
      state = applyMoves(SOLVED, moves)
    } while (isDone(state))
    return state
  },
  nextRoutine(state) {
    if (isDone(state) || !restSolved(state)) return null
    const placed = TOP_CORNERS.filter(slot => inPlace(state, slot))
    if (!placed.length) return { label: 'No corner is in place yet: cycle three, then look again', moves: CYCLE_ALG, algStart: 0 }
    if (placed[0] === WORK_SLOT) return { label: 'The front-right corner is in place: cycle the other three', moves: CYCLE_ALG, algStart: 0 }
    const pre = quarterTurns('U', turnToFront(placed[0]))
    return {
      label: 'Bring the placed corner to the front-right, cycle the other three, then turn the top back',
      moves: [...pre, ...CYCLE_ALG, ...invertAlg(pre)],
      algStart: pre.length,
    }
  },
  focus: () => pieceSlots(WORK_SLOT),
}
