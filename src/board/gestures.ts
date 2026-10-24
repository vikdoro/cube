import { LAYER_AXIS, layerAt, SLOTS, type Layer } from '../cube/model'
import { add, cross, scale } from '../cube/vec'
import { toBoard, type View } from '../cube/view'
import { BOARD_BOUNDS, placements, slotCentre, type Point, type Polygon } from './layout'

/**
 * Reading a drag as a turn.
 *
 * Fingers are imprecise, so a press counts for every sticker within a fingertip of it (gaps and arrows included),
 * and the whole line drawn since the press decides among their moves. Each move has a direction at every point of
 * the board (the way its stickers travel there: straight across the face, around a ring), and every bit of the line
 * is checked against the direction where it was drawn. The move the line follows best wins, so a touch-down wobble
 * or a hook at the end counts for little, and following a ring around its curve stays on that ring. Nearer stickers
 * are preferred, and a middle row that can't turn gives way to a neighbouring row that can. It is re-decided on
 * every move, so changing your mind mid-drag works. Distances are in screen pixels so it feels the same at any size.
 */
export const REACH_PX = 16
/** Movement below this is a tap (or a drag back to where it started). */
export const SLOP_PX = 10
/** How far a drag has to run along its move before letting go turns it. */
export const COMMIT_PX = 22
/** Dragging this far off the board cancels; coming back in resumes the drag. */
const CANCEL_PX = 36

/** One move a drag could mean, with the direction its stickers travel across the board. */
export interface DragOption {
  layer: Layer
  /** Distance from the press to the nearest sticker of this move. */
  dist: number
  field: { centre: Point; dir: Point }[]
  /** Middle slices are recognised but don't turn. */
  blocked: boolean
}

const unit = (x: number, y: number): Point => { const l = Math.hypot(x, y) || 1; return [x / l, y / l] }

/** The screen direction a slot's sticker travels on a clockwise turn of `layer`, from its real 3D motion. */
export function directionOf(view: View, slot: number, layer: Layer): Point {
  // a clockwise turn about axis a moves a point p along -(a × p)
  const s = SLOTS[slot], p = add(s.pos, s.normal, 0.5)
  const v = toBoard(view, scale(cross(LAYER_AXIS[layer], p), -1)), n = toBoard(view, s.normal)
  // board-space motion to screen motion, for each part of the board
  if (n[1] === 1) return unit(v[0], v[2])   // the face in the middle: x right, z down the page
  if (n[1] === -1) return unit(v[0], -v[2]) // the lid: hinged at the top, its front row furthest up
  if (n[0] === 1) return unit(-v[1], v[2])  // right side: going down the cube moves outward
  if (n[0] === -1) return unit(v[1], v[2])  // left side
  if (n[2] === 1) return unit(v[0], -v[1])  // near side (bottom of the board)
  return unit(v[0], v[1])                   // far side (top of the board)
}

/** Distance from a point to a polygon's edge, or 0 inside it. */
function edgeDistance(points: Polygon, [x, y]: Point) {
  let inside = false, best = Infinity
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[j], [bx, by] = points[i]
    if ((ay > y) !== (by > y) && x < ax + (y - ay) * (bx - ax) / (by - ay)) inside = !inside
    const ex = bx - ax, ey = by - ay
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1)))
    best = Math.min(best, Math.hypot(x - ax - t * ex, y - ay - t * ey))
  }
  return inside ? 0 : best
}

/** The slot nearest to a point: what a tap lands on. */
export function nearestSlot(view: View, point: Point) {
  const all = placements(view)
  let nearest = 0, best = Infinity
  all.forEach((p, slot) => { const d = edgeDistance(p.points, point); if (d < best) { best = d; nearest = slot } })
  return nearest
}

/** The moves a press at `point` could start: those of every sticker within `reach`. */
export function dragOptions(view: View, point: Point, reach: number): DragOption[] {
  const options = new Map<Layer, DragOption>()
  placements(view).forEach((placement, slot) => {
    const dist = edgeDistance(placement.points, point)
    if (dist > reach) return
    const s = SLOTS[slot]
    for (let axis = 0; axis < 3; axis++) {
      if (s.normal[axis] !== 0) continue // turning about the axis it faces would only spin it in place
      const layer = layerAt(axis, s.pos[axis]), known = options.get(layer)
      if (known) { known.dist = Math.min(known.dist, dist); continue }
      // where the stickers of this move sit, and which way each travels
      const field = SLOTS.filter(t => t.normal[axis] === 0 && t.pos[axis] === s.pos[axis])
        .map(t => ({ centre: slotCentre(view, t.index), dir: directionOf(view, t.index, layer) }))
      options.set(layer, { layer, dist, field, blocked: layer === 'M' || layer === 'E' || layer === 'S' })
    }
  })
  return [...options.values()]
}

const directionAt = (field: DragOption['field'], [x, y]: Point) => field.reduce(
  (a, f) => { const d = (f.centre[0] - x) ** 2 + (f.centre[1] - y) ** 2; return d < a.d ? { d, dir: f.dir } : a },
  { d: Infinity, dir: [0, 0] as Point },
).dir

/** How far the line has travelled along a move (signed), and how much of its length went that way (0..1). */
function follow(option: DragOption, path: readonly Point[]) {
  let along = 0, total = 0
  for (let i = 1; i < path.length; i++) {
    const [x0, y0] = path[i - 1], [x1, y1] = path[i], sx = x1 - x0, sy = y1 - y0
    const dir = directionAt(option.field, [(x0 + x1) / 2, (y0 + y1) / 2])
    along += sx * dir[0] + sy * dir[1]
    total += Math.hypot(sx, sy)
  }
  return { along, fit: total ? Math.abs(along) / total : 0 }
}

/** The move the drawn line follows best, and how far along it the line has gone (positive is clockwise). */
export function bestOption(options: readonly DragOption[], path: readonly Point[], reach: number) {
  let best: { option: DragOption; along: number; score: number } | null = null
  for (const option of options) {
    const f = follow(option, path)
    const score = f.fit - 0.5 * option.dist / reach - (option.blocked ? 0.5 : 0)
    if (!best || score > best.score) best = { option, along: f.along, score }
  }
  return best
}

/** Whether a point is well off the board; pxPerUnit converts the margin from screen pixels. */
export function isOffBoard([x, y]: Point, pxPerUnit: number) {
  const m = CANCEL_PX / pxPerUnit, b = BOARD_BOUNDS
  return x < b.left - m || x > b.right + m || y < b.top - m || y > b.bottom + m
}
