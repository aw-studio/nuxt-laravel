import { describe, it, expect } from 'vitest'
import { urlEncodeObject } from '../src/runtime/utils/urlEncodeObject'
import { prepareQueryParams } from '../src/runtime/utils/prepareQueryParams'
import type { Filter, LaravelIndexState } from '../src/runtime/types'

/**
 * Cross-package contract tests.
 *
 * `@aw-studio/nuxt-laravel` and `aw-studio/laravel-model-index` are coupled ONLY
 * by the query string — no codegen, no shared schema. That means a change on
 * either side is invisible to the other until runtime, which is exactly how the
 * operator vocabularies drifted apart historically.
 *
 * The literal query strings asserted here are duplicated, deliberately, in the
 * backend's `tests/Feature/ContractTest.php`, which asserts that the same
 * strings parse into the expected conditions. If you change a literal here,
 * change it there too — that pairing is the contract.
 */

/**
 * Field names are deliberately those of the backend's `TestModel` fixture
 * (name, age, title, color) so both sides can assert the identical literal.
 */
const CASES: Array<{ name: string, filter: Filter, query: string }> = [
    {
        name: 'a scalar filter',
        filter: { name: 'John' },
        query: 'filter[name]=John',
    },
    {
        name: 'an operator filter',
        filter: { age: { $lte: 40 } },
        query: 'filter[age][$lte]=40',
    },
    {
        name: 'a case-insensitive operator',
        filter: { name: { $containsi: 'JOH' } },
        query: 'filter[name][$containsi]=JOH',
    },
    {
        name: 'an $in list',
        filter: { title: { $in: ['S', 'M'] } },
        query: 'filter[title][$in][0]=S&filter[title][$in][1]=M',
    },
    {
        name: 'a $between tuple',
        filter: { age: { $between: [18, 30] } },
        query: 'filter[age][$between][0]=18&filter[age][$between][1]=30',
    },
    {
        name: 'a null check',
        filter: { color: { $null: true } },
        query: 'filter[color][$null]=true',
    },
    {
        name: 'a not-null check',
        filter: { color: { $notNull: true } },
        query: 'filter[color][$notNull]=true',
    },
    {
        name: 'an $or group',
        filter: {
            $or: [{ name: { $contains: 'John' } }, { name: { $contains: 'Paul' } }],
        },
        query: 'filter[$or][0][name][$contains]=John&filter[$or][1][name][$contains]=Paul',
    },
    {
        name: 'a nested $and/$or group',
        filter: {
            $and: [
                { $or: [{ name: 'John' }, { name: 'Paul' }] },
                { age: { $gt: 30 } },
            ],
        } as unknown as Filter,
        query: 'filter[$and][0][$or][0][name]=John&filter[$and][0][$or][1][name]=Paul&filter[$and][1][age][$gt]=30',
    },
    {
        name: 'a boolean value',
        filter: { title: true },
        query: 'filter[title]=true',
    },
]

const decoded = (params: URLSearchParams) => decodeURIComponent(params.toString())

describe('urlEncodeObject — filter serialization', () => {
    it.each(CASES)('serializes $name', ({ filter, query }) => {
        expect(decoded(urlEncodeObject(filter, 'filter'))).toBe(query)
    })
})

const state = (o: Partial<LaravelIndexState<any>>): LaravelIndexState<any> =>
    ({
        items: [],
        error: null,
        loading: false,
        syncUrl: true,
        filter: {},
        __updated: new Date(0),
        __ssr: false,
        ...o,
    }) as LaravelIndexState<any>

describe('prepareQueryParams — full request shape', () => {
    it('emits every parameter the backend reads, in a stable order', () => {
        const params = prepareQueryParams(
            state({
                page: 2,
                perPage: 25,
                sort: '-created_at',
                search: 'foo',
                filter: { name: { $containsi: 'joh' } },
            })
        )

        expect(decoded(params)).toBe(
            'page=2&perPage=25&sort=-created_at&search=foo&filter[name][$containsi]=joh'
        )
    })

    it('emits nothing for an empty state', () => {
        expect(prepareQueryParams(state({})).toString()).toBe('')
    })

    it('omits an empty filter object rather than sending a bare key', () => {
        const params = prepareQueryParams(state({ page: 1, filter: {} }))

        expect(decoded(params)).toBe('page=1')
        expect(decoded(params)).not.toContain('filter')
    })

    it('supports a multi-column sort', () => {
        expect(decoded(prepareQueryParams(state({ sort: 'name,-age' })))).toBe(
            'sort=name,-age'
        )
    })

    // Characterization, not endorsement: these fields are written with a
    // truthiness check, so 0 is indistinguishable from "unset". A caller cannot
    // request page 0 (harmless — pages are 1-based) or perPage 0 (which the
    // backend would reject anyway).
    it('drops page and perPage when they are 0', () => {
        expect(prepareQueryParams(state({ page: 0, perPage: 0 })).toString()).toBe('')
    })

    it('drops an empty search string', () => {
        expect(prepareQueryParams(state({ search: '' })).toString()).toBe('')
    })
})

describe('operator vocabulary', () => {
    // Every operator the client's FilterOperatorOption union advertises must
    // exist on the backend. The backend now throws on unknown operators, so an
    // operator listed here and missing there is a runtime 500, not a silent
    // empty result. The matching backend test asserts the same list is accepted.
    const OPERATORS = [
        '$eq', '$eqi', '$ne', '$nei',
        '$lt', '$lte', '$gt', '$gte',
        '$in', '$notIn',
        '$contains', '$notContains', '$containsi', '$notContainsi',
        '$between',
        '$startsWith', '$endsWith',
        '$null', '$notNull',
    ]

    it.each(OPERATORS)('serializes %s under its field', op => {
        const query = decoded(urlEncodeObject({ field: { [op]: 'x' } }, 'filter'))

        expect(query).toBe(`filter[field][${op}]=x`)
    })

    it('covers exactly the documented operator set', () => {
        expect(OPERATORS).toHaveLength(19)
        expect(new Set(OPERATORS).size).toBe(OPERATORS.length)
    })
})
