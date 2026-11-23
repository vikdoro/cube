import { describe, expect, it } from 'vitest'
import { applyMove, type Move } from 'flatcube'
import { checkDrills, ROUTINES, type Routine } from './cube/drills'
import { drillDef, DRILLS, type DrillDef } from './drills'

// a drill that passes every check, to break one field at a time
const good: DrillDef = {
  kind: 'test-drill',
  routine: 'lily',
  title: 'Test drill',
  pick: 'Do the test',
  about: 'A drill for the tests.',
  doneName: 'Test',
  onPar: 'No wasted turns.',
  overPar: 'The routine takes {par}.',
  steps: ['Bring the **white edges** up.', 'It takes {turns}.'],
  view: 'yellow-middle',
  guided: false,
}

const problems = (patch: Partial<DrillDef>, routines: Record<string, Routine> = ROUTINES) =>
  checkDrills([{ ...good, ...patch }], routines)

/** Exactly one problem, about this drill and this field. */
function expectOne(found: string[], kind: string, field: string) {
  expect(found).toHaveLength(1)
  expect(found[0].startsWith(kind)).toBe(true)
  expect(found[0]).toContain(field)
}

describe('the drills file', () => {
  it('has nothing wrong with it', () => {
    expect(checkDrills(DRILLS, ROUTINES)).toEqual([])
  })

  it('passes a good drill', () => {
    expect(problems({})).toEqual([])
  })

  it('wants a kind of lowercase letters and hyphens, used once', () => {
    expectOne(problems({ kind: '' }), 'drill 1', 'kind')
    expectOne(problems({ kind: 'Test Drill' }), 'Test Drill', 'kind')
    const twice = checkDrills([good, { ...good }], ROUTINES)
    expectOne(twice, 'test-drill', 'kind')
  })

  it('wants a routine that exists', () => {
    expectOne(problems({ routine: 'nope' as DrillDef['routine'] }), 'test-drill', 'routine')
  })

  it('wants a guide for a guided drill', () => {
    expectOne(problems({ routine: 'cross', guided: true }), 'test-drill', 'guided')
    expect(problems({ routine: 'lily', guided: true })).toEqual([])
  })

  it('wants every piece of copy filled in', () => {
    for (const field of ['title', 'pick', 'about', 'doneName', 'onPar', 'overPar'] as const) {
      expectOne(problems({ [field]: ' ' }), 'test-drill', field)
    }
    expectOne(problems({ steps: [] }), 'test-drill', 'steps')
    expectOne(problems({ steps: ['One.', ''] }), 'test-drill', 'steps')
  })

  it('wants a known view', () => {
    expectOne(problems({ view: 'upside-down' as DrillDef['view'] }), 'test-drill', 'view')
  })

  it('allows {turns} in steps and {par} in the done sentences, nowhere else', () => {
    expect(problems({ steps: ['It takes {turns}.'], onPar: 'Under {par}.', overPar: 'It takes {par}.' })).toEqual([])
    expectOne(problems({ steps: ['It takes {par}.'] }), 'test-drill', 'steps')
    expectOne(problems({ steps: ['It takes {moves}.'] }), 'test-drill', 'steps')
    expectOne(problems({ overPar: 'It takes {turns}.' }), 'test-drill', 'overPar')
    expectOne(problems({ about: 'It takes {turns}.' }), 'test-drill', 'about')
    expectOne(problems({ title: 'Drill {par}' }), 'test-drill', 'title')
  })

  it('allows bold only in steps, opened and closed', () => {
    expectOne(problems({ steps: ['Bring the **white edges up.'] }), 'test-drill', 'steps')
    expectOne(problems({ about: 'The **white** edges.' }), 'test-drill', 'about')
  })

  it('finds a drill by its kind', () => {
    expect(drillDef('lily')).toBe(DRILLS.find(d => d.kind === 'lily'))
    expect(() => drillDef('nope')).toThrow('No drill "nope"')
  })
})

describe('the routines', () => {
  it('are the six steps of the method, two of them guided', () => {
    const routines: Record<string, Routine> = ROUTINES
    expect(Object.keys(routines).sort()).toEqual(['corners', 'cross', 'edges', 'lily', 'middle', 'yellow'])
    expect(Object.keys(routines).filter(id => routines[id].guide).sort()).toEqual(['lily', 'middle'])
  })

  it('make puzzles that their hints solve', () => {
    for (const [id, routine] of Object.entries(ROUTINES as Record<string, Routine>)) {
      for (let i = 0; i < 2; i++) {
        let state = routine.puzzle(), recent: Move[] = []
        expect(routine.goal(state), id).toBe(false)
        expect(routine.par(state), id).toBeGreaterThan(0)
        for (let turns = 0; !routine.goal(state) && turns < 200; turns++) {
          const move = routine.hint(state, recent)
          expect(move, id).not.toBeNull()
          state = applyMove(state, move!)
          recent = [...recent, move!].slice(-7)
        }
        expect(routine.goal(state), id).toBe(true)
      }
    }
  })
})
