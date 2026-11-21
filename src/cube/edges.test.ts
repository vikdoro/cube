import { describe, expect, it } from 'vitest'
import { scramble } from './drills'
import { edgesHint, edgesPuzzle, edgesTurns, GOES, isYellowEdges, order, routine } from './edges'
import { isYellowCross } from './yellow'
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
  for (let move = edgesHint(state, recent); move; move = edgesHint(state, recent)) {
    expect(move.amount).not.toBe(2)
    expect(moves.length).toBeLessThan(500) // no going round in circles
    state = applyMove(state, move)
    moves.push(move)
    recent = [...recent, move].slice(-9)
  }
  return { moves, end: state }
}

/** How many whole goes of nine turns the moves hold, the yellow turns between them aside. */
function goes(moves: Move[]) {
  let count = 0
  for (let i = 0; i < moves.length;) {
    if (moves[i].layer === 'U') { i++; continue }
    const x = SIDES.find(x => routine(x).every((m, j) => moves[i + j] && sameMove(m, moves[i + j])))
    if (!x) return null
    count++
    i += 9
  }
  return count
}

describe('yellow edges', () => {
  it('is the yellow cross with every yellow edge on its own side', () => {
    expect(isYellowEdges(SOLVED)).toBe(true)
    expect(isYellowEdges(applyMove(SOLVED, turn('U')))).toBe(false)
    expect(isYellowCross(applyMove(SOLVED, turn('U')))).toBe(true)
    expect(order(applyMove(SOLVED, turn('U')))).toBe('lined')
  })

  it('has nine turns that keep the yellow cross', () => {
    for (const x of SIDES) expect(isYellowCross(applyMoves(SOLVED, routine(x)))).toBe(true)
  })

  it('takes a pair next to each other in one go and a pair across in two, with yellow turns between', () => {
    for (const x of SIDES) {
      for (const path of [[x], [x, x], [x, RIGHT(x)], [x, x, RIGHT(x)], [x, OPPOSITE(x)]]) {
        for (let u = 0; u < 4; u++) {
          const start = applyMoves(SOLVED, [...path.flatMap(y => undo(routine(y))), ...Array(u).fill(turn('U'))])
          const { moves, end } = follow(start)
          expect(isYellowEdges(end)).toBe(true)
          expect(goes(moves)).toBe(GOES[order(start)])
          expect(moves.length).toBe(edgesTurns(start))
        }
      }
    }
  })

  it('from anywhere makes the yellow cross first, then puts the yellow edges home', () => {
    const random = seeded(41)
    for (let i = 0; i < 15; i++) {
      const start = scramble(SOLVED, random)
      const { moves, end } = follow(start)
      expect(isYellowEdges(end)).toBe(true)
      expect(moves.length).toBe(edgesTurns(start))
    }
  })

  it('gets back on track after a stray turn or an undo in the middle of a go', () => {
    const random = seeded(42)
    for (let i = 0; i < 10; i++) {
      let state = edgesPuzzle(() => scramble(SOLVED, random), 2, random)
      const recent: Move[] = []
      for (let k = 0; k < 6; k++) {
        const move = edgesHint(state, recent)!
        state = applyMove(state, move)
        recent.push(move)
      }
      const stray = turn('L', 3)
      expect(isYellowEdges(follow(applyMove(state, stray), [...recent, stray]).end)).toBe(true)
      const back = inverse(recent[recent.length - 1])
      expect(isYellowEdges(follow(applyMove(state, back), [...recent, back]).end)).toBe(true)
    }
  })

  it('starts each level from its order, with the yellow cross made', () => {
    const random = seeded(43)
    const wanted = { 1: 'next', 2: 'across' } as Record<number, string>
    for (let level = 1; level <= 3; level++) {
      for (let i = 0; i < 8; i++) {
        const state = edgesPuzzle(() => scramble(SOLVED, random), level, random)
        expect(isYellowCross(state)).toBe(true)
        if (level < 3) expect(order(state)).toBe(wanted[level])
        else expect(order(state)).not.toBe('lined')
      }
    }
  })
})

function RIGHT(x: Face): Face { return SIDES[(SIDES.indexOf(x) + 1) % 4] }
function OPPOSITE(x: Face): Face { return SIDES[(SIDES.indexOf(x) + 2) % 4] }
