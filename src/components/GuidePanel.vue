<script setup lang="ts">
// Guided play's panel under the board, told like a story: a few short slides per edge, with a segment each along the
// bottom. A slide that's only read fills on a timer and moves on; holding the panel pauses it and tapping its right
// side skips ahead. A slide with turns fills as the player makes them, the next one drawn on the board, and can't be
// skipped. Tapping the left side goes back a slide, turning the cube back with it. The panel turns red after a turn
// off the plan that has to be turned back. It keeps one height, so the board never changes size.
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { useGuide } from '../composables/useGuide'

const g = useGuide()

/** Reading time for a slide: enough for a slow reader, and holding pauses it anyway. */
const readMs = (say: string) => 1600 + say.length * 55

const elapsed = shallowRef(0)
const held = shallowRef(false)
const timed = computed(() => !!g.current.value && !g.current.value.turns.length && !g.finished.value && !g.rewinding.value)
watch([g.segment, g.slide], () => { elapsed.value = 0 })

let last = performance.now(), frame = 0
function tick(now: number) {
  const dt = now - last
  last = now
  if (timed.value && !held.value) {
    elapsed.value += dt
    if (elapsed.value >= readMs(g.current.value!.say)) g.forward()
  }
  frame = requestAnimationFrame(tick)
}
frame = requestAnimationFrame(tick)
onBeforeUnmount(() => cancelAnimationFrame(frame))

// a press that lasts is a hold (pause); a short one is a tap (left third back, the rest forward)
let downAt = 0, holdTimer: ReturnType<typeof setTimeout> | undefined
function down() {
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
  if (e.clientX - box.left < box.width / 3) g.back()
  else g.forward()
}
function cancel() { clearTimeout(holdTimer); held.value = false; downAt = 0 }

/** How full each slide's segment is. */
function fill(i: number) {
  if (g.finished.value || i < g.slide.value) return 1
  if (i > g.slide.value) return 0
  const s = g.current.value!
  if (!s.turns.length) return Math.min(1, elapsed.value / readMs(s.say))
  return s.free ? (g.done.value ? 1 : 0) : g.done.value / s.turns.length
}
</script>

<template>
  <section class="panel" :class="{ bad: g.wrong.value.length && !g.finished.value, held }"
    @pointerdown="down" @pointerup="up" @pointercancel="cancel" @pointerleave="cancel">
    <p :key="`${g.slide.value}-${g.finished.value}`" class="say" aria-live="polite">{{ g.text.value }}</p>
    <div class="story" role="progressbar" :aria-valuemax="g.slides.value.length" :aria-valuenow="g.slide.value">
      <span v-for="(_, i) in g.slides.value" :key="i" class="seg">
        <b :style="{ transform: `scaleX(${fill(i)})` }" :class="{ smooth: !timed || i !== g.slide.value }" />
      </span>
    </div>
  </section>
</template>

<style scoped>
.panel { flex: none; height: 112px; box-sizing: border-box; display: grid; grid-template-rows: 1fr auto; gap: 10px; padding: 14px 14px 12px; border-radius: 18px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06); transition: background-color 0.2s; user-select: none; -webkit-user-select: none; cursor: pointer; }
.panel.bad { background: color-mix(in srgb, #ff3b30 14%, var(--card)); }
.say { align-self: center; margin: 0; font-size: 17px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; animation: rise 0.25s ease-out; transition: opacity 0.2s; }
.held .say { opacity: 0.7; }
.bad .say { color: #ff3b30; font-weight: 600; }
.story { display: flex; gap: 3px; }
.seg { position: relative; flex: 1; height: 4px; border-radius: 2px; background: var(--fill); overflow: hidden; }
.seg b { position: absolute; inset: 0; background: var(--muted); transform-origin: left; }
.seg b.smooth { transition: transform 0.34s ease-in-out; }
@keyframes rise { from { opacity: 0; transform: translateY(4px) } }
</style>
