import { describe, it, expect } from 'vitest'
import { buildFilterFromQuery } from '../src/runtime/utils/buildFilterFromQuery'

describe('buildFilterFromQuery', () => {
    it('hydrates every unknown query param when no allowlist is given (legacy behavior)', () => {
        const filter = buildFilterFromQuery({
            is_active: '1',
            name: 'foo',
        })

        expect(filter).toEqual({ is_active: '1', name: 'foo' })
    })

    it('never hydrates reserved pagination/sort/search keys', () => {
        const filter = buildFilterFromQuery({
            page: '2',
            perPage: '25',
            sort: '-created_at',
            search: 'bar',
            is_active: '1',
        })

        expect(filter).toEqual({ is_active: '1' })
    })

    it('ignores non-string values', () => {
        const filter = buildFilterFromQuery({
            tags: ['a', 'b'], // array query param
            empty: null,
            name: 'foo',
        })

        expect(filter).toEqual({ name: 'foo' })
    })

    it('only hydrates allowlisted keys when urlFilters is set', () => {
        const filter = buildFilterFromQuery(
            { is_active: '1', name: 'foo' },
            ['name']
        )

        expect(filter).toEqual({ name: 'foo' })
    })

    it('prevents cross-page filter leakage', () => {
        // A vehicles index left `?is_active=1` in the URL. The vehicle-groups
        // index only allows `name`, so the stale `is_active` must not leak into
        // its request (the backend filter allowlist would otherwise throw).
        const filter = buildFilterFromQuery(
            { is_active: '1', name: 'service-team' },
            ['name']
        )

        expect(filter).not.toHaveProperty('is_active')
        expect(filter).toEqual({ name: 'service-team' })
    })

    it('hydrates nothing when the allowlist is empty', () => {
        const filter = buildFilterFromQuery({ is_active: '1', name: 'foo' }, [])

        expect(filter).toEqual({})
    })
})
