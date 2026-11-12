You're doing a refactor in this repo (~/dev/cube, Vue 3 + TS + Vite + vitest): extracting an open-source "engine" package from a private cube-practice app. The design is settled and written down; your job is to implement it, not to redesign it.

Read these first, in this order:
1. `engine-spec.md` (repo root): the whole design, the decisions that are already made, the target layout, the public API, acceptance criteria.
2. The tests that are already written and currently red: `packages/engine/src/{notation,facelets,cube,interop}.test.ts`, `packages/engine/src/vue/{createBoard,keyboard}.test.ts`, `src/boundaries.test.ts`. They are the contract. Don't weaken or delete them; if one is wrong, say so and say why before changing it.
3. The current code you'll be moving or reshaping: `src/cube/{model,view,vec}.ts`, `src/board/*`, `src/composables/*`, `src/components/CubeBoard.vue`, `src/App.vue`.

Work in this order, running `npm test` as you go:
1. Set up the npm workspace (`packages/engine`, root `workspaces`, vitest include, tsconfig) and move `model`, `vec`, `view`, `board/*` with their tests, changing only import paths. Everything existing must stay green.
2. Write `notation.ts`, then `facelets.ts` (`toFacelets` first, then `fromFacelets` with solvability checks), then `cube.ts`. The spec's "Verified facts" section describes the facelet mapping I already prototyped against the current model; use it as a head start.
3. Turn `useCube` into `createBoard` (instance, `dispose`, unsubscribe functions, lazy browser globals, no import-time work), then make `CubeBoard.vue` take the board as a prop and emit `turn`, and add `keyboard.ts`.
4. Repoint the private app (`src/board.ts`, composables, components, `App.vue`) at the package's entry points only.
5. Write `packages/engine/README.md` and move `cube-terminology.md` into the package.

Hard rules:
- The app's behaviour must not change. This is a refactor. Don't "improve" gestures, animation, or drills on the way.
- Standard notation is decided; don't add a mirror mode and don't change the model's frame. `model.ts` keeps its own frame; the public notation is `boardMove(IDENTITY, …)`.
- Never write the word "rubik" anywhere (a test checks the engine).
- Do not commit, push, or stage anything. Leave the changes in the working tree.
- Don't add dependencies other than `cubejs` as a devDependency of the engine (for the interop test). No DOM test libraries; the tests are written for node.
- Match the surrounding code: the existing files are terse, with explanatory doc comments on the why and little else. Follow that style, naming included.

When you're done, report: which tests pass (paste the summary line), whether `npm run build` passes, what you checked by running the app in a browser and what you did not, and anything in the spec you deviated from or found wrong. If the spec contradicts the code or a test, stop and tell me instead of picking silently.
