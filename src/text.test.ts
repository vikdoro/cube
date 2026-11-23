import { describe, expect, it } from 'vitest'
import type { Drill } from './composables/usePractice'
import type { DrillDef } from './drills'
import { SOLVED } from 'flatcube'
import { doneSummary, doneTitle, drillTitle, fill, richText } from './text'

// a made-up drill, so editing the real drills' copy doesn't break these
const def: DrillDef = {
  kind: 'test-drill',
  routine: 'cross',
  title: 'Test drill',
  pick: 'Do the test',
  about: 'A drill for the tests.',
  doneName: 'Test',
  onPar: 'No wasted turns.',
  overPar: 'The routine takes {par}.',
  steps: ['It takes {turns}.'],
  view: 'yellow-middle',
  guided: false,
}

const drill = (moves = 0, par = 0, hints = 0): Drill =>
  ({ kind: 'test-drill', start: SOLVED, par, moves, hints, hintShown: false, done: false, recent: [], guided: false })

describe('drill names', () => {
  it('titles a drill by its name', () => {
    expect(drillTitle(drill(), def)).toBe('Test drill')
  })

  it('says what was made, and in how many moves', () => {
    expect(doneTitle(drill(7), def)).toBe('Test in 7 moves')
    expect(doneTitle(drill(1), def)).toBe('Test in 1 move')
  })
})

describe('the done sheet', () => {
  it('says how the turns went against par, then the hints', () => {
    expect(doneSummary(drill(9, 9), def)).toBe('No wasted turns. No hints.')
    expect(doneSummary(drill(8, 9, 1), def)).toBe('No wasted turns. You used 1 hint.')
    expect(doneSummary(drill(12, 9, 2), def)).toBe('The routine takes 9. You used 2 hints.')
  })
})

describe('copy placeholders', () => {
  it('fills in the par, as turns or as a number', () => {
    expect(fill('It takes {turns}.', 12)).toBe('It takes 12 turns.')
    expect(fill('It takes {turns}.', 1)).toBe('It takes 1 turn.')
    expect(fill('The routine takes {par}.', 9)).toBe('The routine takes 9.')
    expect(fill('Nothing to fill.', 9)).toBe('Nothing to fill.')
  })

  it('splits bold words out, after filling in', () => {
    expect(richText('Bring the **white edges** round, in {turns}.', 12)).toEqual([
      { text: 'Bring the ', bold: false },
      { text: 'white edges', bold: true },
      { text: ' round, in 12 turns.', bold: false },
    ])
    expect(richText('**Hint** draws the next turn.', 3)).toEqual([
      { text: 'Hint', bold: true },
      { text: ' draws the next turn.', bold: false },
    ])
    expect(richText('Plain.', 3)).toEqual([{ text: 'Plain.', bold: false }])
  })
})
