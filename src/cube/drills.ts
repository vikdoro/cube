import { applyMove, FACES, SOLVED, type CubeState, type Move } from 'flatcube'
import type { DrillDef } from '../drills'
import type { Guide } from './guide'
import { cornersHint, cornersPuzzle, cornersTurns, isFirstLayer } from './corners'
import { crossHint, crossPuzzle, isCross, routineTurns } from './cross'
import { isLily, lilyDistance, lilyHint, lilyPuzzle } from './lily'
import { lilyGuide } from './lilyGuide'
import { isTwoLayers, middleHint, middlePuzzle, middleTurns } from './middle'
import { middleGuide } from './middleGuide'
import { isYellowCross, yellowHint, yellowPuzzle, yellowTurns } from './yellow'
import { edgesHint, edgesPuzzle, edgesTurns, isYellowEdges } from './edges'

const randomInt = (n: number, random: () => number) => Math.floor(random() * n)

/** 20 random turns of any amount, applied to `state`. */
export function scramble(state: CubeState, random = Math.random) {
  for (let i = 0; i < 20; i++) {
    state = applyMove(state, { layer: FACES[randomInt(6, random)], amount: (1 + randomInt(3, random)) as Move['amount'] })
  }
  return state
}

const scrambled = () => scramble(SOLVED)

/** The cube logic of one step of the method; a drill in src/drills.ts names the routine it plays. */
export interface Routine {
  /** Whether the goal is reached. */
  goal: (state: CubeState) => boolean
  /** A new puzzle, from where the step before leaves the cube. */
  puzzle: () => CubeState
  /** The turns the routine takes from the start; for the lily, the fewest it can be made in. */
  par: (start: CubeState) => number
  /** The next turn to suggest; `recent` is the last seven turns made, newest last. */
  hint: (state: CubeState, recent: readonly Move[]) => Move | null
  /** The story told when the drill is played guided. */
  guide?: Guide
}

/**
 * One routine per step of the method, each from where the step before leaves the cube: the lily from a full scramble,
 * the cross from the lily, the corners from the cross, the middle layer from the white face, the yellow cross from the
 * first two layers (any shape on top) and the yellow edges from the yellow cross (in any order). The puzzle makers can
 * stop partway through a step too; the tests use that. A routine is guided by giving it a `guide`.
 */
const routines = {
  lily: { goal: isLily, puzzle: () => lilyPuzzle(scrambled, 4), par: lilyDistance, hint: lilyHint, guide: lilyGuide },
  cross: { goal: isCross, puzzle: () => crossPuzzle(scrambled, 4), par: routineTurns, hint: crossHint },
  corners: { goal: isFirstLayer, puzzle: () => cornersPuzzle(scrambled, 4), par: cornersTurns, hint: cornersHint },
  middle: { goal: isTwoLayers, puzzle: () => middlePuzzle(scrambled, 4), par: middleTurns, hint: middleHint, guide: middleGuide },
  yellow: { goal: isYellowCross, puzzle: () => yellowPuzzle(scrambled, 4), par: yellowTurns, hint: yellowHint },
  edges: { goal: isYellowEdges, puzzle: () => edgesPuzzle(scrambled, 3), par: edgesTurns, hint: edgesHint },
} satisfies Record<string, Routine>

export type RoutineId = keyof typeof routines
/** `satisfies` keeps the ids; this view makes every entry a Routine, with its optional guide. */
export const ROUTINES: Record<RoutineId, Routine> = routines

const PLACEHOLDER = /\{[^}]*\}/g

/** What's wrong with these drills, in plain words; empty when nothing is. */
export function checkDrills(drills: readonly DrillDef[], routines: Record<string, Routine>): string[] {
  const found: string[] = []
  const seen = new Set<string>()
  drills.forEach((d, i) => {
    const name = d.kind || `drill ${i + 1}`
    const wrong = (field: string, what: string) => found.push(`${name}: ${field} ${what}`)
    if (!/^[a-z-]+$/.test(d.kind)) wrong('kind', 'must be lowercase letters and hyphens')
    else if (seen.has(d.kind)) wrong('kind', 'is used by another drill')
    seen.add(d.kind)
    const routine = routines[d.routine]
    if (!routine) wrong('routine', `"${d.routine}" does not exist`)
    else if (d.guided && !routine.guide) wrong('guided', `is on, but the routine "${d.routine}" has no guide`)
    if (d.view !== 'yellow-middle' && d.view !== 'white-middle') wrong('view', 'must be yellow-middle or white-middle')
    const text = { title: d.title, pick: d.pick, about: d.about, doneName: d.doneName, onPar: d.onPar, overPar: d.overPar }
    for (const [field, value] of Object.entries(text)) {
      if (!value.trim()) wrong(field, 'is empty')
      check(field, value, field === 'onPar' || field === 'overPar' ? '{par}' : null)
    }
    if (!d.steps.length) wrong('steps', 'has none')
    d.steps.forEach((step, k) => {
      const field = `steps (step ${k + 1})`
      if (!step.trim()) wrong(field, 'is empty')
      check(field, step, '{turns}')
    })

    /** Only `allowed` may be in braces, and bold only in steps, opened and closed. */
    function check(field: string, value: string, allowed: string | null) {
      const bad = (value.match(PLACEHOLDER) ?? []).find(p => p !== allowed)
      if (bad) wrong(field, allowed ? `has ${bad}; only ${allowed} can be filled in` : `has ${bad}; nothing can be filled in here`)
      const bold = value.split('**').length - 1
      if (bold && !field.startsWith('steps')) wrong(field, 'has ** bold marks, which only steps can use')
      else if (bold % 2) wrong(field, 'has a ** bold mark that is not closed')
    }
  })
  return found
}
