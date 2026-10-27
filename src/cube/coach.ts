import { METHOD_ORDER, type Routine, type StageId } from './method'
import { applyMove, inverse, sameMove, type CubeState, type Move } from './model'
import { STAGES } from './stages'

/**
 * The coach follows the learner through the method one routine at a time. The cube is only read between routines,
 * because half-way through an algorithm it looks broken. A turn that isn't the next one of the routine is "off track":
 * the hint then asks for it to be turned back, until the learner is on the routine again.
 */
export interface Coach {
  /** The cube after every turn recorded so far (the board may lag behind while turns animate). */
  state: CubeState
  stage: StageId | null
  routine: Routine | null
  /** How many moves of the routine are done. */
  done: number
  /** The learner's turns away from the routine, oldest first. */
  offTrack: readonly Move[]
}

/** The first stage, in method order, that still has something to do here. */
function pick(state: CubeState): Pick<Coach, 'stage' | 'routine'> {
  for (const id of METHOD_ORDER) {
    const stage = STAGES[id]
    if (!stage || stage.isDone(state)) continue
    const routine = stage.nextRoutine(state)
    if (routine) return { stage: id, routine }
  }
  return { stage: null, routine: null }
}

export const coachStart = (state: CubeState): Coach => ({ state, done: 0, offTrack: [], ...pick(state) })

export function coachTurn(coach: Coach, move: Move): Coach {
  const state = applyMove(coach.state, move)
  const { offTrack, routine } = coach
  if (offTrack.length) {
    const last = offTrack[offTrack.length - 1]
    return { ...coach, state, offTrack: sameMove(move, inverse(last)) ? offTrack.slice(0, -1) : [...offTrack, move] }
  }
  if (!routine) return { ...coach, state }
  const expected = routine.moves[coach.done], following = routine.moves[coach.done + 1]
  let moves = routine.moves
  if (!sameMove(move, expected)) {
    // undoing the last move of the routine steps back in it
    if (coach.done && sameMove(move, inverse(moves[coach.done - 1]))) return { ...coach, state, done: coach.done - 1 }
    // a half turn can be made either way round
    const halfTurn = following && sameMove(expected, following) && sameMove(move, inverse(expected))
    if (!halfTurn) return { ...coach, state, offTrack: [move] }
    moves = [...moves.slice(0, coach.done), move, move, ...moves.slice(coach.done + 2)]
  }
  const done = coach.done + 1
  if (done < moves.length) return { ...coach, state, done, routine: { ...routine, moves } }
  return { ...coach, state, done: 0, ...pick(state) }
}

/** The move to make next: back on track first, then the routine. */
export function coachHint(coach: Coach): Move | null {
  if (coach.offTrack.length) return inverse(coach.offTrack[coach.offTrack.length - 1])
  return coach.routine?.moves[coach.done] ?? null
}
