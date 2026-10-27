import { alg, quarterTurns } from '../alg'
import type { Stage } from '../method'
import { applyMove, applyMoves, faceOf, isSolved, pieceSlots, SOLVED, type CubeState, type Move } from '../model'

/**
 * Stage 7, the last step of the method: every piece is in place, some top corners are twisted.
 * R′ D′ R D twice twists the front-right top corner one way, four times the other way; U brings the next corner round.
 */
export const TWIST_ALG: readonly Move[] = alg("R' D' R D")
export const TOP_TURN: Move = { layer: 'U', amount: 1 }

/** The slot of the top face's front-right sticker: the corner the method works on. */
export const WORK_SLOT = 8

const randomInt = (n: number, random: () => number) => Math.floor(random() * n)

/** Twists of the four top corners (in thirds of a turn, 0–2), legal when they add up to whole turns. */
export function randomTwists(random: () => number, allowNone = false): number[] {
  let twists: number[]
  do twists = [0, 1, 2, 3].map(() => randomInt(3, random))
  while (twists.reduce((a, k) => a + k, 0) % 3 || (!allowNone && twists.every(k => !k)))
  return twists
}

/** The moves that twist the top corners by `twists`, going round with U, ending with the top where it started. */
export function twistMoves(twists: readonly number[]): Move[] {
  const moves: Move[] = []
  for (const k of twists) {
    for (let r = 0; r < 2 * k; r++) moves.push(...TWIST_ALG)
    moves.push(TOP_TURN) // bring the next corner to the front-right
  }
  return moves
}

/** A random case of the last step: some top corners twisted, the twists adding up to whole turns. */
export const twistCase = (random = Math.random): CubeState => applyMoves(SOLVED, twistMoves(randomTwists(random)))

const yellowUp = (state: CubeState) => faceOf(state[WORK_SLOT]) === 'U'

export const twistCorners: Stage = {
  id: 7,
  title: 'Twist the last corners',
  short: 'Twist corners',
  intro: [
    'Every piece is in place; only some top corners are twisted. Work on the ringed corner, front-right of the middle face.',
    'If yellow isn\'t facing up there, do R′ D′ R D and repeat it until it is, 2 or 4 times.',
    'Then turn only the top, U, to bring the next twisted corner into the ring. Don\'t roll the cube.',
    'Half-way, the rest of the cube looks broken. Keep going: it comes back with the last corner.',
    'The moves sit under the board with the next one lit up. Hint draws it on the board.',
  ],
  chunks: [{ name: 'dip', moves: TWIST_ALG }],
  isDone: isSolved,
  start: twistCase,
  nextRoutine(state) {
    if (isSolved(state)) return null
    if (!yellowUp(state)) return { label: 'Dip the corner until yellow faces up', moves: TWIST_ALG, algStart: 0 }
    // this corner is done: turn the top to the nearest twisted one, or to line the top up at the end
    for (const amount of [1, 3, 2] as const) {
      const next = applyMove(state, { layer: 'U', amount })
      if (isSolved(next)) return { label: 'Line the top up', moves: quarterTurns('U', amount), algStart: -1 }
      if (!yellowUp(next)) return { label: 'Turn the top to the next twisted corner', moves: quarterTurns('U', amount), algStart: -1 }
    }
    return null // not a position this stage handles
  },
  focus: () => pieceSlots(WORK_SLOT),
}
