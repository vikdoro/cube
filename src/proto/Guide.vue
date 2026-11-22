<script setup lang="ts">
// PROTOTYPE: everything the player reads is in one panel under the board, told like a story: a few short slides per
// step, with a segment each along the bottom. A slide without turns fills on a timer and moves on; holding the panel
// pauses it and tapping its right side skips ahead. Tapping its left side goes back a slide, turning the cube back
// with it, and everything after is to do again. A slide with turns fills as
// the player makes them, the next one drawn on the board as pulsing arrows, and can't be skipped. The panel turns red
// after a wrong turn, whose undo the arrows then show; the end just gets a 🎉. It keeps one height, so the board never changes size.
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import type { Board } from 'flatcube/vue'
import Stage from './Stage.vue'
import { STEPS } from './script'
import type { Guide } from './useGuide'

const { board, guide: g } = defineProps<{ board: Board; guide: Guide }>()

interface Slide { step: number; say: string; from: number; to: number; end?: boolean }
/** Every step's slides in a row, with the range of the step's turns each one waits for, then a last one. */
const SLIDES: Slide[] = STEPS.flatMap((st, step) => {
  let at = 0
  return st.slides.map(sl => ({ step, say: sl.say, from: at, to: (at += sl.turns) }))
})
const LAST = STEPS.length - 1
SLIDES.push({ step: LAST, say: 'The edge is home, and both layers are done. 🎉', from: STEPS[LAST].turns.length, to: STEPS[LAST].turns.length, end: true })

const acts = (sl: Slide) => sl.to > sl.from
/** Reading time for a slide: enough for a slow reader, and holding pauses it anyway. */
const readMs = (sl: Slide) => 1600 + sl.say.length * 55

/** The slide the player is on. */
const live = shallowRef(0)
/** Turning the cube back after a step back: taps wait. */
const rewinding = shallowRef(false)
/** Time spent on the slide on show, for the timed ones. */
const elapsed = shallowRef(0)
const held = shallowRef(false)
const menu = shallowRef(false)

const shown = computed(() => SLIDES[live.value])
const timed = computed(() => !shown.value.end && !acts(shown.value))

function goLive(k: number) {
  if (k >= SLIDES.length) return
  if (SLIDES[k].step !== g.step.value) {
    if (!g.stepDone.value) return
    g.advance()
  }
  live.value = k
  elapsed.value = 0
  settle()
}

let settling: ReturnType<typeof setTimeout> | undefined
/** A slide whose turns are all made moves on after a moment to see the last one land. */
function settle() {
  clearTimeout(settling)
  const sl = SLIDES[live.value]
  if (sl.end || !acts(sl) || sl.step !== g.step.value) return
  if (g.done.value >= sl.to && !g.wrong.value.length) {
    settling = setTimeout(() => { if (g.done.value >= sl.to && !g.wrong.value.length) goLive(live.value + 1) }, 600)
  }
}
watch(() => [g.done.value, g.wrong.value.length], settle)

board.onTurnApplied((_, byPlayer) => {
  if (!byPlayer) return
  // turning while a reading slide is up: jump to the slide that waits for turns
  const sl = SLIDES[live.value]
  if (!acts(sl) && !sl.end && g.done.value > 0) {
    const k = SLIDES.findIndex((s, i) => i > live.value && s.step === sl.step && acts(s))
    if (k > 0) { live.value = k; elapsed.value = 0; settle() }
  }
})

function forward() {
  if (timed.value && !rewinding.value) goLive(live.value + 1)
}
async function back() {
  if (live.value === 0 || rewinding.value || board.busy.value) return
  clearTimeout(settling)
  const k = live.value - 1
  rewinding.value = true
  await g.rewindTo(SLIDES[k].step, SLIDES[k].from)
  rewinding.value = false
  live.value = k
  elapsed.value = 0
}

let last = performance.now(), frame = 0
function tick(now: number) {
  const dt = now - last
  last = now
  if (timed.value && !held.value && !menu.value) {
    elapsed.value += dt
    if (elapsed.value >= readMs(shown.value)) forward()
  }
  frame = requestAnimationFrame(tick)
}
frame = requestAnimationFrame(tick)
onBeforeUnmount(() => { cancelAnimationFrame(frame); clearTimeout(settling) })

// a press that lasts is a hold (pause); a short one is a tap (left third back, the rest forward)
let downAt = 0, holdTimer: ReturnType<typeof setTimeout> | undefined
function down(e: PointerEvent) {
  if ((e.target as Element).closest('button')) return
  downAt = performance.now()
  holdTimer = setTimeout(() => { held.value = true }, 220)
}
function up(e: PointerEvent) {
  if (!downAt) return
  clearTimeout(holdTimer)
  const wasHeld = held.value
  held.value = false
  downAt = 0
  if (wasHeld) return
  const box = (e.currentTarget as Element).getBoundingClientRect()
  if (e.clientX - box.left < box.width / 3) back()
  else forward()
}
function cancel() { clearTimeout(holdTimer); held.value = false; downAt = 0 }

function restart() {
  menu.value = false
  g.goTo(0)
  live.value = 0
  elapsed.value = 0
}

/** How full each slide's segment is. */
function fill(i: number) {
  const sl = SLIDES[i]
  if (i === live.value) {
    if (timed.value) return Math.min(1, elapsed.value / readMs(sl))
    return acts(sl) && sl.step === g.step.value ? Math.max(0, Math.min(1, (g.done.value - sl.from) / (sl.to - sl.from))) : 0
  }
  return i < live.value ? 1 : 0
}

const wrong = computed(() => g.wrong.value.length > 0)
const text = computed(() => wrong.value ? 'Not that one. Undo it the way the arrows show.' : shown.value.say)

/** A trigger's area shows until its first turn: it says what's about to change, then the turns speak for themselves. */
const area = computed(() => g.done.value === 0 && !g.wrong.value.length ? g.current.value.area : undefined)
const liveActs = computed(() => acts(SLIDES[live.value]) && g.done.value < SLIDES[live.value].to)
const arrow = computed(() => g.wrong.value.length || liveActs.value ? g.next.value : null)
</script>

<template>
  <Stage :board="board" :pieces="g.current.value.pieces" :targets="g.current.value.targets" :area="area" :arrow="arrow" />

  <button class="more" aria-label="More" :aria-expanded="menu" @click="menu = !menu">⋯</button>
  <div v-if="menu" class="scrim" @click="menu = false" />
  <nav v-if="menu" class="menu">
    <button @click="restart">Start again</button>
  </nav>

  <section class="panel" :class="{ bad: wrong, held }"
    @pointerdown="down" @pointerup="up" @pointercancel="cancel" @pointerleave="cancel">
    <div class="body">
      <p :key="live" class="say" aria-live="polite">{{ text }}</p>
      <button v-if="shown.end" class="btn primary" @click="restart">Again</button>
    </div>
    <div class="story" role="progressbar" :aria-valuemax="SLIDES.length - 1" :aria-valuenow="live">
      <span v-for="(_, i) in SLIDES.slice(0, -1)" :key="i" class="seg" :class="{ now: i === live }">
        <b :style="{ transform: `scaleX(${fill(i)})` }" :class="{ smooth: !timed || i !== live }" />
      </span>
    </div>
  </section>

</template>

<style scoped>
.panel { position: relative; z-index: 3; flex: none; height: 112px; box-sizing: border-box; display: grid; grid-template-rows: 1fr auto; gap: 10px; padding: 14px 14px 12px; border-radius: 18px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06); transition: background-color 0.2s; user-select: none; -webkit-user-select: none; cursor: pointer; }
.panel.bad { background: #ffe3e3; }
.body { display: flex; align-items: center; gap: 12px; min-height: 0; }
.say { flex: 1; margin: 0; font-size: 17px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; animation: rise 0.25s ease-out; transition: opacity 0.2s; }
.held .say { opacity: 0.7; }
.bad .say { color: #d70015; font-weight: 600; }
.story { display: flex; gap: 3px; }
.seg { position: relative; flex: 1; height: 4px; border-radius: 2px; background: var(--fill); overflow: hidden; }
.seg b { position: absolute; inset: 0; background: var(--muted); transform-origin: left; }
.seg b.smooth { transition: transform 0.34s ease-in-out; }
.more { position: absolute; top: calc(10px + env(safe-area-inset-top, 0px)); right: 10px; z-index: 4; appearance: none; border: 0; width: 40px; height: 40px; border-radius: 50%; background: var(--card); color: var(--muted); font: 700 18px var(--round); line-height: 1; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer; }
.scrim { position: fixed; inset: 0; z-index: 4; }
.menu { position: absolute; top: calc(56px + env(safe-area-inset-top, 0px)); right: 10px; z-index: 5; min-width: 180px; padding: 6px; border-radius: 14px; background: var(--card); box-shadow: 0 2px 6px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.18); }
.menu button { display: block; width: 100%; text-align: left; padding: 10px 12px; border: 0; border-radius: 9px; background: none; color: var(--fg); font: 500 16px var(--sans); cursor: pointer; }
@keyframes rise { from { opacity: 0; transform: translateY(4px) } }
</style>
