import { shallowRef } from 'vue'
import { TURN_MS } from '../board/motion'
import { extendPath, pathFromSolved, randomTurns, scramble, type DrillKind } from '../cube/drills'
import { isLily, lilyDistance, lilyHint, lilyPuzzle } from '../cube/lily'
import { applyMoves, inverse, isSolved, SOLVED, type CubeState, type Move } from '../cube/model'
import { IDENTITY } from '../cube/vec'
import { loadPractice, savePractice } from '../storage'
import { useCube } from './useCube'
import { useSheets } from './useSheets'

/** The drill in progress, if any. Replaced as a whole on every change. */
export interface Drill {
  kind: DrillKind
  /** Undo: how many turns the cube was scrambled by. Lily: how many petals are left to place, 4 for a full scramble. */
  level: number
  start: CubeState
  /** Undo: the turns from solved to the start, so the hint can undo them one by one. */
  startPath: readonly Move[]
  /** The fewest turns it can be solved in, when known. */
  par: number | null
  moves: number
  hints: number
  /** A hint was shown since the last turn. */
  hintShown: boolean
  done: boolean
  /** Undo: the turns from solved to the current position, kept up to date as the player turns. */
  path: readonly Move[]
}

export const MAX_LEVEL: Record<DrillKind, number> = { undo: 5, lily: 4 }

/** Whether the drill's goal is reached. */
const isGoal = (kind: DrillKind, state: CubeState) => kind === 'lily' ? isLily(state) : isSolved(state)

const cube = useCube()
const sheets = useSheets()
const drill = shallowRef<Drill | null>(null)

const fresh = { moves: 0, hints: 0, hintShown: false, done: false } as const

/** Undo a few random turns. */
function startUndo(level = 1) {
  let start: CubeState
  do start = applyMoves(SOLVED, randomTurns(level)); while (isSolved(start))
  savePractice({ level })
  const startPath = pathFromSolved(start, level)
  begin({ kind: 'undo', level, start, startPath, par: level, path: startPath, ...fresh })
}

/** Make the white lily, with a few petals left to place or from a full scramble. Yellow starts in the middle. */
function startLily(level = 1) {
  const start = lilyPuzzle(() => scramble(SOLVED), level)
  savePractice({ lilyLevel: level })
  begin({ kind: 'lily', level, start, startPath: [], par: lilyDistance(start), path: [], ...fresh })
  cube.setView(IDENTITY)
}

function begin(next: Drill) {
  drill.value = next
  cube.reset(next.start)
  sheets.close()
  // the steps are explained once, before the first puzzle; after that they are behind "Steps"
  const seen = loadPractice().seen ?? {}
  if (!seen[next.kind]) {
    savePractice({ seen: { ...seen, [next.kind]: true } })
    sheets.openIntro(false)
  }
}

const START: Record<DrillKind, (level: number) => void> = { undo: startUndo, lily: startLily }

/** Start a drill at a level. */
const start = (kind: DrillKind, level: number) => START[kind](level)

function nextPuzzle() {
  const d = drill.value
  if (d) start(d.kind, d.level)
}

function retry() {
  const d = drill.value
  if (!d) return
  cube.reset(d.start)
  drill.value = { ...d, path: d.startPath, ...fresh }
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
  drill.value = { ...d, moves: d.moves + 1, hintShown: false, path: extendPath(d.path, move) }
}

function hint() {
  const d = drill.value
  if (!d || d.done || cube.busy.value) return
  const move = d.kind === 'lily' ? lilyHint(cube.state.value) : d.path.length ? inverse(d.path[d.path.length - 1]) : null
  if (!move) return
  drill.value = { ...d, hints: d.hints + 1, hintShown: true }
  cube.showArrows(move, 900) // hold the arrows a little longer than after a turn
}

cube.onTurnApplied(() => {
  const d = drill.value
  if (!d || d.done || !isGoal(d.kind, cube.state.value)) return
  drill.value = { ...d, done: true }
  setTimeout(() => { if (drill.value?.done) sheets.open('done') }, TURN_MS + 300) // let the last turn land first
})

export function usePractice() {
  return {
    drill,
    start, nextPuzzle, retry, stop, resetToSolved, startOver, recordTurn, hint,
    /** The level to offer: the one being played, or the last one played. */
    currentLevel: (kind: DrillKind) => {
      if (drill.value?.kind === kind) return drill.value.level
      const memory = loadPractice()
      return (kind === 'lily' ? memory.lilyLevel : memory.level) ?? 1
    },
  }
}
