# Changelog

## v1.0.0

First release with a stability commitment. See [UPGRADE.md](UPGRADE.md) for
migration steps.

Pairs with `aw-studio/laravel-model-index` **1.x**. The two packages are coupled
only by the query string, so mixing majors is not supported.

### Breaking changes

- **`useLaravelCrudResource` is removed.** `useLaravelCrud` absorbs its features
  — `urlPrefix`, per-operation config, `:id` substitution, custom methods — with
  a flat config instead of the nested `config: { … }` wrapper. `destroy()` now
  takes an id rather than a model, per-call endpoint overrides moved into a
  params object, and `onCreateSuccess`/`onUpdateError` became per-operation
  `onSuccess`/`onError`.
- **`destroy()` no longer inherits the resource schema.** A `DELETE` sends no
  meaningful body, so validating an empty payload against the create schema
  rejected every delete.
- **`zod` is a peer dependency** (`^3.24.0 || ^4.0.0`) rather than bundled, so
  consumer schemas and the module always use the same zod instance.
- **`laravel-echo` and `pusher-js` are removed.** Nothing in the package ever
  imported them.
- **`reset()` restores the options the index was created with.** It previously
  used different fallbacks from the initialiser, silently turning `syncUrl` on,
  inventing a page size and blanking an unset sort.
- **URL sync uses `router.replace`.** Pass `historyMode: 'push'` to restore the
  old behaviour, which made the back button walk through every intermediate
  list state.
- **The `ssr` option is removed.** It only set a state field nothing read; the
  documented `await useProducts({ ssr: true })` never loaded during SSR. Await
  `load()` in setup instead.
- **`Filter` is an object with optional `$and`/`$or`** rather than a union, so
  `filter.completed` typechecks.
- `setConfig` checks presence rather than truthiness, so `{ syncUrl: false }`
  and `{ perPage: 0 }` are no longer discarded.

### Added

- **Full Sanctum auth.** `useLaravelSanctum` gains `login`, `logout`,
  `fetchUser`, `user`, `isAuthenticated` and `loading`, with configurable
  endpoints and state key so multiple guards can run side by side.
  `fetchUser()` resolves to `null` on 401/419 rather than throwing.
- **Nuxt 4 support**, declared via `compatibility: '>=3.17.0'`.
- `$startsWith`, `$endsWith`, `$null` and `$notNull` added to
  `FilterOperatorOption`; the four case-insensitive operators the types already
  advertised are now implemented server-side.
- `historyMode` option on `useLaravelIndex`.

### Fixed

- **Watchers no longer accumulate.** Every call site used to add a watcher that
  was never torn down, growing with each navigation. Registration is tracked
  once per state key on the Nuxt app instance, which is per-request on the
  server and per-session on the client.
- A rejection with no `response` attached — a DNS failure, an offline client —
  no longer throws a `TypeError` while building the error state, masking the
  original cause.
- The configured `perPage` is no longer destroyed when sort, search or filter
  changes before the first load completes.
- `ModuleOptions` moved into `runtime/types`, fixing an unresolvable
  `~/src/module` import that had been failing the playground typecheck.

### Internal

- All four `@ts-expect-error` suppressions removed.
- The hand-rolled 183-line `md5` util is gone; the serialized string is the
  change-detection fingerprint.
- Test suite grew from 7 tests to 165, including paired cross-package contract
  tests and a Nuxt runtime environment for the composables.
- CI runs a Nuxt 3/4 × zod 3/4 matrix, builds both majors, and gates on the
  full typecheck.


## v0.0.44

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.43...v0.0.44)

## v0.0.43

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.42...v0.0.43)

### 🩹 Fixes

- **index:** Prevent cross-page URL filter leakage in useLaravelIndex ([60cc646](https://github.com/aw-studio/nuxt-laravel/commit/60cc646))

### ❤️ Contributors

- Jannes Behrens <jannes@aw-studio.de>

## v0.0.42

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.41...v0.0.42)

## v0.0.41

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.40...v0.0.41)

## v0.0.40

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.39...v0.0.40)

## v0.0.39

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.38...v0.0.39)

## v0.0.38

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.37...v0.0.38)

## v0.0.37

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.36...v0.0.37)

## v0.0.36

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.35...v0.0.36)

## v0.0.35

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.34...v0.0.35)

## v0.0.34

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.33...v0.0.34)

## v0.0.33

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.32...v0.0.33)

## v0.0.32

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.31...v0.0.32)

## v0.0.31

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.30...v0.0.31)

### 🚀 Enhancements

- Delete request with body ([#4](https://github.com/aw-studio/nuxt-laravel/pull/4))

### ❤️ Contributors

- Lukas Heller <dev@lukas-heller.de>

## v0.0.30

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.29...v0.0.30)

## v0.0.29

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.28...v0.0.29)

## v0.0.28

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.27...v0.0.28)

### 🚀 Enhancements

- Implement useLaravelCrudResource composable for CRUD operations ([9e18498](https://github.com/aw-studio/nuxt-laravel/commit/9e18498))

### 🩹 Fixes

- Lint ([a5c72da](https://github.com/aw-studio/nuxt-laravel/commit/a5c72da))

### ❤️ Contributors

- Lukas Heller <dev@lukas-heller.de>

## v0.0.27

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.26...v0.0.27)

## v0.0.26

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.25...v0.0.26)

## v0.0.25

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.24...v0.0.25)

## v0.0.24

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.23...v0.0.24)

## v0.0.23

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.22...v0.0.23)

## v0.0.22

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.21...v0.0.22)

## v0.0.21

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.20...v0.0.21)

## v0.0.20

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.19...v0.0.20)

## v0.0.19

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.18...v0.0.19)

## v0.0.18

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.17...v0.0.18)

## v0.0.17

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.16...v0.0.17)

## v0.0.16

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.15...v0.0.16)

## v0.0.15

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.14...v0.0.15)

## v0.0.14

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.13...v0.0.14)

## v0.0.13

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.12...v0.0.13)

## v0.0.12

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.11...v0.0.12)

## v0.0.11

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.10...v0.0.11)

## v0.0.10

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.9...v0.0.10)

## v0.0.9

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.8...v0.0.9)

## v0.0.8

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.7...v0.0.8)

## v0.0.7

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.6...v0.0.7)

## v0.0.6

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.5...v0.0.6)

## v0.0.5

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.4...v0.0.5)

## v0.0.4

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.3...v0.0.4)

## v0.0.3

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.2...v0.0.3)

## v0.0.2

[compare changes](https://github.com/aw-studio/nuxt-laravel/compare/v0.0.1...v0.0.2)

## v0.0.1

