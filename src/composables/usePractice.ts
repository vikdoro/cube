import { shallowRef } from 'vue'
import { IDENTITY, rollTowards, SOLVED, type CubeState, type Move } from 'flatcube'
import { TURN_MS } from 'flatcube/board'
import { scramble, type DrillKind } from '../cube/drills'
import { cornersHint, cornersPuzzle, cornersTurns, isFirstLayer } from '../cube/corners'
import { crossHint, crossPuzzle, isCross, routineTurns } from '../cube/cross'
import { isLily, lilyDistance, lilyHint, lilyPuzzle } from '../cube/lily'
import { isTwoLayers, middleHint, middlePuzzle, middleTurns } from '../cube/middle'
import { isYellowCross, yellowHint, yellowPuzzle, yellowTurns } from '../cube/yellow'
import { edgesHint, edgesPuzzle, edgesTurns, isYellowEdges } from '../cube/edges'
import { loadPractice, savePractice } from '../storage'
import { board as cube } from '../board'
import { useSheets } from './useSheets'

/** The drill in progress, if any. Replaced as a whole on every change. */
export interface Drill {
  kind: DrillKind
  start: CubeState
  /** The turns the routine takes from the start; for the lily, the fewest it can be made in. */
  par: number
  moves: number
  hints: number
  /** Played guided: the steps told as story slides, every turn shown on the board (see useGuide). */
  guided: boolean
  /** A hint was shown since the last turn. */
  hintShown: boolean
  done: boolean
  /** The last seven turns as made, newest last, so the corners, middle, yellow and edges hints can finish a sequence begun. */
  recent: readonly Move[]
}

/** Whether the drill's goal is reached. */
const GOAL: Record<DrillKind, (state: CubeState) => boolean> = {
  lily: isLily, cross: isCross, corners: isFirstLayer, middle: isTwoLayers, yellow: isYellowCross, edges: isYellowEdges,
}

const sheets = useSheets()
const drill = shallowRef<Drill | null>(null)

const fresh = { moves: 0, hints: 0, hintShown: false, done: false, recent: [] } as const

const scrambled = () => scramble(SOLVED)
// white in the middle for the corners, where the slots being filled are easiest to see, and yellow on the lid;
// yellow in the middle for the rest
const WHITE_UP = rollTowards(IDENTITY, [0, -1, 0])

/**
 * Each drill's puzzle, from where the step before leaves the cube: the lily from a full scramble, the cross from the
 * lily, the corners from the cross, the middle layer from the white face, the yellow cross from the first two layers
 * (any shape on top) and the yellow edges from the yellow cross (in any order). The puzzle makers can stop partway
 * through a step too; the tests use that.
 */
const PUZZLE: Record<DrillKind, () => { start: CubeState, par: (start: CubeState) => number }> = {
  lily: () => ({ start: lilyPuzzle(scrambled, 4), par: lilyDistance }),
  cross: () => ({ start: crossPuzzle(scrambled, 4), par: routineTurns }),
  corners: () => ({ start: cornersPuzzle(scrambled, 4), par: cornersTurns }),
  middle: () => ({ start: middlePuzzle(scrambled, 4), par: middleTurns }),
  yellow: () => ({ start: yellowPuzzle(scrambled, 4), par: yellowTurns }),
  edges: () => ({ start: edgesPuzzle(scrambled, 3), par: edgesTurns }),
}

/** Start a drill with a new puzzle. */
function start(kind: DrillKind) {
  const { start, par } = PUZZLE[kind]()
  const guided = !!loadPractice().guided?.[kind] // only drills with a guide play it (see useGuide)
  begin({ kind, start, par: par(start), ...fresh, guided })
  cube.setView(kind === 'corners' ? WHITE_UP : IDENTITY)
}

function begin(next: Drill) {
  drill.value = next
  cube.reset(next.start)
  sheets.close()
  // the steps are explained once, before the first puzzle; after that they are behind "Steps". Guided play explains
  // as it goes instead.
  const seen = loadPractice().seen ?? {}
  if (!seen[next.kind] && !next.guided) {
    savePractice({ seen: { ...seen, [next.kind]: true } })
    sheets.openIntro(false)
  }
}

function nextPuzzle() {
  const d = drill.value
  if (d) start(d.kind)
}

function retry() {
  const d = drill.value
  if (!d) return
  cube.reset(d.start)
  drill.value = { ...d, ...fresh }
}

function stop() {
  drill.value = null
}

/** Stop practising and go back to a solved cube. */
function resetToSolved() {
  stop()
  sheets.close()
  cube.reset(SOLVED)
}

/** Start over from the logo: a solved cube, held as at the start. */
function startOver() {
  resetToSolved()
  cube.setView(IDENTITY)
}

/** Count one of the player's turns towards the drill. Called before the turn is made. */
function recordTurn(move: Move) {
  const d = drill.value
  if (!d || d.done) return
  drill.value = {
    ...d, moves: d.moves + 1, hintShown: false, recent: [...d.recent, move].slice(-7),
  }
}

/** The next turn to suggest for a drill, if any. */
const HINT: Record<DrillKind, (d: Drill) => Move | null> = {
  lily: () => lilyHint(cube.state.value),
  cross: () => crossHint(cube.state.value),
  corners: d => cornersHint(cube.state.value, d.recent),
  middle: d => middleHint(cube.state.value, d.recent),
  yellow: d => yellowHint(cube.state.value, d.recent),
  edges: d => edgesHint(cube.state.value, d.recent),
}

function hint() {
  const d = drill.value
  if (!d || d.done || cube.busy.value) return
  const move = HINT[d.kind](d)
  if (!move) return
  drill.value = { ...d, hints: d.hints + 1, hintShown: true }
  cube.showArrows(move, 900) // hold the arrows a little longer than after a turn
}

cube.onTurnApplied(() => {
  const d = drill.value
  if (!d || d.done || !GOAL[d.kind](cube.state.value)) return
  drill.value = { ...d, done: true }
  setTimeout(() => { if (drill.value?.done) sheets.open('done') }, TURN_MS + 300) // let the last turn land first
})

export function usePractice() {
  return {
    drill,
    start, nextPuzzle, retry, stop, resetToSolved, startOver, recordTurn, hint,
  }
}
