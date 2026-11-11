# Cube

An interactive 3×3 cube played on a flat, fanned-out board: one face in the
middle with all four sides fanned around it, three rows deep, and the far face
hanging open above like a lid. Drag a sticker to turn its row or ring; tap any
side to roll the cube so that side is in the middle.

**Practice** scrambles the cube by 1–5 turns for you to turn back ("Undo N
moves"), so every puzzle ends with a solved cube. Two more drills build the
first step of the beginner method: the white lily (the four white edges round
the yellow centre) and the white cross (the petals dropped onto the white
face, each on the side of its own colour). The guided course (the
beginner method taught backwards) is parked on the `learning-full` branch.

Vue 3 (Composition API) + TypeScript + Vite, deployed as static assets on
Cloudflare Workers.

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # vitest: cube model, drills, board geometry and drag reading
npm run build    # type-check + dist/
npm run deploy   # build + wrangler deploy
```

Add `?debug` to the URL (e.g. http://localhost:5173/?debug) to label every
sticker with the place it starts on, so the labels travel with the turns and
show which way each one went. A place is named by its face's board name and a
number, 1–9 in reading order as the face is seen from inside the cube, held as
at the start (U1–U9 on the lid, D1–D9 in the middle, and so on). Each side is read with its rim up, so the row along
the rim is 1 2 3 (F1 F2 F3 along the bottom of the board); the lid is read
with its hinge up (U1 U2 U3 along it); the middle is read with the far side
up, so its top row reads D3 D2 D1.

## Code layout

| Folder | What lives there |
| --- | --- |
| `src/cube/` | The cube itself, pure and stateless. `model.ts`: slots, moves as permutations, solved check. `view.ts`: how the cube is held on the board, rolling it, board-relative move names. `drills.ts`: building and hinting the undo puzzles. `lily.ts` and `cross.ts`: the white lily and white cross drills, their goals, hints and puzzles. |
| `src/board/` | The flat board, pure geometry. `layout.ts`: where each sticker is drawn. `arrows.ts`: the turn arrows. `gestures.ts`: reading a drag as a turn. `frame.ts`: stickers at a moment of an animation. `motion.ts`: timings. |
| `src/composables/` | App state, one shared instance each. `useCube`: the cube, its turn queue and animation clock. `usePlayer`: the player's turns and undo. `usePractice`: the drill in progress. `useSheets`: which bottom sheet is open. |
| `src/components/` | The UI: `CubeBoard` (SVG + dragging), `TopBar` (which shows the drill in progress), `UndoButton` and `HintButton` under the board, and the sheets built on `BottomSheet` (`PracticeSheet`, `DrillIntroSheet`, `DrillDoneSheet`). |

Moves are named by where their face sits on the board, not by the cube's own
faces, as if looking down into the cube from above: the middle is always D, the
lid U, the far side B and the near side F. Every face is seen from inside the
cube, so a turn that looks clockwise on the board gets a prime.

Solved and held as at the start, the board is a standard cube:

| Board place | Face | Colour |
| --- | --- | --- |
| Lid | U | white |
| Middle | D | yellow |
| Near side (bottom of the screen) | F | green |
| Far side (top of the screen) | B | blue |
| Right side | R | red |
| Left side | L | orange |
