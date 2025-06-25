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
