# Nuxt Laravel

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
![CI](https://github.com/aw-studio/nuxt-laravel/actions/workflows/ci.yml/badge.svg)
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

An opinionated Nuxt 3 toolkit for consuming a Laravel API: Sanctum (cookie/SPA)
authentication, a typed HTTP client, stateful & filterable model indexes,
Zod-validated forms with Laravel error mapping, and CRUD helpers — all
auto-imported.

It pairs with the [Laravel Model Index](https://github.com/aw-studio/laravel-model-index)
package on the backend for the filtering/sorting/pagination API.

- [Features](#features)
- [Setup](#setup)
- [Authentication (Sanctum)](#authentication-sanctum)
- [HTTP Client — `useLaravelApi`](#http-client--uselaravelapi)
- [Fetching a single model — `useLaravelGet`](#fetching-a-single-model--uselaravelget)
- [Model Index — `useLaravelIndex`](#model-index--uselaravelindex)
  - [Configuration](#configuration)
  - [SSR](#ssr)
  - [Data Fetching](#data-fetching)
  - [Searching](#searching)
  - [Filtering](#filtering)
  - [URL sync & `urlFilters`](#url-sync--urlfilters)
  - [Sorting](#sorting)
  - [Meta / Loading State](#meta--loading-state)
  - [Mutating State](#mutating-state)
- [Forms — `useLaravelForm`](#forms--uselaravelform)
- [CRUD — `useLaravelCrud`](#crud--uselaravelcrud)
- [Resource CRUD — `useLaravelCrudResource`](#resource-crud--uselaravelcrudresource)
- [Example](#example)
- [Contribution](#contribution)

## Features

- 🔐 Sanctum SPA (cookie) auth with automatic `XSRF-TOKEN` handling
- 🌐 Typed HTTP client with credentialed requests
- 📑 Stateful, filterable, paginated model indexes — complex filtering,
  search, sorting, pagination, infinite scroll, and optional URL sync
- ✅ Zod-validated forms that map Laravel `422` validation errors back onto fields
- ♻️ CRUD helpers that compose index/get/form into a single resource API
- 🧩 SSR-friendly data fetching

## Setup

### 1. Install

```bash
npm i @aw-studio/nuxt-laravel
```

### 2. Configure

Add the module and point it at your Laravel API:

```ts
export default defineNuxtConfig({
  modules: ['@aw-studio/nuxt-laravel'],
  laravel: {
    baseUrl: 'https://your-laravel-api.tld', // default: http://localhost:8000
  },
})
```

### 3. Prepare the Laravel backend

Because authentication is cookie/SPA based (Laravel Sanctum), the backend must:

- enable Sanctum's stateful API middleware,
- allow CORS **with credentials** for your frontend origin, and
- expose `sanctum/csrf-cookie`.

See the [Laravel Sanctum SPA docs](https://laravel.com/docs/sanctum#spa-authentication)
and [Laravel Model Index](https://github.com/aw-studio/laravel-model-index) for
the index/filter API.

## Authentication (Sanctum)

`useLaravelSanctum` primes the CSRF cookie; afterwards every request made
through the client automatically sends the `X-XSRF-TOKEN` header and includes
credentials.

```ts
const { csrf } = useLaravelSanctum()
const { post, get } = useLaravelApi()

// Prime the XSRF cookie, then log in
await csrf()
await post('/login', { email, password })

// Subsequent authenticated requests just work
const user = await get('/api/user')
```

## HTTP Client — `useLaravelApi`

The foundation all other composables build on. Each request sends
`Accept: application/json`, `credentials: 'include'`, and the `X-XSRF-TOKEN`
header read from the `XSRF-TOKEN` cookie. URLs are resolved against the
configured `baseUrl`.

```ts
const { get, post, put, patch, destroy, getApiUrl } = useLaravelApi()

await get('/api/products')
await post('/api/products', { title: 'New' })
await put('/api/products/1', { title: 'Updated' })
await patch('/api/products/1', { title: 'Patched' })
await destroy('/api/products/1', {})
```

> If you register a custom `$apiFetch` (an `ofetch` instance) on the Nuxt app, it
> is used automatically; otherwise the global `$fetch` is used.

## Fetching a single model — `useLaravelGet`

Wraps `useAsyncData` (SSR-friendly) and unwraps Laravel's `{ data: T }` resource
envelope.

```ts
const { data, error, refresh } = await useLaravelGet<User>('/api/user')

// With query params
const { data: product } = await useLaravelGet<Product>('/api/products/1', {
  query: { with: 'variants' },
})
```

## Model Index — `useLaravelIndex`

The `useLaravelIndex` composable provides a stateful, filterable Laravel API
index. Pass the relative endpoint as the first argument — it also serves as the
default state key, so keep it unique (or set `key`).

It is typically wrapped in a reusable composable:

```ts
import type { LaravelIndexOptions } from '@aw-studio/nuxt-laravel'
import type { Product } from '@/types'

export const useProducts = (options?: LaravelIndexOptions) =>
  useLaravelIndex<Product>('/api/products', options)
```

### Configuration

Configure the index when initializing:

```ts
const { items } = await useProducts({
  perPage: 6,
  syncUrl: true,
  sort: 'title',
  ssr: true,
})
```

| Option       | Type                      | Default     | Description                                                            |
| ------------ | ------------------------- | ----------- | --------------------------------------------------------------------- |
| `perPage`    | `number`                  | —           | Items per page.                                                       |
| `syncUrl`    | `boolean`                 | `true`      | Mirror state to the query string and hydrate from it on init.        |
| `sort`       | `string`                  | —           | Initial sort.                                                         |
| `ssr`        | `boolean`                 | `false`     | Load items during server-side rendering.                             |
| `key`        | `string`                  | endpoint    | Override the shared state key.                                        |
| `urlFilters` | `string[]`                | `undefined` | Allowlist of query keys to hydrate into the filter (see below).      |
| `onError`    | `(error) => void`         | —           | Called when a request fails.                                          |
| `onSuccess`  | `(response) => void`      | —           | Called on a successful response.                                      |

You can also update the configuration at runtime:

```ts
const { setConfig, setPerPage, setSyncUrl } = await useProducts()

setConfig({ perPage: 6, syncUrl: true })
setPerPage(10)
setSyncUrl(false)
```

### SSR

Pass `ssr: true` to load items during server-side rendering:

```ts
const { items } = await useProducts({ perPage: 6, ssr: true })
```

### Data Fetching

```ts
const { load, loadAll, loadMore, nextPage, prevPage, setPage } = await useProducts()

await load()        // load the first (or URL) page
await load(6)       // load a specific page
await nextPage()    // next page
await prevPage()    // previous page
await loadAll()     // load every item, unpaginated
await loadMore()    // append the next page (infinite scrolling)
```

### Searching

```ts
const { setSearch } = await useProducts()
setSearch('Foo')
```

### Filtering

Filters are serialized into URL-encoded query params for the backend.

```ts
const { setFilter } = await useProducts()

// Basic filter
setFilter({ size: 'M', color: 'blue' })

// Operators
setFilter({ price: { $lt: 100 } })

// Complex conditions
setFilter({
  $and: [
    { $or: [{ title: { $contains: 'John' } }, { title: { $contains: 'Paul' } }] },
    { price: { $lt: 100 } },
    { size: { $in: ['S', 'M'] } },
  ],
})
```

#### Available Operators

| Operator        | Description                  |
| --------------- | ---------------------------- |
| `$eq`           | Equal to                     |
| `$eqi`          | Equal to (case-insensitive)  |
| `$ne`           | Not equal to                 |
| `$nei`          | Not equal (case-insensitive) |
| `$lt`           | Less than                    |
| `$lte`          | Less than or equal to        |
| `$gt`           | Greater than                 |
| `$gte`          | Greater than or equal to     |
| `$in`           | In array                     |
| `$notIn`        | Not in array                 |
| `$contains`     | Contains                     |
| `$notContains`  | Does not contain             |
| `$containsi`    | Contains (case-insensitive)  |
| `$notContainsi` | Not contains (case-insens.)  |
| `$between`      | Between two values           |

Combine groups with `$and` / `$or`.

### URL sync & `urlFilters`

When `syncUrl` is enabled, the index mirrors page, sort, search, and filters
into the query string and hydrates them back on init — so a shared/bookmarked
URL restores the list state.

By default, **every** unknown query param is hydrated as a filter. This can leak
state between pages: e.g. one index sets `?is_active=1`, the user navigates to an
unrelated index, and that index hydrates `is_active` and sends it to a backend
whose filter allowlist rejects the field.

Use `urlFilters` to restrict which keys may be hydrated from the URL. When set,
only the listed keys are read back; when omitted, behavior is unchanged.

```ts
export const useVehicleGroups = (options?: LaravelIndexOptions) =>
  useLaravelIndex<VehicleGroup>('/api/vehicle-groups', {
    syncUrl: true,
    // A stale `?is_active=1` left by another index is ignored instead of
    // being sent to the backend.
    urlFilters: ['name'],
    ...options,
  })
```

### Sorting

```ts
const { setSort } = await useProducts()

setSort('title')        // ascending
setSort('-title')       // descending
setSort('title:desc')   // descending (alternate syntax, backend dependent)
```

### Meta / Loading State

Pagination metadata, loading flag, and error are reactive:

```vue
<template>
  <div>
    <Spinner v-if="loading" />
    <p v-if="error">{{ error.message }}</p>
    Page: {{ meta?.current_page }} / {{ meta?.last_page }}
  </div>
</template>

<script setup lang="ts">
const { meta, loading, error } = await useProducts()
</script>
```

### Mutating State

Patch a single item in place (e.g. after an optimistic update) or reset the
index:

```ts
const { mutateStateItem, reset } = await useProducts()

mutateStateItem(productId, { title: 'Renamed' })
reset()
```

## Forms — `useLaravelForm`

A thin wrapper around [vee-validate](https://vee-validate.logaretm.com/) with a
[Zod](https://zod.dev/) schema. It exposes per-field bindings and a `submit()`
that posts to Laravel and maps `422` validation errors (`{ errors: { field:
[...] } }`) back onto the corresponding fields.

```vue
<template>
  <form @submit.prevent="form.submit">
    <input v-model="form.fields.email" v-bind="form.fieldProps.email" />
    <span v-if="form.fieldMeta.email.touched">{{ form.errors.value.email }}</span>

    <input v-model="form.fields.password" type="password" />
    <button :disabled="form.isSubmitting.value">Log in</button>
  </form>
</template>

<script setup lang="ts">
import * as z from 'zod'

type LoginForm = { email: string; password: string }

const form = useLaravelForm<LoginForm>({
  submitUrl: '/login',
  method: 'POST', // POST | PUT | PATCH | DELETE
  initialValues: { email: '', password: '' },
  schema: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  onSubmitSuccess: () => navigateTo('/dashboard'),
  onSubmitError: error => console.error(error),
})
</script>
```

`form` also exposes everything returned by vee-validate's `useForm` (`values`,
`errors`, `isSubmitting`, `setFieldError`, …).

## CRUD — `useLaravelCrud`

Composes index/get/form into a single resource bound to one `endpoint`,
`schema`, and `initialValues`.

```ts
import * as z from 'zod'

type Todo = { id: number; title: string; completed: boolean }
type TodoForm = Omit<Todo, 'id'>

export const useTodos = useLaravelCrud<Todo, TodoForm>({
  endpoint: '/api/todos',
  initialValues: { title: '', completed: false },
  schema: z.object({
    title: z.string().min(1),
    completed: z.boolean().default(false),
  }),
  onCreateSuccess: res => console.log('created', res),
})
```

```ts
const { index, show, create, update, destroy } = useTodos

const list = await index({ perPage: 10 }) // → useLaravelIndex
const one = await show('1')               // → useLaravelGet
const createForm = create()               // → useLaravelForm (POST)
const editForm = update(todo)             // → useLaravelForm (PUT /api/todos/:id)
const deleteForm = destroy(todo)          // → useLaravelForm (DELETE)
```

## Resource CRUD — `useLaravelCrudResource`

A more configurable factory when operations need different endpoints, schemas,
initial values, callbacks, a `:id` placeholder, a `urlPrefix`, or extra custom
methods.

```ts
const useArticles = () =>
  useLaravelCrudResource<{ index: Article }, { create: ArticleForm }>({
    config: { endpoint: '/api/articles', schema, initialValues },
    show: { options: { query: { with: 'author' } } },
    update: { endpoint: '/api/articles/:id/publish' },
    methods: {
      archive: (id: number) => useLaravelApi().post(`/api/articles/${id}/archive`, {}),
    },
  })

const { index, show, create, update, destroy, archive } = useArticles()

// Optionally scope endpoints with a urlPrefix
const list = index(undefined, { urlPrefix: '/admin' })
```

## Example

```ts
// composables/useProducts.ts
import type { LaravelIndexOptions } from '@aw-studio/nuxt-laravel'
import type { Product } from '@/types'

export const useProducts = (options?: LaravelIndexOptions) =>
  useLaravelIndex<Product>('/api/products', options)
```

```vue
<template>
  <div>
    <input v-model="searchTerm" type="search" placeholder="Search" />

    <ProductCard v-for="item in items" :key="item.id" :product="item" />

    <button :disabled="!hasPrevPage" @click="prevPage">Previous</button>
    <button :disabled="!hasNextPage" @click="nextPage">Next</button>
    <div>Page: {{ meta?.current_page }} / {{ meta?.last_page }}</div>
  </div>
</template>

<script setup lang="ts">
const { items, meta, hasNextPage, hasPrevPage, nextPage, prevPage, setSearch, load } =
  await useProducts({ perPage: 6, syncUrl: true })

const searchTerm = ref('')
watch(searchTerm, () => setSearch(searchTerm.value))

onMounted(load)
</script>
```

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

  # Release a new version
  npm run release
  ```

</details>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@aw-studio/nuxt-laravel/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@aw-studio/nuxt-laravel

[npm-downloads-src]: https://img.shields.io/npm/dm/@aw-studio/nuxt-laravel.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@aw-studio/nuxt-laravel

[license-src]: https://img.shields.io/npm/l/@aw-studio/nuxt-laravel.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@aw-studio/nuxt-laravel

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
