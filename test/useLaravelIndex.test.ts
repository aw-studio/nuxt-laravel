// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNuxtApp } from 'nuxt/app'
import { useLaravelIndex } from '../src/runtime/composables/useLaravelIndex'

/**
 * `useLaravelIndex` holds the list state for an endpoint: pagination, sorting,
 * search, filters and optional URL sync. It had no test coverage at all.
 *
 * Two things shape how these tests are written:
 *
 * - State lives in `useState(key ?? \`index-${endpoint}\`)`, which is shared
 *   process-wide. Every test therefore uses its own endpoint, except the ones
 *   that assert sharing on purpose.
 * - `watch` is registered outside a component scope, so it is never torn down.
 *   Each `useLaravelIndex()` call adds a permanent watcher to its own state.
 */

let routeQuery: Record<string, unknown> = {}
const push = vi.fn()

vi.mock('nuxt/app', async importOriginal => {
    const actual = await importOriginal<typeof import('nuxt/app')>()
    return {
        ...actual,
        useRoute: () => ({ query: routeQuery }),
        useRouter: () => ({ push }),
    }
})

const api = vi.fn()

/** A Laravel resource envelope. */
const envelope = (
    items: Array<{ id: number, name?: string }>,
    meta: Partial<{
        current_page: number
        last_page: number
        per_page: number
        total: number
    }> = {}
) => ({
    data: items,
    meta: {
        total: 3,
        per_page: 10,
        current_page: 1,
        last_page: 1,
        from: 1,
        to: items.length,
        ...meta,
    },
    links: { first: '', last: '', prev: null, next: null },
})

/** Let Vue's watchers and the awaited fetch settle. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

let endpointCounter = 0
const uniqueEndpoint = () => `/api/items-${++endpointCounter}`

beforeEach(() => {
    api.mockReset()
    api.mockResolvedValue(envelope([{ id: 1, name: 'One' }]))
    push.mockClear()
    routeQuery = {}
    ;(useNuxtApp() as Record<string, unknown>).$apiFetch = api
})

const requestedUrl = () => String(api.mock.calls.at(-1)?.[0] ?? '')

describe('initial state', () => {
    it('starts empty and not loading', () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })

        expect(index.state.value.items).toEqual([])
        expect(index.state.value.loading).toBe(false)
        expect(index.state.value.error).toBeNull()
        expect(index.state.value.meta).toBeUndefined()
    })

    it('defaults syncUrl to true', () => {
        const index = useLaravelIndex(uniqueEndpoint())

        expect(index.state.value.syncUrl).toBe(true)
    })

    it('applies perPage and sort from options', () => {
        const index = useLaravelIndex(uniqueEndpoint(), {
            syncUrl: false,
            perPage: 25,
            sort: '-created_at',
        })

        expect(index.state.value.perPage).toBe(25)
        expect(index.state.value.sort).toBe('-created_at')
    })
})

describe('loading', () => {
    it('requests the endpoint and stores items and meta', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })

        await index.load()

        expect(index.state.value.items).toEqual([{ id: 1, name: 'One' }])
        expect(index.state.value.meta?.current_page).toBe(1)
        expect(index.state.value.loading).toBe(false)
    })

    it('serializes state into the query string', async () => {
        const endpoint = uniqueEndpoint()
        const index = useLaravelIndex(endpoint, { syncUrl: false, perPage: 25 })

        // Load first: changing sort/search before the first load triggers
        // loadAll(), which wipes perPage — see the characterization test below.
        await index.load()

        index.setSort('-created_at')
        index.setSearch('shirt')
        // Changing sort/search schedules its own reload; let that land first so
        // the assertion below describes the explicit load(2), not the watcher's.
        await settle()
        api.mockClear()

        await index.load(2)

        const url = decodeURIComponent(requestedUrl())
        expect(url).toContain(`${endpoint}?`)
        expect(url).toContain('page=2')
        expect(url).toContain('perPage=25')
        expect(url).toContain('sort=-created_at')
        expect(url).toContain('search=shirt')
    })

    it('keeps the configured perPage when search changes before the first load', function () {
        // Regression test. The sort/search/filter watcher used to branch on
        // `state.page`, which is only set once a load has completed. Before that
        // it called `loadAll()`, and `loadAll()` sets `perPage = undefined` —
        // so the configured page size was destroyed for the rest of the session
        // and the backend silently fell back to its own default.
        return (async () => {
            const index = useLaravelIndex(uniqueEndpoint(), {
                syncUrl: false,
                perPage: 25,
            })

            index.setSearch('shirt')
            await settle()

            expect(index.state.value.perPage).toBe(25)
            expect(decodeURIComponent(requestedUrl())).toContain('perPage=25')

            await index.load(2)
            expect(decodeURIComponent(requestedUrl())).toContain('perPage=25')
        })()
    })

    it('reloads the first page when a filter changes, never unpaginated', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), {
            syncUrl: false,
            perPage: 25,
        })

        // Even after an explicit loadAll(), a filter change returns the list to
        // page 1 rather than re-fetching everything unpaginated.
        await index.loadAll()
        expect(requestedUrl()).not.toContain('page=')

        index.setFilter({ name: 'Shirt' })
        await settle()

        expect(requestedUrl()).toContain('page=1')
    })

    it('serializes filters in the backend operator shape', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })

        index.setFilter({ name: { $containsi: 'shirt' } })
        await index.load()

        expect(decodeURIComponent(requestedUrl())).toContain(
            'filter[name][$containsi]=shirt'
        )
    })

    it('clears page and perPage for loadAll', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), {
            syncUrl: false,
            perPage: 25,
        })

        await index.loadAll()

        expect(requestedUrl()).not.toContain('page=')
        expect(requestedUrl()).not.toContain('perPage=')
    })
})

describe('pagination', () => {
    const paged = (current: number, last: number) =>
        envelope([{ id: current }], { current_page: current, last_page: last })

    it('reports next and previous availability from meta', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        api.mockResolvedValue(paged(2, 5))

        await index.load(2)

        expect(index.hasNextPage.value).toBe(true)
        expect(index.hasPrevPage.value).toBe(true)
    })

    it('has no next page on the last page', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        api.mockResolvedValue(paged(5, 5))

        await index.load(5)

        expect(index.hasNextPage.value).toBe(false)
    })

    it('has no previous page on the first page', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        api.mockResolvedValue(paged(1, 5))

        await index.load(1)

        expect(index.hasPrevPage.value).toBe(false)
    })

    it('advances and retreats a page', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })

        // `nextPage`/`prevPage` step from `meta.current_page`, so the fake server
        // has to answer with the page that was actually asked for.
        api.mockImplementation((url: string) => {
            const page = Number(new URL(url).searchParams.get('page') ?? 1)
            return Promise.resolve(paged(page, 5))
        })

        await index.load(2)

        index.nextPage()
        await settle()
        expect(requestedUrl()).toContain('page=3')

        index.prevPage()
        await settle()
        expect(requestedUrl()).toContain('page=2')
    })

    it('does nothing when paging past the end', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        api.mockResolvedValue(paged(5, 5))
        await index.load(5)

        const before = api.mock.calls.length
        index.nextPage()
        await settle()

        expect(api.mock.calls.length).toBe(before)
    })
})

describe('loadMore', () => {
    it('appends the next page instead of replacing', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })

        api.mockResolvedValue(
            envelope([{ id: 1 }], { current_page: 1, last_page: 2 })
        )
        await index.load(1)

        api.mockResolvedValue(
            envelope([{ id: 2 }], { current_page: 2, last_page: 2 })
        )
        index.loadMore()
        await settle()

        expect(index.state.value.items).toEqual([{ id: 1 }, { id: 2 }])
    })

    it('stops at the last page', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        api.mockResolvedValue(
            envelope([{ id: 1 }], { current_page: 2, last_page: 2 })
        )
        await index.load(2)

        const before = api.mock.calls.length
        index.loadMore()
        await settle()

        expect(api.mock.calls.length).toBe(before)
    })

    it('does nothing before any load, when meta is unknown', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })

        index.loadMore()
        await settle()

        expect(api).not.toHaveBeenCalled()
    })
})

describe('mutateStateItem', () => {
    it('patches a matching item in place', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        api.mockResolvedValue(envelope([{ id: 1, name: 'One' }, { id: 2, name: 'Two' }]))
        await index.load()

        index.mutateStateItem(2, { name: 'Changed' })

        expect(index.state.value.items).toEqual([
            { id: 1, name: 'One' },
            { id: 2, name: 'Changed' },
        ])
    })

    it('leaves the list alone when no item matches', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        api.mockResolvedValue(envelope([{ id: 1, name: 'One' }]))
        await index.load()

        index.mutateStateItem(99, { name: 'Nope' })

        expect(index.state.value.items).toEqual([{ id: 1, name: 'One' }])
    })

    it('throws when the id key is missing from an item', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        api.mockResolvedValue(
            envelope([{ name: 'no id' } as unknown as { id: number }])
        )
        await index.load()

        expect(() => index.mutateStateItem(1, { name: 'x' })).toThrow(/not found in item/)
    })
})

describe('error handling', () => {
    it('stores the Laravel error body and rethrows', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        const body = { message: 'Unprocessable', errors: { name: ['required'] } }
        api.mockRejectedValue({ response: { _data: body } })

        await expect(index.load()).rejects.toBeTruthy()

        expect(index.state.value.error).toEqual(body)
        expect(index.state.value.loading).toBe(false)
    })

    it('empties the list on a failed reload', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        await index.load()
        expect(index.state.value.items).toHaveLength(1)

        api.mockRejectedValue({ response: { _data: { message: 'boom' } } })
        await expect(index.load()).rejects.toBeTruthy()

        expect(index.state.value.items).toEqual([])
    })

    it('calls the onError callback', async () => {
        const onError = vi.fn()
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false, onError })
        api.mockRejectedValue({ response: { _data: { message: 'boom' } } })

        await expect(index.load()).rejects.toBeTruthy()

        expect(onError).toHaveBeenCalledTimes(1)
    })
})

describe('URL sync', () => {
    it('hydrates sort, search and filters from the query string', () => {
        routeQuery = { sort: '-created_at', search: 'shirt', is_active: '1' }

        const index = useLaravelIndex(uniqueEndpoint())

        expect(index.state.value.sort).toBe('-created_at')
        expect(index.state.value.search).toBe('shirt')
        expect(index.state.value.filter).toEqual({ is_active: '1' })
    })

    it('never hydrates reserved pagination keys as filters', () => {
        routeQuery = { page: '2', perPage: '25', sort: 'name', search: 'x' }

        const index = useLaravelIndex(uniqueEndpoint())

        expect(index.state.value.filter).toEqual({})
    })

    it('restricts hydration to urlFilters when given', () => {
        routeQuery = { is_active: '1', leaked_from_another_page: 'yes' }

        const index = useLaravelIndex(uniqueEndpoint(), {
            urlFilters: ['is_active'],
        })

        expect(index.state.value.filter).toEqual({ is_active: '1' })
    })

    it('pushes state back into the query string on load', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { perPage: 25 })

        await index.load(2)

        expect(push).toHaveBeenCalled()
        expect(push.mock.calls.at(-1)?.[0].query).toMatchObject({
            page: 2,
            perPage: 25,
        })
    })

    it('does not touch the router when syncUrl is off', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })

        await index.load()

        expect(push).not.toHaveBeenCalled()
    })

    it('takes the page from the URL when load is called with no argument', async () => {
        routeQuery = { page: '4' }
        const index = useLaravelIndex(uniqueEndpoint())

        await index.load()

        expect(requestedUrl()).toContain('page=4')
    })

    it('lets the server response win over the requested page', async () => {
        // `state.page` is assigned from `meta.current_page` after the response,
        // so it reflects what the backend actually served — asking for page 4 of
        // a one-page result leaves `state.page` at 1, not 4.
        routeQuery = { page: '4' }
        const index = useLaravelIndex(uniqueEndpoint())
        api.mockResolvedValue(envelope([{ id: 1 }], { current_page: 1, last_page: 1 }))

        await index.load()

        expect(index.state.value.page).toBe(1)
    })
})

describe('reactivity', () => {
    it('reloads when the search term changes', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        await index.load()
        const before = api.mock.calls.length

        index.setSearch('shirt')
        await settle()

        expect(api.mock.calls.length).toBeGreaterThan(before)
        expect(decodeURIComponent(requestedUrl())).toContain('search=shirt')
    })

    it('reloads when the sort changes', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        await index.load()
        const before = api.mock.calls.length

        index.setSort('-name')
        await settle()

        expect(api.mock.calls.length).toBeGreaterThan(before)
    })

    it('resets to the first page when filters change', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        await index.load(3)

        index.setFilter({ name: 'Shirt' })
        await settle()

        expect(requestedUrl()).toContain('page=1')
    })

    it('does not reload when the value is unchanged', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        index.setSearch('shirt')
        await settle()
        const before = api.mock.calls.length

        index.setSearch('shirt')
        await settle()

        expect(api.mock.calls.length).toBe(before)
    })
})

describe('shared state', () => {
    it('shares state between calls for the same endpoint', async () => {
        const endpoint = uniqueEndpoint()
        const a = useLaravelIndex(endpoint, { syncUrl: false })
        const b = useLaravelIndex(endpoint, { syncUrl: false })

        await a.load()

        expect(b.state.value.items).toEqual(a.state.value.items)
    })

    it('isolates state when an explicit key is given', async () => {
        const endpoint = uniqueEndpoint()
        const a = useLaravelIndex(endpoint, { syncUrl: false })
        const b = useLaravelIndex(endpoint, { syncUrl: false, key: 'separate-list' })

        await a.load()

        expect(a.state.value.items).toHaveLength(1)
        expect(b.state.value.items).toEqual([])
    })
})

describe('reset', () => {
    it('returns the state to empty', async () => {
        const index = useLaravelIndex(uniqueEndpoint(), { syncUrl: false })
        await index.load()
        expect(index.state.value.items).toHaveLength(1)

        index.reset()

        expect(index.state.value.items).toEqual([])
        expect(index.state.value.meta).toBeUndefined()
        expect(index.state.value.page).toBeUndefined()
        expect(index.state.value.search).toBeUndefined()
        expect(index.state.value.filter).toEqual({})
    })
})
