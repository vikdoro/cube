import { FACE_NORMAL, FACES, moveName, type Face, type Move } from './model'
import { equals, quarterTurn, thenApply, transform, type Mat3, type Vec3 } from './vec'

/**
 * Which way the cube is held on the board: the rotation from cube coordinates to board coordinates.
 * On the board, +y is the face in the middle (towards you), -z points up the page and +x to the right.
 */
export type View = Mat3

export const toBoard = (view: View, v: Vec3) => transform(view, v)

/** The face that sits in the middle of the board. */
export const facingFace = (view: View): Face => FACES.find(f => toBoard(view, FACE_NORMAL[f])[1] === 1)!

/** The cube face shown at the place on the board where `face` sits when the cube is held straight. */
const boardFace = (view: View, face: Face): Face =>
  FACES.find(f => equals(FACE_NORMAL[f], toBoard(view, FACE_NORMAL[face])))!

/**
 * Moves are named by where their face sits on the board, not by the cube's own faces: the middle is always U,
 * the far side (top of the page) B, the near side F and the lid D. Rolling the cube renames its moves.
 */
export function boardMoveName(view: View, move: Move) {
  const layer = move.layer
  if (layer === 'M' || layer === 'E' || layer === 'S') return moveName(move)
  return moveName({ ...move, layer: boardFace(view, layer) })
}

/**
 * Roll the cube so that the face whose normal points along `boardNormal` (in board coordinates) comes to the
 * middle: a quarter turn towards you for a side, a half turn for the lid.
 */
export function rollTowards(view: View, boardNormal: Vec3): View {
  const [nx, ny, nz] = boardNormal
  if (ny === 1) return view
  if (ny === -1) return thenApply(view, ([x, y, z]) => [x, -y, -z])
  return thenApply(view, v => quarterTurn(v, [nz, 0, -nx]))
}
