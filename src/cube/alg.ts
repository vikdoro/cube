import { inverse, type Layer, type Move } from './model'

/** Moves from standard notation: "R' D' R D", "U2". Both ' and ′ mark an anticlockwise turn. */
export function alg(notation: string): Move[] {
  return notation.trim().split(/\s+/).map(token => {
    const m = /^([URFDLBMES])(['′2]?)$/.exec(token)
    if (!m) throw new Error(`bad move: ${token}`)
    return { layer: m[1] as Layer, amount: m[2] === '2' ? 2 : m[2] ? 3 : 1 }
  })
}

/** The moves that undo a sequence: each one inverted, in reverse order. */
export const invertAlg = (moves: readonly Move[]): Move[] => moves.map(inverse).reverse()

/** A turn as quarter turns the player can drag: a half turn is two of them. */
export const quarterTurns = (layer: Layer, amount: 1 | 2 | 3): Move[] =>
  amount === 2 ? [{ layer, amount: 1 }, { layer, amount: 1 }] : [{ layer, amount }]
