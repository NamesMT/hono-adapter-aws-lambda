# AGENTS.md

`hono-adapter-aws-lambda` is a fork of [hono](https://hono.dev)'s `aws-lambda` adapter: a
publishable ESM-only library (Node >= 22) that wraps a Hono app for API Gateway v1/v2, ALB and
Lambda function URLs, plus a `createTriggerFactory` API for non-HTTP triggers (S3, SQS, …). Built
with [tsdown](https://github.com/rolldown/tsdown), tested with [Vitest](https://vitest.dev).

## Docs

Where knowledge lives, and when to reach for each:

| tier | what it holds | when you use it |
| --- | --- | --- |
| `AGENTS.md` — this file | orientation and the rules that prevent defects | read every session; write when a rule is learned the hard way |
| `.agentDocs/` | depth: module rationale, traps with their causes, compatibility | read on demand, before touching that area; write when a rule needs its reasoning kept |
| `docs/` | how-to and reference for a person using this package | read when the task is user-facing; write in the same commit as the change |
| `README.md` | the first read, for a person | write alongside `docs/` |

- **One home per fact.** State the rule here, keep the reasoning in `.agentDocs/` and link it — never both.
- **A dead pointer is a bug.** If the target is gone, delete the pointer rather than leave it.
- Move depth behind a pointer once a section outgrows a screen or two; keep the rule inline.

## Commands

```sh
pnpm run lint             # eslint (@antfu/eslint-config) — it also owns formatting
pnpm run test:types       # tsc --noEmit --skipLibCheck
pnpm run check            # lint + test:types + vitest run --coverage — the release gate
pnpm run build            # tsdown -> dist/index.mjs + dist/index.d.mts
pnpm run release:check    # validate a version against package.json: `pnpm run release:check 1.5.0`
pnpm run release:preview  # print the changelog the next release would get
pnpm run test             # vitest watch mode
pnpm exec vitest run      # run the suite once
pnpm run start            # NODE_ENV=dev tsx src/index.ts — no watch
pnpm run watch            # NODE_ENV=dev tsx watch src/index.ts
pnpm run dev             # alias of `pnpm run watch`
```

## Structure

- `src/index.ts` — public entry; re-exports `handle`/`streamHandle` (`handler.ts`), the trigger API
  (`trigger.ts`) and `types.ts`. `src/request.ts` turns events into requests, `src/common.ts` picks
  the processor and holds binary content-type helpers, `src/utils/event.ts` builds minimal events.
- `test/index.test.ts` — the whole suite (one test; the stream-handler suite is `describe.skip`);
  imports via the `#src/*` alias with a `.js` suffix and the fixture `test/sample-event-v2.json`.
- `package.json`: `imports` maps `#src/*` -> `./src/*`; `exports`/`main`/`module`/`types` point at
  `dist/`, and `files` ships only `dist`.
- `.github/workflows/` — `ci.yml` runs lint + types + `pnpm test` (no coverage) on Node 22.x for
  pushes/PRs to `main`; `release.yml` is manual and runs `pnpm run check` on Node 24.

## Conventions

- Conventional commits (`feat:`, `fix:`, `chore:`, …) — the changelog is derived from them.
- ESLint (`@antfu/eslint-config`) owns lint and formatting; `lint-staged` runs `eslint --fix` on commit — run `pnpm run lint` before claiming a change is clean.
- ESM only, `"type": "module"` with an `import`-only `exports` map; do not add a CJS build.
- The repo targets Node >= 22 and AWS LLRT, so `node:`-protocol imports are intentionally allowed.
- `hono` is a peer dependency; `@namesmt/utils-lambda` is a runtime dependency.

## How to work here

- **Check the callers before you change anything.** Grep who uses it and which tests name it. If the
  impact is unclear, say so — do not guess.
- **Never overwrite or delete a large section you have not understood.** Read it, or say what you could
  not determine and ask.
- **Do not invent requirements.** Build what was asked; surface what else you notice and let it be
  decided.
- **Fix the class, not the instance.** A copied helper, a rule stated twice, a guard bypassed by a
  second path is one problem: one implementation, one guard. That is the work, not a follow-up to ask
  for. Stay inside the task rather than refactoring the world.
- **Verify before claiming, and say what you checked.** A passing test is not evidence it pins
  anything — **break the thing it guards and watch it fail.** If it still passes, either the test is
  decoration or a different guard is running; find out which. Where a stub cannot answer the question,
  drive the real thing.
- **Never write an identifier from memory.** A commit hash, path, line number or version must be quoted
  from the source; a plausible-looking invented one is worse than none.
- **A stated blocker is a hypothesis, not a fact.** Re-test "cannot install X" / "tool unavailable"
  before inheriting it, and never report a failure your own flag forced.
- **Report the risk with the change** — correctness, security, operational and integration; plus what
  you could not verify and every assumption you made. An unverified claim marked as such beats a
  confident one that is wrong.
- **Missing recall of this repo?** Read this file, `.agentDocs/` and `git log` before acting, then ask
  1–3 focused questions rather than guessing at intent.

## Conciseness

**Prune verbose, keep correctness** — code, comments, docs alike.

- Code: a comment only for non-obvious *intent*, never to restate the line, and never long. A block
  arguing for its own change is a commit message.
- Docs: one idea per sentence. Cut anything that would not change what a reader does.
- Delete history `git log` already holds — keep the *rule* that came out of it, not the story.
- **Never drop a caveat to save a line.** Concise means no filler, not fewer facts.

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
