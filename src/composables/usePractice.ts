import { shallowRef } from 'vue'
import { applyMoves, IDENTITY, inverse, isSolved, rollTowards, SOLVED, type CubeState, type Move } from 'flatcube'
import { TURN_MS } from 'flatcube/board'
import { extendPath, pathFromSolved, randomTurns, scramble, type DrillKind } from '../cube/drills'
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
  /**
   * Undo: how many turns the cube was scrambled by. Lily: how many petals are left to place, 4 for a full scramble.
   * Cross: how many petals are left to drop, 5 for a full scramble. Corners: how many corners are left to place, 5 for
   * a full scramble. Middle: how many middle edges are left to place, 5 for a full scramble. Yellow: the goes of six turns left, 1 a
   * line, 2 an L, 3 a dot, 4 any shape. Edges: 1 a pair next to each other, 2 a pair across, 3 either.
   */
  level: number
  start: CubeState
  /** Undo: the turns from solved to the start, so the hint can undo them one by one. */
  startPath: readonly Move[]
  /** The fewest turns it can be solved in, when known. For the later drills, the turns the routine takes. */
  par: number | null
  moves: number
  hints: number
  /** Played guided: the steps told as story slides, every turn shown on the board (see useGuide). */
  guided: boolean
  /** A hint was shown since the last turn. */
  hintShown: boolean
  done: boolean
  /** Undo: the turns from solved to the current position, kept up to date as the player turns. */
  path: readonly Move[]
  /** The last seven turns as made, newest last, so the corners, middle, yellow and edges hints can finish a sequence begun. */
  recent: readonly Move[]
}

export const MAX_LEVEL: Record<DrillKind, number> = { undo: 5, lily: 4, cross: 5, corners: 5, middle: 5, yellow: 4, edges: 3 }

/** Whether the drill's goal is reached. */
const GOAL: Record<DrillKind, (state: CubeState) => boolean> = {
  undo: isSolved, lily: isLily, cross: isCross, corners: isFirstLayer, middle: isTwoLayers, yellow: isYellowCross, edges: isYellowEdges,
}

const sheets = useSheets()
const drill = shallowRef<Drill | null>(null)

const fresh = { moves: 0, hints: 0, hintShown: false, done: false, recent: [], guided: false } as const

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

/** Make the white cross, with a few petals left to drop or from a full scramble. Yellow starts in the middle. */
function startCross(level = 1) {
  const start = crossPuzzle(() => scramble(SOLVED), level)
  savePractice({ crossLevel: level })
  begin({ kind: 'cross', level, start, startPath: [], par: level < MAX_LEVEL.cross ? routineTurns(start) : null, path: [], ...fresh })
  cube.setView(IDENTITY)
}

/**
 * Put the white corners in, with a few left to place or from a full scramble. White starts in the middle, where the
 * slots being filled are easiest to see, and yellow on the lid.
 */
function startCorners(level = 1) {
  const start = cornersPuzzle(() => scramble(SOLVED), level)
  savePractice({ cornersLevel: level })
  begin({ kind: 'corners', level, start, startPath: [], par: level < MAX_LEVEL.corners ? cornersTurns(start) : null, path: [], ...fresh })
  cube.setView(rollTowards(IDENTITY, [0, -1, 0]))
}

/** Put the middle layer's edges in, with a few left to place or from a full scramble. Yellow starts in the middle. */
function startMiddle(level = 1) {
  const start = middlePuzzle(() => scramble(SOLVED), level)
  savePractice({ middleLevel: level })
  // guided play needs the white face done, which a full scramble doesn't have
  const guided = !!loadPractice().guided?.middle && level < MAX_LEVEL.middle
  begin({ kind: 'middle', level, start, startPath: [], par: level < MAX_LEVEL.middle ? middleTurns(start) : null, path: [], ...fresh, guided })
  cube.setView(IDENTITY)
}

/** Make the yellow cross on top of the first two layers, from a line, an L, a dot or any shape. Yellow starts in the middle. */
function startYellow(level = 1) {
  const start = yellowPuzzle(() => scramble(SOLVED), level)
  savePractice({ yellowLevel: level })
  begin({ kind: 'yellow', level, start, startPath: [], par: yellowTurns(start), path: [], ...fresh })
  cube.setView(IDENTITY)
}

/** Put the yellow edges on their own sides, from a pair next to each other, a pair across or either. Yellow starts in the middle. */
function startEdges(level = 1) {
  const start = edgesPuzzle(() => scramble(SOLVED), level)
  savePractice({ edgesLevel: level })
  begin({ kind: 'edges', level, start, startPath: [], par: edgesTurns(start), path: [], ...fresh })
  cube.setView(IDENTITY)
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

const START: Record<DrillKind, (level: number) => void> = {
  undo: startUndo, lily: startLily, cross: startCross, corners: startCorners, middle: startMiddle, yellow: startYellow, edges: startEdges,
}

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
  drill.value = { ...d, path: d.startPath, ...fresh, guided: d.guided }
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
    ...d, moves: d.moves + 1, hintShown: false, path: extendPath(d.path, move), recent: [...d.recent, move].slice(-7),
  }
}

/** The next turn to suggest for a drill, if any. */
const HINT: Record<DrillKind, (d: Drill) => Move | null> = {
  undo: d => d.path.length ? inverse(d.path[d.path.length - 1]) : null,
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
    /** The level to offer: the one being played, or the last one played. */
    currentLevel: (kind: DrillKind) => {
      if (drill.value?.kind === kind) return drill.value.level
      const memory = loadPractice()
      return ({ undo: memory.level, lily: memory.lilyLevel, cross: memory.crossLevel, corners: memory.cornersLevel, middle: memory.middleLevel, yellow: memory.yellowLevel, edges: memory.edgesLevel }[kind]) ?? 1
    },
  }
}
