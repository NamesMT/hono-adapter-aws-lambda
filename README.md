# hono-adapter-aws-lambda [![NPM version](https://img.shields.io/npm/v/@namesmt/hono-adapter-aws-lambda?color=a1b858&label=)](https://www.npmjs.com/package/@namesmt/hono-adapter-aws-lambda)

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
# npm
npm install @namesmt/hono-adapter-aws-lambda

# yarn
yarn add @namesmt/hono-adapter-aws-lambda

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
