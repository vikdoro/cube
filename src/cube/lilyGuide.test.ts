import { describe, expect, it } from 'vitest'
import { applyMove, SOLVED, type CubeState, type Move } from 'flatcube'
import { scramble } from './drills'
import { isLily, lilyPuzzle, petals } from './lily'
import { lilySegment } from './lilyGuide'
import type { GuideSegment } from './guide'

// a seeded generator, so failures can be reproduced
function seeded(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31 }
}

/** Make a segment's turns as the slides ask, checking no petal is lost on the way. */
function play(state: CubeState, segment: GuideSegment) {
  const start = petals(state)
  for (const slide of segment.slides) {
    if (slide.free) {
      for (let n = 0; !slide.free.goal(state); n++) {
        expect(n).toBeLessThan(3)
        state = applyMove(state, slide.free.next(state))
        expect(petals(state)).toBe(start)
      }
    } else {
      for (const move of slide.turns) {
        state = applyMove(state, move)
        expect(petals(state)).toBeGreaterThanOrEqual(start)
      }
    }
  }
  expect(petals(state)).toBe(start + 1)
  return state
}

/** Follow the story from a puzzle to its end, `off` turning the cube off the plan between segments. */
function story(state: CubeState, off?: (state: CubeState) => CubeState) {
  let explained = false, segments = 0
  for (let seg = lilySegment(state, explained); seg; seg = lilySegment(state, explained)) {
    expect(++segments).toBeLessThan(20)
    state = play(state, seg)
    explained = true
    if (off) state = off(state)
  }
  return { state, segments }
}

const puzzles = (toPlace: number, n: number, seed: number) => {
  const random = seeded(seed)
  return Array.from({ length: n }, () => lilyPuzzle(() => scramble(SOLVED, random), toPlace))
}

describe('the guided lily', () => {
  it('follows the story from a full scramble, and from partway, to the lily', () => {
    for (const toPlace of [1, 2, 3, 4]) {
      for (const start of puzzles(toPlace, 25, toPlace * 7)) {
        const { state, segments } = story(start)
        expect(isLily(state)).toBe(true)
        expect(segments).toBe(4 - petals(start))
      }
    }
  })

  it('carries on after a random turn off the plan', () => {
    const random = seeded(5)
    const faces = ['U', 'R', 'F', 'D', 'L', 'B'] as const
    const stray = (s: CubeState) => isLily(s) ? s : applyMove(s, { layer: faces[Math.floor(random() * 6)], amount: 1 } as Move)
    for (const start of puzzles(4, 15, 21)) expect(isLily(story(stray(start)).state)).toBe(true)
  })

  it('shortens the reading once the routine has been told', () => {
    const start = puzzles(4, 1, 9)[0]
    const reading = (seg: GuideSegment) => seg.slides.filter(s => !s.turns.length).length
    expect(reading(lilySegment(start, true)!)).toBe(1)
    expect(reading(lilySegment(start, false)!)).toBeGreaterThan(1)
  })

  it('says it all in plain words, with no move letters', () => {
    for (const start of puzzles(4, 30, 13)) {
      for (const explained of [false, true]) {
        for (const slide of lilySegment(start, explained)!.slides) {
          expect(slide.say).not.toMatch(/\b[URFDLBMES]['’2]?(?=[\s.,]|$)/)
          expect(slide.say).toMatch(/\.$/)
        }
      }
    }
  })

  it('has no story once the lily is made', () => {
    const lily = (['F', 'R', 'B', 'L'] as const).reduce((s, layer) => applyMove(s, { layer, amount: 2 }), SOLVED)
    expect(isLily(lily)).toBe(true)
    expect(lilySegment(lily, false)).toBeNull()
  })
})
