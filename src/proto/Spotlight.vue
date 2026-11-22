<script setup lang="ts">
// PROTOTYPE: drawn over the board without touching the engine. Outlines the pieces the step is about, following them
// through turns (it draws from the same shapes the board does), marks where the piece is going, sweeps a soft light
// along the outline of a trigger's area, and can show the next turn as pulsing ghost arrows.
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import type { Move } from 'flatcube'
import { arrowPaths, placements, pointsAttr, stickerShapes, VIEW_BOX } from 'flatcube/board'
import type { Board } from 'flatcube/vue'

const props = defineProps<{ board: Board; pieces: number[]; targets: number[]; arrow: Move | null; area?: number[] }>()
const root = useTemplateRef<SVGSVGElement>('root')
const box = shallowRef({})

// sit exactly over the board's own svg, the one before this one
let watcher: ResizeObserver | undefined
function measure() {
  const svg = root.value?.previousElementSibling, parent = root.value?.parentElement
  if (!svg || !parent) return
  const r = svg.getBoundingClientRect(), p = parent.getBoundingClientRect()
  box.value = { top: r.top - p.top + 'px', left: r.left - p.left + 'px', width: r.width + 'px', height: r.height + 'px' }
}
onMounted(() => {
  measure()
  watcher = new ResizeObserver(measure)
  watcher.observe(root.value!.previousElementSibling!)
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => { watcher?.disconnect(); window.removeEventListener('resize', measure) })

const b = props.board
const shapes = computed(() => stickerShapes(b.state.value, b.view.value, b.turning.value, b.rolling.value, b.now.value))
const lit = computed(() => new Set(props.pieces))
const still = computed(() => !b.busy.value)

// the stickers a trigger ends up changing, outlined as one area: their shapes drawn with a wide stroke merge across the
// gaps between them, and a narrower one cut out of that leaves a thin line round the whole area
const [vx, vy, vw, vh] = VIEW_BOX.split(' ').map(Number)
const zoned = computed(() => still.value ? (props.area ?? []).map(slot => pointsAttr(placements(b.view.value)[slot].points)) : [])
const shown = computed(() => shapes.value.filter(s => lit.value.has(b.state.value[s.slot])).map(s => pointsAttr(s.points)))
const homes = computed(() => still.value ? props.targets.map(slot => pointsAttr(placements(b.view.value)[slot].points)) : [])
const ghost = computed(() => still.value && props.arrow ? arrowPaths(b.view.value, props.arrow) : [])
</script>

<template>
  <svg ref="root" class="spot" :viewBox="VIEW_BOX" :style="box" aria-hidden="true">
    <defs>
      <marker id="ghost-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
      </marker>
    </defs>
    <template v-if="zoned.length">
      <defs>
        <mask id="zone-line" maskUnits="userSpaceOnUse" :x="vx" :y="vy" :width="vw" :height="vh">
          <g fill="#fff" stroke="#fff" stroke-width="12" stroke-linejoin="round"><polygon v-for="(p, i) in zoned" :key="i" :points="p" /></g>
          <g fill="#000" stroke="#000" stroke-width="8" stroke-linejoin="round"><polygon v-for="(p, i) in zoned" :key="i" :points="p" /></g>
        </mask>
        <linearGradient id="zone-band" gradientUnits="userSpaceOnUse" :x1="vx - vw * 0.4" :y1="vy" :x2="vx" :y2="vy + vh * 0.2">
          <stop offset="0" stop-color="#fff" stop-opacity="0" />
          <stop offset="0.5" stop-color="#fff" stop-opacity="0.75" />
          <stop offset="1" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g mask="url(#zone-line)">
        <rect :x="vx" :y="vy" :width="vw" :height="vh" fill="#fff" opacity="0.18" />
        <rect :x="vx - vw * 0.4" :y="vy" :width="vw * 0.4" :height="vh" fill="url(#zone-band)">
          <animateTransform attributeName="transform" type="translate" from="0 0" :to="`${vw * 1.4} 0`" dur="2.4s" repeatCount="indefinite" />
        </rect>
      </g>
    </template>
    <polygon v-for="(p, i) in homes" :key="'h' + i" :points="p" class="home" />
    <polygon v-for="(p, i) in shown" :key="'l' + i" :points="p" class="lit" />
    <g class="ghost">
      <path v-for="(d, i) in ghost" :key="'gh' + i" :d="d" class="halo" />
      <path v-for="(d, i) in ghost" :key="'g' + i" :d="d" class="arrow" marker-end="url(#ghost-head)" />
    </g>
  </svg>
</template>

<style scoped>
.spot { position: absolute; pointer-events: none; overflow: visible; }
.lit { fill: none; stroke: #fff; stroke-width: 3.2; stroke-linejoin: round; filter: drop-shadow(0 0 3px rgba(10,122,255,0.9)); }
.home { fill: none; stroke: #fff; stroke-width: 2.2; stroke-dasharray: 5 4; animation: march 1s linear infinite; }
.ghost { animation: pulse 1.3s ease-in-out infinite; }
.arrow { fill: none; stroke: var(--accent); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 7 5; }
.halo { fill: none; stroke: var(--halo); stroke-width: 7; stroke-linecap: round; }
@keyframes pulse { 0%, 100% { opacity: 0.35 } 50% { opacity: 1 } }
@keyframes march { to { stroke-dashoffset: -9 } }
</style>
