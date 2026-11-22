import { describe, expect, it } from 'vitest'
import { applyMoves, isSolved, SLOTS } from 'flatcube'
import { isTwoLayers } from '../cube/middle'
import { CORNER, EDGE, START, STEP_STARTS, STEPS } from './script'

describe('prototype script', () => {
  it('starts one edge short of two layers', () => {
    expect(isTwoLayers(START)).toBe(false)
  })
  it('lines the edge up after the free step', () => {
    expect(STEPS[0].free!.goal(STEP_STARTS[0])).toBe(false)
    expect(STEPS[0].free!.goal(STEP_STARTS[1])).toBe(true)
  })
  it('splits every step’s turns across its slides', () => {
    for (const step of STEPS) expect(step.slides.reduce((n, sl) => n + sl.turns, 0)).toBe(step.turns.length)
  })
  it('lifts the corner next to the edge after making room', () => {
    // the slides say so: the corner up in the yellow layer, beside the edge in front
    const s = STEP_STARTS[2], slot = (id: number) => SLOTS[s.indexOf(id)].pos
    expect(CORNER.every(id => slot(id)[1] === 1)).toBe(true)
    expect(EDGE.every(id => slot(id).join() === '0,1,1')).toBe(true)
    expect(CORNER.every(id => slot(id).join() === '1,1,1')).toBe(true)
  })
  it('lights three pieces where a trigger’s layers cross', () => {
    // two corners and the edge between them: 3 + 2 + 3 stickers
    for (const step of STEPS.filter(s => s.trigger)) expect(step.area!.length).toBe(8)
  })
  it('ends with two layers done', () => {
    expect(isTwoLayers(STEP_STARTS[STEPS.length])).toBe(true)
    expect(isSolved(applyMoves(START, STEPS.flatMap(s => s.turns)))).toBe(true)
  })
})
