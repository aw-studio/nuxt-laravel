import type { LaravelIndexState } from '../types'
import { urlEncodeObject } from './urlEncodeObject'

export const prepareQueryParams = (
    state: LaravelIndexState<any>
): URLSearchParams => {
    const params = new URLSearchParams()
    const { page, sort, search, filter, perPage, cursor } = state

    // A cursor and a page number are mutually exclusive: the backend's
    // cursorPaginate() reads `cursor` and ignores `page`.
    if (cursor) {
        params.append('cursor', cursor)
    } else if (page) {
        params.append('page', String(page))
    }
    if (perPage) {
        params.append('perPage', String(perPage))
    }
    if (sort) {
        params.append('sort', sort!)
    }
    if (search) {
        params.append('search', search!)
    }
    if (Object.keys(filter).length > 0) {
        const filterParams = urlEncodeObject(filter, 'filter')
        filterParams.forEach((value, key) => {
            params.append(key, value)
        })
    }

    return params
}
