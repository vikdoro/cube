<script setup lang="ts">
// Guided play's marks, drawn over the board without touching the engine: an outline round the pieces the step is about,
// following them through turns (it draws from the same shapes the board does), a dashed one where the piece is going,
// and the next turn as pulsing arrows. It sits right after the board's own svg and over it exactly.
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import type { Move } from 'flatcube'
import { arrowPaths, placements, pointsAttr, stickerShapes, VIEW_BOX } from 'flatcube/board'
import type { Board } from 'flatcube/vue'

const props = defineProps<{ board: Board; pieces: readonly number[]; targets: readonly number[]; arrow: Move | null }>()
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
