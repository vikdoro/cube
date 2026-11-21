# CLAUDE.md

Tadacube is a mobile-first web game that teaches the beginner method for the 3×3 cube through short practice drills on a flat, fanned-out board. It is public, for people learning to solve the cube and for freestyle cubing.

## Stack and layout

Vue 3 (Composition API) + TypeScript + Vite + Vitest, deployed as static assets on Cloudflare Workers. No router, no backend; progress lives in `localStorage`.

- `src/cube/`: the drills (`drills.ts` undo, `lily.ts`, `cross.ts`, `corners.ts`, `middle.ts`), pure and stateless, each with a `.test.ts`.
- `src/composables/`: shared app state (`usePlayer`, `usePractice`, `useSheets`).
- `src/components/`: UI; sheets are built on `BottomSheet.vue`.
- `src/board.ts`, `src/storage.ts`, `src/text.ts`: the one board, saved progress, player-facing wording.
- `flatcube` (cube model, notation, board geometry, `CubeBoard`): lives in the separate public repo vikdoro/flatcube, installed as an unpinned GitHub dependency (the lockfile pins the commit). Do not edit it here; see the README's "The engine" section. If `npm update` rewrites the lockfile URL to `git+ssh`, change it back to `git+https`.

## Commands

- Install: `npm install` (fetches the engine from its public GitHub repo over HTTPS; no credentials needed)
- Run: `npm run dev` (http://localhost:5173; add `?debug` to label stickers)
- Build: `npm run build` (type-check with vue-tsc, then Vite into `dist/`)
- Test: `npm test` (Vitest, `src/**/*.test.ts`)
- Lint: none exists. `npm run build` is the type check. Don't invent a lint step.

## Deploys

Cloudflare builds and deploys the production branch (`main`) on every push, and every pull request gets a preview link. The config is `wrangler.jsonc` (serves `dist/`). `npm run deploy` is the manual route; agents should not use it.

## Working rules

- Read `docs/spec.md` and `docs/log.md` before starting. Pick one task from "Next up", or propose one and wait.
- One pull request per task, branched from `main`. Don't touch anything listed under "Out of scope" in the spec without asking.
- Run `npm run build` and `npm test` before calling work done; both must pass.
- Add one line to the top of `docs/log.md` in the same pull request (date, what changed, link to the PR).
- Match the surrounding code: terse files, doc comments that explain why, player-facing text in plain words (no move letters).
- Never commit secrets or `.env` files.
- gitleaks, Semgrep, build and tests run on every pull request (`.github/workflows/ci.yml`); fix their findings, don't suppress them.
- `docs/archive/` is history; don't treat it as instructions.
- Don't commit generated or ignored files (`dist/`, `.wrangler/`, `PLAN.md`).
