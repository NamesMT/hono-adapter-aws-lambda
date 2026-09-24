# AGENTS.md

`hono-adapter-aws-lambda` is a fork of [hono](https://hono.dev)'s `aws-lambda` adapter: a
publishable ESM-only library (Node >= 22) that wraps a Hono app for API Gateway v1/v2, ALB and
Lambda function URLs, plus a `createTriggerFactory` API for non-HTTP triggers (S3, SQS, …). Built
with [tsdown](https://github.com/rolldown/tsdown), tested with [Vitest](https://vitest.dev).

## Commands

```sh
pnpm run lint             # eslint (@antfu/eslint-config) — it also owns formatting
pnpm run test:types       # tsc --noEmit --skipLibCheck
pnpm run check            # lint + test:types + vitest run --coverage — the release gate
pnpm run build            # tsdown -> dist/index.mjs + dist/index.d.mts
pnpm run release:check    # validate a version against package.json: `pnpm run release:check 1.5.0`
pnpm run release:preview  # print the changelog the next release would get
pnpm exec vitest run      # run the suite once (`pnpm test` is watch mode)
```

## Structure

- `src/index.ts` — public entry; re-exports `handle`/`streamHandle` (`handler.ts`), the trigger API
  (`trigger.ts`) and `types.ts`. `src/request.ts` turns events into requests, `src/common.ts` picks
  the processor and holds binary content-type helpers, `src/utils/event.ts` builds minimal events.
- `test/index.test.ts` — the whole suite (one test; the stream-handler suite is `describe.skip`);
  imports via the `#src/*` alias with a `.js` suffix and the fixture `test/sample-event-v2.json`.
- `package.json`: `imports` maps `#src/*` -> `./src/*`; `exports`/`main`/`module`/`types` point at
  `dist/`, and `files` ships only `dist`.
- `tsdown.config.ts` — single entry `src/index.ts`, `dts: true`; `vitest.config.ts` only sets coverage excludes.
- `.github/workflows/` — `ci.yml` runs lint + types + `pnpm test` (no coverage) on Node 22.x for
  pushes/PRs to `main`; `release.yml` is manual and runs `pnpm run check` on Node 24.

## Conventions

- Conventional commits (`feat:`, `fix:`, `chore:`, …) — the changelog is derived from them.
- ESLint via `@antfu/eslint-config` owns formatting: no Prettier, single quotes, 2-space indent,
  sorted imports. `lint-staged` runs `eslint --fix` on every commit, so run `pnpm run lint` before
  claiming a change is clean. The config deliberately allows trailing spaces in comments.
- ESM only, `"type": "module"` with an `import`-only `exports` map; do not add a CJS build.
- The repo targets Node >= 22 and AWS LLRT, so `node:`-protocol imports are intentionally not
  enforced (`unicorn/prefer-node-protocol` is off).
- `hono` is a peer dependency; `@namesmt/utils-lambda` is a runtime dependency.

## Releasing

Manual and version-first: dispatch **Actions → Release → Run workflow** with the version; it runs
`pnpm run check`, builds, then changelogen bumps `package.json`, writes CHANGELOG.md, commits and tags.
This workflow is the only publish path (a pushed tag publishes nothing); `dry-run` still does the
commit/tag/changelog locally and only skips the push, GitHub release and npm publish. Setup: README.

## Gotchas

- `pnpm test` watches; anything non-interactive must use `vitest run` (as `check` does).
- `dist/` is built, never committed — it is gitignored, but a stale copy exists locally.
- Release changelogen uses `--clean`: it fails on a non-empty `git status --porcelain` (ignored `dist/` does not count).
