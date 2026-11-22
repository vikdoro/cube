import { applyMoves, inLayer, inverse, SLOTS, SOLVED, type CubeState, type Face, type Move } from 'flatcube'

/**
 * PROTOTYPE (throwaway): one hardcoded middle layer puzzle, broken into small steps, to try out ways of guiding the
 * player through a routine. Yellow is U on the cube and sits in the middle of the board; green is near, red right.
 */

const t = (layer: Face, amount: Move['amount'] = 1): Move => ({ layer, amount })

const LINE_UP = [t('U', 3)]
const MAKE_ROOM = [t('U'), t('R'), t('U', 3), t('R', 3)]
const DROP_IN = [t('U', 3), t('F', 3), t('U'), t('F')]

/** The green and red edge, as its two sticker ids (also its home slots). */
export const EDGE = SLOTS.filter(s => s.pos.join() === '1,0,1').map(s => s.index)
/** The white corner under the edge's home, which the routine lifts out and puts back. */
export const CORNER = SLOTS.filter(s => s.pos.join() === '1,-1,1').map(s => s.index)
const GREEN = EDGE.find(id => SLOTS[id].face === 'F')!
const GREEN_CENTRE = 22, RED_CENTRE = 13

/** Two layers done but the green and red edge, which sits on the yellow face one turn away from lining up. */
export const START: CubeState = applyMoves(SOLVED, [...LINE_UP, ...MAKE_ROOM, ...DROP_IN].reverse().map(inverse))

export interface Step {
  title: string
  /**
   * The step's text as story slides, a few lines each. A slide with turns waits for them (that many of the step's
   * turns, in order); one without is read on a timer.
   */
  slides: { say: string; turns: number }[]
  /** The turns that finish the step, in order. */
  turns: Move[]
  /** Sticker ids to light up: they follow their pieces round. */
  pieces: number[]
  /** Slots to outline where they are: the edge's home. */
  targets: number[]
  /** Any turn of this layer counts until the goal is met (lining up can go either way). */
  free?: { layer: Face; goal: (state: CubeState) => boolean }
}

// Words in [brackets](term) can be tapped for a line about them, see TERMS
export const STEPS: Step[] = [
  {
    title: 'Find the edge',
    slides: [
      { say: 'This [edge](edge) has no yellow on it, so it belongs in the middle row.', turns: 0 },
      { say: 'Its home is the [gap](gap) between the [green](green) and [red](red) sides, outlined on the board.', turns: 0 },
    ],
    turns: [], pieces: EDGE, targets: EDGE,
  },
  {
    title: 'Line it up',
    slides: [{ say: 'Turn the [yellow face](yellow) until the edge’s green sticker sits on the green side.', turns: 1 }],
    turns: LINE_UP, pieces: [...EDGE, GREEN_CENTRE], targets: [],
    free: { layer: 'U', goal: s => SLOTS[s.indexOf(GREEN)].face === 'F' },
  },
  {
    title: 'Make room',
    slides: [
      { say: 'Its other sticker is red, so the edge goes towards the [red side](red).', turns: 0 },
      { say: 'First the [white corner](corner) under the gap comes up next to the edge, so the two can go down together.', turns: 0 },
      { say: 'Turn the [yellow face](yellow) to move the edge out of the way.', turns: 1 },
      { say: 'Turn the [red side](red) to lift the white corner up.', turns: 1 },
      { say: 'Turn the yellow face back, and the edge comes back too.', turns: 1 },
      { say: 'Turn the red side back down. The corner stays up, right next to the edge.', turns: 1 },
    ],
    turns: MAKE_ROOM, pieces: [...EDGE, ...CORNER, RED_CENTRE], targets: EDGE,
  },
  {
    title: 'Drop it in',
    slides: [
      { say: 'The edge and the corner are now a [pair](pair). Turn the yellow face to move them round.', turns: 1 },
      { say: 'Turn the [green side](green) to lift the [gap](gap) up to the yellow face.', turns: 1 },
      { say: 'Turn the yellow face back, and the pair lands right over the gap.', turns: 1 },
      { say: 'Turn the green side down, and both drop home together.', turns: 1 },
    ],
    turns: DROP_IN, pieces: [...EDGE, ...CORNER], targets: EDGE,
  },
]

const layer = (l: Face) => SLOTS.filter(s => inLayer(s.pos, l)).map(s => s.index)
const at = (ids: number[]) => (state: CubeState) => ids.map(id => state.indexOf(id))

/** What a tappable word says, and the slots it lights up on the cube as it is. */
export const TERMS: Record<string, { say: string; slots: (state: CubeState) => number[] }> = {
  edge: { say: 'An edge has two stickers and sits between two centres. This one is green and red.', slots: at(EDGE) },
  gap: { say: 'The edge’s home in the middle row, between the green and red centres. Another piece sits there for now.', slots: () => EDGE },
  corner: { say: 'This corner belongs to the white face, which is done. It comes out for a moment and goes back with the edge.', slots: at(CORNER) },
  pair: { say: 'The edge and the white corner side by side. Moving them together keeps the white face whole at the end.', slots: at([...EDGE, ...CORNER]) },
  yellow: { say: 'The middle of the board. Turning it moves the whole yellow layer, the yellow stickers and the side stickers around them.', slots: () => layer('U') },
  red: { say: 'A side is named by its centre, which never moves. Turning the red side moves its whole layer.', slots: () => layer('R') },
  green: { say: 'A side is named by its centre, which never moves. Turning the green side moves its whole layer.', slots: () => layer('F') },
}

/** The cube at the start of each step, and at the end. */
export const STEP_STARTS: CubeState[] = STEPS.reduce<CubeState[]>((all, s) => [...all, applyMoves(all[all.length - 1], s.turns)], [START])
