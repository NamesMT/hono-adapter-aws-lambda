# hono-adapter-aws-lambda ![TypeScript heart icon](https://img.shields.io/badge/♡-%23007ACC.svg?logo=typescript&logoColor=white)

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Codecov][codecov-src]][codecov-href]
[![Bundlejs][bundlejs-src]][bundlejs-href]
[![jsDocs.io][jsDocs-src]][jsDocs-href]

**hono-adapter-aws-lambda** is a fork of [hono](https://hono.dev/)'s `aws-lambda` adapter, experimenting and adding some extra features

## Features & Roadmap
- [x] add router support for trigger events.
  - > Support is added with a few notices
    - Must use `getTriggerPath()` when defining a trigger route
    - Must use `fixTriggerRoute()` to support basePath / grouping
  - I.e, support for S3, SQS, etc. triggers, which would also support a simpler cross-function call interface.

## Usage
### Install package:
```sh
# pnpm (recommended)
pnpm install @namesmt/hono-adapter-aws-lambda
```

### Import:
```ts
// ESM
import { handle, streamHandle } from '@namesmt/hono-adapter-aws-lambda'
```

### Examples:
Fast example of accepting an S3 trigger event
```ts
import { handle, streamHandle } from '@namesmt/hono-adapter-aws-lambda'

interface Bindings {
  event: { Records: Array<{ eventName: string }> }
}
const app = new Hono<{ Bindings: Bindings }>()

app.on('TRIGGER', getTriggerPath('aws:s3'), c => c.text(c.env.event.Records[0].eventName))
```

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
