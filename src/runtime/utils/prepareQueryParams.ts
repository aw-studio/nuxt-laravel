import type { LaravelIndexState } from '../types'
import { urlEncodeObject } from './urlEncodeObject'

export const prepareQueryParams = (
    state: LaravelIndexState<any>
): URLSearchParams => {
    const params = new URLSearchParams()
    const { page, sort, search, filter, perPage } = state

    if (page) {
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
