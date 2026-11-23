# Drills in one file

## Goal

Every drill is set up in one readable file, `src/drills.ts`, that a product manager can edit without knowing Vue or the cube code: the order in the Practice sheet, the names, the copy (Practice card, intro steps, done sheet), which way up the cube is held, and whether the "Guided" switch shows. Today the same facts are spread over six `Record<DrillKind, …>` tables and `if kind === …` branches in five files (`usePractice.ts`, `text.ts`, `PracticeSheet.vue`, `DrillIntroSheet.vue`, `DrillDoneSheet.vue`, `useGuide.ts`).

The cube logic (goal check, puzzle maker, par, hint, guide planner) stays code. It moves into one registry of **routines** in `src/cube/drills.ts`; a drill names the routine it plays. A new kind of puzzle still needs a developer to write its routine; everything else about a drill is a data edit.

This builds on PR #7 (guided lily): branch from `main` once #7 is merged, or rebase onto it.

## Non-goals

- No behaviour or wording change visible to the player. Every string moves over verbatim.
- No JSON/YAML or runtime loading: the file is TypeScript so `npm run build` type-checks it.
- The guide planners' slide text (`lilyGuide.ts`, `middleGuide.ts`) is generated from the cube, not copy; it stays in code.
- The parked guided course, the engine, new drills, new routines.
- Shared wording that isn't per drill (the hints count in the done sheet, the Practice sheet intro, buttons) stays where it is.

## Behavior

1. The Practice sheet lists the drills in `DRILLS` order, each with its `pick` title and `about` text, and the "Guided" switch only when `guided: true`.
2. The intro sheet title is `title`; its numbered steps are `steps`, one item each. In a step, `**words**` is shown bold and `{turns}` as the par in turns ("12 turns", "1 turn").
3. The top bar shows `title` during a drill and `` `${doneName} in N moves` `` once done (as `doneTitle` today).
4. The done sheet says `onPar` when moves ≤ par, else `overPar`, then the shared hints sentence, separated by one space. `{par}` in those is the bare number. Today's strings:
   - lily: `onPar: 'That is the shortest way.'`, `overPar: 'It can be done in {par}.'`
   - the rest: `onPar: 'No wasted turns.'`, `overPar: 'The routine takes {par}.'`
   This removes the `d.kind !== 'lily'` branch in `DrillDoneSheet.vue`.
5. `view: 'white-middle'` holds the cube white in the middle (corners today, `WHITE_UP`); `'yellow-middle'` is `IDENTITY` (the rest). Replaces `kind === 'corners'` in `usePractice.start`.
6. Guided play runs only if the drill has `guided: true` and the player switched it on. The guide comes from the drill's routine.
7. `localStorage` keys stay `drill.kind`, so saved `seen`/`guided` flags carry over. Kinds stay `lily cross corners middle yellow edges`.
8. `checkDrills(DRILLS, ROUTINES)` returns `[]`. For a bad entry it returns one plain-English problem per issue, each starting with the drill's kind (or `drill N` when the kind is empty) and naming the field:
   - `kind` empty, not lowercase letters/hyphens, or used twice
   - `routine` not in `ROUTINES`
   - `guided: true` but the routine has no guide
   - an empty `title`, `pick`, `about`, `doneName`, `onPar`, `overPar`, or no `steps`/an empty step
   - `view` not `yellow-middle` or `white-middle`
   - a `{…}` placeholder other than `{turns}` in `steps` or `{par}` in `onPar`/`overPar`, or any placeholder in another field
   - an odd number of `**` in a step, or `**` in any field other than `steps`
9. `drillDef(kind)` returns the drill; an unknown kind throws `Error('No drill "<kind>"')`.

## Design

### `src/drills.ts` (new, the file a PM edits)

Top doc comment in plain words for a non-developer: what the file is, that order = Practice sheet order, each field (as below), the `**bold**` / `{turns}` / `{par}` rules, the house style from CLAUDE.md (plain words, sides named by colour, no move letters), "don't rename `kind`, saved progress uses it", that adding a drill means copying an entry and choosing an existing `routine`, that a new routine needs a developer, and that `npm test` checks the file (`checkDrills`).

```ts
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

export const DRILLS: DrillDef[] = [ /* the six drills, in method order, copy moved verbatim */ ]

/** The drill of this kind. */
export function drillDef(kind: DrillKind): DrillDef
```

Copy migration: `pick`/`about` from `PICKS` in `PracticeSheet.vue`; `title` from `TITLES` and `doneName` from the inline map in `text.ts`; `steps` from `DrillIntroSheet.vue`, with `<b>x</b>` → `**x**` and `{{ plural(drill.par, 'turn') }}` → `{turns}`; `onPar`/`overPar` per Behavior 4 (trailing space dropped). `guided: true` for lily and middle.

### `src/cube/drills.ts` (becomes the routine registry)

Keeps `scramble`. Drops `DrillKind`. Adds:

```ts
export interface Routine {
  goal: (state: CubeState) => boolean
  /** A new puzzle, from where the step before leaves the cube. */
  puzzle: () => CubeState
  par: (start: CubeState) => number
  /** The next turn to suggest; `recent` is the last seven turns made, newest last. */
  hint: (state: CubeState, recent: readonly Move[]) => Move | null
  guide?: Guide
}

export const ROUTINES = { lily: {…}, cross: {…}, corners: {…}, middle: {…}, yellow: {…}, edges: {…} } satisfies Record<string, Routine>
export type RoutineId = keyof typeof ROUTINES

/** What's wrong with these drills, in plain words; empty when nothing is. */
export function checkDrills(drills: readonly DrillDef[], routines: Record<string, Routine>): string[]
```

Each routine wires what `GOAL`, `PUZZLE` (with the same `4`/`3` arguments and `scramble(SOLVED)`), `HINT` and `GUIDES` hold today; `lily` and `middle` carry `lilyGuide`/`middleGuide`. Type the `ROUTINES` map so `ROUTINES[id]` is a `Routine` with optional `guide` (e.g. annotate the entries or cast via `satisfies` + a `Record<RoutineId, Routine>` view). `checkDrills` takes `routines` as a parameter so tests can pass fixtures. The `DrillDef` import is type-only (no runtime cycle).

### Callers

- `usePractice.ts`: delete `GOAL`, `PUZZLE`, `HINT`, the routine imports and the `'corners'` check; look up `ROUTINES[drillDef(kind).routine]`. `start` sets `guided` only when `def.guided` and the saved flag is on. `Drill.kind` stays.
- `useGuide.ts`: delete `GUIDES`; the guide is `ROUTINES[drillDef(d.kind).routine].guide` when `d.guided`.
- `text.ts`: `drillTitle(d, def = drillDef(d.kind))`, `doneTitle(d, def = …)`, and new
  - `doneSummary(d, def = drillDef(d.kind))`: Behavior 4, moving the hints sentence out of `DrillDoneSheet.vue`
  - `fill(text, par)`: `{turns}` → `plural(par, 'turn')`, `{par}` → `String(par)`
  - `richText(text, par): { text: string, bold: boolean }[]`: `fill`, then split on `**`, dropping empty parts
- `PracticeSheet.vue`: `v-for` over `DRILLS`; switch `v-if="def.guided"`.
- `usePractice.ts`: rewrite the comment above the views so it no longer names drills (each drill picks its `view`).
- `DrillIntroSheet.vue`: one `<ol class="steps">` rendering `richText(step, drill.par)` as text and `<b>` parts. No `v-html` (Semgrep). Key the steps by index, not text: two identical steps are a valid edit.
- `DrillDoneSheet.vue`: `summary` is `doneSummary(d)`.
- `storage.ts`: `guided`/`seen` typed `Record<string, boolean>`.

### Docs

- `CLAUDE.md` layout: add `src/drills.ts` (the drills, for editing by hand) and say `src/cube/drills.ts` holds the routines.
- `docs/spec.md`: replace "listed in `GUIDES`" with "marked `guided` in `src/drills.ts`"; in Code and tests, a drill is guided by giving its routine a `guide` and setting `guided: true`; mention `src/drills.ts` under Current features; update the test count.
- `docs/log.md`: one line at the top.

## Test plan

- `src/drills.test.ts` (new):
  - `checkDrills(DRILLS, ROUTINES)` is `[]` (guards every future copy edit).
  - each rule in Behavior 8 against a fixture drill: exactly one problem, which starts with the kind and mentions the field.
  - `drillDef` finds a drill and throws on an unknown kind.
  - `ROUTINES` has the six routines; only lily and middle have guides.
  - each routine's `puzzle()` starts off its goal with `par > 0`, and following its hints reaches the goal.
- `src/text.test.ts` (rewritten): `drillTitle`/`doneTitle`/`doneSummary` against a fixture def (so copy edits don't break tests), including on/over par, 0/1/2 hints and the singular; `fill` and `richText`.
- Existing drill and guide tests stay unchanged and must pass.

## Acceptance criteria

- [ ] `npm test` passes, with `src/drills.test.ts` and `src/text.test.ts` unedited
- [ ] `npm run build` passes
- [ ] No `Record<DrillKind` and no `kind === '…'` / `kind !== '…'` left in `src/`; `GUIDES` gone
- [ ] All drill copy lives in `src/drills.ts`; every player-facing string is the same as before (compare against `git diff` of the removed copy)
- [ ] In `npm run dev`, every drill's Practice card, intro steps (bold intact, turn count shown), top bar and done sheet read as before; corners still starts white in the middle; the switch shows on lily and middle only
- [ ] `src/drills.ts` opens with the plain-words guide for editors
- [ ] `CLAUDE.md`, `docs/spec.md` and `docs/log.md` updated
