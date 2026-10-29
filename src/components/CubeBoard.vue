<script setup lang="ts">
// The board, and turning it by hand. Press a sticker and drag: the row or ring the drag runs along lights up with
// its arrows; let go and it turns. A tap without a drag on a side rolls the cube so that side is in the middle.
import { computed, useTemplateRef } from 'vue'
import { arrowPaths } from '../board/arrows'
import { stickerShapes } from '../board/frame'
import { bestOption, COMMIT_PX, dragOptions, isOffBoard, nearestSlot, REACH_PX, SLOP_PX, type DragOption } from '../board/gestures'
import { BOARD_BOUNDS, centroid, LID_PLATE, PLATE_HALF, pointsAttr, slotCentre, VIEW_BOX, type Point } from '../board/layout'
import { inLayer, SLOTS } from '../cube/model'
import { IDENTITY } from '../cube/vec'
import { boardSlotName, facingFace } from '../cube/view'
import { useCube } from '../composables/useCube'
import { usePlayer } from '../composables/usePlayer'

const cube = useCube()
const player = usePlayer()
const svg = useTemplateRef<SVGSVGElement>('svg')

// as wide as it can be, leaving a row above it for the move's name and one under it for Undo; the margins past the
// lid and under the plate (where the arrows go) are given back, so both centre in the space beside the cube itself
const ROOM = '128px'
const [, vbY, vbW, vbH] = VIEW_BOX.split(' ').map(Number)
const scale = `min(100cqw / ${vbW}, (100cqh - ${ROOM}) / ${vbH})`
const fit = {
  aspectRatio: `${vbW} / ${vbH}`,
  maxHeight: `calc(100cqh - ${ROOM})`,
  marginTop: `calc(${vbY - BOARD_BOUNDS.top} * ${scale})`,
  marginBottom: `calc(${PLATE_HALF - vbY - vbH} * ${scale})`,
}

const sizeOf = (points: readonly Point[]) => {
  const xs = points.map(p => p[0]), ys = points.map(p => p[1])
  return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]
}

const FACE_NAME = { U: 'top', D: 'bottom', R: 'right', L: 'left', F: 'front', B: 'back' } as const
const label = computed(() =>
  `The cube as an open box: its ${FACE_NAME[facingFace(cube.view.value)]} face in the middle, four sides around it, the lid hanging open above`)

const shapes = computed(() =>
  stickerShapes(cube.state.value, cube.view.value, cube.turning.value, cube.rolling.value, cube.now.value))

const stickers = computed(() => {
  const live = cube.livePreview.value
  return shapes.value.map(s => ({
    ...s,
    points: pointsAttr(s.points),
    tappable: !cube.rolling.value && s.depth === -1,
    lit: !!live && inLayer(SLOTS[s.slot].pos, live.move.layer),
  }))
})

// debug (?debug in the URL): every sticker labelled with the place it starts on, so the labels travel with the turns.
// A place is named by its face's board name and a number, 1 to 9 in reading order as the face is seen from inside the
// cube, with the cube held as at the start. Each side is read with its rim up, so the row along the rim is 1 2 3; the
// lid with its hinge up (U1 U2 U3 along it); the middle with the far side up (D3 D2 D1 along its top row, since
// looking up at it from inside mirrors it)
const READ_UP: Record<string, Point> = { U: [0, 1], D: [0, -1], B: [0, -1], F: [0, 1], L: [-1, 0], R: [1, 0] }
const START_NAMES = (() => {
  const names: string[] = []
  for (const face of 'UDFBLR') {
    const [ux, uy] = READ_UP[face], up = ([x, y]: Point) => ux * x + uy * y, right = ([x, y]: Point) => uy * x - ux * y
    const rows = SLOTS.filter(s => boardSlotName(IDENTITY, s)[0] === face)
      .map(s => ({ slot: s.index, at: slotCentre(IDENTITY, s.index) }))
      .sort((a, b) => up(b.at) - up(a.at))
    for (let r = 0; r < 3; r++)
      rows.slice(3 * r, 3 * r + 3).sort((a, b) => right(a.at) - right(b.at)).forEach((p, c) => names[p.slot] = face + (3 * r + c + 1))
  }
  return names
})()
const debug = new URLSearchParams(location.search).has('debug')
const labels = computed(() => {
  if (!debug) return []
  return shapes.value.map(s => {
    const [x, y] = centroid(s.points)
    const [w, h] = sizeOf(s.points)
    // on the left and right sides the stickers are tall and thin, so the label runs along them
    const upright = h > w * 1.3
    const [across, along] = upright ? [w, h] : [h, w]
    const turn = upright ? (x > 0 ? 90 : -90) : 0
    return { slot: s.slot, x, y, turn, text: START_NAMES[cube.state.value[s.slot]], size: Math.min(11, along / 2.6, across / 1.4) }
  })
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
    ref="svg" :viewBox="VIEW_BOX" :style="fit" role="img" :aria-label="label"
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

    <text
      v-for="l in labels" :key="'label' + l.slot" class="label"
      :x="l.x" :y="l.y" :font-size="l.size" :transform="l.turn ? `rotate(${l.turn} ${l.x} ${l.y})` : undefined"
    >{{ l.text }}</text>

    <template v-if="arrows">
      <path v-for="(d, i) in arrows.paths" :key="'halo' + i" :d="d" class="arrow-halo" :opacity="arrows.alpha" />
      <path v-for="(d, i) in arrows.paths" :key="'arrow' + i" :d="d" class="arrow" :opacity="arrows.alpha" marker-end="url(#arrowhead)" />
    </template>
  </svg>
</template>

<style scoped>
svg { flex: none; width: 100%; display: block; touch-action: none; user-select: none; -webkit-user-select: none; }
.plate { fill: var(--plate); }
.lid { stroke: var(--plate); stroke-width: 8; stroke-linejoin: round; }
.sticker { stroke-width: 1.6; stroke-linejoin: round; }
.sticker.tappable { cursor: pointer; }
.sticker.lit { stroke: var(--accent); stroke-width: 3; }
.shade { fill: #000; pointer-events: none; }
.label { fill: #000; stroke: rgba(255,255,255,0.85); stroke-width: 2.4; paint-order: stroke; font-family: var(--round); font-weight: 700; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
.arrowhead { fill: var(--accent); }
.arrow { fill: none; stroke: var(--accent); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.arrow-halo { fill: none; stroke: var(--halo); stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
</style>
