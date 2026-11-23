import { applyMove, FACES, type CubeState, type Move } from 'flatcube'

/**
 * The drills, one per step of the beginner method. Each starts where the step before leaves the cube, the lily from a
 * full scramble. Lily: make the white lily (see lily.ts). Cross: drop the lily's petals onto the white face (see
 * cross.ts). Corners: put the white corners in round the cross (see corners.ts). Middle: put the middle layer's edges
 * in (see middle.ts). Yellow: make the yellow cross on top of the first two layers (see yellow.ts). Edges: put the
 * yellow edges on their own sides (see edges.ts).
 */
export type DrillKind = 'lily' | 'cross' | 'corners' | 'middle' | 'yellow' | 'edges'

const randomInt = (n: number, random: () => number) => Math.floor(random() * n)

/** 20 random turns of any amount, applied to `state`. */
export function scramble(state: CubeState, random = Math.random) {
  for (let i = 0; i < 20; i++) {
    state = applyMove(state, { layer: FACES[randomInt(6, random)], amount: (1 + randomInt(3, random)) as Move['amount'] })
  }
  return state
}
