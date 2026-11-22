import { describe, expect, it } from 'vitest'
import { applyMoves, isSolved } from 'flatcube'
import { isTwoLayers } from '../cube/middle'
import { START, STEP_STARTS, STEPS } from './script'

describe('prototype script', () => {
  it('starts one edge short of two layers', () => {
    expect(isTwoLayers(START)).toBe(false)
  })
  it('lines the edge up after the free step', () => {
    expect(STEPS[1].free!.goal(STEP_STARTS[1])).toBe(false)
    expect(STEPS[1].free!.goal(STEP_STARTS[2])).toBe(true)
  })
  it('ends with two layers done', () => {
    expect(isTwoLayers(STEP_STARTS[STEPS.length])).toBe(true)
    expect(isSolved(applyMoves(START, STEPS.flatMap(s => s.turns)))).toBe(true)
  })
})
