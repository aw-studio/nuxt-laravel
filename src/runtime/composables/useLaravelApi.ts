import { useCookie, useNuxtApp } from 'nuxt/app'
import type { ofetch } from 'ofetch'
import { useLaravelConfig } from '#imports'

export const useLaravelApi = () => {
    const config = useLaravelConfig()

    const getApiUrl = (url: string): string => {
        if (!url.startsWith('/')) {
            url = `/${url}`
        }
        let apiBase = config.baseUrl

        if (!apiBase) {
            throw new Error(
                'API base URL is not defined in the runtime config.'
            )
        }
        if (apiBase.endsWith('/')) {
            apiBase = apiBase.slice(0, -1) // Remove trailing slash if exists
        }
        return `${apiBase}${url}`
    }

    const makeRequest = async (url: string, options: any = {}) => {
        const xsrfToken = useCookie('XSRF-TOKEN').value

        const fetch =
            typeof useNuxtApp().$apiFetch === 'function'
                ? (useNuxtApp().$apiFetch as typeof ofetch)
                : ($fetch as typeof ofetch)

        return await fetch(getApiUrl(url), {
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': xsrfToken || '',
            },
            credentials: 'include',
            ...options,
        })
    }

    const get = async (url: string, options: any = {}) => {
        return makeRequest(url, {
            ...options,
            method: 'GET',
        })
    }
    const post = async (url: string, body: any, options: any = {}) => {
        return makeRequest(url, {
            ...options,
            method: 'POST',
            body,
        })
    }
    const put = async (url: string, body: any, options: any = {}) => {
        return makeRequest(url, {
            ...options,
            method: 'PUT',
            body,
        })
    }
    const patch = async (url: string, body: any, options: any = {}) => {
        return makeRequest(url, {
            ...options,
            method: 'PATCH',
            body,
        })
    }
    const destroy = async (url: string, body: any, options: any = {}) => {
        return makeRequest(url, {
            ...options,
            method: 'DELETE',
            body,
        })
    }

    // Create a test client with fetch for testing purposes
    const client = {
        get,
        post,
        put,
        patch,
        destroy,
    }

    return {
        getApiUrl,
        get,
        post,
        put,
        patch,
        destroy,
        makeRequest,
        client,
    }
}
