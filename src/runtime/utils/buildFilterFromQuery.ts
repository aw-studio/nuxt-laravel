import type { Filter } from '../types'

/**
 * Query-string keys that are reserved by `useLaravelIndex` for pagination,
 * sorting and search. They are never hydrated into the filter object.
 */
export const KNOWN_INDEX_QUERY_KEYS = new Set([
    'page',
    'perPage',
    'sort',
    'search',
])

/**
 * Build the `filter` object from a route query.
 *
 * @param query The route query (e.g. `route.query`).
 * @param urlFilters Optional allowlist of keys that may be hydrated from the
 * URL. When provided, only these keys are read; when omitted, every unknown
 * (non-reserved) string query param is treated as a filter.
 */
export const buildFilterFromQuery = (
    query: Record<string, unknown>,
    urlFilters?: string[]
): Filter => {
    const filter: Filter = {}
    const allowed = urlFilters ? new Set(urlFilters) : undefined

    Object.keys(query).forEach(key => {
        if (KNOWN_INDEX_QUERY_KEYS.has(key)) {
            return
        }

        // When an allowlist is configured, ignore everything outside it.
        // This prevents cross-page filter leakage from stale query params.
        if (allowed && !allowed.has(key)) {
            return
        }

        const value = query[key]
        if (typeof value === 'string') {
            filter[key] = value // string form for URL-based filter
        }
    })

    return filter
}
