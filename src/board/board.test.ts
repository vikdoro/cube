import { describe, expect, it } from 'vitest'
import { FACE_NORMAL, FACES, type Face } from '../cube/model'
import { IDENTITY } from '../cube/vec'
import { rollTowards, toBoard } from '../cube/view'
import { arrowPaths } from './arrows'
import { bestOption, dragOptions } from './gestures'
import { placements, UNIT, type Point } from './layout'

describe('board layout', () => {
  it('places all 54 stickers as quadrilaterals, 9 of them on the middle face', () => {
    const all = placements(IDENTITY)
    expect(all).toHaveLength(54)
    all.forEach(p => expect(p.points).toHaveLength(4))
    expect(all.filter(p => p.depth === -1)).toHaveLength(9)
  })

  it('draws four arcs for the middle face and the lid, two arrows for a side', () => {
    const count = (face: Face) => arrowPaths(IDENTITY, { layer: face, amount: 1 }).length
    expect(count('U')).toBe(4)
    expect(count('D')).toBe(4)
    for (const face of ['R', 'L', 'F', 'B'] as const) expect(count(face)).toBe(2)
  })
})

describe('reading a drag', () => {
  const drag = (from: Point, to: Point, view = IDENTITY) => {
    const reach = 0.4 * UNIT
    const path: Point[] = Array.from({ length: 11 }, (_, i) => [from[0] + (to[0] - from[0]) * i / 10, from[1] + (to[1] - from[1]) * i / 10])
    return bestOption(dragOptions(view, from, reach), path, reach)!
  }

  it('a drag along the top row of the middle face turns the far side', () => {
    const best = drag([-UNIT, -UNIT], [UNIT, -UNIT])
    expect(best.option.layer).toBe('B')
    expect(Math.abs(best.along)).toBeGreaterThan(UNIT)
  })

  it('a drag down the right column turns R, and the opposite way gives the opposite sign', () => {
    const down = drag([UNIT, -UNIT], [UNIT, UNIT]), up = drag([UNIT, UNIT], [UNIT, -UNIT])
    expect(down.option.layer).toBe('R')
    expect(up.option.layer).toBe('R')
    expect(Math.sign(down.along)).toBe(-Math.sign(up.along))
  })

  it('a drag along the middle row is recognised but blocked', () => {
    expect(drag([-UNIT, 0], [UNIT, 0]).option.blocked).toBe(true)
  })

  it('works the same after rolling the cube', () => {
    for (const face of FACES.filter(f => f !== 'U')) {
      const view = rollTowards(IDENTITY, toBoard(IDENTITY, FACE_NORMAL[face]))
      expect(drag([-UNIT, -UNIT], [UNIT, -UNIT], view).option.blocked).toBe(false)
    }
  })
})
