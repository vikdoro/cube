/**
 * The drills, set up in one place: this file is meant to be edited by hand, no coding needed. Save it, then run
 * `npm test`: it checks the file and says in plain words what is wrong, if anything.
 *
 * The order here is the order in the Practice sheet. Each drill has:
 *
 * - kind: a short name nobody sees. Don't rename it: players' saved progress uses it. Lowercase letters and hyphens.
 * - routine: the cube logic the drill plays (the puzzle, the goal, the hints). Pick one that exists in
 *   src/cube/drills.ts; a brand new kind of puzzle needs a developer to write its routine.
 * - title: the drill's name, on its intro sheet and in the top bar.
 * - pick, about: the drill's card in the Practice sheet, its heading and its text.
 * - doneName: what was made, for the top bar once done: "<doneName> in 9 moves".
 * - onPar, overPar: the done sheet's first sentence, when the player took no more turns than the routine does, and
 *   when they took more. The hints sentence is added after it.
 * - steps: the intro sheet's numbered steps, one line each.
 * - view: which way up the cube is held at the start: 'yellow-middle' or 'white-middle'.
 * - guided: true to offer the "Guided" switch. The routine must have a guide, which only a developer can add.
 *
 * Inside the text, three things are filled in or styled for you:
 *
 * - **words** in a step are shown bold. Only steps can have bold.
 * - {turns} in a step becomes the routine's turns for this puzzle: "12 turns", or "1 turn".
 * - {par} in onPar or overPar becomes the bare number: "12".
 *
 * House style: plain words, the sides of the cube named by their colour, never move letters (R, U, F...).
 *
 * To add a drill, copy an entry, give it a new kind, pick an existing routine and rewrite the text.
 */
import type { RoutineId } from './cube/drills'

/** A short name for a drill, never shown; saved progress uses it. */
export type DrillKind = string

export interface DrillDef {
  kind: DrillKind
  /** The cube logic it plays: one of ROUTINES in src/cube/drills.ts. */
  routine: RoutineId
  /** The drill's name: intro sheet and top bar. */
  title: string
  /** Its card in the Practice sheet: heading and text. */
  pick: string
  about: string
  /** What was made, for "<doneName> in 9 moves". */
  doneName: string
  /** The done sheet's first sentence, at or under par / over it. */
  onPar: string
  overPar: string
  /** The intro sheet's numbered steps. */
  steps: string[]
  view: 'yellow-middle' | 'white-middle'
  /** Show the "Guided" switch; the routine must have a guide. */
  guided: boolean
}

// the steps of the method in order, each drill starting where the one before leaves the cube
export const DRILLS: DrillDef[] = [
  {
    kind: 'lily',
    routine: 'lily',
    title: 'White lily',
    pick: 'Make the white lily',
    about: 'The first step of solving, from a full scramble: the four white edges around the yellow centre.',
    doneName: 'Lily',
    onPar: 'That is the shortest way.',
    overPar: 'It can be done in {par}.',
    steps: [
      'Bring the four **white edges** round the **yellow centre**, white facing the same way as the yellow. That is the lily. The corners don\'t matter.',
      'The cube is fully scrambled. It can be done in {turns}.',
      'Turning the yellow face moves the petals round without losing them. Turn it first to keep a petal out of the way of the next one.',
      'Stuck? **Hint** draws the next turn on the board.',
    ],
    view: 'yellow-middle',
    guided: true,
  },
  {
    kind: 'cross',
    routine: 'cross',
    title: 'White cross',
    pick: 'Make the white cross',
    about: 'From the lily, the petals drop onto the lid, each on the side of its own colour.',
    doneName: 'Cross',
    onPar: 'No wasted turns.',
    overPar: 'The routine takes {par}.',
    steps: [
      'Move the white petals from round the yellow centre to the **lid**, each on the side of its own colour. That is the white cross.',
      'Each petal has a second colour, on the side next to it. Turn the **yellow face** until that colour is next to the centre of the same colour.',
      'Turn that side **twice**. The petal drops onto the lid.',
      'The lily is made. The routine takes {turns}.',
      'Stuck? **Hint** draws the next turn on the board.',
    ],
    view: 'yellow-middle',
    guided: false,
  },
  {
    kind: 'corners',
    routine: 'corners',
    title: 'White corners',
    pick: 'Put in the white corners',
    about: 'From the cross, with white in the middle, the corners go in between the cross\'s edges, which finishes the white face.',
    doneName: 'Corners',
    onPar: 'No wasted turns.',
    overPar: 'The routine takes {par}.',
    steps: [
      'Put the four **white corners** in the middle face, between the white edges, each matching the two sides next to it. That finishes the white face.',
      'Turn the **lid** until a white corner is on the outer edge, at the same corner of the board as its slot: the corner of the middle face between the sides of its two colours.',
      'Then four turns: a side at that corner, the lid, the side back, the lid back. Repeat them until the corner is in, white in the middle. It takes one, three or five goes.',
      'A white corner stuck in the middle face in the wrong place: the four turns once at its corner lift it out.',
      'The white cross is made. The routine takes {turns}.',
      'Stuck? **Hint** draws the next turn on the board, and shows which side.',
    ],
    view: 'white-middle',
    guided: false,
  },
  {
    kind: 'middle',
    routine: 'middle',
    title: 'Middle layer',
    pick: 'Fill the middle layer',
    about: 'From the white face, the four edges with no yellow go into the middle row, each between the sides of its colours.',
    doneName: 'Middle layer',
    onPar: 'No wasted turns.',
    overPar: 'The routine takes {par}.',
    steps: [
      'Put the four edges with no yellow into the **middle row** of the sides, each between the two sides of its colours. The white face stays done, on the lid.',
      'Find an edge on the yellow face with no yellow on it. Turn the **yellow face** until its colour on the side matches that side\'s centre.',
      'Its other colour says where it goes: the middle row, towards the side of that colour, left or right. Eight turns put it in: four with that side, then four with the side it is on.',
      'An edge stuck in the middle row in the wrong place, or the wrong way round: the eight turns there push it out onto the yellow face.',
      'The white face is made. The routine takes {turns}.',
      'Stuck? **Hint** draws the next turn on the board.',
    ],
    view: 'yellow-middle',
    guided: true,
  },
  {
    kind: 'yellow',
    routine: 'yellow',
    title: 'Yellow cross',
    pick: 'Make the yellow cross',
    about: 'From the first two layers, the yellow edges turn so their yellow is on the yellow face. Six turns, done once, twice or three times.',
    doneName: 'Yellow cross',
    onPar: 'No wasted turns.',
    overPar: 'The routine takes {par}.',
    steps: [
      'Turn the four **yellow edges** so their yellow is on the yellow face, round the centre. That is the yellow cross. The corners don\'t matter, and neither do the edges\' other colours. The first two layers stay done.',
      'The yellow edges already on the yellow face make a **dot** (none), an **L** (two next to each other) or a **line** (two across). Each go of the six turns takes a dot to an L, an L to a line and a line to the cross.',
      'Pick the side to work from. For a line: a side it runs alongside. For an L: the side with one arm opposite it and the other on its left. For a dot: any side. Left and right are as seen from that side, looking across the yellow face.',
      'Six turns: that side, the side to its right, the yellow face, the right side back, the yellow face back, then that side back.',
      'The yellow edges can start in any shape. The routine takes {turns}.',
      'Stuck? **Hint** draws the next turn on the board.',
    ],
    view: 'yellow-middle',
    guided: false,
  },
  {
    kind: 'edges',
    routine: 'edges',
    title: 'Yellow edges',
    pick: 'Put the yellow edges in place',
    about: 'From the yellow cross, the yellow edges swap round until each one\'s other colour matches its side. Nine turns, done once or twice.',
    doneName: 'Yellow edges',
    onPar: 'No wasted turns.',
    overPar: 'The routine takes {par}.',
    steps: [
      'Swap the four **yellow edges** round until each one\'s other colour matches the centre of its side. The yellow cross stays made, and the corners don\'t matter yet.',
      'Turn the **yellow face** until two edges match their sides. If all four match, you\'re done.',
      'Two **side by side**: work from the side with one of them opposite it and the other on its right. Two **across**: work from any side, then turn yellow to find a pair side by side and go again. Left and right are as seen from that side, looking across the yellow face.',
      'Nine turns: the side to its right, the yellow face, the right side back, the yellow face, the right side, the yellow face twice, the right side back, then the yellow face.',
      'The edges can start in any order. The routine takes {turns}.',
      'Stuck? **Hint** draws the next turn on the board.',
    ],
    view: 'yellow-middle',
    guided: false,
  },
]

/** The drill of this kind. */
export function drillDef(kind: DrillKind): DrillDef {
  const def = DRILLS.find(d => d.kind === kind)
  if (!def) throw new Error(`No drill "${kind}"`)
  return def
}
