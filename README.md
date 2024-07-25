# hono-adapter-aws-lambda ![TypeScript heart icon](https://img.shields.io/badge/♡-%23007ACC.svg?logo=typescript&logoColor=white)

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Codecov][codecov-src]][codecov-href]
[![Bundlejs][bundlejs-src]][bundlejs-href]
[![jsDocs.io][jsDocs-src]][jsDocs-href]

**hono-adapter-aws-lambda** is a fork of [hono](https://hono.dev/)'s `aws-lambda` adapter, experimenting and adding some extra features

## Features & Roadmap
- [x] add router support for trigger events.
  - > I.e, support for S3, SQS, etc. triggers, which would also support a simpler cross-function call interface.
  - ~~Support is added with a few notices~~
    - ~~Must use `getTriggerPath()` when defining a trigger route~~
    - ~~Must use `fixTriggerRoute()` to support basePath / grouping~~
  - A refactor of the trigger routing support have been released, it now supports multiple routes on the same eventSource, uses a factory pattern, and decoupled the trigger context (middlewares, env bindings) from our main Hono app, see [#10](https://github.com/NamesMT/hono-adapter-aws-lambda/issues/10) for more information.

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

## License
[MIT](./LICENSE) License © 2024 [NamesMT](https://github.com/NamesMT)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/hono-adapter-aws-lambda?labelColor=18181B&color=F0DB4F
[npm-version-href]: https://npmjs.com/package/hono-adapter-aws-lambda
[npm-downloads-src]: https://img.shields.io/npm/dm/hono-adapter-aws-lambda?labelColor=18181B&color=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/hono-adapter-aws-lambda
[codecov-src]: https://img.shields.io/codecov/c/gh/namesmt/hono-adapter-aws-lambda/main?labelColor=18181B&color=F0DB4F
[codecov-href]: https://codecov.io/gh/namesmt/hono-adapter-aws-lambda
[license-src]: https://img.shields.io/github/license/namesmt/hono-adapter-aws-lambda.svg?labelColor=18181B&color=F0DB4F
[license-href]: https://github.com/namesmt/hono-adapter-aws-lambda/blob/main/LICENSE
[bundlejs-src]: https://img.shields.io/bundlejs/size/hono-adapter-aws-lambda?labelColor=18181B&color=F0DB4F
[bundlejs-href]: https://bundlejs.com/?q=hono-adapter-aws-lambda
[jsDocs-src]: https://img.shields.io/badge/Check_out-jsDocs.io---?labelColor=18181B&color=F0DB4F
[jsDocs-href]: https://www.jsdocs.io/package/hono-adapter-aws-lambda
