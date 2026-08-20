import type { Ref, ToRefs } from 'vue'
import type { ZodObject, ZodRawShape } from 'zod'

export type ModuleOptions = {
    /** Base URL of the Laravel API, e.g. https://api.example.com */
    baseUrl: string
}

export type LaravelResponseMeta = {
    total: number
    per_page: number
    current_page: number
    last_page: number
    from: number
    to: number
}

export type LaravelResponseLinks = {
    first: string
    last: string
    prev: string | null
    next: string | null
}

export type IndexResponse<T> = {
    data: T[]
    meta?: LaravelResponseMeta
    links?: LaravelResponseLinks
}

export type LaravelIndexState<T> = {
    items: T[]
    error: {
        message: string
        errors: { [key: string]: string[] }
    } | null
    loading: boolean
    meta?: LaravelResponseMeta
    page?: number
    perPage?: number
    syncUrl: boolean
    sort?: string
    search?: string
    filter: Filter
    __updated: Date
    __hash?: string
}

export type LaravelIndexOptions = {
    perPage?: number
    syncUrl?: boolean
    sort?: string
    key?: string
    /**
     * How URL sync writes to browser history.
     *
     * `replace` (the default) keeps a filter change or page step out of the
     * history stack, so the back button leaves the list rather than walking
     * back through every intermediate state. Use `push` when each page should
     * be a separate history entry.
     */
    historyMode?: 'replace' | 'push'
    /**
     * Restrict which query-string keys are hydrated into `filter` on init.
     *
     * When set, only these keys are read from the URL (any other query params
     * are ignored). This prevents cross-page filter leakage, e.g. a `?is_active=1`
     * left in the URL by one index being sent as a filter by an unrelated index
     * whose backend allowlist rejects it.
     *
     * When omitted, every unknown query param is treated as a filter (the
     * original, unchanged behavior).
     *
     * @example ['is_active', 'name']
     */
    urlFilters?: string[]
    onError?: (error: any) => void
    onSuccess?: (response: IndexResponse<any>) => void
}

export type LaravelIndex<T> = ToRefs<LaravelIndexState<T>> & {
    state: Ref<LaravelIndexState<T>>
    hasNextPage: Ref<boolean>
    hasPrevPage: Ref<boolean>
    nextPage: () => void
    prevPage: () => void
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    setSearch: (search: string) => void
    setFilter: (filter: Filter) => void
    setSort: (sort: string) => void
    setSyncUrl: (syncUrl: boolean) => void
    setConfig: (config: LaravelIndexOptions) => void
    load: (page?: number, append?: boolean) => Promise<void>
    loadAll: () => Promise<void>
    loadMore: () => void
    mutateStateItem: (id: string | number, data: Partial<T>) => void
    reset: () => void
}

export type FilterOperatorOption =
    | { $eq: string | number | boolean | null }
    | { $eqi: string | number | boolean | null }
    | { $ne: string | number | boolean | null }
    | { $nei: string | number | boolean | null }
    | { $lt: string | number }
    | { $lte: string | number }
    | { $gt: string | number }
    | { $gte: string | number }
    | { $in: (string | number)[] }
    | { $notIn: (string | number)[] }
    | { $contains: string | number }
    | { $notContains: string | number }
    | { $containsi: string | number }
    | { $notContainsi: string | number }
    | { $between: [string | number, string | number] }
    | { $startsWith: string | number }
    | { $endsWith: string | number }
    | { $null: boolean }
    | { $notNull: boolean }

export type FilterValue =
    | FilterOperatorOption
    | string
    | number
    | boolean
    | null

/**
 * A filter object.
 *
 * `$and` / `$or` are optional keys rather than separate union members, so
 * `filter.completed` typechecks. As a union, any property access failed
 * because the `$or` branch had no such key.
 */
export type Filter = {
    $and?: Filter[]
    $or?: Filter[]
} & {
    [key: string]: FilterValue | Filter[] | undefined
}

export type ModelResponse<T> = { data: T }

export type LaravelGetOptions = {
    query?: Record<string, any>
}

export type CrudOperation = 'index' | 'show' | 'create' | 'update' | 'destroy'

/** The operations that submit a form, and therefore carry a schema. */
export type CrudFormOperation = 'create' | 'update' | 'destroy'

export type CrudOperationParams = {
    /** Path segment prefixed to the resolved endpoint, e.g. `/admin`. */
    urlPrefix?: string
    id?: string | number
}

export type CrudOperationConfig<TForm> = {
    /**
     * Overrides the endpoint for this operation. `:id` is substituted when
     * present, so `/api/products/:id/publish` works.
     */
    endpoint?: string
    schema?: ZodObject<ZodRawShape>
    initialValues?: TForm
    onSuccess?: (response: any) => void
    onError?: (error: any) => void
}

export type CrudOptions<TForm extends Record<string, any>> = {
    /**
     * The resource endpoint, e.g. `/api/products`. Member operations append
     * the id. Optional only if every operation overrides it.
     */
    endpoint?: string

    /** Zod schema used to validate the create and update forms. */
    schema?: ZodObject<ZodRawShape>

    /** Initial values for the create form. */
    initialValues?: TForm

    /** Prefix applied to every operation unless overridden per call. */
    urlPrefix?: string

    onSuccess?: (response: any) => void
    onError?: (error: any) => void

    index?: { endpoint?: string, options?: LaravelIndexOptions }
    show?: { endpoint?: string, options?: LaravelGetOptions }
    create?: CrudOperationConfig<TForm>
    update?: CrudOperationConfig<TForm>
    destroy?: CrudOperationConfig<TForm>

    /** Extra methods merged into the returned object. */
    methods?: Record<string, (...args: any[]) => any>
}

export type LaravelFormOptions<TForm extends Record<string, any>> = {
    initialValues: TForm
    submitUrl: string
    schema: ZodObject<ZodRawShape> | undefined
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    onSubmitSuccess?: (response: any) => void
    onSubmitError?: (error: any) => void
}

export type ErrorBag = {
    [key: string]: string | string[]
}
export type ValidationError = {
    errors: ErrorBag
}

export type ExceptionError = {
    exception: string
    file: string
    line: number
    message: string
}
export type FormError = {
    response: {
        data?: ValidationError | ExceptionError
        _data?: ValidationError | ExceptionError
        ok: boolean
        status: number
        statusText: string
        url: string
    }
}

export type SanctumOptions = {
    /** Route that sets the XSRF-TOKEN cookie. */
    csrfEndpoint?: string
    loginEndpoint?: string
    logoutEndpoint?: string
    /** Route returning the authenticated user. */
    userEndpoint?: string
    /**
     * State key holding the user. Override to run more than one guard side by
     * side, e.g. a staff guard and a separate member guard.
     */
    key?: string
}

export type SanctumCredentials = {
    email?: string
    password?: string
    remember?: boolean
    [key: string]: unknown
}
