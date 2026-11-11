# White cross drill: spec

Written 2026-11-11. Tests: `src/cube/cross.test.ts` and `src/text.test.ts` (both fail until this is built).

## What it is

A third practice drill, after "Undo the scramble" and "Make the white lily". The lily leaves the four white edges
round the yellow centre. This drill moves them to the white face, each on the side of its own colour: the white
cross, which finishes the first step of the beginner method.

The player learns one routine:

1. Turn the yellow face until a petal's second colour sits over the side of that colour.
2. Turn that side twice. The petal drops onto the white face, matching on both faces.
3. Repeat for each petal.

On this board the white face is the lid, so the player watches the cross build on a face that is hidden on a real
cube. The drill holds the cube as the lily does (`cube.setView(IDENTITY)`): yellow in the middle, white on the lid.

## Words

Code uses the cube's own faces, as `lily.ts` does: **U is yellow, D is white**, and the sides are F, R, B, L.
On the board the yellow face is the middle and the white face is the lid, and the board's move names differ from the
cube's (see `view.ts`). So the code says U and D, and the text the player reads says "yellow face", "lid" and "side",
never a letter.

A white edge is one of the four edge pieces with a white sticker. Each belongs to one side: the face of its other
sticker when solved. At any moment a white edge is:

- **home**: both stickers in their solved slots.
- **a petal**: its white sticker is on U. A petal is **matched** when its other sticker is on the side it belongs to.
- anything else.

A position is **settled** when every white edge is home or a petal. Settled positions are the ones the routine works
from: the lily is settled with four petals, the cross is settled with none. There are 209 of them among the 190 080
ways the four white edges can lie. Only the white edges matter; the rest of the cube is ignored throughout.

## `src/cube/cross.ts`

Pure and stateless, in the style of `lily.ts`. Exports:

| Export | Meaning |
| --- | --- |
| `isCross(state)` | All four white edges are home. |
| `dropped(state)` | How many white edges are home, 0–4. |
| `isSettled(state)` | Every white edge is home or a petal. |
| `settleDistance(state)` | The fewest quarter turns to a settled position. 0 when settled, never more than 6. |
| `crossHint(state)` | The next quarter turn of the routine, or `null` once the cross is made. |
| `routineTurns(state)` | How many turns it takes to follow `crossHint` from here to the cross. |
| `crossPuzzle(scrambled, toDrop)` | A start position for a level (below). `scrambled` is a function that returns a fresh full scramble, as in `lilyPuzzle`. |

### The hint

Always a quarter turn (amount 1 or 3), like the lily's hint. In order:

1. The cross is made: `null`.
2. The position is settled and a petal is matched: a quarter turn of that petal's side. Either direction; pick one
   and keep to it.
3. The position is settled and no petal is matched: a quarter turn of U, the shorter way round to the nearest match.
   When both ways are equally far (a half turn away), either.
4. The position is not settled: a quarter turn that brings it one turn closer to a settled position
   (`settleDistance` goes down by one). When several do, prefer one that brings a white edge home. This is what
   finishes a drop: halfway through one, turning on and turning back both lead to a settled position, and the hint
   must turn on.

Rule 4 also covers a full scramble (it leads to the nearest position where every white edge is a petal or already
home, a lily that keeps what is in place) and a player who wanders off the routine.

Why not the shortest way to the cross, as the lily's hint is the shortest way to the lily: the shortest way is often
a trick, such as turning the yellow face in the middle of a drop so that a second petal is knocked into place. It
would teach something other than the routine. Checked on 3 000 lilies: with three petals to drop, the trick saves up
to three turns over the routine.

Facts the tests rely on:

- From a settled position the routine turns only U and the sides, two side turns per petal and at most three U
  turns, so at most 11 turns in all. A dropped edge is never disturbed again.
- From a settled position the hints take the fewest turns the routine allows (fewest among ways that use only U
  quarter turns and side half turns).
- From anywhere, the cross is at most 6 + 11 turns away by the hints.

### Speed

The search table behind rule 4 covers all 190 080 positions. Built naively (a `Map`, as in `lily.ts`) a table of
that size took roughly half a second on a laptop, which would be a visible stall on a phone if it ran when the page
loads.

- Nothing heavy at module load. Build the table on first use.
- `isCross`, `dropped`, `isSettled`, and `crossHint` and `routineTurns` from a settled position must not need the
  table. That keeps levels 1–4 free of it unless the player leaves the routine.
- One table is enough: a search outwards from the 209 settled positions reaches every position.
- Measure the first-use build time and report it. If it is over about 200 ms on a laptop, use a typed array
  indexed by the position's number instead of a `Map`.

### Puzzles

`crossPuzzle(scrambled, toDrop)`:

- `toDrop` 1–4: take a scramble, make the lily by following `lilyHint`, then follow `crossHint` until the position
  is settled with exactly `toDrop` petals left. With 4 that is the lily itself.
- `toDrop` 5: the scramble as it is.
- Never return a position with the cross already made; take another scramble.

## Wiring

Follow how the lily was added; each of these has a lily line to copy.

- `src/cube/drills.ts`: `DrillKind` gains `'cross'`. Mention the cross in the header comment.
- `src/storage.ts`: `PracticeMemory` gains `crossLevel`, the last cross level played.
- `src/composables/usePractice.ts`:
  - `MAX_LEVEL.cross` is 5.
  - `startCross(level)`: start from `crossPuzzle(() => scramble(SOLVED), level)`, save `crossLevel`, hold the cube
    with `cube.setView(IDENTITY)`. `par` is `routineTurns(start)` for levels 1–4 and `null` for level 5, where the
    turns the hints take are no measure of a good solve.
  - The goal check, the hint and `currentLevel` handle the third kind. Three kinds is the point to replace the
    two-way conditionals with a lookup by kind, as `START` already is.
  - Update the comments on `Drill.level` and `Drill.par` (for the cross, par is the routine's turns, not the true
    fewest).
- `src/text.ts`: `levelName('cross', n)` is `"n petal(s)"` for 1–4 and `"full scramble"` for 5. `drillTitle` is
  `White cross · <level name>`. `doneTitle` is `Cross in N moves`. Pinned by `src/text.test.ts`.
- `src/components/PracticeSheet.vue`: a third pick under the lily, chips 1–4 and a wide "Full scramble" chip, with
  `aria-label` `White cross, <level name>`.
- `src/components/DrillIntroSheet.vue`: a steps list for the cross (copy below).
- `src/components/DrillDoneSheet.vue`:
  - Summary for the cross when par is known: `No wasted turns. ` if `moves <= par`, otherwise
    `The routine takes <par>. `. Undo and lily keep their wording. With no par, only the hints sentence.
  - The level-up button reads "Try a full scramble" when the next level is the full scramble of either drill.
- `README.md`: the Practice paragraph and the `src/cube/` row of the code layout table mention neither the lily nor
  the cross. Bring both up to date.

Nothing else should need to change: the top bar, Hint button, undo and keyboard already work from the drill in
progress.

## Text

Plain words, no letters for moves, same tone as the lily's steps.

Practice sheet pick:

> **Make the white cross**
> The petals drop onto the lid, each on the side of its own colour. Pick how many petals are still to drop, or
> start from a full scramble.

Steps, levels 1–4:

1. Move the white petals from round the yellow centre to the **lid**, each on the side of its own colour. That is
   the white cross.
2. Each petal has a second colour, on the side next to it. Turn the **yellow face** until that colour is next to
   the centre of the same colour.
3. Turn that side **twice**. The petal drops onto the lid.
4. "One petal is still to drop." / "N petals are still to drop." Then: "The routine takes N turns."
5. Stuck? **Hint** draws the next turn on the board.

Steps, level 5 (full scramble):

1. Make the **white cross**: the four white edges on the lid, round the white centre, each on the side of its own
   colour.
2. First make the lily: bring the white edges round the yellow centre.
3. Each petal has a second colour, on the side next to it. Turn the **yellow face** until that colour is next to
   the centre of the same colour.
4. Turn that side **twice**. The petal drops onto the lid.
5. Stuck? **Hint** draws the next turn on the board.

## Not in this piece of work

- Carrying on from a finished lily puzzle straight into its cross.
- Remembering which levels have been solved cleanly.
- Showing the keyboard keys in the UI.
- Any change to the board, the gestures, the animations or the other two drills' behaviour.
- New dependencies.

## Done when

- `npm test` passes, with the test files unchanged.
- `npm run build` passes (it type-checks the tests too).
- In the browser at a phone-sized window: each cross level starts with yellow in the middle; Hint draws the
  routine's turn; the last drop opens the done sheet with the right title and summary; a clean solve at level 4
  offers "Try a full scramble"; "Steps" shows the right list for the level; the Practice sheet still fits or
  scrolls with three picks; the lily and undo drills work as before.
