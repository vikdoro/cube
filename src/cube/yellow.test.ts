import { describe, expect, it } from 'vitest'
import { scramble } from './drills'
import { isTwoLayers } from './middle'
import { GOES, isYellowCross, routine, shape, yellowHint, yellowPuzzle, yellowTurns } from './yellow'
import { applyMove, applyMoves, inverse, sameMove, SOLVED, type CubeState, type Face, type Move } from 'flatcube'

// a seeded generator, so failures can be reproduced
function seeded(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31 }
}

const turn = (layer: Face, amount: Move['amount'] = 1): Move => ({ layer, amount })
const SIDES: Face[] = ['F', 'R', 'B', 'L']
const undo = (moves: Move[]) => [...moves].reverse().map(inverse)

/** Follow the hints to the end, as the player would, each one a quarter turn. */
function follow(state: CubeState, recent: Move[] = []) {
  const moves: Move[] = []
  for (let move = yellowHint(state, recent); move; move = yellowHint(state, recent)) {
    expect(move.amount).not.toBe(2)
    expect(moves.length).toBeLessThan(500) // no going round in circles
    state = applyMove(state, move)
    moves.push(move)
    recent = [...recent, move].slice(-7)
  }
  return { moves, end: state }
}

/** The moves cut into whole goes of six, or null if they don't cut that way. */
function goes(moves: Move[]) {
  const out: Face[] = []
  for (let i = 0; i < moves.length; i += 6) {
    const x = SIDES.find(x => routine(x).every((m, j) => moves[i + j] && sameMove(m, moves[i + j])))
    if (!x) return null
    out.push(x)
  }
  return out
}

describe('yellow cross', () => {
  it('is the first two layers and the yellow edges facing up, wherever they are round the sides', () => {
    expect(isYellowCross(SOLVED)).toBe(true)
    expect(isYellowCross(applyMove(SOLVED, turn('U')))).toBe(true)
    expect(isYellowCross(applyMove(SOLVED, turn('R')))).toBe(false)
    expect(shape(SOLVED)).toBe('cross')
  })

  it('has six turns that keep the first two layers', () => {
    for (const x of SIDES) expect(isTwoLayers(applyMoves(SOLVED, routine(x)))).toBe(true)
  })

  it('takes a line in one go, an L in two and a dot in three, each worked from one side with no yellow turns', () => {
    for (const x of SIDES) {
      // undo goes from solved, each from a random-looking side, to get every shape held every way
      for (const path of [[x], [x, RIGHT(x)], [x, x, RIGHT(x)], [x, LEFT(x), x]]) {
        const start = applyMoves(SOLVED, path.flatMap(y => undo(routine(y))))
        if (shape(start) === 'cross') continue
        const { moves, end } = follow(start)
        expect(isYellowCross(end)).toBe(true)
        const done = goes(moves)
        expect(done).not.toBeNull()
        expect(done!.length).toBe(GOES[shape(start)])
        expect(moves.length).toBe(yellowTurns(start))
      }
    }
  })

  it('turns a dot into an L, an L into a line and a line into the cross', () => {
    const random = seeded(31)
    const next = { dot: 'L', L: 'line', line: 'cross' } as const
    for (let level = 1; level <= 3; level++) {
      for (let i = 0; i < 5; i++) {
        let state = yellowPuzzle(() => scramble(SOLVED, random), level, random), recent: Move[] = []
        const from = shape(state)
        for (let k = 0; k < 6; k++) {
          const move = yellowHint(state, recent)!
          state = applyMove(state, move)
          recent = [...recent, move].slice(-7)
        }
        expect(isTwoLayers(state)).toBe(true)
        expect(shape(state)).toBe(next[from as keyof typeof next])
      }
    }
  })

  it('from anywhere makes the first two layers first, then the yellow cross', () => {
    const random = seeded(32)
    for (let i = 0; i < 15; i++) {
      const start = scramble(SOLVED, random)
      const { moves, end } = follow(start)
      expect(isYellowCross(end)).toBe(true)
      expect(moves.length).toBe(yellowTurns(start))
    }
  })

  it('gets back on track after a stray turn or an undo in the middle of a go', () => {
    const random = seeded(33)
    for (let i = 0; i < 10; i++) {
      let state = yellowPuzzle(() => scramble(SOLVED, random), 3, random)
      const recent: Move[] = []
      for (let k = 0; k < 3; k++) {
        const move = yellowHint(state, recent)!
        state = applyMove(state, move)
        recent.push(move)
      }
      const stray = turn('L', 3)
      expect(isYellowCross(follow(applyMove(state, stray), [...recent, stray]).end)).toBe(true)
      const back = inverse(recent[recent.length - 1])
      expect(isYellowCross(follow(applyMove(state, back), [...recent, back]).end)).toBe(true)
    }
  })

  it('starts each level from its shape, with the first two layers done', () => {
    const random = seeded(34)
    const wanted = { 1: 'line', 2: 'L', 3: 'dot' } as Record<number, string>
    for (let level = 1; level <= 4; level++) {
      for (let i = 0; i < 8; i++) {
        const state = yellowPuzzle(() => scramble(SOLVED, random), level, random)
        expect(isTwoLayers(state)).toBe(true)
        if (level < 4) expect(shape(state)).toBe(wanted[level])
        else expect(shape(state)).not.toBe('cross')
      }
    }
  })
})

function RIGHT(x: Face): Face { return SIDES[(SIDES.indexOf(x) + 1) % 4] }
function LEFT(x: Face): Face { return SIDES[(SIDES.indexOf(x) + 3) % 4] }
