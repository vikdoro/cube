import { computed, shallowRef } from 'vue'
import { TURN_MS } from '../board/motion'
import { coachHint, coachStart, coachTurn, type Coach } from '../cube/coach'
import { extendPath, pathFromSolved, randomTurns, type DrillKind } from '../cube/drills'
import type { Chunk, StageId } from '../cube/method'
import { applyMoves, inverse, isSolved, SOLVED, type CubeState, type Move } from '../cube/model'
import { stage } from '../cube/stages'
import { IDENTITY } from '../cube/vec'
import { loadPractice, savePractice } from '../storage'
import { LESSON_SIZE, useCourse, type Scaffold } from './useCourse'
import { useCube } from './useCube'
import { useSheets } from './useSheets'

/** The drill in progress, if any. Replaced as a whole on every change. */
export interface Drill {
  kind: DrillKind
  /** For "undo": how many turns the cube was scrambled by. */
  level: number
  /** For a lesson: the stage being learnt, how much help it gets, and how far through the lesson it is. */
  stage: StageId | null
  scaffold: Scaffold | null
  lesson: { index: number; clean: number } | null
  /** When the lesson is over: the meter before and after. */
  result: { before: number; after: number } | null
  start: CubeState
  /** For "undo": the turns from solved to the start, so the hint can undo them one by one. */
  startPath: readonly Move[]
  /** The fewest turns it can be solved in, when known. */
  par: number | null
  /** Slots to ring on the board: the piece the player works on. */
  focus: readonly number[] | null
  moves: number
  hints: number
  /** A hint was shown since the last turn. */
  hintShown: boolean
  done: boolean
  /** The turns from solved to the current position, kept up to date as the player turns. */
  path: readonly Move[]
  /** For a lesson: the coach following the method. */
  coach: Coach | null
}

/** The routine under the board: setup turns, the stage's algorithm in chunks, setup turned back, and what is lit. */
export interface RoutineView {
  stageTitle: string
  label: string
  pre: readonly Move[]
  chunks: readonly Chunk[]
  post: readonly Move[]
  lit: { part: 'pre' | 'alg' | 'post'; index: number } | null
  /** The turn that puts a wrong move right, when the learner is off the routine. */
  offTrack: Move | null
}

export const MAX_LEVEL = 5

const cube = useCube()
const sheets = useSheets()
const course = useCourse()
const drill = shallowRef<Drill | null>(null)

const fresh = { result: null, moves: 0, hints: 0, hintShown: false, done: false } as const

/** The warm-up: undo a few random turns. */
function startUndo(level = 1) {
  let start: CubeState
  do start = applyMoves(SOLVED, randomTurns(level)); while (isSolved(start))
  savePractice({ level })
  const startPath = pathFromSolved(start, level)
  drill.value = {
    kind: 'undo', level, stage: null, scaffold: null, lesson: null, coach: null, focus: null,
    start, startPath, par: level, path: startPath, ...fresh,
  }
  cube.reset(start)
  sheets.close()
  // the steps are explained once, before the first puzzle; after that they are behind "Steps"
  const seen = loadPractice().seen ?? {}
  if (!seen.undo) {
    savePractice({ seen: { ...seen, undo: true } })
    sheets.openIntro(false)
  }
}

/** A lesson: LESSON_SIZE puzzles of one stage, with the help its meter calls for. */
function startLesson(id: StageId) {
  const scaffold = course.scaffold(id)
  cube.setView(IDENTITY) // the method is described with the top face in the middle
  const start = stage(id).start(Math.random)
  drill.value = {
    kind: 'stage', level: 0, stage: id, scaffold, lesson: { index: 0, clean: 0 }, start, startPath: [], par: null,
    focus: stage(id).focus(start), path: [], coach: coachStart(start), ...fresh,
  }
  cube.reset(start)
  sheets.close()
  if (scaffold === 'follow') sheets.openIntro(false) // a stage that is new is explained first
  follow()
}

/** The next puzzle: of the same lesson, or of a fresh lesson once this one is over. */
function nextPuzzle() {
  const d = drill.value
  if (!d) return
  if (d.kind === 'undo') return startUndo(d.level)
  if (!d.lesson || d.lesson.index + 1 >= LESSON_SIZE) return startLesson(d.stage!)
  const start = stage(d.stage!).start(Math.random)
  drill.value = { ...d, lesson: { ...d.lesson, index: d.lesson.index + 1 }, start, focus: stage(d.stage!).focus(start), path: [], coach: coachStart(start), ...fresh }
  cube.reset(start)
  follow()
}

function retry() {
  const d = drill.value
  if (!d) return
  cube.reset(d.start)
  drill.value = { ...d, path: d.startPath, coach: d.coach && coachStart(d.start), ...fresh }
  follow()
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
  drill.value = { ...d, moves: d.moves + 1, hintShown: false, path: extendPath(d.path, move), coach: d.coach && coachTurn(d.coach, move) }
}

function nextMove(d: Drill): Move | null {
  if (d.coach) return coachHint(d.coach)
  return d.path.length ? inverse(d.path[d.path.length - 1]) : null
}

function hint() {
  const d = drill.value
  if (!d || d.done || cube.busy.value) return
  const move = nextMove(d)
  if (!move) return
  drill.value = { ...d, hints: d.hints + (d.scaffold === 'follow' ? 0 : 1), hintShown: true }
  cube.showArrows(move, 900) // hold the arrows a little longer than after a turn
}

/** In follow mode the next move's arrows stay on the board. */
function follow() {
  const d = drill.value
  cube.pinArrows(d && d.scaffold === 'follow' && !d.done ? nextMove(d) : null)
}

const routineView = computed<RoutineView | null>(() => {
  const d = drill.value
  if (!d?.coach || d.done || d.scaffold === 'none') return null
  const c = d.coach, s = stage(c.stage ?? d.stage!), r = c.routine
  const algLen = s.chunks.reduce((n, ch) => n + ch.moves.length, 0)
  const pre = !r ? [] : r.algStart < 0 ? r.moves : r.moves.slice(0, r.algStart)
  const post = !r || r.algStart < 0 ? [] : r.moves.slice(r.algStart + algLen)
  const offTrack = c.offTrack.length ? inverse(c.offTrack[c.offTrack.length - 1]) : null
  let lit: RoutineView['lit'] = null
  if (r && !offTrack && (d.scaffold !== 'dim' || d.hintShown)) {
    if (r.algStart < 0 || c.done < r.algStart) lit = { part: 'pre', index: c.done }
    else if (c.done < r.algStart + algLen) lit = { part: 'alg', index: c.done - r.algStart }
    else lit = { part: 'post', index: c.done - r.algStart - algLen }
  }
  return { stageTitle: s.short, label: offTrack ? 'Turn that back' : r?.label ?? '', pre, chunks: s.chunks, post, lit, offTrack }
})

cube.onTurnApplied(() => {
  const d = drill.value
  if (!d || d.done || !isSolved(cube.state.value)) return
  const clean = d.hints === 0 || d.scaffold === 'follow'
  const lesson = d.lesson && { ...d.lesson, clean: d.lesson.clean + (clean ? 1 : 0) }
  const over = d.kind === 'undo' || (lesson && lesson.index + 1 >= LESSON_SIZE)
  const result = over && lesson ? course.recordLesson(d.stage!, lesson.clean) : null
  drill.value = { ...d, done: true, lesson, result }
  cube.pinArrows(null)
  if (over) setTimeout(() => { if (drill.value?.done) sheets.open('done') }, TURN_MS + 300) // let the last turn land first
})

cube.onTurnLanded(follow)

export function usePractice() {
  return {
    drill, routineView,
    startUndo, startLesson, nextPuzzle, retry, stop, resetToSolved, recordTurn, hint,
    /** The "undo" level to offer: the one being played, or the last one played. */
    currentLevel: () => drill.value?.kind === 'undo' ? drill.value.level : loadPractice().level ?? 1,
  }
}
