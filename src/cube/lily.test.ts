import { describe, expect, it } from 'vitest'
import { scramble } from './drills'
import { isLily, lilyDistance, lilyHint, lilyPuzzle, petals } from './lily'
import { applyMove, applyMoves, SOLVED, type Move } from '@tadacube/engine'

// a seeded generator, so failures can be reproduced
function seeded(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31 }
}

// the solved cube held upside down has the white face on U: the lily is the white cross around the yellow centre
const LILY = applyMoves(SOLVED, [{ layer: 'R', amount: 2 }, { layer: 'L', amount: 2 }, { layer: 'F', amount: 2 }, { layer: 'B', amount: 2 }])

describe('white lily', () => {
  it('is four white edges on the yellow face, however the U layer is turned', () => {
    expect(isLily(LILY)).toBe(true)
    expect(isLily(applyMove(LILY, { layer: 'U', amount: 1 }))).toBe(true)
    expect(isLily(SOLVED)).toBe(false)
    expect(lilyDistance(SOLVED)).toBe(8) // each white edge is a half turn away
  })

  it('counts the petals in place', () => {
    expect(petals(LILY)).toBe(4)
    expect(petals(applyMove(LILY, { layer: 'R', amount: 1 }))).toBe(3)
    expect(petals(SOLVED)).toBe(0)
  })

  it('hints a shortest way to the lily', () => {
    const random = seeded(3)
    for (let i = 0; i < 20; i++) {
      let state = scramble(SOLVED, random)
      const d = lilyDistance(state)
      expect(d).toBeLessThanOrEqual(10)
      for (let n = 0; n < d; n++) state = applyMove(state, lilyHint(state) as Move)
      expect(isLily(state)).toBe(true)
      expect(lilyHint(state)).toBeNull()
    }
  })

  it('leaves the asked number of petals to place', () => {
    const random = seeded(4)
    for (let toPlace = 1; toPlace <= 4; toPlace++) {
      for (let i = 0; i < 10; i++) {
        const state = lilyPuzzle(() => scramble(SOLVED, random), toPlace)
        expect(isLily(state)).toBe(false)
        if (toPlace < 4) expect(petals(state)).toBe(4 - toPlace)
      }
    }
  })
})
