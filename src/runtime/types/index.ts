import type { Ref, ToRefs } from 'vue'
import type { ZodObject, ZodRawShape } from 'zod'

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
    __ssr: boolean
}

export type LaravelIndexOptions = {
    perPage?: number
    syncUrl?: boolean
    sort?: string
    ssr?: boolean
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

export type Filter =
    | { [key: string]: FilterOperatorOption | string | number | boolean }
    | { $or: Filter[] }
    | { $and: Filter[] }

export type ModelResponse<T> = { data: T }

export type LaravelGetOptions = {
    query?: Record<string, any>
}

export type CrudParams<TForm> = {
    /**
     * The default endpoint for the model, used for CRUD operations.
     *
     * @var {string}
     * @example '/api/events'
     */
    endpoint: string

    /**
     * The Zod schema for the model, used for validation.
     *
     * @var {ZodObject<ZodRawShape>}
     * @example z.object({ name: z.string().min(1) })
     */
    schema: ZodObject<ZodRawShape>

    /**
     * The initial values for the form, used to populate the form fields.
     *
     * @var {TForm}
     * @example { name: '', active: boolean }
     */
    initialValues: TForm

    /**
     * Optional Zod schema for updating the model, used for validation.
     * If not provided, the main schema will be used.
     *
     * @var {ZodObject<ZodRawShape>}
     * @example z.object({ name: z.string().min(1) })
     */
    updateSchema?: ZodObject<ZodRawShape>

    onCreateSuccess?: (response: any) => void
    onUpdateSuccess?: (response: any) => void

    onCreateError?: (error: any) => void
    onUpdateError?: (error: any) => void
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
