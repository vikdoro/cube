import type { CubeState, Face, Move } from 'flatcube'

/**
 * Guided play: a drill's steps told as story slides, written from the cube as it is. A drill that can be guided gives a
 * planner that, from a position where its routine can start, returns the next stretch of the story (a segment, usually
 * one piece's journey) or null once the goal is reached. The player makes every turn; see useGuide for how turns are
 * followed.
 */

export interface GuideSlide {
  /** A few lines in plain words, sides named by colour, no move letters. */
  say: string
  /** The turns the slide waits for, in order; none for a slide that's only read. */
  turns: Move[]
  /** Any turn of this layer counts until the goal is met, the arrows showing the way there (lining up goes either way). */
  free?: { layer: Face; goal: (state: CubeState) => boolean; next: (state: CubeState) => Move }
}

export interface GuideSegment {
  slides: GuideSlide[]
  /** Sticker ids to outline: they follow their pieces round. */
  pieces: readonly number[]
  /** Slots to outline with a dashed line where they are: where the piece is going. */
  targets: readonly number[]
}

export interface Guide {
  /** The next stretch of the story from here, or null once the goal is reached. `explained`: the routine was told already. */
  segment: (state: CubeState, explained: boolean) => GuideSegment | null
  /** Whether the routine can carry on from here: off this, a turn has to be turned back. */
  intact: (state: CubeState) => boolean
  /** What the panel says when a turn left `intact`. */
  broken: string
  /** What it says after any other turn off the plan that has to be turned back (one made mid-routine). */
  stray: string
  /** What the panel says once the goal is reached. */
  done: string
}

/** The colour of each face's centre, as the slides name the sides. */
export const COLOUR: Record<Face, string> = { U: 'yellow', D: 'white', F: 'green', R: 'red', B: 'blue', L: 'orange' }
