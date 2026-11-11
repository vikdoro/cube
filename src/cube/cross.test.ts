import { describe, expect, it } from 'vitest'
import { crossHint, crossPuzzle, dropped, isCross, isSettled, routineTurns, settleDistance } from './cross'
import { scramble } from './drills'
import { isLily, petals } from './lily'
import { applyMove, applyMoves, pieceSlots, SLOTS, SOLVED, type CubeState, type Face, type Move } from './model'

// a seeded generator, so failures can be reproduced
function seeded(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31 }
}

const SIDES: Face[] = ['F', 'R', 'B', 'L']
const turn = (layer: Face, amount: Move['amount'] = 1): Move => ({ layer, amount })
const isSide = (move: Move) => SIDES.includes(move.layer as Face)

// white is D, so the solved cube has the cross made; a half turn of each side lifts its white edge to the yellow
// face, still over its own side: the lily with every petal matched
const LILY = applyMoves(SOLVED, SIDES.map(side => turn(side, 2)))

/** Follow the hints to the end, checking each one is a quarter turn. */
function follow(state: CubeState) {
  const moves: Move[] = []
  for (let move = crossHint(state); move; move = crossHint(state)) {
    expect(move.amount).not.toBe(2)
    expect(moves.length).toBeLessThan(40) // no going round in circles
    state = applyMove(state, move)
    moves.push(move)
  }
  return { moves, end: state }
}

// where the white edge stickers sit: all the routine cares about
const WHITE_EDGES = SLOTS.filter(s => s.face === 'D' && pieceSlots(s.index).length === 2).map(s => s.index)
const whiteKey = (state: CubeState) => WHITE_EDGES.map(id => state.indexOf(id)).join()

/** The fewest quarter turns to the cross when only the yellow face turns freely and the sides turn by halves. */
function fewestByRoutine(start: CubeState) {
  const steps: [Move, number][] = [[turn('U', 1), 1], [turn('U', 3), 1], ...SIDES.map(side => [turn(side, 2), 2] as [Move, number])]
  const best = new Map([[whiteKey(start), 0]])
  const byCost: CubeState[][] = [[start]]
  for (let cost = 0; cost < byCost.length; cost++) {
    for (const state of byCost[cost] ?? []) {
      if (best.get(whiteKey(state)) !== cost) continue
      if (isCross(state)) return cost
      for (const [move, c] of steps) {
        const next = applyMove(state, move), key = whiteKey(next)
        if ((best.get(key) ?? Infinity) > cost + c) {
          best.set(key, cost + c)
          ;(byCost[cost + c] ??= []).push(next)
        }
      }
    }
  }
  throw new Error('no way to the cross')
}

describe('white cross', () => {
  it('is the four white edges home, whatever the rest of the cube does', () => {
    expect(isCross(SOLVED)).toBe(true)
    expect(isCross(applyMove(SOLVED, turn('U')))).toBe(true) // the yellow face holds no white edge
    expect(isCross(applyMoves(SOLVED, [turn('R'), turn('U'), turn('R', 3), turn('U', 3)]))).toBe(true) // corners don't matter
    expect(isCross(LILY)).toBe(false)
    expect(isCross(applyMove(SOLVED, turn('F')))).toBe(false)
    expect(isCross(applyMove(SOLVED, turn('D')))).toBe(false) // white edges round the white centre, on the wrong sides
  })

  it('counts the edges dropped home', () => {
    expect(dropped(SOLVED)).toBe(4)
    expect(dropped(applyMove(SOLVED, turn('F', 2)))).toBe(3)
    expect(dropped(applyMove(SOLVED, turn('F')))).toBe(3)
    expect(dropped(LILY)).toBe(0)
    expect(dropped(applyMove(SOLVED, turn('D')))).toBe(0)
  })

  it('is settled when every white edge is home or a petal', () => {
    for (const state of [SOLVED, LILY, applyMove(LILY, turn('U')), applyMove(SOLVED, turn('F', 2))]) {
      expect(isSettled(state)).toBe(true)
      expect(settleDistance(state)).toBe(0)
    }
    // halfway through a drop, and on the white face but the wrong side
    for (const state of [applyMove(SOLVED, turn('F')), applyMove(SOLVED, turn('D'))]) {
      expect(isSettled(state)).toBe(false)
      expect(settleDistance(state)).toBe(1)
    }
  })

  it('drops a matched petal with two turns of its side, the same way both times', () => {
    for (const side of SIDES) {
      const start = applyMove(SOLVED, turn(side, 2))
      const first = crossHint(start) as Move
      expect(first.layer).toBe(side)
      expect(first.amount).not.toBe(2)
      const halfway = applyMove(start, first)
      expect(crossHint(halfway)).toEqual(first) // a drop begun is finished, not turned back
      const end = applyMove(halfway, first)
      expect(isCross(end)).toBe(true)
      expect(crossHint(end)).toBeNull()
    }
  })

  it('turns the yellow face the shorter way round to a match', () => {
    expect(isSide(crossHint(LILY) as Move)).toBe(true) // every petal is matched already
    expect(crossHint(applyMove(LILY, turn('U')))).toEqual(turn('U', 3))
    expect(crossHint(applyMove(LILY, turn('U', 3)))).toEqual(turn('U'))
    const opposite = crossHint(applyMove(LILY, turn('U', 2))) as Move
    expect(opposite.layer).toBe('U')
    expect(opposite.amount).not.toBe(2)
  })

  it('counts the turns the routine takes', () => {
    expect(routineTurns(SOLVED)).toBe(0)
    expect(routineTurns(applyMove(SOLVED, turn('F')))).toBe(1)
    expect(routineTurns(applyMove(SOLVED, turn('F', 2)))).toBe(2)
    expect(routineTurns(LILY)).toBe(8)
    expect(routineTurns(applyMove(LILY, turn('U')))).toBe(9)
    expect(routineTurns(applyMove(LILY, turn('U', 2)))).toBe(10)
  })

  it('from a settled position turns only the yellow face and the sides, and never loses a dropped edge', () => {
    const random = seeded(5)
    for (let toDrop = 1; toDrop <= 4; toDrop++) {
      for (let i = 0; i < 10; i++) {
        const start = crossPuzzle(() => scramble(SOLVED, random), toDrop)
        const { moves, end } = follow(start)
        expect(isCross(end)).toBe(true)
        expect(moves.length).toBe(routineTurns(start))
        // two turns of a side for each petal, and the yellow face never more than three quarters round
        expect(moves.filter(isSide)).toHaveLength(2 * toDrop)
        expect(moves.filter(m => m.layer === 'U').length).toBe(moves.length - 2 * toDrop)
        expect(moves.length - 2 * toDrop).toBeLessThanOrEqual(3)
        let state = start, home = dropped(start)
        for (const move of moves) {
          state = applyMove(state, move)
          expect(dropped(state)).toBeGreaterThanOrEqual(home)
          home = dropped(state)
        }
      }
    }
  })

  it('takes the fewest turns the routine allows', () => {
    const random = seeded(6)
    for (let toDrop = 1; toDrop <= 4; toDrop++) {
      for (let i = 0; i < 10; i++) {
        const start = crossPuzzle(() => scramble(SOLVED, random), toDrop)
        expect(routineTurns(start)).toBe(fewestByRoutine(start))
      }
    }
  })

  it('from anywhere heads for the nearest settled position, then follows the routine', () => {
    const random = seeded(7)
    for (let i = 0; i < 30; i++) {
      const start = scramble(SOLVED, random)
      const away = settleDistance(start)
      expect(away).toBeLessThanOrEqual(6) // no position is further from a settled one
      let state = start
      for (let d = away; d > 0; d--) {
        state = applyMove(state, crossHint(state) as Move)
        expect(settleDistance(state)).toBe(d - 1)
      }
      expect(isSettled(state)).toBe(true)
      const { moves, end } = follow(state)
      expect(isCross(end)).toBe(true)
      expect(moves.every(m => m.layer === 'U' || isSide(m))).toBe(true)
      expect(moves.length).toBeLessThanOrEqual(11) // four drops and at most three turns of the yellow face
      expect(routineTurns(start)).toBe(away + moves.length)
    }
  })

  it('leaves the asked number of petals to drop', () => {
    const random = seeded(8)
    for (let toDrop = 1; toDrop <= 4; toDrop++) {
      for (let i = 0; i < 10; i++) {
        const state = crossPuzzle(() => scramble(SOLVED, random), toDrop)
        expect(isCross(state)).toBe(false)
        expect(isSettled(state)).toBe(true)
        expect(dropped(state)).toBe(4 - toDrop)
        expect(petals(state)).toBe(toDrop)
        if (toDrop === 4) expect(isLily(state)).toBe(true)
      }
    }
  })

  it('gives the scramble as it is at the last level, skipping one with the cross already made', () => {
    const scrambled = scramble(SOLVED, seeded(9))
    expect(isCross(scrambled)).toBe(false)
    const queue = [SOLVED, scrambled]
    expect(crossPuzzle(() => queue.shift() as CubeState, 5)).toEqual(scrambled)
  })
})
