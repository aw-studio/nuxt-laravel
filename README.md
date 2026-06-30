<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: My Module
- Package name: my-module
- Description: My new Nuxt module
-->

# My Module

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

My new Nuxt module for doing amazing things.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/my-module?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

<!-- Highlight some of the features your module provide here -->
- ⛰ &nbsp;Foo
- 🚠 &nbsp;Bar
- 🌲 &nbsp;Baz

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add my-module
```

That's it! You can now use My Module in your Nuxt app ✨


## `useLaravelIndex` — URL filter hydration

When `syncUrl` is enabled, `useLaravelIndex` mirrors the list state (page, sort,
search and filters) into the query string, and on init it hydrates that state
back from the URL.

By default, **every** unknown query param is read back as a filter. This means a
filter set by one index can leak into another via the URL. For example, a
vehicles index sets `?is_active=1`; the user navigates to a vehicle-groups index,
which hydrates `is_active` from the URL and sends it to a backend whose filter
allowlist does not include that field — resulting in an error.

Use the `urlFilters` option to restrict which keys may be hydrated from the URL.
When set, only the listed keys are read back (everything else is ignored); when
omitted, the original behavior is unchanged.

```ts
const { items, load } = await useLaravelIndex<VehicleGroup>('/api/vehicle-groups', {
  syncUrl: true,
  // Only these keys are hydrated from the query string. A stale `?is_active=1`
  // left over from another index is ignored instead of being sent to the backend.
  urlFilters: ['name'],
})
```

| Option       | Type       | Default     | Description                                                                 |
| ------------ | ---------- | ----------- | --------------------------------------------------------------------------- |
| `urlFilters` | `string[]` | `undefined` | Allowlist of query keys to hydrate into `filter`. Omit for legacy behavior. |


## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/my-module/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/my-module

[npm-downloads-src]: https://img.shields.io/npm/dm/my-module.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/my-module

[license-src]: https://img.shields.io/npm/l/my-module.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/my-module

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
