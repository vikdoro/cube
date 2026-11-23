import { computed, shallowRef } from 'vue'
import { applyMove, inverse, sameMove, type Move } from 'flatcube'
import { ROUTINES } from '../cube/drills'
import type { GuideSegment } from '../cube/guide'
import { drillDef } from '../drills'
import { board as cube } from '../board'
import { usePlayer } from './usePlayer'
import { usePractice } from './usePractice'

/**
 * Guided play of a drill: follows the player's turns through the story the drill's planner writes. The expected turn
 * moves a slide on, turning the last one back moves it back. Any other turn is never forced back: if the routine can
 * carry on from where the cube is, the story is written again from there; if not, the turns are counted as wrong and
 * the arrows show the way back, until they're turned back (or the cube is back where the routine can carry on).
 */

const practice = usePractice()
const player = usePlayer()

const segment = shallowRef<GuideSegment | null>(null)
/** The slide the player is on, and how many of its turns are made. */
const slide = shallowRef(0)
const done = shallowRef(0)
/** Turns off the plan to turn back, newest last, and whether the first of them left the routine unable to carry on. */
const wrong = shallowRef<Move[]>([])
const broke = shallowRef(false)
/** Turning the cube back after a step back: turns made meanwhile aren't the player's. */
const rewinding = shallowRef(false)
/** The routine was told once this puzzle: later segments keep their reading short. */
let explained = false
/** The turns made on the plan this segment, and how many there were when each slide began. */
let history: Move[] = []
let starts = [0]
let moving: ReturnType<typeof setTimeout> | undefined

const guide = computed(() => {
  const d = practice.drill.value
  return d?.guided ? ROUTINES[drillDef(d.kind).routine].guide ?? null : null
})
const slides = computed(() => segment.value?.slides ?? [])
const current = computed(() => slides.value[slide.value] ?? null)
const finished = computed(() => !!practice.drill.value?.done)

/** Write the story again from the cube as it is. */
function replan() {
  clearTimeout(moving)
  segment.value = guide.value?.segment(cube.state.value, explained) ?? null
  slide.value = done.value = 0
  wrong.value = []
  history = []
  starts = [0]
}

function goTo(k: number) {
  slide.value = k
  done.value = 0
  starts[k] = history.length
}

/** On to the next slide, or the next segment after the last. */
function next() {
  if (slide.value < slides.value.length - 1) goTo(slide.value + 1)
  else { explained = true; replan() }
}

const complete = () => !!current.value && current.value.turns.length > 0 && done.value >= current.value.turns.length && !wrong.value.length

/** A slide whose turns are all made moves on after a moment to see the last one land. */
function settle() {
  clearTimeout(moving)
  if (complete()) moving = setTimeout(() => { if (complete()) next() }, 600)
}

cube.onReset(() => { explained = false; replan() })

cube.onTurnApplied(move => {
  const g = guide.value
  if (!g || rewinding.value || finished.value || !segment.value) return
  const state = cube.state.value
  if (wrong.value.length) {
    const last = wrong.value[wrong.value.length - 1]
    wrong.value = sameMove(move, inverse(last)) ? wrong.value.slice(0, -1) : [...wrong.value, move]
    if (wrong.value.length && g.intact(state)) replan() // back where the routine can carry on, another way round
    return
  }
  // a turn while a slide is being read starts the slide that waits for it
  let s = current.value!
  if (!s.turns.length) {
    const j = slides.value.findIndex((t, i) => i > slide.value && t.turns.length > 0)
    const t = slides.value[j]
    if (t && (t.free ? move.layer === t.free.layer : sameMove(move, t.turns[0]))) { goTo(j); s = t }
  }
  if (s.free && move.layer === s.free.layer) {
    history.push(move)
    done.value = s.free.goal(state) ? s.turns.length : 0
    settle()
  } else if (!s.free && done.value < s.turns.length && sameMove(move, s.turns[done.value])) {
    history.push(move)
    done.value++
    settle()
  } else if (!s.free && done.value > 0 && sameMove(move, inverse(s.turns[done.value - 1]))) {
    history.pop()
    done.value--
  } else if (g.intact(state)) {
    replan()
  } else {
    broke.value = g.intact(applyMove(state, inverse(move))) // it was this turn that left the routine
    wrong.value = [move]
  }
})

/** Skip a slide that's only read. */
function forward() {
  if (current.value && !current.value.turns.length && !rewinding.value) next()
}

const landed = () => new Promise<void>(resolve => { const off = cube.onTurnLanded(() => { off(); resolve() }) })

/** Back to the start of this slide, or of the one before if this one hasn't begun: the cube turns back with it. */
async function back() {
  if (!segment.value || rewinding.value || finished.value || cube.busy.value) return
  const k = done.value || wrong.value.length ? slide.value : Math.max(0, slide.value - 1)
  clearTimeout(moving)
  rewinding.value = true
  const turns = [...history.slice(starts[k] ?? 0), ...wrong.value].reverse()
  for (const move of turns) { player.turnBack(move); await landed() }
  history = history.slice(0, starts[k] ?? 0)
  wrong.value = []
  rewinding.value = false
  goTo(k)
}

/** The turn to make next, drawn on the board: turning a wrong one back first. */
const arrow = computed<Move | null>(() => {
  const s = current.value
  if (!s || finished.value) return null
  if (wrong.value.length) return inverse(wrong.value[wrong.value.length - 1])
  if (s.free) return s.free.goal(cube.state.value) ? null : s.free.next(cube.state.value)
  return s.turns[done.value] ?? null
})

/** What the panel says. */
const text = computed(() => {
  const g = guide.value
  if (!g) return ''
  if (finished.value) return g.done
  if (wrong.value.length) return broke.value ? g.broken : g.stray
  return current.value?.say ?? ''
})

export function useGuide() {
  return {
    active: computed(() => !!guide.value), segment, slides, slide, done, wrong, current, finished, arrow, text, rewinding,
    forward, back,
  }
}
