import { describe, expect, it } from 'vitest'
import { extendPath, pathFromSolved, randomTurns } from './drills'
import { applyMoves, isSolved, SOLVED, type Move } from 'flatcube'

// a seeded generator, so failures can be reproduced
function seeded(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31 }
}

describe('undo drill', () => {
  it('scrambles never repeat a face back to back', () => {
    const random = seeded(1)
    for (let i = 0; i < 200; i++) {
      const turns = randomTurns(5, random)
      turns.slice(1).forEach((m, j) => expect(m.layer).not.toBe(turns[j].layer))
    }
  })

  it('finds a shortest path from solved, no longer than the scramble', () => {
    const random = seeded(2)
    for (let n = 1; n <= 4; n++) {
      for (let i = 0; i < 10; i++) {
        const start = applyMoves(SOLVED, randomTurns(n, random))
        if (isSolved(start)) continue
        const path = pathFromSolved(start, n)
        expect(path.length).toBeGreaterThan(0)
        expect(path.length).toBeLessThanOrEqual(n)
        expect(applyMoves(SOLVED, path)).toEqual(start)
      }
    }
  })

  it('merges turns of the same face into the path', () => {
    const R: Move = { layer: 'R', amount: 1 }, U: Move = { layer: 'U', amount: 1 }
    expect(extendPath([U, R], R)).toEqual([U, { layer: 'R', amount: 2 }])
    expect(extendPath([U, R], { layer: 'R', amount: 3 })).toEqual([U])
    expect(extendPath([U], R)).toEqual([U, R])
  })
})
