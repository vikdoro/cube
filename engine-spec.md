# Engine extraction: spec

Split this repo into an **open engine** (the cube laid out flat, controllable from anything) and the **private app**
(drills, practice, personalised content). The engine goes public on GitHub later; this spec is about getting the
boundary right inside this repo first. Nothing is published, renamed on GitHub or committed as part of this work.

## Decisions already made (don't reopen them)

- **Notation is standard.** The engine's public moves are `U D F B L R`, `'` (anticlockwise), `2`, as on a standard
  cube held with white on top and green in front, clockwise as seen from outside the cube. A third-party solver that
  speaks standard notation and Kociemba facelet strings must be able to solve the engine's cube with nothing
  translated. Do not add a "mirror" or "cube-fixed" mode, and do not add notes apologising for the inside view: the
  owner finds the board clear.
- **The model keeps its own frame.** `model.ts` stays as it is: its `U` is the board's middle face, and
  `view.ts` (`boardMove`, `BOARD_NAME`) already translates. Public notation = `boardMove(IDENTITY, name, amount)`.
  Do not rewrite the model's frame; the drills (private) depend on it.
- **Public notation is cube-fixed, the keyboard is view-relative.** `parseMove('D')` always means the same turn,
  whatever the board is showing. Only keyboard (and the on-screen move label) follow the view, via `boardMove(view, …)`
  as today.
- **Slices (M, E, S) and wide moves (r, Rw), rotations (x y z): not supported** by the notation parser. They throw a
  `NotationError`. The model keeps its slice code; nothing public exposes it.
- **Drills, hints, practice, sheets, storage, text stay in the app.** The engine must not mention them.
- **Package name** `@tadacube/engine` is a placeholder. Use it everywhere (one grep to rename later).
- **Never write "rubik"** anywhere in the engine (owner's rule; a test enforces it).
- **No commits.** Leave the working tree changed and uncommitted.

## Verified facts (so you don't have to rediscover them)

I prototyped the facelet bridge against the current model in a scratch test and checked it against known results:

- Reading board-frame facelets from the model works like this. For each Kociemba facelet (face `X` of `URFDLB`, row
  `r`, column `c`), take the slot `SLOTS[X-index*9 + r*3 + c]` as defined in `model.ts` (its `ROW_STEP`/`COLUMN_STEP`
  already are the Kociemba reading order), **mirror its position and normal in y** to find the model slot that holds
  it, take that slot's sticker, and write the letter `BOARD_NAME[faceOf(sticker)]` (U and D swapped; R L F B as they are).
- With that, `R`, `U`, `D` and the superflip (`U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2`) produce exactly the
  standard facelet strings in the tests, and the cube-notation → model-move map is `boardMove(IDENTITY, face, amount)`.
- The real Kociemba solver `cubejs` (npm, CommonJS, `Cube.initSolver()` then `Cube.fromString(s).solve()`) solves a
  20-move scramble through that bridge and its solution applies cleanly. `interop.test.ts` is that experiment.

Treat these as a head start, not gospel: the tests are the arbiter.

## Target layout

```
package.json                  root: private, "workspaces": ["packages/*"], depends on "@tadacube/engine": "*"
packages/engine/
  package.json                name @tadacube/engine, private for now, "type": "module",
                              exports: "." → src/index.ts, "./board" → src/board/index.ts, "./vue" → src/vue/index.ts
                              (TS source exports are fine for now; a build step is for when it is published)
                              peerDependencies: vue ^3.5; devDependencies: cubejs (for the interop test)
  README.md                   see "README" below
  src/
    index.ts                  core entry (framework-free)
    model.ts vec.ts view.ts   moved from src/cube/ (with their tests)
    notation.ts               NEW
    facelets.ts               NEW
    cube.ts                   NEW (headless cube)
    board/                    moved from src/board/ (layout, arrows, frame, gestures, motion + board.test.ts), index.ts
    vue/
      createBoard.ts          the old useCube, made an instance (see below)
      CubeBoard.vue           the old component, taking the board as a prop
      keyboard.ts             keyToAction + attachKeyboard
      index.ts
src/ (the private app)
  cube/ drills lily cross corners middle (+ tests)     stay; import from '@tadacube/engine'
  composables/ usePlayer usePractice useSheets         stay; use the app's board instance
  board.ts                    NEW: `export const board = createBoard()` for the app
  components/ (minus CubeBoard.vue) text storage App.vue main.ts
cube-terminology.md           moves to packages/engine/ (it describes the board)
```

`vitest.config.ts` includes `src/**/*.test.ts` and `packages/*/src/**/*.test.ts`. `npm run build`, `npm test` and
`vue-tsc` must cover the engine too (add a tsconfig for it as needed).

## Public API

### Core (`@tadacube/engine`, no Vue, no DOM)

**`notation.ts`**
- `parseMove(token: string): Move`, `parseMoves(text: string): Move[]`, `formatMove(move): string`,
  `formatMoves(moves): string`, `class NotationError extends Error`.
- Grammar: a face letter `U R F D L B` (uppercase only) then nothing, `'`, `′`, `’` (all primes) or `2` (`2'` and `2′`
  are `2`). Tokens separated by any whitespace. `''` and whitespace-only give `[]` for `parseMoves`.
- `parseMove(face + suffix)` equals `boardMove(IDENTITY, face, 1 | 3 | 2)`. `Move` stays the model's type and is
  opaque to users: they build moves from notation.
- Anything else throws `NotationError` whose message names the offending token. Lowercase letters say wide moves
  aren't supported; `M E S` say slice moves aren't supported.
- `formatMove` writes an ASCII prime and never `2'`.

**`facelets.ts`**
- `toFacelets(state: CubeState): string`: 54 letters, faces in the order `U R F D L B`, Kociemba reading order, as in
  "Verified facts". Standard colours in the board frame: U white lid, D yellow middle, F green near, B blue far, R red
  right, L orange left, held as at the start.
- `fromFacelets(text: string): CubeState` and `class FaceletError extends Error`. Rejects: wrong length, letters
  outside `URFDLB`, not nine of each, centres not in place (index 4 of each face), stickers that don't form the 12
  edges and 8 corners (each exactly once), and **unsolvable states** (corner twist sum, edge flip sum, permutation
  parity). For a valid string it returns exactly the state whose `toFacelets` is that string (sticker ids follow from
  which piece sits where).

**`cube.ts`**: the headless cube.
```ts
createCube(initial?: CubeState): Cube
interface Cube {
  readonly state: CubeState                      // a snapshot: never mutated afterwards
  apply(input: string | Move | readonly Move[]): void   // atomic: bad notation applies nothing and notifies nobody
  reset(state?: CubeState): void                 // default solved
  isSolved(): boolean
  toFacelets(): string
  subscribe(fn: (e: CubeEvent) => void): () => void    // returns unsubscribe
}
type CubeEvent = { type: 'move'; move: Move } | { type: 'reset' }   // one 'move' event per move, in order
```

**`index.ts`** exports all of the above plus what the app needs from the model and view (`SOLVED`, `FACES`, `SLOTS`,
`applyMove`, `applyMoves`, `inverse`, `isSolved`, `faceOf`, `pieceSlots`, `permutation`, `inLayer`, the types
`Move Face Layer CubeState Slot`, `IDENTITY` and the vec helpers, `View`, `rollTowards`, `boardMove`, `boardMoveName`,
`boardSlotName`, `facingFace`, `toBoard`). Export what the app really uses, nothing speculative.

### Board geometry (`@tadacube/engine/board`, no Vue)
Moved as they are: `layout`, `arrows`, `frame`, `gestures`, `motion`. Behaviour must not change (`board.test.ts`
moves with them and must pass untouched apart from import paths).

### Vue (`@tadacube/engine/vue`)

**`createBoard(options?: { state?: CubeState; view?: View }): Board`**: the old `useCube`, one instance per call.
- Same surface as `useCube()` today: refs/computeds `state view turning rolling preview now busy livePreview arrows
  badge`; actions `turn reset setView roll rollToSlot showArrows hideArrows setPreview`; listeners `onTurnApplied`,
  `onTurnLanded`, `onReset`.
- `turn(input: string | Move | readonly Move[], byPlayer = false)`: also takes notation. Bad notation throws
  `NotationError` before anything is queued.
- Listener registrations **return an unsubscribe function**.
- **`dispose()`**: clears the animation frame and every timer/interval, so nothing keeps running.
- **No module-level state and no work at import time.** In particular the "hidden tab" `setInterval` moves inside
  `createBoard` (and `dispose` clears it).
- **Browser globals are read lazily and may be missing.** No `document` → behave as a hidden tab (turns land at
  once). No `matchMedia` → motion is not reduced. No `requestAnimationFrame` is only reached when animating.
  (The tests run under node, with no DOM library.)
- Behaviour otherwise unchanged: state changes as a turn starts, the board animates towards it, turns queue, hidden
  tab or reduced motion lands turns at once, `reset` drops the queue, listener order is `applied` then `landed`.

**`CubeBoard.vue`**: props `board: Board`, optional `debug?: boolean` (replaces reading `?debug` from the URL inside the
component; the app passes it). It no longer imports `usePlayer`: when a drag commits it **emits `turn` with the move**,
and the app's handler calls `playerTurn`. Everything else (drag preview, tap to roll, arrows, stickers) behaves as now.

**`keyboard.ts`**
- `keyToAction(e: Pick<KeyboardEvent, 'code'|'key'|'shiftKey'|'metaKey'|'ctrlKey'|'altKey'>, view: View)` →
  `{ type: 'turn'; move: Move } | { type: 'undo' } | { type: 'roll'; towards: Vec3 } | null`. Exactly the key map
  `App.vue` has today (S/W/X/A/D/Q by `e.code`, Shift primes, arrows and Space roll, Z / Ctrl+Z / ⌘Z undo, other
  modifiers → null). Turns use `boardMove(view, face, …)`.
- `attachKeyboard({ target?, getView, onAction, enabled? }): () => void` adds a `keydown` listener (default
  `document`), calls `preventDefault` for roll and ⌘Z as `App.vue` does today, returns a detach function.

### What the app does after the move
- `src/board.ts` creates the single board; `usePlayer`, `usePractice`, `TopBar`, `MoveBadge`, … use that instance
  instead of `useCube()`. The app's own composables may stay module singletons; the engine's may not.
- `App.vue` uses `attachKeyboard` and `<CubeBoard :board="board" :debug="…" @turn="playerTurn" />`.
- User-visible behaviour is identical: drag, tap to roll, undo pill, hints, drills, sheets, keyboard, `?debug`.

## README (`packages/engine/README.md`)
Short and factual: what it is (a cube on a flat board, controllable from anything), a 15-line usage example (create a
board, feed it notation, hook a keyboard), the notation contract in two sentences (standard notation, cube-fixed,
white lid / yellow middle at the start), the facelets + solver example (the `cubejs` snippet from `interop.test.ts`),
the three entry points, and "not supported: slices, wide moves, rotations". Move `cube-terminology.md` here.
No marketing, no roadmap.

## Tests

Already written (red until the work is done); don't weaken them. Changing one needs a reason you can state:

| File | Covers |
| --- | --- |
| `packages/engine/src/notation.test.ts` | grammar, spellings, errors, formatting |
| `packages/engine/src/facelets.test.ts` | standard facelet results (R, U, D, superflip), round trips, validation |
| `packages/engine/src/cube.test.ts` | headless cube: apply, atomicity, events, reset, independence |
| `packages/engine/src/vue/createBoard.test.ts` | instance board: queue, listeners, reset, animation clock, dispose, no import side effects |
| `packages/engine/src/vue/keyboard.test.ts` | key map, view-relative turns |
| `packages/engine/src/interop.test.ts` | a real Kociemba solver solves the cube through facelets |
| `src/boundaries.test.ts` | what may import what; engine has no drill/app code; files moved; no "rubik" |

Existing tests move with their code (`model`, `view`, `board` into the engine; `drills`, `lily`, `cross`, `corners`,
`middle`, `text` stay) and must keep passing with only import paths changed. Add tests for anything new you
introduce that these don't cover (e.g. `attachKeyboard`, the `turn` emit on `CubeBoard` if you can test it without a DOM).

## Acceptance
1. `npm test` green (all of the above plus every existing test).
2. `npm run build` green (type-check + bundle).
3. `npm run dev`, then in a browser: drag turns, tap to roll, undo pill, a drill with hints, the sheets, keyboard
   keys, `?debug` all behave as before. Say plainly what you did and didn't check by eye.
4. `git status` shows changes only, no commits.

## Out of scope
Publishing, a build/bundle step for the package, a web-component wrapper, themes/palettes, scramble generation,
localisation of the label strings, a docs site, CI.
