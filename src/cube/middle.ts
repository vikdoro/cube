import { applyMove, applyMoves, faceOf, inverse, pieceSlots, sameMove, SLOTS, type CubeState, type Face, type Move } from 'flatcube'
import { cornersHint, isFirstLayer } from './corners'

/**
 * The middle layer: with the white face done, the four edges with no yellow or white in the middle row of the sides,
 * each between the sides of its own colours. With the first layer that makes the first two layers. Yellow is U on the
 * cube, white D.
 *
 * The routine: turn U until an edge's side colour is on the side of that colour (a T with its centre), then the eight
 * turns that put it in towards the side of its other colour. An edge stuck in a wrong slot, or flipped in its own, is
 * pushed out onto U by the same eight turns there.
 */

const SIDES: Face[] = ['F', 'R', 'B', 'L']
// the side to the right of each side, looking at it from outside with U up
export const RIGHT: Record<Face, Face> = { F: 'R', R: 'B', B: 'L', L: 'F', U: 'U', D: 'D' }

// the middle edges, each as its two sticker ids
export const EDGES = SLOTS.map(s => pieceSlots(s.index))
  .filter(piece => piece.length === 2 && piece.every(slot => SIDES.includes(SLOTS[slot].face)))
  .filter((piece, i, all) => all.findIndex(other => `${other}` === `${piece}`) === i)

export const edges = [0, 1, 2, 3]

const turn = (layer: Face, amount: Move['amount'] = 1): Move => ({ layer, amount })

/** The eight turns that take the edge in front of side `x`, on U, into the slot between `x` and side `y`. */
export function insert(x: Face, y: Face): Move[] {
  return RIGHT[x] === y
    ? [turn('U'), turn(y), turn('U', 3), turn(y, 3), turn('U', 3), turn(x, 3), turn('U'), turn(x)]
    : [turn('U', 3), turn(y, 3), turn('U'), turn(y), turn('U'), turn(x), turn('U', 3), turn(x, 3)]
}

export const isHome = (state: CubeState, i: number) => EDGES[i].every(id => state[id] === id)
export const onTop = (state: CubeState, i: number) => EDGES[i].some(id => SLOTS[state.indexOf(id)].face === 'U')

/** How many middle edges are home. */
export const placedEdges = (state: CubeState) => edges.filter(i => isHome(state, i)).length

/** The first layer done and the four middle edges home: the first two layers. */
export const isTwoLayers = (state: CubeState) => isFirstLayer(state) && placedEdges(state) === 4

/** For an edge on U: the side its side sticker is on, the colour of that sticker, and the colour on top. */
export function onSide(state: CubeState, i: number) {
  const [a, b] = EDGES[i]
  const [side, top] = SLOTS[state.indexOf(a)].face === 'U' ? [b, a] : [a, b]
  return { at: SLOTS[state.indexOf(side)].face, colour: faceOf(side), other: faceOf(top) }
}

/**
 * What the routine does next from a done first layer with no eight turns in progress: a U turn, or eight turns to put
 * an edge in or push one out. Null once the middle layer is done.
 */
export function plan(state: CubeState): Move[] | null {
  if (isTwoLayers(state)) return null
  const top = edges.filter(i => onTop(state, i))
  const lined = top.find(i => onSide(state, i).at === onSide(state, i).colour)
  if (lined !== undefined) { const { colour, other } = onSide(state, lined); return insert(colour, other) }
  if (top.length) {
    // turn U the shorter way to make the nearest T
    const lines = (move: Move) => top.some(i => { const s = onSide(applyMove(state, move), i); return s.at === s.colour })
    return [lines(turn('U')) ? turn('U') : lines(turn('U', 3)) ? turn('U', 3) : turn('U')]
  }
  // only edges stuck in the middle row are left: push one out onto U
  const stuck = edges.find(i => !isHome(state, i))!
  const at = SLOTS[state.indexOf(EDGES[stuck][0])].face, other = SLOTS[state.indexOf(EDGES[stuck][1])].face
  const x = RIGHT[at] === other ? at : other
  return insert(x, RIGHT[x])
}

/**
 * The next turn of eight begun from a done first layer, if the last turns are their start. `recent` are the last
 * turns as made, newest last.
 */
function inProgress(state: CubeState, recent: readonly Move[]): Move | null {
  for (let k = Math.min(7, recent.length); k > 0; k--) {
    const tail = recent.slice(-k)
    const before = applyMoves(state, [...tail].reverse().map(inverse))
    if (!isFirstLayer(before)) continue
    const moves = plan(before)
    if (moves && moves.length === 8 && tail.every((move, j) => sameMove(move, moves[j]))) return moves[k]
  }
  return null
}

/**
 * The next quarter turn of the routine, or null once the first two layers are done. `recent` are the player's last
 * turns (seven are enough), so eight turns begun are finished. Without the white face it is the corners' hint, which
 * makes the lily and the cross first.
 */
export function middleHint(state: CubeState, recent: readonly Move[] = []): Move | null {
  if (isTwoLayers(state)) return null
  const going = inProgress(state, recent)
  if (going) return going
  return isFirstLayer(state) ? plan(state)![0] : cornersHint(state, recent)
}

/** Follow the hints from `state`, calling `each` with the position after every turn and the last turns made. */
function follow(state: CubeState, each: (state: CubeState, recent: readonly Move[]) => boolean | void) {
  let recent: Move[] = []
  for (let move = middleHint(state); move; move = middleHint(state, recent)) {
    state = applyMove(state, move)
    recent = [...recent, move].slice(-7)
    if (each(state, recent)) return state
  }
  return null
}

/** How many turns it takes to follow `middleHint` from here to the first two layers. */
export function middleTurns(state: CubeState) {
  let turns = 0
  follow(state, () => { turns++ })
  return turns
}

/**
 * A middle layer puzzle from a full scramble: with `toPlace` 1–4 it makes the white face, then follows the routine
 * until that many edges are left to place, between eight-turn goes (4 is the white face itself); with 5 it is the
 * scramble as it is. Never done already.
 */
export function middlePuzzle(scrambled: () => CubeState, toPlace: number): CubeState {
  for (;;) {
    let state = scrambled()
    if (isTwoLayers(state)) continue
    if (toPlace === 5) return state
    let recent: Move[] = []
    for (let move = cornersHint(state); move; move = cornersHint(state, recent)) {
      state = applyMove(state, move)
      recent = [...recent, move].slice(-3)
    }
    const target = 4 - toPlace
    if (placedEdges(state) > target) continue
    if (placedEdges(state) === target) return state
    const found = follow(state, (s, r) => placedEdges(s) === target && !inProgress(s, r))
    if (found) return found
  }
}
