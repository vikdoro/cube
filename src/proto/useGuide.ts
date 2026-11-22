import { computed, shallowRef } from 'vue'
import { inverse, sameMove, type Move } from 'flatcube'
import type { Board } from 'flatcube/vue'
import { STEP_STARTS, STEPS } from './script'

/**
 * PROTOTYPE: follows the player through the hardcoded steps. Every turn on the board is checked
 * against the step: the expected turn moves it on, turning the last one back moves it back, anything else
 * is a wrong turn to undo first. The player makes every turn; only undoing and going back are played for them.
 */
export function useGuide(board: Board) {
  const step = shallowRef(0)
  /** Turns of the step done so far. */
  const done = shallowRef(0)
  /** Turns off the routine, newest last. */
  const wrong = shallowRef<Move[]>([])

  const current = computed(() => STEPS[step.value])
  const stepDone = computed(() => done.value >= current.value.turns.length && !wrong.value.length)
  const finished = computed(() => step.value === STEPS.length - 1 && stepDone.value)
  /** The turn to make next: undoing a wrong one first. */
  const next = computed<Move | null>(() =>
    wrong.value.length ? inverse(wrong.value[wrong.value.length - 1]) : current.value.turns[done.value] ?? null)

  board.onTurnApplied(move => {
    const s = current.value
    if (wrong.value.length) {
      const last = wrong.value[wrong.value.length - 1]
      wrong.value = sameMove(move, inverse(last)) ? wrong.value.slice(0, -1) : [...wrong.value, move]
    } else if (s.free && move.layer === s.free.layer) {
      done.value = s.free.goal(board.state.value) ? s.turns.length : 0
    } else if (done.value < s.turns.length && sameMove(move, s.turns[done.value])) {
      done.value++
    } else if (done.value > 0 && sameMove(move, inverse(s.turns[done.value - 1]))) {
      done.value--
    } else {
      wrong.value = [...wrong.value, move]
    }
  })

  /** Go to a step, the cube put as it is at its start. */
  function goTo(i: number) {
    step.value = Math.max(0, Math.min(STEPS.length - 1, i))
    done.value = 0
    wrong.value = []
    board.reset(STEP_STARTS[step.value])
  }

  /** On to the next step, the cube as it is. */
  function advance() {
    if (step.value >= STEPS.length - 1) return
    step.value++
    done.value = 0
    wrong.value = []
  }

  /** Turn the step's last turn back. */
  function back() {
    if (board.busy.value) return
    const move = wrong.value.length ? wrong.value[wrong.value.length - 1] : current.value.turns[done.value - 1]
    if (move) board.turn(inverse(move))
  }

  const landed = () => new Promise<void>(resolve => { const off = board.onTurnLanded(() => { off(); resolve() }) })

  /** Turn the cube back, on the board, to `doneTo` turns into a step: wrong turns first, then the steps' own. */
  async function rewindTo(stepIndex: number, doneTo: number) {
    for (;;) {
      if (wrong.value.length) board.turn(inverse(wrong.value[wrong.value.length - 1]))
      else if (step.value === stepIndex && done.value <= doneTo) break
      else if (done.value > 0) board.turn(inverse(current.value.turns[done.value - 1]))
      else if (step.value > 0) { step.value--; done.value = current.value.turns.length; continue }
      else break
      await landed()
    }
  }

  return { step, done, wrong, current, stepDone, finished, next, goTo, advance, back, rewindTo }
}

export type Guide = ReturnType<typeof useGuide>
