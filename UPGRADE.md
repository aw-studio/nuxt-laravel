# Upgrade Guide

## 0.0.x → 1.0.0

1.0.0 is the first release with a stability commitment. It removes one of two
overlapping CRUD APIs, completes the auth composable, and fixes several defects
in `useLaravelIndex` that were found while writing its first tests.

Nothing here reaches you until you change your version constraint. `^0.0.44`
resolves to `>=0.0.44 <0.0.45` — caret on `0.0.x` pins to the exact patch — so
0.0.x installs are unaffected by this release.

---

## 1. Install zod yourself

`zod` is now a **peer dependency** (`^3.24.0 || ^4.0.0`) rather than bundled.
You pass your own zod schemas into `useLaravelCrud`, so bundling a second copy
risks two zod instances where schemas built by one are not recognised by the
other.

```sh
npm i zod
```

npm 7+ installs peers automatically, so in most cases this already happened.

**If you are on zod 4**, `@vee-validate/zod` still declares only a zod 3 peer
and npm may report `ERESOLVE`. zod 4 is tested and works — both majors run in
CI. Until that peer range is widened upstream, add an override:

```jsonc
// package.json
"overrides": { "@vee-validate/zod": { "zod": "$zod" } }
```

`laravel-echo` and `pusher-js` have been removed. Nothing in the package ever
imported them; if your app uses Echo, install it directly.

## 2. `useLaravelCrudResource` is gone — use `useLaravelCrud`

The two composables did the same job. `useLaravelCrud` keeps the better name and
absorbs the resource version's features, with a flat config instead of the
nested `config: { … }` wrapper.

```diff
-export const useProducts = useLaravelCrudResource<
-  { index: Product; show: Product },
-  { create: ProductForm; update: UpdateForm; delete: DeleteForm }
->({
-  config: {
-    endpoint: '/api/products',
-    schema,
-    initialValues,
-  },
-  update: { schema: updateSchema },
-  delete: { endpoint: '/api/products/:id/archive' },
-  methods: { publish },
-})
+export const useProducts = () =>
+  useLaravelCrud<Product, ProductForm>({
+    endpoint: '/api/products',
+    schema,
+    initialValues,
+    update: { schema: updateSchema },
+    destroy: { endpoint: '/api/products/:id/archive' },
+    methods: { publish },
+  })
```

Four things to change:

- Lift everything out of `config` to the top level.
- Rename the `delete` key to `destroy`.
- Two generics (`TModel`, `TForm`) instead of the nested `CrudReturnTypes` /
  `CrudFormTypes` objects.
- `destroy()` takes an **id**, not a model.

```diff
-const form = destroy(product)
+const form = destroy(product.id)
```

If you were already on `useLaravelCrud`, its per-call endpoint overrides moved
into a params object, and the operation callbacks became per-operation:

```diff
-create('/api/products/import')
+create({ endpoint: '/api/products/import' })   // or: create: { endpoint } in config

-update(product, '/api/products/7/publish')
+update(product, { urlPrefix: '/admin' })

-onCreateSuccess: r => …,
-onCreateError: e => …,
+create: { onSuccess: r => …, onError: e => … },
```

### `destroy()` no longer inherits the schema

A `DELETE` sends no meaningful body, so validating an empty payload against the
create schema rejected every delete. If your delete genuinely needs validation,
give it its own:

```ts
destroy: { schema: z.object({ reason: z.string().min(1) }), initialValues: { reason: '' } }
```

## 3. `useLaravelIndex` fixes that change behaviour

**`reset()` now restores the options the index was created with.** It previously
used different fallbacks from the initialiser, so it silently turned `syncUrl`
on, invented a page size of 10, and replaced an unset sort with an empty string
— leaving the index in a configuration it never started in.

**URL sync uses `router.replace`.** A filter tweak or page step is not a
navigation, and pushing made the back button walk through every intermediate
list state. To restore the old behaviour:

```diff
-useLaravelIndex('/api/products', { syncUrl: true })
+useLaravelIndex('/api/products', { syncUrl: true, historyMode: 'push' })
```

**The `ssr` option is removed.** It only ever set a state field nothing read —
the documented `await useProducts({ ssr: true })` never loaded anything during
SSR. To load on the server, await `load()` in setup:

```diff
-const { items } = await useProducts({ perPage: 6, ssr: true })
+const { items, load } = useProducts({ perPage: 6 })
+await load()
```

The result transfers to the client through Nuxt's payload, so the list renders
with data and does not refetch on hydration.

**`setConfig` checks presence rather than truthiness**, so
`setConfig({ syncUrl: false })` and `{ perPage: 0 }` are no longer silently
discarded. If you relied on falsy values being ignored, pass `undefined`.

Two more fixes need no action: watchers no longer accumulate (each call site
used to add one that was never torn down), and a rejection with no `response`
attached — a DNS failure, an offline client — no longer throws a `TypeError`
while building the error state.

## 4. `Filter` is an object, not a union

`$and` and `$or` are optional keys rather than separate union members, so
property access typechecks:

```ts
const filter: Filter = { completed: true }
filter.completed   // now valid; previously a type error
```

If you were casting around this, the cast can go.

## 5. Auth is complete

`useLaravelSanctum` previously exposed only `csrf()`. It now covers the flow:

```ts
const { user, isAuthenticated, login, logout, fetchUser } = useLaravelSanctum<User>()

await login({ email, password })   // primes CSRF, posts, then loads the user
await logout()
```

This is additive — existing `csrf()` calls keep working. The underlying
cookie/XSRF mechanics are unchanged.

`fetchUser()` resolves to `null` on a `401` or `419` rather than throwing, since
a guest is an expected answer rather than an error.

Endpoints and the state key are configurable, so a staff guard and a member
guard can run side by side:

```ts
useLaravelSanctum<Member>({
  key: 'member',
  loginEndpoint: '/member/login',
  userEndpoint: '/api/member',
})
```

---

## Also in 1.0.0

- **Nuxt 4 support** — `compatibility: '>=3.17.0'`, and CI runs a Nuxt 3/4 ×
  zod 3/4 matrix.
- **Operator parity** — `$startsWith`, `$endsWith`, `$null` and `$notNull` are
  exposed, and the four case-insensitive operators the types already advertised
  are now implemented server-side.
- The hand-rolled `md5` util is gone (internal; never part of the public API).

## Backend compatibility

`aw-studio/laravel-model-index` **1.x** pairs with this release. The two
packages are coupled only by the query string, so mixing majors is not
supported. That package's 1.0 also flips sorting and searching to
deny-by-default and changes `get()`/`paginate()` return types — see its
`UPGRADE.md`.
