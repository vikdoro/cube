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
  /** The explanation, shown a sentence at a time. */
  say: string[]
  /** The turns that finish the step, in order. */
  turns: Move[]
  /** A few words for each turn. */
  captions: string[]
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
    say: ['This edge has no yellow on it, so it belongs in the middle row.', 'Its home is the gap between the green and red sides.'],
    turns: [], captions: [], pieces: EDGE, targets: EDGE,
  },
  {
    title: 'Line it up',
    say: ['Turn the yellow face until the edge’s green sticker is on the green side.'],
    turns: LINE_UP, captions: ['Yellow face'], pieces: [...EDGE, GREEN_CENTRE], targets: [],
    free: { layer: 'U', goal: s => SLOTS[s.indexOf(GREEN)].face === 'F' },
  },
  {
    title: 'Make room',
    say: ['Its other sticker is red, so it goes towards the red side.', 'Four turns: the yellow face, the red side, then both back.'],
    turns: MAKE_ROOM, captions: ['Yellow face', 'Red side', 'Yellow face back', 'Red side back'],
    pieces: [...EDGE, RED_CENTRE], targets: EDGE,
  },
  {
    title: 'Drop it in',
    say: ['Now four more with the green side.', 'The yellow face the other way, the green side, then both back.'],
    turns: DROP_IN, captions: ['Yellow face, other way', 'Green side', 'Yellow face back', 'Green side back'],
    pieces: EDGE, targets: EDGE,
  },
]

/** The cube at the start of each step, and at the end. */
export const STEP_STARTS: CubeState[] = STEPS.reduce<CubeState[]>((all, s) => [...all, applyMoves(all[all.length - 1], s.turns)], [START])

/** Names for the layers, for the turn chips: the colour of the centre. */
export const LAYER_COLOUR: Record<string, string> = { U: '#ffd60a', R: '#ea3a30', F: '#2fb357', D: '#f4f4f6', L: '#ff8f1f', B: '#1f6fe5' }
