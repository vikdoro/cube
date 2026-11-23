import { describe, expect, it } from 'vitest'
import type { Drill } from './composables/usePractice'
import type { DrillKind } from './cube/drills'
import { SOLVED } from 'flatcube'
import { doneTitle, drillTitle, levelName } from './text'

const drill = (kind: DrillKind, level: number, moves = 0): Drill =>
  ({ kind, level, start: SOLVED, startPath: [], par: null, moves, hints: 0, hintShown: false, done: false, path: [], recent: [], guided: false })

describe('drill names', () => {
  it('names a level in a few words', () => {
    expect(levelName('undo', 1)).toBe('1 move')
    expect(levelName('undo', 3)).toBe('3 moves')
    expect(levelName('lily', 2)).toBe('2 petals')
    expect(levelName('lily', 4)).toBe('full scramble')
    expect(levelName('cross', 1)).toBe('1 petal')
    expect(levelName('cross', 4)).toBe('4 petals')
    expect(levelName('cross', 5)).toBe('full scramble')
    expect(levelName('corners', 1)).toBe('1 corner')
    expect(levelName('corners', 4)).toBe('4 corners')
    expect(levelName('corners', 5)).toBe('full scramble')
    expect(levelName('middle', 1)).toBe('1 edge')
    expect(levelName('middle', 5)).toBe('full scramble')
    expect(levelName('yellow', 2)).toBe('an L')
    expect(levelName('yellow', 4)).toBe('any shape')
    expect(levelName('edges', 2)).toBe('a pair across')
    expect(levelName('edges', 3)).toBe('any order')
  })

  it('titles a drill by its goal and level', () => {
    expect(drillTitle(drill('undo', 2))).toBe('Undo 2 moves')
    expect(drillTitle(drill('lily', 4))).toBe('White lily · full scramble')
    expect(drillTitle(drill('cross', 3))).toBe('White cross · 3 petals')
    expect(drillTitle(drill('cross', 5))).toBe('White cross · full scramble')
    expect(drillTitle(drill('corners', 2))).toBe('White corners · 2 corners')
    expect(drillTitle(drill('middle', 3))).toBe('Middle layer · 3 edges')
    expect(drillTitle(drill('yellow', 1))).toBe('Yellow cross · a line')
    expect(drillTitle(drill('edges', 1))).toBe('Yellow edges · a pair side by side')
  })

  it('says what was made, and in how many moves', () => {
    expect(doneTitle(drill('undo', 1, 1))).toBe('Solved in 1 move')
    expect(doneTitle(drill('lily', 4, 7))).toBe('Lily in 7 moves')
    expect(doneTitle(drill('cross', 4, 9))).toBe('Cross in 9 moves')
    expect(doneTitle(drill('corners', 1, 4))).toBe('Corners in 4 moves')
    expect(doneTitle(drill('middle', 1, 8))).toBe('Middle layer in 8 moves')
    expect(doneTitle(drill('yellow', 3, 18))).toBe('Yellow cross in 18 moves')
    expect(doneTitle(drill('edges', 1, 10))).toBe('Yellow edges in 10 moves')
  })
})
