import { computed, shallowRef } from 'vue'
import { inverse, sameMove, type Move } from 'flatcube'
import type { Board } from 'flatcube/vue'
import { STEP_STARTS, STEPS } from './script'

/**
 * PROTOTYPE: follows the player through the hardcoded steps. Every turn on the board, the player's or played for them,
 * is checked against the step: the expected turn moves it on, turning the last one back moves it back, anything else
 * is a wrong turn to undo first.
 */
export function useGuide(board: Board) {
  const step = shallowRef(0)
  /** Turns of the step done so far. */
  const done = shallowRef(0)
  /** Sentences of the step shown so far. */
  const said = shallowRef(1)
  /** Turns off the routine, newest last. */
  const wrong = shallowRef<Move[]>([])
  const playing = shallowRef(false)
  /** When the player last did anything, for showing a hint after a pause. */
  const lastAction = shallowRef(performance.now())
  const now = shallowRef(performance.now())
  setInterval(() => { now.value = performance.now() }, 250)

  const current = computed(() => STEPS[step.value])
  const stepDone = computed(() => done.value >= current.value.turns.length && !wrong.value.length && said.value >= current.value.say.length)
  const finished = computed(() => step.value === STEPS.length - 1 && stepDone.value)
  /** The turn to make next: undoing a wrong one first. */
  const next = computed<Move | null>(() =>
    wrong.value.length ? inverse(wrong.value[wrong.value.length - 1]) : current.value.turns[done.value] ?? null)
  const idle = computed(() => now.value - lastAction.value)

  board.onTurnApplied(move => {
    lastAction.value = performance.now()
    const s = current.value
    if (wrong.value.length) {
      const last = wrong.value[wrong.value.length - 1]
      wrong.value = sameMove(move, inverse(last)) ? wrong.value.slice(0, -1) : [...wrong.value, move]
    } else if (s.free && done.value < s.turns.length && move.layer === s.free.layer) {
      if (s.free.goal(board.state.value)) done.value = s.turns.length
    } else if (done.value < s.turns.length && sameMove(move, s.turns[done.value])) {
      done.value++
    } else if (done.value > 0 && sameMove(move, inverse(s.turns[done.value - 1]))) {
      done.value--
    } else {
      wrong.value = [...wrong.value, move]
      playing.value = false
    }
  })

  /** Go to a step, the cube put as it is at its start. */
  function goTo(i: number) {
    playing.value = false
    step.value = Math.max(0, Math.min(STEPS.length - 1, i))
    done.value = 0
    said.value = 1
    wrong.value = []
    board.reset(STEP_STARTS[step.value])
    lastAction.value = performance.now()
  }

  /** On to the next step, the cube as it is. */
  function advance() {
    if (step.value >= STEPS.length - 1) return
    step.value++
    done.value = 0
    said.value = 1
    wrong.value = []
    lastAction.value = performance.now()
  }

  function sayMore() {
    said.value = Math.min(current.value.say.length, said.value + 1)
    lastAction.value = performance.now()
  }

  const landed = () => new Promise<void>(resolve => { const off = board.onTurnLanded(() => { off(); resolve() }) })
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  /** Play turns for the player, a pause after each: `count` of them, or the rest of the step. */
  async function play(count = Infinity, pause = 450) {
    if (playing.value) return
    said.value = current.value.say.length
    playing.value = true
    for (let k = 0; k < count && playing.value; k++) {
      const move = next.value
      if (!move) break
      board.turn(move)
      await landed()
      await sleep(pause)
    }
    playing.value = false
  }

  /** Turn the step's last turn back. */
  function back() {
    if (playing.value || board.busy.value) return
    const move = wrong.value.length ? wrong.value[wrong.value.length - 1] : current.value.turns[done.value - 1]
    if (move) board.turn(inverse(move))
  }

  /** Turn the whole step back to its start, quickly. */
  async function rewind() {
    playing.value = false
    // a free step can have been turned any number of ways: jump back instead
    if (current.value.free) { goTo(step.value); return }
    const moves =[...wrong.value, ...current.value.turns.slice(0, done.value)].reverse().map(inverse)
    for (const m of moves) { board.turn(m); await landed() }
  }

  const stop = () => { playing.value = false }

  return { step, done, said, wrong, playing, current, stepDone, finished, next, idle, goTo, advance, sayMore, play, back, rewind, stop }
}

export type Guide = ReturnType<typeof useGuide>
