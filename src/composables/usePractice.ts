import { computed, shallowRef } from 'vue'
import { TURN_MS } from '../board/motion'
import {
  extendPath, pathFromSolved, randomTurns, twistCase, twistNext, TWIST_SLOT, type DrillKind,
} from '../cube/drills'
import { applyMoves, inverse, isSolved, pieceSlots, SOLVED, type CubeState, type Move } from '../cube/model'
import { IDENTITY } from '../cube/vec'
import { loadPractice, savePractice } from '../storage'
import { useCube } from './useCube'
import { useSheets } from './useSheets'

/** The drill in progress, if any. Replaced as a whole on every change. */
export interface Drill {
  kind: DrillKind
  /** For "undo": how many turns the cube was scrambled by. */
  level: number
  start: CubeState
  /** For "undo": the turns from solved to the start, so the hint can undo them one by one. */
  startPath: readonly Move[]
  /** The fewest turns it can be solved in, when known. */
  par: number | null
  /** Slots to ring on the board: the piece the player works on. */
  focus: readonly number[] | null
  moves: number
  hints: number
  done: boolean
  /** The player's turns since the start. */
  history: readonly Move[]
  /** The turns from solved to the current position, kept up to date as the player turns. */
  path: readonly Move[]
}

export const MAX_LEVEL = 5

const cube = useCube()
const sheets = useSheets()
const drill = shallowRef<Drill | null>(null)

function startDrill(kind: DrillKind, level = 1) {
  let start: CubeState, par: number | null = null, focus: readonly number[] | null = null
  if (kind === 'undo') {
    do start = applyMoves(SOLVED, randomTurns(level)); while (isSolved(start))
    par = level
    savePractice({ level })
  } else {
    start = twistCase()
    focus = pieceSlots(TWIST_SLOT)
    cube.setView(IDENTITY) // the method is described with the top face in the middle
  }
  const startPath = kind === 'undo' ? pathFromSolved(start, level) : []
  drill.value = { kind, level, start, startPath, par, focus, moves: 0, hints: 0, done: false, history: [], path: startPath }
  cube.reset(start)
  sheets.close()
  // the steps are explained once per drill, before the first puzzle; after that they are behind "Steps"
  const seen = loadPractice().seen ?? {}
  if (!seen[kind]) {
    savePractice({ seen: { ...seen, [kind]: true } })
    sheets.openIntro(false)
  }
}

/** Another puzzle of the same drill. */
function nextPuzzle() {
  if (drill.value) startDrill(drill.value.kind, drill.value.level)
}

function retry() {
  const d = drill.value
  if (!d) return
  cube.reset(d.start)
  drill.value = { ...d, moves: 0, hints: 0, done: false, history: [], path: d.startPath }
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

/** Count one of the player's turns towards the drill. Called before the turn is made. */
function recordTurn(move: Move) {
  const d = drill.value
  if (!d || d.done) return
  drill.value = { ...d, moves: d.moves + 1, history: [...d.history, move], path: extendPath(d.path, move) }
}

function hint() {
  const d = drill.value
  if (!d || d.done || cube.busy.value) return
  const move = d.kind === 'twist'
    ? twistNext(d.history, cube.state.value).move
    : d.path.length ? inverse(d.path[d.path.length - 1]) : null
  if (!move) return
  drill.value = { ...d, hints: d.hints + 1 }
  cube.showArrows(move, 900) // hold the arrows a little longer than after a turn
}

/** For the twist drill: which step of the routine comes next (0–3 in the algorithm, 4 for turning the top). */
const twistStep = computed(() => {
  const d = drill.value
  return d && d.kind === 'twist' && !d.done ? twistNext(d.history, cube.state.value).step : null
})

cube.onTurnApplied(() => {
  const d = drill.value
  if (!d || d.done || !isSolved(cube.state.value)) return
  drill.value = { ...d, done: true }
  setTimeout(() => { if (drill.value?.done) sheets.open('done') }, TURN_MS + 300) // let the last turn land first
})

export function usePractice() {
  return {
    drill, twistStep,
    startDrill, nextPuzzle, retry, stop, resetToSolved, recordTurn, hint,
    /** The "undo" level to offer: the one being played, or the last one played. */
    currentLevel: () => drill.value?.kind === 'undo' ? drill.value.level : loadPractice().level ?? 1,
  }
}
