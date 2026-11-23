import { shallowRef } from 'vue'
import { IDENTITY, rollTowards, SOLVED, type CubeState, type Move } from 'flatcube'
import { TURN_MS } from 'flatcube/board'
import { ROUTINES } from '../cube/drills'
import { drillDef, type DrillKind } from '../drills'
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

const sheets = useSheets()
const drill = shallowRef<Drill | null>(null)

const fresh = { moves: 0, hints: 0, hintShown: false, done: false, recent: [] } as const

// white in the middle for the corners, where the slots being filled are easiest to see, and yellow on the lid;
// yellow in the middle for the rest
const VIEWS = { 'white-middle': rollTowards(IDENTITY, [0, -1, 0]), 'yellow-middle': IDENTITY }

const routineOf = (kind: DrillKind) => ROUTINES[drillDef(kind).routine]

/** Start a drill with a new puzzle. */
function start(kind: DrillKind) {
  const def = drillDef(kind)
  const routine = ROUTINES[def.routine]
  const start = routine.puzzle()
  const guided = def.guided && !!loadPractice().guided?.[kind] // only drills with a guide play it (see useGuide)
  begin({ kind, start, par: routine.par(start), ...fresh, guided })
  cube.setView(VIEWS[def.view])
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

function hint() {
  const d = drill.value
  if (!d || d.done || cube.busy.value) return
  const move = routineOf(d.kind).hint(cube.state.value, d.recent)
  if (!move) return
  drill.value = { ...d, hints: d.hints + 1, hintShown: true }
  cube.showArrows(move, 900) // hold the arrows a little longer than after a turn
}

cube.onTurnApplied(() => {
  const d = drill.value
  if (!d || d.done || !routineOf(d.kind).goal(cube.state.value)) return
  drill.value = { ...d, done: true }
  setTimeout(() => { if (drill.value?.done) sheets.open('done') }, TURN_MS + 300) // let the last turn land first
})

export function usePractice() {
  return {
    drill,
    start, nextPuzzle, retry, stop, resetToSolved, startOver, recordTurn, hint,
  }
}
