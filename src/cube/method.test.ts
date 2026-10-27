import { describe, expect, it } from 'vitest'
import { alg, invertAlg } from './alg'
import { coachHint, coachStart, coachTurn, type Coach } from './coach'
import { TEACHING_ORDER } from './method'
import { applyMove, applyMoves, isSolved, SOLVED, type Move } from './model'
import { stage } from './stages'
import { CYCLE_ALG } from './stages/positionCorners'

// a seeded generator, so failures can be reproduced
function seeded(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31 }
}

/** Follow the coach's hints to the end. */
function followHints(coach: Coach, budget: number): { coach: Coach; moves: number } {
  let moves = 0
  while (!isSolved(coach.state) && moves < budget) {
    const hint = coachHint(coach)
    if (!hint) break
    coach = coachTurn(coach, hint)
    moves++
  }
  return { coach, moves }
}

describe('alg', () => {
  it('reads notation', () => {
    expect(alg("R' U2 F")).toEqual([{ layer: 'R', amount: 3 }, { layer: 'U', amount: 2 }, { layer: 'F', amount: 1 }])
    expect(applyMoves(SOLVED, [...alg("R U R' U'"), ...invertAlg(alg("R U R' U'"))])).toEqual(SOLVED)
  })
})

describe.each(TEACHING_ORDER.map(id => [id, id === 7 ? 60 : 120] as const))('stage %i', (id, budget) => {
  const s = stage(id)

  it('starts undone and is solved by following the hints', () => {
    const random = seeded(id)
    for (let i = 0; i < 200; i++) {
      const start = s.start(random)
      expect(s.isDone(start)).toBe(false)
      const { coach, moves } = followHints(coachStart(start), budget)
      expect(isSolved(coach.state), `case ${i} not solved in ${moves} moves`).toBe(true)
    }
  })
})

describe('stage 6', () => {
  const s = stage(6)

  it('is done once the corners are in place, twisted or not', () => {
    expect(s.isDone(SOLVED)).toBe(true)
    expect(s.isDone(stage(7).start(seeded(5)))).toBe(true)
    expect(s.isDone(applyMoves(SOLVED, CYCLE_ALG))).toBe(false)
  })

  it('only ever cycles corners: the rest of the cube is untouched by its routines', () => {
    const random = seeded(6)
    for (let i = 0; i < 50; i++) {
      let coach = coachStart(s.start(random))
      while (coach.stage === 6) {
        const hint = coachHint(coach)!
        coach = coachTurn(coach, hint)
      }
      // stage 6 handed over to stage 7 (or finished): every piece is in place now
      expect(s.isDone(coach.state)).toBe(true)
    }
  })
})

describe('coach', () => {
  it('asks for wrong turns to be turned back, then carries on', () => {
    const random = seeded(7)
    for (let i = 0; i < 50; i++) {
      let coach = coachStart(stage(6).start(random))
      // three right moves, then two wrong ones
      for (let k = 0; k < 3; k++) coach = coachTurn(coach, coachHint(coach)!)
      const wrong: Move[] = [{ layer: 'F', amount: 1 }, { layer: 'D', amount: 3 }]
      for (const m of wrong) coach = coachTurn(coach, m)
      expect(coach.offTrack).toHaveLength(2)
      expect(coachHint(coach)).toEqual({ layer: 'D', amount: 1 })
      const { coach: end } = followHints(coach, 200)
      expect(isSolved(end.state)).toBe(true)
    }
  })

  it('accepts a half turn made the other way round', () => {
    // a stage 6 case whose placed corner is at the back-left needs U U before the cycle
    const random = seeded(8)
    let found = false
    for (let i = 0; i < 200 && !found; i++) {
      const start = stage(6).start(random)
      const coach = coachStart(start)
      const r = coach.routine!
      if (r.algStart !== 2) continue
      found = true
      const other = { layer: 'U', amount: 3 } as const
      let c = coachTurn(coach, other)
      expect(c.offTrack).toHaveLength(0)
      expect(coachHint(c)).toEqual(other)
      c = coachTurn(c, other)
      expect(c.done).toBe(2)
      expect(c.state).toEqual(applyMove(applyMove(start, other), other))
    }
    expect(found).toBe(true)
  })
})
