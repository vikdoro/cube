import { applyMoves, inverse, SLOTS, SOLVED, type CubeState, type Face, type Move } from 'flatcube'

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

export const STEPS: Step[] = [
  {
    title: 'Find the edge',
    slides: [
      { say: 'This edge has no yellow on it, so it belongs in the middle row.', turns: 0 },
      { say: 'Its home is the gap between the green and red sides, outlined on the board.', turns: 0 },
    ],
    turns: [], pieces: EDGE, targets: EDGE,
  },
  {
    title: 'Line it up',
    slides: [{ say: 'Turn the yellow face until the edge’s green sticker sits on the green side.', turns: 1 }],
    turns: LINE_UP, pieces: [...EDGE, GREEN_CENTRE], targets: [],
    free: { layer: 'U', goal: s => SLOTS[s.indexOf(GREEN)].face === 'F' },
  },
  {
    title: 'Make room',
    slides: [
      { say: 'Its other sticker is red, so the edge goes towards the red side.', turns: 0 },
      { say: 'To make room, turn the yellow face, then the red side, the way the arrows show.', turns: 2 },
      { say: 'Now turn both back: the yellow face first, then the red side.', turns: 2 },
    ],
    turns: MAKE_ROOM, pieces: [...EDGE, RED_CENTRE], targets: EDGE,
  },
  {
    title: 'Drop it in',
    slides: [
      { say: 'Do the same with the green side, starting with the yellow face the other way.', turns: 2 },
      { say: 'Turn both back, and the edge drops into its home.', turns: 2 },
    ],
    turns: DROP_IN, pieces: EDGE, targets: EDGE,
  },
]

/** The cube at the start of each step, and at the end. */
export const STEP_STARTS: CubeState[] = STEPS.reduce<CubeState[]>((all, s) => [...all, applyMoves(all[all.length - 1], s.turns)], [START])
