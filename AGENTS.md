# AGENTS.md

`hono-adapter-aws-lambda` is a fork of [hono](https://hono.dev)'s `aws-lambda` adapter: a
publishable ESM-only library (Node >= 22) that wraps a Hono app for API Gateway v1/v2, ALB and
Lambda function URLs, plus a `createTriggerFactory` API for non-HTTP triggers (S3, SQS, …). Built
with [tsdown](https://github.com/rolldown/tsdown), tested with [Vitest](https://vitest.dev).

## Docs

Three tiers, so a reader loads only what the task needs:

1. **`AGENTS.md`** (this file) — orientation and the rules that prevent defects. Read every session.
2. **`.agentDocs/`** — depth that would bloat this file: module rationale, traps with their causes,
   compatibility rules. Read on demand.
3. **`README.md` / `docs/`** — for a person using the package, not for an agent.

**There is no `.agentDocs/` here yet and none is needed at this size.** Create one when a section
above outgrows a screen or two: move the *reasoning* out and keep the *rule* here with a pointer to
it — nobody reads a file they do not open. Each document opens with a one-line scope, and this file
links it.

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

## How to work here

- Read the callers and the tests first; flag unclear impact.
- Don't rewrite or delete what you haven't understood; don't invent requirements.
- Report the risk (correctness, security, operational, integration), not just the change.
- **Fix the root cause, not the instance:** a copied helper, a duplicated rule, a second path around a
  guard — one implementation, one guard.
- **Verify before claiming, and say what you checked.** A green test proves only what it asserts — **break the thing it guards and watch it fail.** If it still passes, either the test is decoration or a different guard is running; find out which. Where a stub cannot answer the question, drive the real thing. Mark anything unverified as unverified.
- Unrecalled project? Read this file and `git log`.

## Conciseness

Code, comments, docs: one idea per sentence, nothing that changes no action, the rule not the story
`git log` holds — and never a caveat dropped for a line.

## User-facing docs

`README.md` only (no `docs/`; the changelog is generated): badges and a short read, shipped with the
change.

## Releasing

Manual and version-first: dispatch **Actions → Release → Run workflow** with the version; it runs
`pnpm run check`, builds, then changelogen bumps `package.json`, writes CHANGELOG.md, commits and tags.
This workflow is the only publish path (a pushed tag publishes nothing); `dry-run` still does the
commit/tag/changelog locally and only skips the push, GitHub release and npm publish. Setup: README.

## Gotchas

- `pnpm test` watches; anything non-interactive must use `vitest run` (as `check` does).
- `dist/` is built, never committed — it is gitignored, but a stale copy exists locally.
- Release changelogen uses `--clean`: it fails on a non-empty `git status --porcelain` (ignored `dist/` does not count).
- `handle()` and `streamHandle()` accept `HandleConfigOptions`: `easyRouteKey` fills a minimal request from `routeKey` when the event has no `requestContext.http`, and `isContentTypeBinary` overrides the default text/binary split.
- Route the adapter by setting the `$HAAL-returnBody` response header: both handlers then return the parsed JSON body as the Lambda result instead of going through `createResult`.
- `repository.url` must keep the canonical `NamesMT` casing — with `--provenance`, npm fails the publish when the URL owner does not match the GitHub owner.
