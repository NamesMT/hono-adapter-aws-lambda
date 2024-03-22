# hono-adapter-aws-lambda [![NPM version](https://img.shields.io/npm/v/@namesmt/hono-adapter-aws-lambda?color=a1b858&label=)](https://www.npmjs.com/package/@namesmt/hono-adapter-aws-lambda)

**hono-adapter-aws-lambda** is a fork of [hono](https://hono.dev/)'s `aws-lambda` adapter, experimenting and adding some extra features

## Features & Roadmap
- [ ] add router support for `eventSource`
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

## License
[MIT](./LICENSE) License © 2024 [NamesMT](https://github.com/NamesMT)
