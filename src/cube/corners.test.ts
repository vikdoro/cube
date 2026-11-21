import { describe, expect, it } from 'vitest'
import { cornersHint, cornersPuzzle, cornersTurns, isFirstLayer, placed } from './corners'
import { isCross } from './cross'
import { scramble } from './drills'
import { applyMove, applyMoves, inverse, sameMove, SLOTS, SOLVED, type CubeState, type Face, type Move } from 'flatcube'

// a seeded generator, so failures can be reproduced
function seeded(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31 }
}

const turn = (layer: Face, amount: Move['amount'] = 1): Move => ({ layer, amount })
// each slot's trigger, by the side to the right of the slot: FR, RB, BL, LF
const TRIGGERS = (['R', 'B', 'L', 'F'] as Face[]).map(side => [turn(side), turn('U'), turn(side, 3), turn('U', 3)])

/** Follow the hints to the end, as the player would, each one a quarter turn. */
function follow(state: CubeState, recent: Move[] = []) {
  const moves: Move[] = []
  for (let move = cornersHint(state, recent); move; move = cornersHint(state, recent)) {
    expect(move.amount).not.toBe(2)
    expect(moves.length).toBeLessThan(200) // no going round in circles
    state = applyMove(state, move)
    moves.push(move)
    recent = [...recent, move].slice(-3)
  }
  return { moves, end: state }
}

/**
 * The moves cut into whole triggers and U turns, or null if they don't cut that way. The last trigger may stop a turn
 * short: once its corner drops in, the white face is done and turning U back is not needed.
 */
function cut(moves: Move[]) {
  const steps: (Move | number)[] = []
  for (let i = 0; i < moves.length;) {
    if (moves[i].layer === 'U') { steps.push(moves[i++]); continue }
    const fits = (t: Move[]) => t.every((m, j) => i + j === moves.length && j === 3 || sameMove(m, moves[i + j] ?? m) && i + j < moves.length)
    const t = TRIGGERS.findIndex(fits)
    if (t < 0) return null
    steps.push(t)
    i += 4
  }
  return steps
}

describe('white corners', () => {
  it('is the cross and the four white corners home, whatever the yellow face does', () => {
    expect(isFirstLayer(SOLVED)).toBe(true)
    expect(isFirstLayer(applyMove(SOLVED, turn('U')))).toBe(true)
    expect(isFirstLayer(applyMove(SOLVED, turn('R')))).toBe(false)
    expect(isFirstLayer(applyMoves(SOLVED, TRIGGERS[0]))).toBe(false)
    expect(placed(applyMoves(SOLVED, TRIGGERS[0]))).toBe(3)
  })

  it('has triggers that keep the cross and the other three corners', () => {
    TRIGGERS.forEach(t => {
      const state = applyMoves(SOLVED, t)
      expect(isCross(state)).toBe(true)
      expect(placed(state)).toBe(3)
      expect(applyMoves(SOLVED, [...t, ...t, ...t, ...t, ...t, ...t])).toEqual(SOLVED) // six goes come round again
    })
  })

  it('repeats one trigger until a corner is home: one, three or five goes from over its slot', () => {
    const overSlot = new Set<number>(), inSlot = new Set<number>()
    for (const t of TRIGGERS) {
      for (let goes = 1; goes <= 5; goes++) {
        let start: CubeState = SOLVED
        for (let g = 0; g < 6 - goes; g++) start = applyMoves(start, t)
        if (placed(start) === 4) continue
        const { moves, end } = follow(start)
        expect(isFirstLayer(end)).toBe(true)
        expect(cut(moves)).toEqual(Array(goes).fill(TRIGGERS.indexOf(t)))
        const onTop = SLOTS.some(s => s.face === 'D' && SLOTS[start.indexOf(s.index)].pos[1] === 1)
        ;(onTop ? overSlot : inSlot).add(goes)
      }
    }
    expect([...overSlot].sort()).toEqual([1, 3, 5])
    expect([...inSlot].sort()).toEqual([2, 4]) // twisted in its slot
  })

  it('finishes a trigger begun', () => {
    for (const t of TRIGGERS) {
      const start = applyMoves(SOLVED, [...t, ...t].map(inverse).reverse()) // its corner twisted in its slot
      let state = start, recent: Move[] = []
      for (const move of t.slice(0, 3)) {
        expect(cornersHint(state, recent)).toEqual(move)
        state = applyMove(state, move)
        recent = [...recent, move]
      }
      expect(cornersHint(state, recent)).toEqual(t[3])
    }
  })

  it('from a made cross turns only the yellow face and whole triggers, and never loses a placed corner', () => {
    const random = seeded(11)
    for (let toPlace = 1; toPlace <= 4; toPlace++) {
      for (let i = 0; i < 15; i++) {
        const start = cornersPuzzle(() => scramble(SOLVED, random), toPlace)
        const { moves, end } = follow(start)
        expect(isFirstLayer(end)).toBe(true)
        expect(moves.length).toBe(cornersTurns(start))
        const steps = cut(moves)
        expect(steps).not.toBeNull()
        let state = start, home = placed(start)
        for (const step of steps!) {
          state = typeof step === 'number' ? applyMoves(state, TRIGGERS[step]) : applyMove(state, step)
          if (isFirstLayer(state)) break
          expect(isCross(state)).toBe(true)
          expect(placed(state)).toBeGreaterThanOrEqual(home)
          home = placed(state)
        }
        // never more than three quarter turns of the yellow face in a row
        let run = 0
        for (const step of steps!) { run = typeof step === 'number' ? 0 : run + 1; expect(run).toBeLessThanOrEqual(3) }
      }
    }
  })

  it('from anywhere makes the cross first, then the corners', () => {
    const random = seeded(12)
    for (let i = 0; i < 20; i++) {
      const start = scramble(SOLVED, random)
      const { moves, end } = follow(start)
      expect(isFirstLayer(end)).toBe(true)
      expect(moves.length).toBe(cornersTurns(start))
    }
  })

  it('gets back on track after a stray turn or an undo in the middle of a trigger', () => {
    const random = seeded(13)
    for (let i = 0; i < 10; i++) {
      const start = cornersPuzzle(() => scramble(SOLVED, random), 4)
      const first = cornersHint(start) as Move
      // a stray turn of a side the hint did not ask for
      const stray = applyMove(start, turn('F', 3))
      expect(isFirstLayer(follow(stray, [turn('F', 3)]).end)).toBe(true)
      // the first turn of a trigger and the second, then the second undone
      const second = cornersHint(applyMove(start, first), [first]) as Move
      const undone = applyMoves(start, [first, second, inverse(second)])
      expect(isFirstLayer(follow(undone, [first, second, inverse(second)]).end)).toBe(true)
    }
  })

  it('leaves the asked number of corners to place', () => {
    const random = seeded(14)
    for (let toPlace = 1; toPlace <= 4; toPlace++) {
      for (let i = 0; i < 10; i++) {
        const state = cornersPuzzle(() => scramble(SOLVED, random), toPlace)
        expect(isCross(state)).toBe(true)
        expect(placed(state)).toBe(4 - toPlace)
      }
    }
  })

  it('gives the scramble as it is at the last level, skipping one with the white face already done', () => {
    const scrambled = scramble(SOLVED, seeded(15))
    expect(isFirstLayer(scrambled)).toBe(false)
    const queue = [applyMove(SOLVED, turn('U')), scrambled]
    expect(cornersPuzzle(() => queue.shift() as CubeState, 5)).toEqual(scrambled)
  })
})
