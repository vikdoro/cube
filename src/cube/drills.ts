import { applyMove, FACES, inverse, isSolved, type CubeState, type Face, type Move } from './model'

/**
 * The warm-up drill: a few random quarter turns to undo. The hint is the inverse of the last turn still standing; the
 * player's own turns cancel against it. Every attempt ends with a solved cube. The method's stages live in ./stages.
 */
export type DrillKind = 'undo' | 'stage'

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
