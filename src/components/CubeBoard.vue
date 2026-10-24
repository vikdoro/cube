<script setup lang="ts">
// The board, and turning it by hand. Press a sticker and drag: the row or ring the drag runs along lights up with
// its arrows; let go and it turns. A tap without a drag on a side rolls the cube so that side is in the middle.
import { computed, useTemplateRef } from 'vue'
import { arrowPaths } from '../board/arrows'
import { stickerShapes } from '../board/frame'
import { bestOption, COMMIT_PX, dragOptions, isOffBoard, nearestSlot, REACH_PX, SLOP_PX, type DragOption } from '../board/gestures'
import { LID_PLATE, placements, PLATE_HALF, pointsAttr, scalePolygon, VIEW_BOX, type Point } from '../board/layout'
import { inLayer, SLOTS } from '../cube/model'
import { facingFace } from '../cube/view'
import { useCube } from '../composables/useCube'
import { usePlayer } from '../composables/usePlayer'
import { usePractice } from '../composables/usePractice'

const cube = useCube()
const player = usePlayer()
const { drill } = usePractice()
const svg = useTemplateRef<SVGSVGElement>('svg')

const FACE_NAME = { U: 'top', D: 'bottom', R: 'right', L: 'left', F: 'front', B: 'back' } as const
const label = computed(() =>
  `The cube as an open box: its ${FACE_NAME[facingFace(cube.view.value)]} face in the middle, four sides around it, the lid hanging open above`)

const stickers = computed(() => {
  const live = cube.livePreview.value
  return stickerShapes(cube.state.value, cube.view.value, cube.turning.value, cube.rolling.value, cube.now.value).map(s => ({
    ...s,
    points: pointsAttr(s.points),
    tappable: !cube.rolling.value && s.depth === -1,
    lit: !!live && inLayer(SLOTS[s.slot].pos, live.move.layer),
  }))
})

// the drill's working piece: a ring around its slots (slots stay put while stickers move through them)
const focusRings = computed(() => {
  const d = drill.value
  if (!d?.focus || d.done || cube.rolling.value) return []
  const here = placements(cube.view.value)
  return d.focus.map(slot => pointsAttr(scalePolygon(here[slot].points, 1.14)))
})

const arrows = computed(() => {
  const a = cube.arrows.value
  return a && { paths: arrowPaths(cube.view.value, a.move), alpha: a.alpha }
})

// ---------- dragging ----------
interface Drag {
  pointerId: number
  start: Point
  path: Point[]
  /** Screen pixels per SVG unit, fixed for the drag. */
  pxPerUnit: number
  reach: number
  options: DragOption[]
  tapSlot: number
  moved: boolean
}
let drag: Drag | null = null

function svgPoint(e: PointerEvent): Point {
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.value!.getScreenCTM()!.inverse())
  return [p.x, p.y]
}

function onPointerDown(e: PointerEvent) {
  if (drag || cube.rolling.value) return // one finger at a time; a second touch or a resting palm is ignored
  const pxPerUnit = svg.value!.getScreenCTM()!.a, reach = REACH_PX / pxPerUnit, start = svgPoint(e)
  const options = dragOptions(cube.view.value, start, reach)
  if (!options.length) return
  drag = { pointerId: e.pointerId, start, path: [start], pxPerUnit, reach, options, tapSlot: nearestSlot(cube.view.value, start), moved: false }
  svg.value!.setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!drag || e.pointerId !== drag.pointerId) return
  const p = svgPoint(e)
  drag.path.push(p)
  if (!drag.moved && Math.hypot(p[0] - drag.start[0], p[1] - drag.start[1]) * drag.pxPerUnit < SLOP_PX) return
  drag.moved = true
  cube.hideArrows()
  player.hideUndo()
  if (isOffBoard(p, drag.pxPerUnit)) return cube.setPreview({ kind: 'cancel' })
  const best = bestOption(drag.options, drag.path, drag.reach)!
  const along = best.along * drag.pxPerUnit
  cube.setPreview(Math.abs(along) < SLOP_PX ? null : { // dragged back to where it started: cancelled
    kind: 'turn',
    move: { layer: best.option.layer, amount: along > 0 ? 1 : 3 },
    blocked: best.option.blocked,
    ready: Math.abs(along) >= COMMIT_PX,
  })
}

function endDrag(e: PointerEvent, commit: boolean) {
  if (!drag || e.pointerId !== drag.pointerId) return
  const d = drag, p = cube.preview.value
  drag = null
  if (commit && d.moved && p?.kind === 'turn' && !p.blocked && p.ready) player.playerTurn(p.move)
  else if (commit && !d.moved) cube.rollToSlot(d.tapSlot)
  cube.setPreview(null)
}
</script>

<template>
  <svg
    ref="svg" :viewBox="VIEW_BOX" role="img" :aria-label="label"
    @pointerdown="onPointerDown" @pointermove="onPointerMove"
    @pointerup="endDrag($event, true)" @pointercancel="endDrag($event, false)"
  >
    <defs>
      <marker id="arrowhead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" class="arrowhead" />
      </marker>
    </defs>
    <rect class="plate" :x="-PLATE_HALF" :y="-PLATE_HALF" :width="2 * PLATE_HALF" :height="2 * PLATE_HALF" rx="14" />
    <polygon class="plate lid" :points="pointsAttr(LID_PLATE)" />

    <template v-for="s in stickers" :key="s.slot">
      <polygon
        class="sticker" :class="{ tappable: s.tappable, lit: s.lit }"
        :points="s.points" :fill="s.colour" :stroke="s.colour"
      />
      <!-- deeper rows of the sides are shaded a little, like walls going down -->
      <polygon v-if="s.depth > 0" :points="s.points" class="shade" :opacity="0.05 * s.depth" />
    </template>

    <polygon v-for="(points, i) in focusRings" :key="'focus' + i" class="focus-ring" :points="points" />

    <template v-if="arrows">
      <path v-for="(d, i) in arrows.paths" :key="'halo' + i" :d="d" class="arrow-halo" :opacity="arrows.alpha" />
      <path v-for="(d, i) in arrows.paths" :key="'arrow' + i" :d="d" class="arrow" :opacity="arrows.alpha" marker-end="url(#arrowhead)" />
    </template>
  </svg>
</template>

<style scoped>
svg { width: 100%; height: 100%; display: block; touch-action: none; user-select: none; -webkit-user-select: none; }
.plate { fill: var(--plate); }
.lid { stroke: var(--plate); stroke-width: 8; stroke-linejoin: round; }
.sticker { stroke-width: 1.6; stroke-linejoin: round; }
.sticker.tappable { cursor: pointer; }
.sticker.lit { stroke: var(--accent); stroke-width: 3; }
.shade { fill: #000; pointer-events: none; }
.focus-ring { fill: none; stroke: #fff; stroke-width: 2.5; stroke-linejoin: round; pointer-events: none; }
.arrowhead { fill: var(--accent); }
.arrow { fill: none; stroke: var(--accent); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.arrow-halo { fill: none; stroke: var(--halo); stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
</style>
