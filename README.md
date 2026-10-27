# Cube

An interactive 3×3 cube played on a flat, fanned-out board: one face in the
middle with all four sides fanned around it, three rows deep, and the far face
hanging open above like a lid. Drag a sticker to turn its row or ring; tap any
side to roll the cube so that side is in the middle.

**Learn** teaches the beginner (layer by layer) method backwards, one stage at a
time, so every puzzle ends with a solved cube. A lesson is five puzzles; each
stage has a mastery meter of five bars that a clean lesson raises and a rough
one lowers, and the help under the board (arrows after every turn, the next
move lit, the moves shown unlit, nothing) follows the meter. A solid stage left
for a few days asks for a refresh. Stages built so far: 7 "Twist the last
corners" and 6 "Put the last corners in place". Plus a warm up, "Undo N moves".

Vue 3 (Composition API) + TypeScript + Vite, deployed as static assets on
Cloudflare Workers.

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # vitest: cube model, drills, board geometry and drag reading
npm run build    # type-check + dist/
npm run deploy   # build + wrangler deploy
```

## Code layout

| Folder | What lives there |
| --- | --- |
| `src/cube/` | The cube itself, pure and stateless. `model.ts`: slots, moves as permutations, solved check. `view.ts`: how the cube is held on the board, rolling it, board-relative move names. `alg.ts`: moves from notation. `method.ts`: the stage contract and teaching order. `stages/`: one file per stage of the method (is it done, make a case, the next routine). `coach.ts`: following a routine turn by turn, and getting back on track after a wrong turn. `drills.ts`: the undo warm up. |
| `src/board/` | The flat board, pure geometry. `layout.ts`: where each sticker is drawn. `arrows.ts`: the turn arrows. `gestures.ts`: reading a drag as a turn. `frame.ts`: stickers at a moment of an animation. `motion.ts`: timings. |
| `src/composables/` | App state, one shared instance each. `useCube`: the cube, its turn queue and animation clock. `usePlayer`: the player's turns and undo. `useCourse`: the mastery meters, scaffold and recommendation. `usePractice`: the lesson or drill in progress. `useSheets`: which bottom sheet is open. |
| `src/components/` | The UI: `CubeBoard` (SVG + dragging), `TopBar`, `DrillBar`, and the sheets built on `BottomSheet` (`CourseSheet`, `StageIntroSheet`, `LessonDoneSheet`, `HelpSheet`). |

Adding a stage: write `src/cube/stages/<name>.ts` against the `Stage` contract in
`method.ts`, register it in `stages/index.ts` and add its id to `TEACHING_ORDER`.
`method.test.ts` then checks by brute force that the coach solves every case it
generates.

Moves are named by where their face sits on the board, not by the cube's own
faces: the middle is always U, the far side B, the near side F and the lid D.
