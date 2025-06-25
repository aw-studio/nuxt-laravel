import { ofetch } from 'ofetch'
import { useRuntimeConfig, useCookie } from 'nuxt/app'
import type { ModuleOptions } from '~/src/module'

export const useLaravelApi = () => {
    const config = useRuntimeConfig().public.laravel as ModuleOptions

    const xsrfToken = useCookie('XSRF-TOKEN').value

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

    const get = async (url: string, options: any = {}) => {
        return await ofetch(getApiUrl(url), {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': xsrfToken || '',
            },
            credentials: 'include',
            ...options,
        })
    }
    const post = async (url: string, body: any, options: any = {}) => {
        return await ofetch(getApiUrl(url), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': xsrfToken || '',
            },
            body,
            credentials: 'include',
            ...options,
        })
    }
    const put = async (url: string, body: any, options: any = {}) => {
        return await ofetch(getApiUrl(url), {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': xsrfToken || '',
            },
            body,
            credentials: 'include',
            ...options,
        })
    }
    const destroy = async (url: string, options: any = {}) => {
        return await ofetch(getApiUrl(url), {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': xsrfToken || '',
            },
            credentials: 'include',
            ...options,
        })
    }

    // Create a test client with fetch for testing purposes
    const client = {
        get,
        post,
        put,
        delete: destroy,
    }

    return {
        getApiUrl,
        get,
        post,
        put,
        delete: destroy,
        client,
    }
}
