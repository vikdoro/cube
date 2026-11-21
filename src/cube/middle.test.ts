import { describe, expect, it } from 'vitest'
import { isFirstLayer } from './corners'
import { scramble } from './drills'
import { isTwoLayers, middleHint, middlePuzzle, middleTurns, placedEdges } from './middle'
import { applyMove, applyMoves, sameMove, SOLVED, type CubeState, type Face, type Move } from 'flatcube'

// a seeded generator, so failures can be reproduced
function seeded(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31 }
}

const turn = (layer: Face, amount: Move['amount'] = 1): Move => ({ layer, amount })
const RIGHT: Record<string, Face> = { F: 'R', R: 'B', B: 'L', L: 'F' }
// the eight turns for every side and both ways
const INSERTS = (['F', 'R', 'B', 'L'] as Face[]).flatMap(x => [
  [turn('U'), turn(RIGHT[x]), turn('U', 3), turn(RIGHT[x], 3), turn('U', 3), turn(x, 3), turn('U'), turn(x)],
  [turn('U', 3), turn(x, 3), turn('U'), turn(x), turn('U'), turn(RIGHT[x]), turn('U', 3), turn(RIGHT[x], 3)],
])

/** Follow the hints to the end, as the player would, each one a quarter turn. */
function follow(state: CubeState, recent: Move[] = []) {
  const moves: Move[] = []
  for (let move = middleHint(state, recent); move; move = middleHint(state, recent)) {
    expect(move.amount).not.toBe(2)
    expect(moves.length).toBeLessThan(400) // no going round in circles
    state = applyMove(state, move)
    moves.push(move)
    recent = [...recent, move].slice(-7)
  }
  return { moves, end: state }
}

/** The moves cut into whole eight-turn goes and U turns, or null if they don't cut that way. */
function cut(moves: Move[]) {
  const steps: (Move | Move[])[] = []
  for (let i = 0; i < moves.length;) {
    const go = INSERTS.find(t => t.every((m, j) => moves[i + j] && sameMove(m, moves[i + j])))
    if (go) { steps.push(go); i += 8; continue }
    if (moves[i].layer !== 'U') return null
    steps.push(moves[i++])
  }
  return steps
}

describe('middle layer', () => {
  it('is the white face and the four middle edges home, whatever the yellow face does', () => {
    expect(isTwoLayers(SOLVED)).toBe(true)
    expect(isTwoLayers(applyMove(SOLVED, turn('U')))).toBe(true)
    expect(isTwoLayers(applyMove(SOLVED, turn('R')))).toBe(false)
    expect(placedEdges(applyMoves(SOLVED, INSERTS[0]))).toBe(3)
  })

  it('has eight turns that keep the white face and the other three middle edges', () => {
    for (const go of INSERTS) {
      const state = applyMoves(SOLVED, go)
      expect(isFirstLayer(state)).toBe(true)
      expect(placedEdges(state)).toBe(3)
    }
  })

  it('puts an edge in with one go once it makes a T, either way', () => {
    for (const go of INSERTS) {
      // undo the eight turns from solved: the edge is on the yellow face, ready to go in
      const start = applyMoves(SOLVED, [...go].reverse().map(m => ({ ...m, amount: (4 - m.amount) as Move['amount'] })))
      const { moves, end } = follow(start)
      expect(isTwoLayers(end)).toBe(true)
      expect(moves).toEqual(go)
    }
  })

  it('from a done white face turns only the yellow face and whole goes of eight, and never loses a placed edge', () => {
    const random = seeded(21)
    for (let toPlace = 1; toPlace <= 4; toPlace++) {
      for (let i = 0; i < 15; i++) {
        const start = middlePuzzle(() => scramble(SOLVED, random), toPlace)
        const { moves, end } = follow(start)
        expect(isTwoLayers(end)).toBe(true)
        expect(moves.length).toBe(middleTurns(start))
        const steps = cut(moves)
        expect(steps).not.toBeNull()
        let state = start, home = placedEdges(start), run = 0
        for (const step of steps!) {
          state = Array.isArray(step) ? applyMoves(state, step) : applyMove(state, step)
          expect(isFirstLayer(state)).toBe(true)
          expect(placedEdges(state)).toBeGreaterThanOrEqual(home)
          home = placedEdges(state)
          run = Array.isArray(step) ? 0 : run + 1
          expect(run).toBeLessThanOrEqual(2) // the yellow face never turns more than a half turn to make a T
        }
      }
    }
  })

  it('from anywhere makes the white face first, then the middle layer', () => {
    const random = seeded(22)
    for (let i = 0; i < 20; i++) {
      const start = scramble(SOLVED, random)
      const { moves, end } = follow(start)
      expect(isTwoLayers(end)).toBe(true)
      expect(moves.length).toBe(middleTurns(start))
    }
  })

  it('gets back on track after a stray turn in the middle of a go', () => {
    const random = seeded(23)
    for (let i = 0; i < 10; i++) {
      const start = middlePuzzle(() => scramble(SOLVED, random), 4)
      let state = start, recent: Move[] = []
      for (let k = 0; k < 3; k++) {
        const move = middleHint(state, recent)!
        state = applyMove(state, move)
        recent.push(move)
      }
      const stray = turn('L', 3)
      expect(isTwoLayers(follow(applyMove(state, stray), [...recent, stray]).end)).toBe(true)
    }
  })

  it('leaves the asked number of edges to place', () => {
    const random = seeded(24)
    for (let toPlace = 1; toPlace <= 4; toPlace++) {
      for (let i = 0; i < 10; i++) {
        const state = middlePuzzle(() => scramble(SOLVED, random), toPlace)
        expect(isFirstLayer(state)).toBe(true)
        expect(placedEdges(state)).toBe(4 - toPlace)
      }
    }
  })

  it('gives the scramble as it is at the last level, skipping one with two layers already done', () => {
    const scrambled = scramble(SOLVED, seeded(25))
    const queue = [applyMove(SOLVED, turn('U')), scrambled]
    expect(middlePuzzle(() => queue.shift() as CubeState, 5)).toEqual(scrambled)
  })
})
