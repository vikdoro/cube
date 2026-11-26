# Spec

## Purpose

Tadacube is an interactive 3×3 cube on a flat board (one face in the middle, the four sides fanned around it, the far face open above like a lid). It teaches the beginner method with short practice drills where every puzzle ends in a finished step. It is a public app. The main goal is teaching people to solve the cube; it is also a board for freestyle cubing.

## Current features

- Drag a sticker to turn its row or ring; tap a side to roll the cube so that side is in the middle.
- Keyboard controls by board position (S middle, W far side, X near side, A/D sides; arrows roll; Cmd/Ctrl+Z undoes).
- Undo button after each move, hint button during a drill, move name shown above the board, start-over confirm on the logo.
- Seven drills in the Practice sheet, each with levels, an intro sheet shown once, and a done sheet:
  - Undo the scramble (1–5 turns)
  - Make the white lily (1–4 petals missing, or full scramble)
  - Make the white cross (1–5 petals, or full scramble)
  - Put in the white corners (1–5, or full scramble)
  - Put in the middle layer (1–5, or full scramble)
  - Make the yellow cross (from a line, an L, a dot, or any shape)
  - Put the yellow edges in place (from a pair side by side, a pair across, or any order)
- Last level per drill and "intro seen" flags are remembered in `localStorage`.
- Dark theme only, whatever the device's light or dark setting.
- `?debug` labels every sticker with the place it starts on.
- Unit tests for the drills, text and the engine boundary (9 files, 59 tests, all pass).

## Next up

Confirmed by Viktor 2026-11-21 (the repo has no TODO comments or issues; these came from the method and the README).

1. Drills for the last corners (put them in place, then twist them), finishing the method
2. Chain the drills into one guided course, as parked on the `learning-full` branch
3. Show progress across drills, e.g. which levels were completed
4. Add a lint step

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
