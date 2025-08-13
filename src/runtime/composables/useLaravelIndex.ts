import { useRoute, useRouter, useState } from 'nuxt/app'
import { computed, toRefs, watch } from 'vue'
import { md5 } from '../utils/md5'
import type {
    Filter,
    IndexResponse,
    LaravelResponseMeta,
    LaravelIndexOptions,
    LaravelIndexState,
    LaravelIndex,
} from '../types'
import { prepareQueryParams } from '../utils/prepareQueryParams'
import { useLaravelApi } from './useLaravelApi'

export function useLaravelIndex<T extends object>(
    endpoint: string,
    options?: LaravelIndexOptions
): LaravelIndex<T> {
    const router = useRouter()
    const route = useRoute()

    /**
     * Set a unique key for the index state.
     */
    const indexKey = options?.key || `index-${endpoint}`

    /**
     * State for the laravel index.
     *
     */
    const state = useState<LaravelIndexState<T>>(indexKey, () => ({
        items: [] as T[],
        error: null as {
            message: string
            errors: { [key: string]: string[] }
        } | null,
        loading: false,
        meta: undefined as LaravelResponseMeta | undefined,
        page: undefined as number | undefined,
        perPage: options?.perPage as number | undefined,
        syncUrl: options?.syncUrl ?? true,
        sort: options?.sort as string | undefined,
        search: undefined as string | undefined,
        filter: {} as Filter,
        __updated: new Date(),
        __hash: undefined as string | undefined,
        __ssr: options?.ssr ?? false,
    }))

    const setConfig = (config: LaravelIndexOptions) => {
        if (config.perPage) {
            state.value.perPage = config.perPage
        }
        if (config.syncUrl) {
            state.value.syncUrl = config.syncUrl
        }
        if (config.sort) {
            state.value.sort = config.sort
        }
        if (config.ssr) {
            state.value.__ssr = config.ssr
        }
    }

    /**
     * Fetch items from the Laravel API.
     * @param append Whether to append the items to the existing
     */
    const fetchFromApi = async (append: boolean = false) => {
        state.value.loading = true
        state.value.error = null

        const params = prepareQueryParams(state.value)
        const { get } = useLaravelApi()

        try {
            const response: IndexResponse<T> = await get(
                `${endpoint}?${params.toString()}`
            )

            // if append is true, append the new items to the existing items
            // otherwise, replace the existing items with the new items.
            // append is used for infinite scrolling.
            if (append) {
                state.value.items = state.value.items.concat(response.data)
            } else {
                state.value.items = response.data
            }

            state.value.meta = response.meta
            state.value.page = response.meta?.current_page
        } catch (e: any) {
            if (!append) {
                state.value.items = []
            }
            state.value.error = e.response._data

            if (options?.onError) {
                options.onError(e)
            }

            throw e
        } finally {
            state.value.loading = false
        }
    }

    const hasNextPage = computed(() => {
        return !!(
            state.value.meta &&
            state.value.meta.current_page &&
            state.value.meta.current_page < state.value.meta.last_page
        )
    })

    const hasPrevPage = computed(() => {
        return !!(
            state.value.meta &&
            state.value.meta.current_page &&
            state.value.meta.current_page > 1
        )
    })

    const nextPage = () => {
        if (hasNextPage.value) {
            load(state.value.meta!.current_page! + 1)
        }
    }

    const prevPage = () => {
        if (hasPrevPage.value) {
            load(state.value.meta!.current_page! - 1)
        }
    }

    const setPage = (page: number) => {
        load(page)
    }

    const setPerPage = (perPage: number) => {
        state.value.perPage = perPage
    }

    const setSearch = (search: string) => {
        state.value.search = search
    }

    const setFilter = (filter: Filter) => {
        state.value.filter = filter
    }

    const setSort = (sort: string) => {
        state.value.sort = sort
    }

    const setSyncUrl = (syncUrl: boolean) => {
        state.value.syncUrl = syncUrl
    }

    /**
     * Load all items from the API without pagination.
     */
    const loadAll = async () => {
        state.value.page = undefined
        state.value.perPage = undefined
        await fetchFromApi()
    }

    /**
     * Load items from the API with pagination.
     * @param page The page number to load.
     * @param append Whether to append the items to the existing
     * items or replace the existing items in the state.
     */
    const load = async (page?: number, append: boolean = false) => {
        // if a page is passed, set the current page to that page
        // if no page is passed, check, if syncUrl is enabled and if so,
        // set the current page to the page in the URL.
        // if no page is passed and syncUrl is disabled, set the current page to 1.
        // then, if syncUrl is enabled, update the URL with the new page

        if (page) {
            state.value.page = page
        } else if (state.value.syncUrl) {
            state.value.page = Number(route.query.page) || 1
        } else {
            state.value.page = 1
        }

        if (state.value.syncUrl) {
            router.push({
                query: {
                    ...route.query,
                    page: state.value.page,
                    perPage: state.value.perPage,
                    sort: state.value.sort,
                    search: state.value.search,
                    ...Object.fromEntries(
                        Object.entries(state.value.filter).map(
                            ([key, value]) => [
                                key,
                                Array.isArray(value) ? value.join(',') : value,
                            ]
                        )
                    ),
                },
            })
        }

        await fetchFromApi(append)
    }

    const loadMore = () => {
        if (state.value.loading) {
            return
        }

        if (!state.value.meta) {
            return
        }

        if (state.value.meta.current_page === state.value.meta.last_page) {
            return
        }

        load(state.value.meta.current_page! + 1, true)
    }

    /**
     * Mutate an item in the state.
     * @param id
     * @param data
     */
    const mutateStateItem = (
        id: string | number,
        data: Partial<T>,
        idKey?: string
    ) => {
        if (!idKey) {
            idKey = 'id'
        }

        const index = state.value.items.findIndex((item: T) => {
            if (!(idKey in item)) {
                throw new Error(
                    `Key ${idKey} not found in item ${JSON.stringify(item)}`
                )
            }
            return item[idKey as keyof typeof item] === id
        })

        if (index !== -1) {
            state.value.items[index] = {
                ...state.value.items[index],
                ...data,
            }
        }
    }

    const hasChanges = () => {
        const newHash = md5(
            JSON.stringify({
                sort: state.value.sort,
                search: state.value.search,
                filter: state.value.filter,
            })
        )

        // Compare with previous hash
        const changed = state.value.__hash !== newHash

        if (changed) {
            state.value.__hash = newHash
            state.value.__updated = new Date()
        }

        return changed
    }

    if (state.value.syncUrl) {
        const q = route.query

        if (q.sort && typeof q.sort === 'string') {
            state.value.sort = q.sort
        }

        if (q.search && typeof q.search === 'string') {
            state.value.search = q.search
        }

        // Build filter from all other query params except known keys
        const knownKeys = new Set(['page', 'perPage', 'sort', 'search'])
        const filter: Filter = {}

        Object.keys(q).forEach(key => {
            if (!knownKeys.has(key)) {
                const value = q[key]
                if (typeof value === 'string') {
                    filter[key] = value // string form for URL-based filter
                }
            }
        })

        state.value.filter = filter
    }

    watch(
        [
            () => state.value.sort,
            () => state.value.search,
            () => state.value.filter,
        ],
        () => {
            if (!hasChanges()) {
                return
            }

            if (state.value.page) {
                load(1)
            } else {
                loadAll()
            }
        }
    )

    const reset = () => {
        state.value.items = []
        state.value.error = null
        state.value.loading = false
        state.value.meta = undefined
        state.value.page = undefined
        state.value.perPage = options?.perPage || 10
        state.value.syncUrl = options?.syncUrl ?? true
        state.value.sort = options?.sort || ''
        state.value.search = undefined
        state.value.filter = {}
        state.value.__updated = new Date()
        state.value.__hash = undefined
        state.value.__ssr = options?.ssr ?? false
    }

    return {
        ...toRefs(state.value),
        state,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        setPerPage,
        setPage,
        setSearch,
        setFilter,
        setSort,
        setSyncUrl,
        setConfig,
        load,
        loadAll,
        loadMore,
        mutateStateItem,
        reset,
    }
}
