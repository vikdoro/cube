import type { CubeState, Move } from './model'

/**
 * The beginner method, as stages. Stage 1 is the first thing done on a scrambled cube and stage 7 the last; they are
 * taught backwards, so a learner's first lesson is stage 7 and every puzzle ends with a solved cube.
 */
export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** A named piece of a stage's algorithm, as shown under the board: "R′ D′ R D" is one chunk. */
export interface Chunk {
  name: string
  moves: readonly Move[]
}

/**
 * What to do next, as a whole: a setup turn, the algorithm, or a setup, the algorithm and the setup undone.
 * `algStart` is where the stage's algorithm begins within `moves`, or -1 when the routine is only setup turns.
 */
export interface Routine {
  label: string
  moves: readonly Move[]
  algStart: number
}

export interface Stage {
  id: StageId
  title: string
  /** For the slim bar under the board. */
  short: string
  /** The numbered steps for the intro sheet. */
  intro: readonly string[]
  chunks: readonly Chunk[]
  /** Whether this stage and every earlier one is done. */
  isDone(state: CubeState): boolean
  /** A fresh case: the earlier stages done, this one not. */
  start(random: () => number): CubeState
  /** At a routine boundary (nothing half done): the next routine, or null when the stage is done or doesn't apply. */
  nextRoutine(state: CubeState): Routine | null
  /** Slots to ring on the board: the working position. */
  focus(state: CubeState): readonly number[] | null
}

/** The stages built so far, in the order they are taught. */
export const TEACHING_ORDER: readonly StageId[] = [7, 6]

/** The same stages in the order they are done in a solve. */
export const METHOD_ORDER: readonly StageId[] = [...TEACHING_ORDER].reverse()

export const algMoves = (stage: Stage): Move[] => stage.chunks.flatMap(c => c.moves)
