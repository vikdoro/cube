import { applyMove, applyMoves, faceOf, FACES, inverse, isSolved, sameMove, SOLVED, type CubeState, type Face, type Move } from './model'

/**
 * Practice drills start from a position a known number of moves (or one known step) away from solved, so every
 * attempt ends with a solved cube.
 *
 * - "undo": a few random quarter turns. The hint is the inverse of the last turn still standing; the player's own
 *   turns cancel against it.
 * - "twist": the last step of the beginner method. Built by running the step's own algorithm on each top corner,
 *   so every position it makes is reachable and solvable by exactly that method.
 */
export type DrillKind = 'undo' | 'twist'

const AXIS: Record<Face, number> = { U: 1, D: 1, R: 0, L: 0, F: 2, B: 2 }
const QUARTER_TURNS: Move[] = FACES.flatMap(layer => [{ layer, amount: 1 }, { layer, amount: 3 }] as Move[])

const randomInt = (n: number, random: () => number) => Math.floor(random() * n)

/** 20 random turns of any amount, applied to `state`. */
export function scramble(state: CubeState, random = Math.random) {
  for (let i = 0; i < 20; i++) {
    state = applyMove(state, { layer: FACES[randomInt(6, random)], amount: (1 + randomInt(3, random)) as Move['amount'] })
  }
  return state
}

/** n random quarter turns that don't simplify: no face twice in a row, no three turns on one axis. */
export function randomTurns(n: number, random = Math.random): Move[] {
  const out: Move[] = []
  while (out.length < n) {
    const layer = FACES[randomInt(6, random)] as Face
    const a = out[out.length - 1], b = out[out.length - 2]
    if (a && a.layer === layer) continue // U then U is one turn
    if (a && b && AXIS[a.layer as Face] === AXIS[layer] && AXIS[b.layer as Face] === AXIS[layer]) continue // U D U is two
    out.push({ layer, amount: random() < 0.5 ? 1 : 3 })
  }
  return out
}

/** The shortest list of quarter turns (up to maxLength) that takes a solved cube to `start`, found by search. */
export function pathFromSolved(start: CubeState, maxLength: number): Move[] {
  const search = (state: CubeState, depth: number, last: Move | null, acc: Move[]): Move[] | null => {
    if (isSolved(state)) return acc
    if (!depth) return null
    for (const move of QUARTER_TURNS) {
      if (last && last.layer === move.layer) continue
      const found = search(applyMove(state, move), depth - 1, move, [...acc, move])
      if (found) return found
    }
    return null
  }
  for (let depth = 1; depth <= maxLength; depth++) {
    const solution = search(start, depth, null, [])
    if (solution) return solution.reverse().map(inverse)
  }
  return []
}

/** Extend a path from solved by one more turn: a turn of the same face merges with the last one, and cancels at 0. */
export function extendPath(path: readonly Move[], move: Move): Move[] {
  const last = path[path.length - 1]
  if (!last || last.layer !== move.layer) return [...path, move]
  const amount = (last.amount + move.amount) % 4
  return amount ? [...path.slice(0, -1), { layer: move.layer, amount: amount as Move['amount'] }] : path.slice(0, -1)
}

// ---------- twist the last corners ----------

/** R′ D′ R D: twice twists the front-right top corner one way, four times the other way. */
export const TWIST_ALG: readonly Move[] = [
  { layer: 'R', amount: 3 }, { layer: 'D', amount: 3 }, { layer: 'R', amount: 1 }, { layer: 'D', amount: 1 },
]
export const TOP_TURN: Move = { layer: 'U', amount: 1 }

/** The slot of the top face's front-right sticker: the corner the twist drill works on. */
export const TWIST_SLOT = 8

/** A random case of the last step: some top corners twisted, the twists adding up to whole turns. */
export function twistCase(random = Math.random): CubeState {
  let twists: number[]
  do twists = [0, 1, 2, 3].map(() => randomInt(3, random))
  while (twists.reduce((a, k) => a + k, 0) % 3 || twists.every(k => !k))
  const moves: Move[] = []
  for (const k of twists) {
    for (let r = 0; r < 2 * k; r++) moves.push(...TWIST_ALG)
    moves.push(TOP_TURN) // bring the next corner to the front-right
  }
  return applyMoves(SOLVED, moves)
}

const yellowUp = (state: CubeState) => faceOf(state[TWIST_SLOT]) === 'U'

/**
 * The next move of the twist step, read from what the player just did and from the corner in front of them.
 * `step` is its place in the routine: 0–3 within TWIST_ALG, 4 for turning the top.
 */
export function twistNext(history: readonly Move[], state: CubeState): { move: Move; step: number } {
  for (let j = 3; j >= 1; j--) {
    if (history.length >= j && history.slice(-j).every((m, i) => sameMove(m, TWIST_ALG[i]))) return { move: TWIST_ALG[j], step: j }
  }
  if (!yellowUp(state)) return { move: TWIST_ALG[0], step: 0 }
  // this corner is done: turn the top to the nearest unfinished one, or to line the top up at the end
  for (const amount of [1, 3, 2] as const) {
    const next = applyMove(state, { layer: 'U', amount })
    if (isSolved(next) || !yellowUp(next)) return { move: { layer: 'U', amount: amount === 2 ? 1 : amount }, step: 4 }
  }
  return { move: TOP_TURN, step: 4 }
}
