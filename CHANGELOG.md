# Changelog


## v1.3.4

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v1.3.3...v1.3.4)

### 🩹 Fixes

- Env data was never passed down, S3 trigger example didn't work ([4aac223](https://github.com/namesmt/hono-adapter-aws-lambda/commit/4aac223))

### 🏡 Chore

- Update deps ([1b2ab81](https://github.com/namesmt/hono-adapter-aws-lambda/commit/1b2ab81))

### ❤️ Contributors

- NamesMT ([@NamesMT](https://github.com/NamesMT))

## v1.3.3

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v1.3.1...v1.3.3)

### 🏡 Chore

- Housekeep, LLRT compat ([d3209a0](https://github.com/namesmt/hono-adapter-aws-lambda/commit/d3209a0))
- **release:** V1.3.2 ([30bc7e8](https://github.com/namesmt/hono-adapter-aws-lambda/commit/30bc7e8))
- ⚠️  Undocumented env rename, and use simple Math.random() for path UUID gen ([87af78d](https://github.com/namesmt/hono-adapter-aws-lambda/commit/87af78d))

#### ⚠️ Breaking Changes

- ⚠️  Undocumented env rename, and use simple Math.random() for path UUID gen ([87af78d](https://github.com/namesmt/hono-adapter-aws-lambda/commit/87af78d))

### ❤️ Contributors

- NamesMT ([@NamesMT](https://github.com/NamesMT))

## v1.3.2

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v1.3.1...v1.3.2)

### 🏡 Chore

- Housekeep, LLRT compat ([d3209a0](https://github.com/namesmt/hono-adapter-aws-lambda/commit/d3209a0))

### ❤️ Contributors

- NamesMT ([@NamesMT](https://github.com/NamesMT))

## v1.3.1

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v1.3.0...v1.3.1)

### 🏡 Chore

- Update deps ([52eee5a](https://github.com/namesmt/hono-adapter-aws-lambda/commit/52eee5a))

### ❤️ Contributors

- NamesMT ([@NamesMT](https://github.com/NamesMT))

## v1.3.0

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v1.2.0...v1.3.0)

### 🚀 Enhancements

- **minimalEvent:** Also stringify body if method is not GET/HEAD ([a0b33ac](https://github.com/namesmt/hono-adapter-aws-lambda/commit/a0b33ac))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v1.2.0

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v1.1.0...v1.2.0)

### 🚀 Enhancements

- **minimalEvent:** Also set `content-type` header ([0402ec4](https://github.com/namesmt/hono-adapter-aws-lambda/commit/0402ec4))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v1.1.0

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v1.0.1...v1.1.0)

### 🚀 Enhancements

- `HandleConfigOptions` and `easyRouteKey` ([b9b7044](https://github.com/namesmt/hono-adapter-aws-lambda/commit/b9b7044))

### 🏡 Chore

- **eslint:** Disable `ts/no-empty-object-type` ([d1f78fc](https://github.com/namesmt/hono-adapter-aws-lambda/commit/d1f78fc))

### ✅ Tests

- Adjust test for asynchronous handler case ([49bddf2](https://github.com/namesmt/hono-adapter-aws-lambda/commit/49bddf2))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v1.0.1

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v1.0.0...v1.0.1)

### 🏡 Chore

- Housekeeping ([449f17a](https://github.com/namesmt/hono-adapter-aws-lambda/commit/449f17a))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v1.0.0

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.2.8...v1.0.0)

### 🏡 Chore

- Bump `@namesmt/utils-lambda` ([601d7e6](https://github.com/namesmt/hono-adapter-aws-lambda/commit/601d7e6))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.2.8

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.2.7...v0.2.8)

### 📖 Documentation

- **README:** Update ([9e1c1f8](https://github.com/namesmt/hono-adapter-aws-lambda/commit/9e1c1f8))

### 🏡 Chore

- Maintain deps, lockfile ([340a427](https://github.com/namesmt/hono-adapter-aws-lambda/commit/340a427))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.2.7

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.2.6...v0.2.7)

### 🏡 Chore

- No longer release under namespace ([fa4a76b](https://github.com/namesmt/hono-adapter-aws-lambda/commit/fa4a76b))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.2.6

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.2.5...v0.2.6)

### 🌊 Types

- **TriggerFactory:** Relax default `Variables` type ([c5c7e62](https://github.com/namesmt/hono-adapter-aws-lambda/commit/c5c7e62))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.2.5

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.2.3...v0.2.5)

### 🚀 Enhancements

- Add `$HAAL-returnBody` special return ([6cd75e6](https://github.com/namesmt/hono-adapter-aws-lambda/commit/6cd75e6))

### 💅 Refactors

- **handler:** Code splitting ([fbb8b40](https://github.com/namesmt/hono-adapter-aws-lambda/commit/fbb8b40))

### 🌊 Types

- Declare global awslambda stream APIs ([4d28a32](https://github.com/namesmt/hono-adapter-aws-lambda/commit/4d28a32))

### 🏡 Chore

- **trigger:** ⚠️  Remove `return-body` special return ([f373710](https://github.com/namesmt/hono-adapter-aws-lambda/commit/f373710))
- Update deps, lockfile ([79479cf](https://github.com/namesmt/hono-adapter-aws-lambda/commit/79479cf))

### ✅ Tests

- Fix types error ([b43c8ad](https://github.com/namesmt/hono-adapter-aws-lambda/commit/b43c8ad))

#### ⚠️ Breaking Changes

- **trigger:** ⚠️  Remove `return-body` special return ([f373710](https://github.com/namesmt/hono-adapter-aws-lambda/commit/f373710))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.2.3

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.2.2...v0.2.3)

### 🩹 Fixes

- Set cookies with comma is bugged ([eb79aa9](https://github.com/namesmt/hono-adapter-aws-lambda/commit/eb79aa9))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.2.2

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.2.1...v0.2.2)

### 🌊 Types

- Export `LambdaTriggerEvent`, `LambdaRequestEvent` ([d037768](https://github.com/namesmt/hono-adapter-aws-lambda/commit/d037768))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.2.1

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.2.0...v0.2.1)

### 🌊 Types

- Refactor and export necessary types, fix `ts2742` ([130d155](https://github.com/namesmt/hono-adapter-aws-lambda/commit/130d155))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.2.0

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.2.0-1719056816.4d340c2...v0.2.0)

### 🚀 Enhancements

- Exports `LambdaEvent`, `LambdaContext` ([07e6790](https://github.com/namesmt/hono-adapter-aws-lambda/commit/07e6790))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.2.0-1719056816.4d340c2

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.2.0-1718818726.a66ea14...v0.2.0-1719056816.4d340c2)

### 🚀 Enhancements

- **getEventSource:** Support all common trigger event interfaces ([1496b5c](https://github.com/namesmt/hono-adapter-aws-lambda/commit/1496b5c))
- **createTriggerFactory:** Add default `Env.Bindings` ([c14b734](https://github.com/namesmt/hono-adapter-aws-lambda/commit/c14b734))

### 🩹 Fixes

- Workaround unbuild alias implicit external bug unjs/unbuild#201 ([#201](https://github.com/namesmt/hono-adapter-aws-lambda/issues/201))

### 💅 Refactors

- ⚠️  Major restructuring ([47dbfca](https://github.com/namesmt/hono-adapter-aws-lambda/commit/47dbfca))
- Remove local definitions of trigger interfaces ([34ef55a](https://github.com/namesmt/hono-adapter-aws-lambda/commit/34ef55a))
- Relocation some code ([40a8f48](https://github.com/namesmt/hono-adapter-aws-lambda/commit/40a8f48))

### 📖 Documentation

- README corrections ([0936e23](https://github.com/namesmt/hono-adapter-aws-lambda/commit/0936e23))
- **README:** Update example ([820cdb9](https://github.com/namesmt/hono-adapter-aws-lambda/commit/820cdb9))

### ✅ Tests

- Update ([4d340c2](https://github.com/namesmt/hono-adapter-aws-lambda/commit/4d340c2))

#### ⚠️ Breaking Changes

- ⚠️  Major restructuring ([47dbfca](https://github.com/namesmt/hono-adapter-aws-lambda/commit/47dbfca))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.2.0-1718818726.a66ea14

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.1.6...v0.2.0-1718818726.a66ea14)

### 🚀 Enhancements

- ⚠️  Major refactor of trigger events support ([a66ea14](https://github.com/namesmt/hono-adapter-aws-lambda/commit/a66ea14))

#### ⚠️ Breaking Changes

- ⚠️  Major refactor of trigger events support ([a66ea14](https://github.com/namesmt/hono-adapter-aws-lambda/commit/a66ea14))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.1.6

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.1.5...v0.1.6)

### 🩹 Fixes

- Exports and docs ([80ed50f](https://github.com/namesmt/hono-adapter-aws-lambda/commit/80ed50f))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.1.5

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.1.4...v0.1.5)

### 🏡 Chore

- Align with honojs/hono#2926 ([#2926](https://github.com/namesmt/hono-adapter-aws-lambda/issues/2926))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.1.4

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.1.3...v0.1.4)

### 🏡 Chore

- Update deps, align with `hono` and `starter-ts` ([3851d2e](https://github.com/namesmt/hono-adapter-aws-lambda/commit/3851d2e))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.1.3

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.1.2...v0.1.3)

### 🏡 Chore

- Align with honojs/hono#a437161 ([eb62ce0](https://github.com/namesmt/hono-adapter-aws-lambda/commit/eb62ce0))
- Update deps ([30fb157](https://github.com/namesmt/hono-adapter-aws-lambda/commit/30fb157))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.1.2

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.1.1...v0.1.2)

### 🚀 Enhancements

- Add `ALBProcessor` and refactor TriggerProcessor + abstract classes ([0124671](https://github.com/namesmt/hono-adapter-aws-lambda/commit/0124671))

### 💅 Refactors

- Improve security against brute-force attack ([f340e45](https://github.com/namesmt/hono-adapter-aws-lambda/commit/f340e45))

### 🏡 Chore

- Align with honojs/hono#c95e135 ([a7a91a6](https://github.com/namesmt/hono-adapter-aws-lambda/commit/a7a91a6))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.1.1

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.1.0...v0.1.1)

### 🚀 Enhancements

- Align with hono@4.2.5 ([d52c916](https://github.com/namesmt/hono-adapter-aws-lambda/commit/d52c916))
- Align with hono@4.2.6, implements triggerProcessor ([3ace017](https://github.com/namesmt/hono-adapter-aws-lambda/commit/3ace017))

### 🏡 Chore

- Update deps ([b85af91](https://github.com/namesmt/hono-adapter-aws-lambda/commit/b85af91))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.1.0

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.1.0-1711616965.7e91467...v0.1.0)

### 📖 Documentation

- **README:** Add quick example to use trigger events ([8917e57](https://github.com/namesmt/hono-adapter-aws-lambda/commit/8917e57))

### 🏡 Chore

- Use `unjs/renovate-config` ([bde6b99](https://github.com/namesmt/hono-adapter-aws-lambda/commit/bde6b99))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))
- Trung Dang ([@NamesMT](http://github.com/NamesMT))

## v0.1.0-1711616965.7e91467

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.1.0-1711141011.89eedae...v0.1.0-1711616965.7e91467)

### 🚀 Enhancements

- ⚠️  Introduce `getTriggerPath()`, `fixTriggerRoutes()` (see description) ([e834b15](https://github.com/namesmt/hono-adapter-aws-lambda/commit/e834b15))

### 🩹 Fixes

- **streamHandle:** Handle response without body ([13ed05b](https://github.com/namesmt/hono-adapter-aws-lambda/commit/13ed05b))

### 💅 Refactors

- Revert "fix: support basePath for trigger events" ([719f694](https://github.com/namesmt/hono-adapter-aws-lambda/commit/719f694))

### 📖 Documentation

- **README:** Update ([7e91467](https://github.com/namesmt/hono-adapter-aws-lambda/commit/7e91467))

#### ⚠️ Breaking Changes

- ⚠️  Introduce `getTriggerPath()`, `fixTriggerRoutes()` (see description) ([e834b15](https://github.com/namesmt/hono-adapter-aws-lambda/commit/e834b15))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.1.0-1711141011.89eedae

[compare changes](https://github.com/namesmt/hono-adapter-aws-lambda/compare/v0.1.0-1711140225.4b7ce09...v0.1.0-1711141011.89eedae)

### 📖 Documentation

- **README:** Update ([89eedae](https://github.com/namesmt/hono-adapter-aws-lambda/commit/89eedae))

### 🏡 Chore

- Should publish under a namespace ([c4a1c6f](https://github.com/namesmt/hono-adapter-aws-lambda/commit/c4a1c6f))
- Adjust linked parts after renaming to namespace ([5dec7df](https://github.com/namesmt/hono-adapter-aws-lambda/commit/5dec7df))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

## v0.1.0-1711140225.4b7ce09


### 🚀 Enhancements

- Introduce support for trigger events ([e9135d4](https://github.com/namesmt/hono-adapter-aws-lambda/commit/e9135d4))

### 🩹 Fixes

- Support basePath for trigger events ([4b7ce09](https://github.com/namesmt/hono-adapter-aws-lambda/commit/4b7ce09))

### 💅 Refactors

- ⚠️  Remove unnecessary, undocumented double binding of `requestContext` ([112346d](https://github.com/namesmt/hono-adapter-aws-lambda/commit/112346d))

### 📖 Documentation

- **README:** Populate ([0831444](https://github.com/namesmt/hono-adapter-aws-lambda/commit/0831444))

### 🌊 Types

- Fix: some props are optional in APIGatewayRequestContextV2 ([ef9d8f9](https://github.com/namesmt/hono-adapter-aws-lambda/commit/ef9d8f9))
- Fix: body are optional in APIGatewayProxyEventV2 ([17053f4](https://github.com/namesmt/hono-adapter-aws-lambda/commit/17053f4))

### 🏡 Chore

- Init ([ed43e37](https://github.com/namesmt/hono-adapter-aws-lambda/commit/ed43e37))
- **package:** Rename `starter-ts` to `hono-adapter-aws-lambda` ([7d07fa4](https://github.com/namesmt/hono-adapter-aws-lambda/commit/7d07fa4))
- Update deps ([bfa1999](https://github.com/namesmt/hono-adapter-aws-lambda/commit/bfa1999))

#### ⚠️ Breaking Changes

- ⚠️  Remove unnecessary, undocumented double binding of `requestContext` ([112346d](https://github.com/namesmt/hono-adapter-aws-lambda/commit/112346d))

### ❤️ Contributors

- NamesMT ([@NamesMT](http://github.com/NamesMT))

