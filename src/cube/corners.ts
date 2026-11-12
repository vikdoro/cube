import { applyMove, inverse, pieceSlots, sameMove, SLOTS, type CubeState, type Face, type Move } from '@tadacube/engine'
import { crossHint, isCross } from './cross'

/**
 * The white corners: with the cross made, the four white corners on the white face, each between the sides of its own
 * colours. That finishes the white face and its row on every side: the first layer. Yellow is U on the cube, white D.
 *
 * The routine: turn U until a white corner is over its slot, then repeat the four turns of its trigger (the side to
 * the right of the slot, U, the side back, U back) until it is home. A corner stuck in a wrong slot is lifted out by
 * one trigger there.
 */

// the white corners as their white sticker ids
const WHITE_CORNERS = SLOTS.filter(s => s.face === 'D' && pieceSlots(s.index).length === 3).map(s => s.index)
const HOME = WHITE_CORNERS.map(id => SLOTS[id].pos)

const corners = [0, 1, 2, 3]

const isHome = (state: CubeState, i: number) => pieceSlots(WHITE_CORNERS[i]).every(slot => state[slot] === slot)
const posOf = (state: CubeState, i: number) => SLOTS[state.indexOf(WHITE_CORNERS[i])].pos

/** The corner's own slot, or the place over it on U: where its trigger works on it. */
function atOwnSlot(state: CubeState, i: number) {
  const [x, , z] = posOf(state, i)
  return x === HOME[i][0] && z === HOME[i][2]
}

/** The four turns that work on the slot at x, z on the white face: the side to its right, U, the side back, U back. */
function trigger([x, , z]: readonly number[]): Move[] {
  const side: Face = x * z > 0 ? (x > 0 ? 'R' : 'L') : (z > 0 ? 'F' : 'B')
  return [{ layer: side, amount: 1 }, { layer: 'U', amount: 1 }, { layer: side, amount: 3 }, { layer: 'U', amount: 3 }]
}
const TRIGGERS = HOME.map(trigger)

/** How many white corners are home. */
export const placed = (state: CubeState) => corners.filter(i => isHome(state, i)).length

/** The cross made and the four white corners home: the white face done. */
export const isFirstLayer = (state: CubeState) => isCross(state) && placed(state) === 4

/**
 * The rest of a trigger begun from a made cross, if the last turns are its start: the next turn of it, or null.
 * `recent` are the last turns as made, newest last.
 */
function triggerInProgress(state: CubeState, recent: readonly Move[]): Move | null {
  for (let k = Math.min(3, recent.length); k > 0; k--) {
    const tail = recent.slice(-k)
    const begun = TRIGGERS.find(t => tail.every((move, j) => sameMove(move, t[j])))
    if (begun && isCross(tail.reduceRight((s, move) => applyMove(s, inverse(move)), state))) return begun[k]
  }
  return null
}

/** The routine's next turn from a made cross with no trigger in progress. */
function nextStep(state: CubeState): Move {
  // a corner over its own slot or twisted in it: its trigger, again until it is home
  const working = corners.find(i => !isHome(state, i) && atOwnSlot(state, i))
  if (working !== undefined) return TRIGGERS[working][0]
  // a corner on U: turn U the shorter way to bring the nearest one over its slot
  const onTop = corners.filter(i => posOf(state, i)[1] === 1)
  if (onTop.length) {
    const turns = (move: Move) => onTop.some(i => atOwnSlot(applyMove(state, move), i))
    const turned = (amount: 1 | 3): Move => ({ layer: 'U', amount })
    return turns(turned(1)) ? turned(1) : turns(turned(3)) ? turned(3) : turned(1)
  }
  // only corners stuck in the wrong slots are left: lift one out
  return trigger(posOf(state, corners.find(i => !isHome(state, i))!))[0]
}

/**
 * The next quarter turn of the routine, or null once the white face is done. `recent` are the player's last turns
 * (three are enough), so a trigger begun is finished. Without the cross it is the cross's hint, which makes the lily
 * first.
 */
export function cornersHint(state: CubeState, recent: readonly Move[] = []): Move | null {
  if (isFirstLayer(state)) return null
  const going = triggerInProgress(state, recent)
  if (going) return going
  return isCross(state) ? nextStep(state) : crossHint(state)
}

/** Follow the hints from `state`, calling `each` with the position after every turn and the turns so far. */
function follow(state: CubeState, each: (state: CubeState, recent: readonly Move[]) => boolean | void) {
  let recent: Move[] = []
  for (let move = cornersHint(state); move; move = cornersHint(state, recent)) {
    state = applyMove(state, move)
    recent = [...recent, move].slice(-3)
    if (each(state, recent)) return state
  }
  return null
}

/** How many turns it takes to follow `cornersHint` from here to the white face. */
export function cornersTurns(state: CubeState) {
  let turns = 0
  follow(state, () => { turns++ })
  return turns
}

/**
 * A corners puzzle from a full scramble: with `toPlace` 1–4 it makes the cross, then follows the routine until that
 * many corners are left to place, between triggers (4 is the cross itself); with 5 it is the scramble as it is. Never
 * a done white face.
 */
export function cornersPuzzle(scrambled: () => CubeState, toPlace: number): CubeState {
  for (;;) {
    let state = scrambled()
    if (isFirstLayer(state)) continue
    if (toPlace === 5) return state
    for (let move = crossHint(state); move; move = crossHint(state)) state = applyMove(state, move)
    const target = 4 - toPlace
    if (placed(state) > target) continue
    if (placed(state) === target) return state
    const found = follow(state, (s, recent) => placed(s) === target && !triggerInProgress(s, recent))
    if (found) return found
  }
}
