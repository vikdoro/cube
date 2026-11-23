import { describe, expect, it } from 'vitest'
import type { Drill } from './composables/usePractice'
import type { DrillKind } from './cube/drills'
import { SOLVED } from 'flatcube'
import { doneTitle, drillTitle } from './text'

const drill = (kind: DrillKind, moves = 0): Drill =>
  ({ kind, start: SOLVED, par: 0, moves, hints: 0, hintShown: false, done: false, recent: [], guided: false })

describe('drill names', () => {
  it('titles a drill by its goal', () => {
    expect(drillTitle(drill('lily'))).toBe('White lily')
    expect(drillTitle(drill('cross'))).toBe('White cross')
    expect(drillTitle(drill('corners'))).toBe('White corners')
    expect(drillTitle(drill('middle'))).toBe('Middle layer')
    expect(drillTitle(drill('yellow'))).toBe('Yellow cross')
    expect(drillTitle(drill('edges'))).toBe('Yellow edges')
  })

  it('says what was made, and in how many moves', () => {
    expect(doneTitle(drill('lily', 7))).toBe('Lily in 7 moves')
    expect(doneTitle(drill('cross', 9))).toBe('Cross in 9 moves')
    expect(doneTitle(drill('corners', 1))).toBe('Corners in 1 move')
    expect(doneTitle(drill('middle', 8))).toBe('Middle layer in 8 moves')
    expect(doneTitle(drill('yellow', 18))).toBe('Yellow cross in 18 moves')
    expect(doneTitle(drill('edges', 10))).toBe('Yellow edges in 10 moves')
  })
})
