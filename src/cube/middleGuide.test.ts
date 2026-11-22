import { describe, expect, it } from 'vitest'
import { applyMove, SOLVED, type CubeState, type Move } from 'flatcube'
import { scramble } from './drills'
import { isFirstLayer } from './corners'
import { isTwoLayers, middlePuzzle } from './middle'
import { middleSegment } from './middleGuide'
import type { GuideSegment } from './guide'

// a seeded generator, so failures can be reproduced
function seeded(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31 }
}

/** Make a segment's turns as the slides ask: the free slide's arrows until its goal, the others' turns in order. */
function play(state: CubeState, segment: GuideSegment) {
  for (const slide of segment.slides) {
    if (slide.free) {
      for (let n = 0; !slide.free.goal(state); n++) {
        expect(n).toBeLessThan(3)
        state = applyMove(state, slide.free.next(state))
      }
    } else state = slide.turns.reduce(applyMove, state)
  }
  return state
}

/** Follow the story from a puzzle to its end, `off` turning the cube off the plan between segments. */
function story(state: CubeState, off?: (state: CubeState) => CubeState) {
  let explained = false, segments = 0
  for (let seg = middleSegment(state, explained); seg; seg = middleSegment(state, explained)) {
    expect(++segments).toBeLessThan(20)
    state = play(state, seg)
    explained = true
    if (off) state = off(state)
  }
  return { state, segments }
}

const puzzles = (level: number, n: number, seed: number) => {
  const random = seeded(seed)
  return Array.from({ length: n }, () => middlePuzzle(() => scramble(SOLVED, random), level))
}

describe('the guided middle layer', () => {
  it('follows the story from every level to two layers done', () => {
    for (const level of [1, 2, 3, 4]) {
      for (const start of puzzles(level, 15, level * 7)) expect(isTwoLayers(story(start).state)).toBe(true)
    }
  })

  it('tells one edge per segment, more or less', () => {
    for (const start of puzzles(4, 10, 3)) expect(story(start).segments).toBeLessThanOrEqual(8)
  })

  it('gives every turn slide one turn, and every edge its eight', () => {
    for (const start of puzzles(3, 10, 11)) {
      const seg = middleSegment(start, false)!
      const fixed = seg.slides.filter(s => !s.free && s.turns.length)
      expect(fixed.every(s => s.turns.length === 1)).toBe(true)
      expect(fixed.length).toBe(8)
    }
  })

  it('carries on after a turn of the yellow face off the plan', () => {
    const random = seeded(5)
    const yellow = (s: CubeState) => applyMove(s, { layer: 'U', amount: random() < 0.5 ? 1 : 3 } as Move)
    for (const start of puzzles(4, 10, 21)) {
      const off = yellow(start)
      expect(isFirstLayer(off)).toBe(true)
      expect(isTwoLayers(story(off, s => isTwoLayers(s) ? s : yellow(s)).state)).toBe(true)
    }
  })

  it('shortens the reading once the routine has been told', () => {
    const start = puzzles(2, 1, 9)[0]
    const reading = (seg: GuideSegment) => seg.slides.filter(s => !s.turns.length).length
    expect(reading(middleSegment(start, true)!)).toBe(1)
    expect(reading(middleSegment(start, false)!)).toBeGreaterThan(1)
  })

  it('says it all in plain words, with no move letters', () => {
    for (const start of puzzles(4, 10, 13)) {
      for (const explained of [false, true]) {
        for (const slide of middleSegment(start, explained)!.slides) {
          expect(slide.say).not.toMatch(/\b[URFDLBMES]['’2]?(?=[\s.,]|$)/)
          expect(slide.say).toMatch(/\.$/)
        }
      }
    }
  })

  it('has no story once the middle layer is done, or without the white face', () => {
    expect(middleSegment(SOLVED, false)).toBeNull()
    expect(middleSegment(scramble(SOLVED, seeded(1)), false)).toBeNull()
  })
})
