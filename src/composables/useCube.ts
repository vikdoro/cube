import { computed, shallowRef } from 'vue'
import type { Rolling, Turning } from '../board/frame'
import { ARROW_FADE_MS, ARROW_HOLD_MS, LETTER_MS, prefersReducedMotion, ROLL_MS, TURN_MS } from '../board/motion'
import { applyMove, SLOTS, SOLVED, type CubeState, type Move } from '../cube/model'
import { IDENTITY } from '../cube/vec'
import { boardMoveName, rollTowards, toBoard, type View } from '../cube/view'

/**
 * The cube on the board: its state, how it is held, and the turns playing out on it.
 * Turns queue up and play one at a time; the state changes as soon as a turn starts, and the board animates
 * towards it. One instance for the whole app (module state), so every component sees the same cube.
 */

/** Arrows that stay on the board for a moment after a turn lands, or for a hint. */
interface Lingering {
  move: Move
  /** When the arrows start to fade (may be in the future, to hold them longer). */
  end: number
  byPlayer: boolean
}

/** What the drag in progress would do. */
export type Preview =
  | { kind: 'cancel' }
  | { kind: 'turn'; move: Move; blocked: boolean; ready: boolean }

type TurnListener = (move: Move, byPlayer: boolean) => void

const state = shallowRef<CubeState>(SOLVED)
const view = shallowRef<View>(IDENTITY)
const turning = shallowRef<Turning | null>(null)
const rolling = shallowRef<Rolling | null>(null)
const lingering = shallowRef<Lingering | null>(null)
const preview = shallowRef<Preview | null>(null)
/** The animation clock: updated every frame while something moves. */
const now = shallowRef(performance.now())

let queue: { move: Move; byPlayer: boolean }[] = []
const applied: TurnListener[] = [], landed: TurnListener[] = [], resets: (() => void)[] = []

const busy = computed(() => !!turning.value || !!rolling.value)

/** The drag preview, while nothing else is moving and the drag means a turn that can happen. */
const livePreview = computed(() => {
  const p = preview.value
  return p && p.kind === 'turn' && !p.blocked && !busy.value ? p : null
})

/** The arrows on the board: during a turn they fade in, while dragging they are faint, after a turn they linger. */
const arrows = computed(() => {
  const t = now.value
  if (turning.value) {
    const alpha = prefersReducedMotion() ? 1 : Math.min(1, (t - turning.value.start) / 120)
    return { move: turning.value.move, alpha, lingering: false }
  }
  if (livePreview.value) return { move: livePreview.value.move, alpha: 0.6, lingering: false }
  if (lingering.value && !rolling.value) {
    const since = t - lingering.value.end
    const alpha = since < ARROW_HOLD_MS ? 1 : Math.max(0, 1 - (since - ARROW_HOLD_MS) / ARROW_FADE_MS)
    return alpha > 0 ? { move: lingering.value.move, alpha, lingering: true } : null
  }
  return null
})

/** The pill in the nav bar: the move being made, or why a drag won't turn. */
const badge = computed(() => {
  const p = busy.value ? null : preview.value
  if (p?.kind === 'cancel') return { text: 'Let go to cancel', on: true }
  if (p?.kind === 'turn' && p.blocked) return { text: 'Middle row doesn\'t turn', on: true }
  const a = arrows.value
  if (!a) return { text: '', on: false }
  // after the player's own turn the letter only shows briefly, then it fades
  const l = lingering.value
  const short = a.lingering && l?.byPlayer && now.value - l.end >= LETTER_MS
  return { text: boardMoveName(view.value, a.move), on: a.alpha > 0.2 && !short }
})

// ---------- the animation loop ----------
let raf = 0

function frame() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  const t = performance.now()
  if (turning.value && t - turning.value.start >= TURN_MS) land(turning.value.move, turning.value.byPlayer, t)
  if (rolling.value && t - rolling.value.start >= ROLL_MS) rolling.value = null
  if (!turning.value && !rolling.value) startNext()
  if (lingering.value && t - lingering.value.end >= ARROW_HOLD_MS + ARROW_FADE_MS) lingering.value = null
  now.value = t
  if (turning.value || rolling.value || lingering.value) raf = requestAnimationFrame(frame)
}

const kick = () => { if (!raf) raf = requestAnimationFrame(frame) }

// a hidden tab gets no animation frames: keep turns landing anyway
setInterval(() => { if (busy.value && document.hidden) frame() }, 250)

function land(move: Move, byPlayer: boolean, t: number) {
  turning.value = null
  lingering.value = { move, end: t, byPlayer }
  landed.forEach(fn => fn(move, byPlayer))
}

function startNext() {
  if (busy.value || !queue.length) return
  const { move, byPlayer } = queue.shift()!
  state.value = applyMove(state.value, move)
  applied.forEach(fn => fn(move, byPlayer))
  const t = performance.now()
  if (document.hidden || prefersReducedMotion()) {
    land(move, byPlayer, t)
    now.value = t
    kick()
    startNext()
    return
  }
  turning.value = { move, start: t, byPlayer }
  kick()
}

// ---------- actions ----------

function turn(move: Move, byPlayer = false) {
  queue.push({ move, byPlayer })
  startNext()
}

/** Put the cube in a new state at once, dropping any turns still to play. */
function reset(next: CubeState) {
  queue = []
  turning.value = rolling.value = lingering.value = null
  state.value = next
  resets.forEach(fn => fn())
}

/** Hold the cube another way at once, without rolling it. */
function setView(next: View) {
  view.value = next
  rolling.value = lingering.value = null
}

/** Roll the cube so the face holding this slot comes to the middle. */
function rollToSlot(slot: number) {
  if (busy.value) return
  const n = toBoard(view.value, SLOTS[slot].normal)
  if (n[1] === 1) return // already in the middle
  const from = view.value
  view.value = rollTowards(from, n)
  lingering.value = null
  if (document.hidden || prefersReducedMotion()) return
  rolling.value = { from, start: performance.now() }
  kick()
}

/** Show a move's arrows without making it, held `extraMs` longer than after a turn. */
function showArrows(move: Move, extraMs = 0) {
  lingering.value = { move, end: performance.now() + extraMs, byPlayer: false }
  kick()
}

function hideArrows() {
  lingering.value = null
}

function setPreview(next: Preview | null) {
  preview.value = next
  now.value = performance.now()
}

export function useCube() {
  return {
    state, view, turning, rolling, preview, now, busy, livePreview, arrows, badge,
    turn, reset, setView, rollToSlot, showArrows, hideArrows, setPreview,
    /** Called as each turn starts, once the state has changed. */
    onTurnApplied: (fn: TurnListener) => { applied.push(fn) },
    /** Called when each turn has finished animating. */
    onTurnLanded: (fn: TurnListener) => { landed.push(fn) },
    /** Called when the cube is put in a new state with reset(). */
    onReset: (fn: () => void) => { resets.push(fn) },
  }
}
