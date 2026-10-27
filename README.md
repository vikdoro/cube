# Cube

An interactive 3×3 cube played on a flat, fanned-out board: one face in the
middle with all four sides fanned around it, three rows deep, and the far face
hanging open above like a lid. Drag a sticker to turn its row or ring; tap any
side to roll the cube so that side is in the middle.

**Practice** scrambles the cube by 1–5 turns for you to turn back ("Undo N
moves"), so every puzzle ends with a solved cube. The guided course (the
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

## Code layout

| Folder | What lives there |
| --- | --- |
| `src/cube/` | The cube itself, pure and stateless. `model.ts`: slots, moves as permutations, solved check. `view.ts`: how the cube is held on the board, rolling it, board-relative move names. `drills.ts`: building and hinting the undo puzzles. |
| `src/board/` | The flat board, pure geometry. `layout.ts`: where each sticker is drawn. `arrows.ts`: the turn arrows. `gestures.ts`: reading a drag as a turn. `frame.ts`: stickers at a moment of an animation. `motion.ts`: timings. |
| `src/composables/` | App state, one shared instance each. `useCube`: the cube, its turn queue and animation clock. `usePlayer`: the player's turns and undo. `usePractice`: the drill in progress. `useSheets`: which bottom sheet is open. |
| `src/components/` | The UI: `CubeBoard` (SVG + dragging), `TopBar`, `DrillBar`, and the sheets built on `BottomSheet` (`PracticeSheet`, `DrillIntroSheet`, `DrillDoneSheet`, `HelpSheet`). |

Moves are named by where their face sits on the board, not by the cube's own
faces: the middle is always U, the far side B, the near side F and the lid D.
