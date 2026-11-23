# Spec

## Purpose

Tadacube is an interactive 3×3 cube on a flat board (one face in the middle, the four sides fanned around it, the far face open above like a lid). It teaches the beginner method with short practice drills where every puzzle ends in a finished step. It is a public app. The main goal is teaching people to solve the cube; it is also a board for freestyle cubing.

## Current features

- Drag a sticker to turn its row or ring; tap a side to roll the cube so that side is in the middle.
- Keyboard controls by board position (S middle, W far side, X near side, A/D sides; arrows roll; Cmd/Ctrl+Z undoes).
- Undo button after each move, hint button during a drill, move name shown above the board, start-over confirm on the logo.
- Six drills in the Practice sheet, one per step of the method, each with an intro sheet shown once and a done sheet. There are no levels: each drill starts where the step before leaves the cube.
  - Make the white lily (from a full scramble)
  - Make the white cross (from the lily)
  - Put in the white corners (from the cross)
  - Put in the middle layer (from the white face)
  - Make the yellow cross (from the first two layers, any shape on top)
  - Put the yellow edges in place (from the yellow cross, in any order)
- The lily and middle layer drills can be played guided, switched on in the Practice sheet: see "Guided steps" below.
- Every drill's setup (order, names, copy, view, guided switch) is one hand-editable file, `src/drills.ts`; the cube logic it names lives in `src/cube/drills.ts`.
- "Intro seen" flags and the guided switches are remembered in `localStorage`.
- `?debug` labels every sticker with the place it starts on.
- Unit tests for the drills, the guided lily and middle layer, text and the engine boundary (11 files, 82 tests, all pass).

## Next up

Confirmed by Viktor 2026-11-21 (the repo has no TODO comments or issues; these came from the method and the README).

0. Guided steps for the other drills, one pull request each, following the middle layer (below; approved by Viktor 2026-11-22, and on 2026-11-23 for every drill)
1. Drills for the last corners (put them in place, then twist them), finishing the method
2. Chain the drills into one guided course, as parked on the `learning-full` branch
3. Show progress across drills, e.g. which steps were completed
4. Add a lint step

## Guided steps (lily and middle layer done)

A drill can be played guided: the app walks the player through each step, turn by turn, and says why. The UX was pinned down with a throwaway prototype (`?proto`, PR #4). The middle layer drill comes first; the other drills follow in their own pull requests. This is not the parked "guided course" (chaining drills together); it is a way to play one drill.

### Choosing it

- A drill with a guide gets a "Guided" switch in the Practice sheet, off by default and remembered in `localStorage`. The switch shows for every drill marked `guided` in `src/drills.ts`.
- Every puzzle starts where the step before leaves the cube, so guided play covers every puzzle.
- Guided play doesn't open the intro sheet: the slides explain as they go.

### The screen

- The top bar and the board stay as they are, at the same size.
- One panel takes the place of the Undo and Hint row under the board. It keeps one height, so the board never resizes.
- The panel tells the steps as story slides: a few lines each, with a segmented bar along the bottom, one segment per slide.
  - A reading slide fills on a timer and moves on. Holding the panel pauses it, and tapping its right side skips ahead.
  - A turn slide waits for its turns and fills as they're made. It can't be skipped. Its next turn is always drawn on the board as pulsing arrows.
  - Tapping the panel's left side goes back a slide and turns the cube back to where that slide starts. The slides after it are empty again.
- The pieces the step is about are outlined on the board, and the edge's home has a dashed outline. Nothing is dimmed.
- After a wrong turn the panel turns red and the arrows show how to turn it back.
- When the goal is reached the panel says so with a 🎉, then the done sheet opens as today. Moves are counted as today.
- Hint isn't needed, since the arrows show every turn. Undo is replaced by tapping the panel's left side; the keyboard's undo still works.

### The story, written from the cube

The slides are written from the cube as it is, in plain words with the sides named by colour (no move letters), and written again whenever the plan changes. For each edge the routine picks:

1. **Line it up**, if needed: where the edge's home is, then "Turn the yellow face until its green sticker sits on the green side." Any turns of the yellow face count until it's lined up.
2. **Make room**, a trigger with the side the edge goes towards: why the top corner by the gap has to join the edge first, then one slide per turn saying what it does (the edge steps aside, the side brings the corner onto the yellow face, the edge comes back, the side turns back).
3. **Drop it in**, the mirrored trigger with the other side: one slide per turn (the pair moves round, the side lifts the gap, the pair lands over it, both drop home).

From the second edge on, the reading slides are shortened to one, since the routine has been explained. An edge stuck in a wrong gap, or flipped in its own, gets one slide saying the same two triggers push it out onto the yellow face. Its eight turns follow, and then it's lined up and put in like any other edge.

### The lily

Each segment is one petal: the white edge that can come up in the fewest turns without any petal already made leaving the yellow face, so the lily only grows. That can take a few turns more than the shortest way. Turns of the yellow face at the start of a segment free the edge's place, and any turns of it count until it's free. Each turn's slide says what it does for the edge (brings it up, takes it round, makes way). Nothing comes before the lily, so every turn off the plan writes the story again from the cube as it is; the panel never turns red.

### Turns off the plan

The player is never forced to undo.

- A turn that keeps the white face done: the story is written again from the cube as it is, and continues from the matching slide.
- A turn that breaks the white face: the panel turns red and says the white face moved, and the arrows show the turn back. Any turns that bring the white face back let the story continue.

### Code and tests

- The story planner is pure and lives next to the drill (`src/cube/middleGuide.ts`): given a cube (and the last turns made), it returns the steps, their slides, the turns each slide waits for, and the pieces to outline.
- Tests follow the plan from random puzzles (the white face done, and partway through the step) to two layers done. They check that each slide's turns add up to its step's, that the plan recovers after a random off-plan turn that keeps the white face, and that no slide text has move letters.
- The board overlay (`BoardSpotlight.vue`), the story panel (`GuidePanel.vue`) and the turn following (`useGuide.ts`) are shared: another drill gets guided by giving its routine a `guide` planner (`src/cube/guide.ts` has the shape) and setting `guided: true` in `src/drills.ts`.
- Stepping back goes back within the current edge's slides; a step back from an edge's first slide does nothing.

## Known bugs and limits

- No known bugs.
- Progress is per browser (`localStorage`); no accounts, no sync.
- No lint step.
- Stale docs at the repo root: `engine-handoff.md` and `engine-spec.md` describe an engine workspace (`packages/engine`) that was since moved to its own repo.

## Out of scope

Don't build or change these without asking Viktor:

- The engine (`flatcube`): it lives in vikdoro/flatcube. Don't change it here or update the locked version.
- The `learning-full` branch and the guided course: parked on purpose.
- The displayed title ("Tadacube"; it was renamed to "Tadacuber" and reverted), the board's layout and move naming.
- Deploy config (`wrangler.jsonc`), dependencies, and any backend, accounts, analytics or ads.
