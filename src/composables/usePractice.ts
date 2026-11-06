import { shallowRef } from 'vue'
import { TURN_MS } from '../board/motion'
import { extendPath, pathFromSolved, randomTurns, type DrillKind } from '../cube/drills'
import { applyMoves, inverse, isSolved, SOLVED, type CubeState, type Move } from '../cube/model'
import { IDENTITY } from '../cube/vec'
import { loadPractice, savePractice } from '../storage'
import { useCube } from './useCube'
import { useSheets } from './useSheets'

/** The drill in progress, if any. Replaced as a whole on every change. */
export interface Drill {
  kind: DrillKind
  /** How many turns the cube was scrambled by. */
  level: number
  start: CubeState
  /** The turns from solved to the start, so the hint can undo them one by one. */
  startPath: readonly Move[]
  /** The fewest turns it can be solved in, when known. */
  par: number | null
  moves: number
  hints: number
  /** A hint was shown since the last turn. */
  hintShown: boolean
  done: boolean
  /** The turns from solved to the current position, kept up to date as the player turns. */
  path: readonly Move[]
}

export const MAX_LEVEL = 5

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
  drill.value = { kind: 'undo', level, start, startPath, par: level, path: startPath, ...fresh }
  cube.reset(start)
  sheets.close()
  // the steps are explained once, before the first puzzle; after that they are behind "Steps"
  const seen = loadPractice().seen ?? {}
  if (!seen.undo) {
    savePractice({ seen: { ...seen, undo: true } })
    sheets.openIntro(false)
  }
}

function nextPuzzle() {
  const d = drill.value
  if (d) startUndo(d.level)
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
  if (!d || d.done || cube.busy.value || !d.path.length) return
  drill.value = { ...d, hints: d.hints + 1, hintShown: true }
  cube.showArrows(inverse(d.path[d.path.length - 1]), 900) // hold the arrows a little longer than after a turn
}

cube.onTurnApplied(() => {
  const d = drill.value
  if (!d || d.done || !isSolved(cube.state.value)) return
  drill.value = { ...d, done: true }
  setTimeout(() => { if (drill.value?.done) sheets.open('done') }, TURN_MS + 300) // let the last turn land first
})

export function usePractice() {
  return {
    drill,
    startUndo, nextPuzzle, retry, stop, resetToSolved, startOver, recordTurn, hint,
    /** The level to offer: the one being played, or the last one played. */
    currentLevel: () => drill.value?.level ?? loadPractice().level ?? 1,
  }
}
