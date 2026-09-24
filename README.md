# hono-adapter-aws-lambda ![TypeScript heart icon](https://img.shields.io/badge/♡-%23007ACC.svg?logo=typescript&logoColor=white)

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Codecov][codecov-src]][codecov-href]
[![Bundlejs][bundlejs-src]][bundlejs-href]
[![jsDocs.io][jsDocs-src]][jsDocs-href]

**hono-adapter-aws-lambda** is a fork of [hono](https://hono.dev/)'s `aws-lambda` adapter, experimenting and adding some extra features

## Features, Changes & Roadmap
- [x] Codebase is refactored quite a bit.
- [x] Add routing support for trigger events.
  - > I.e, support for S3, SQS, etc. triggers, which would also support a simpler cross-function call interface.
  - Multiple routes on the same eventSource support.
  - Uses a factory pattern, the internal trigger context (middlewares, env bindings) is decoupled from the main Hono app.
  - See [#10](https://github.com/NamesMT/hono-adapter-aws-lambda/issues/10) for more information.
- [x] Support returning a Lambda response result directly, useful for returning the response of another invoked function.

## Usage
### Install package:
```sh
# pnpm (recommended)
pnpm install hono-adapter-aws-lambda
```

### Import:
```ts
// ESM
import { handle, streamHandle } from 'hono-adapter-aws-lambda'
```

### Examples:
Fast example of accepting an S3 trigger event
```ts
import type { S3Event } from 'aws-lambda' // You need to install `@types/aws-lambda`
import { createTriggerFactory, handle, streamHandle } from 'hono-adapter-aws-lambda'

interface Bindings {
  event: { Records: Array<{ eventName: string }> }
}
const app = new Hono<{ Bindings: Bindings }>()
const triggerFactory = createTriggerFactory(app)

triggerFactory.on('aws:s3', '$!', c => c.text((c.env.event as S3Event).Records[0].eventName))
```

See some more examples in the test file: [test/index.test.ts](test/index.test.ts)

## Releasing

Releases are manual and version-first: the version is an input, not decided by the workflow.

1. Run **Actions → Release → Run workflow**, enter the version to ship without a leading `v`
   (e.g. `1.5.0`) and optionally tick **dry-run** to stop before pushing/publishing.
2. The workflow validates the version, runs `pnpm run check`, builds, then changelogen bumps
   `package.json`, writes `CHANGELOG.md`, commits and tags `v<version>`.
3. It pushes the commit and tag, creates the GitHub release from the changelog section, and
   publishes to npm with provenance over [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC, no token).

A pushed tag does not publish anything — only this dispatch does. Locally you can validate a
version with `pnpm run release:check 1.5.0` and preview the next changelog with
`pnpm run release:preview`.

Before the first automated release: publish the package once by hand, then on npmjs.com open the
package's **Settings → Trusted Publisher** and add this repository with the workflow filename
`release.yml`.

## License
[MIT](./LICENSE) License © 2024 [NamesMT](https://github.com/NamesMT)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/hono-adapter-aws-lambda?labelColor=18181B&color=F0DB4F
[npm-version-href]: https://npmjs.com/package/hono-adapter-aws-lambda
[npm-downloads-src]: https://img.shields.io/npm/dm/hono-adapter-aws-lambda?labelColor=18181B&color=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/hono-adapter-aws-lambda
[codecov-src]: https://img.shields.io/codecov/c/gh/namesmt/hono-adapter-aws-lambda/main?labelColor=18181B&color=F0DB4F
[codecov-href]: https://codecov.io/gh/namesmt/hono-adapter-aws-lambda
[bundlejs-src]: https://img.shields.io/bundlejs/size/hono-adapter-aws-lambda?labelColor=18181B&color=F0DB4F
[bundlejs-href]: https://bundlejs.com/?q=hono-adapter-aws-lambda
[jsDocs-src]: https://img.shields.io/badge/Check_out-jsDocs.io---?labelColor=18181B&color=F0DB4F
[jsDocs-href]: https://www.jsdocs.io/package/hono-adapter-aws-lambda
