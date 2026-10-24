import { describe, expect, it } from 'vitest'
import { FACE_NORMAL, FACES } from './model'
import { IDENTITY } from './vec'
import { boardMoveName, facingFace, rollTowards, toBoard } from './view'

describe('view', () => {
  it('starts with the top face in the middle', () => {
    expect(facingFace(IDENTITY)).toBe('U')
  })

  it('rolling towards a face brings it to the middle, from any view', () => {
    let view = IDENTITY
    for (const step of ['F', 'R', 'D', 'B', 'L', 'U', 'D', 'F']) {
      const face = FACES.find(f => f === step)!
      view = rollTowards(view, toBoard(view, FACE_NORMAL[face]))
      expect(facingFace(view)).toBe(face)
    }
  })

  it('names moves by where their face is on the board', () => {
    let view = IDENTITY
    expect(boardMoveName(view, { layer: 'U', amount: 1 })).toBe('U')
    view = rollTowards(view, toBoard(view, FACE_NORMAL.F)) // F comes to the middle
    expect(boardMoveName(view, { layer: 'F', amount: 3 })).toBe('U′')
    expect(boardMoveName(view, { layer: 'U', amount: 1 })).toBe('B') // the old top is now the far side
    expect(boardMoveName(view, { layer: 'B', amount: 2 })).toBe('D2') // and the back is the lid
  })
})
