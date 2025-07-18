import type { ZodObject, ZodRawShape } from 'zod'
import type { LaravelGetOptions, LaravelIndexOptions } from '../types'
import { useLaravelIndex } from './useLaravelIndex'
import { useLaravelGet } from './useLaravelGet'
import { useLaravelForm } from './useLaravelForm'

type CrudOperation = 'create' | 'update' | 'delete' | 'show' | 'index'

type CrudOperationConfig<TForm> = {
    endpoint?: string
    schema?: ZodObject<ZodRawShape>
    initialValues?: TForm
    onSuccess?: () => void
    onError?: (error: any) => void
}

type ShowConfig = {
    endpoint?: string
    options?: LaravelGetOptions
}

type IndexConfig = {
    endpoint?: string
    options?: LaravelIndexOptions
}

type CrudResourceConfig<TCreateForm, TUpdateForm, TDeleteForm> = {
    config: CrudOperationConfig<TCreateForm>
    create?: CrudOperationConfig<TCreateForm>
    update?: CrudOperationConfig<TUpdateForm>
    delete?: CrudOperationConfig<TDeleteForm>
    show?: ShowConfig
    index?: IndexConfig
    methods?: {
        [key: string]: (...args: any[]) => any
    }
}

type BuildEndpointParams = {
    id?: string | number
    urlPrefix?: string
}

type GetOperationConfigParams = {
    id?: string | number
    urlPrefix?: string
}

type CrudIndexParams = {
    urlPrefix?: string
}

type CrudShowParams = {
    options?: LaravelGetOptions
    urlPrefix?: string
}

type CrudCreateParams = {
    urlPrefix?: string
}

type CrudUpdateParams = {
    urlPrefix?: string
}

type CrudDeleteParams = {
    urlPrefix?: string
}

export function useLaravelCrudResource<
    TModel extends Record<string, any>,
    TCreateForm extends Record<string, any>,
    TUpdateForm extends Record<string, any> = TCreateForm,
    TDeleteForm extends Record<string, any> | null = null
>(config: CrudResourceConfig<TCreateForm, TUpdateForm, TDeleteForm>) {
    const buildEndpoint = (
        operation: CrudOperation,
        params: BuildEndpointParams
    ): string => {
        const { id, urlPrefix } = params
        const operationConfig = config[operation] as
            | CrudOperationConfig<any>
            | undefined

        const joinPaths = (...parts: (string | undefined)[]) =>
            parts.filter(Boolean).join('/').replace(/\/+/g, '/')

        if (operationConfig?.endpoint) {
            const endpoint = operationConfig.endpoint

            if (endpoint.includes(':id')) {
                if (!id) {
                    throw new Error(
                        `Missing 'id' for operation endpoint: ${endpoint}`
                    )
                }
                return joinPaths(urlPrefix, endpoint.replace(':id', String(id)))
            }

            return joinPaths(urlPrefix, endpoint)
        }

        const baseEndpoint = config.config.endpoint
        if (!baseEndpoint) {
            throw new Error(
                `No endpoint configured for ${operation} and no default endpoint in config`
            )
        }

        const needsId = ['update', 'show', 'delete'].includes(operation)
        if (needsId && !id) {
            throw new Error(`Missing 'id' for operation "${operation}"`)
        }

        return joinPaths(
            urlPrefix,
            baseEndpoint,
            needsId ? String(id) : undefined
        )
    }

    const getOperationConfig = <TForm>(
        operation: CrudOperation,
        params: GetOperationConfigParams
    ) => {
        const { id, urlPrefix } = params

        const operationConfig = config[operation] as
            | CrudOperationConfig<TForm>
            | undefined

        return {
            endpoint: buildEndpoint(operation, { id, urlPrefix }),
            schema: operationConfig?.schema ?? config.config.schema,
            initialValues:
                operationConfig?.initialValues ?? config.config.initialValues,
            onSuccess: operationConfig?.onSuccess ?? config.config.onSuccess,
            onError: operationConfig?.onError ?? config.config.onError,
        }
    }

    const index = (options?: LaravelIndexOptions, params?: CrudIndexParams) => {
        const indexOptions = options ?? config.index?.options
        return useLaravelIndex<TModel>(
            buildEndpoint('index', {
                urlPrefix: params?.urlPrefix,
            }),
            indexOptions
        )
    }

    const show = async (id: string | number, params?: CrudShowParams) => {
        const showOptions = params?.options ?? config.show?.options
        return useLaravelGet<TModel>(
            buildEndpoint('show', {
                id,
                urlPrefix: params?.urlPrefix,
            }),
            showOptions
        )
    }

    const create = (params?: CrudCreateParams) => {
        const { endpoint, schema, initialValues, onSuccess, onError } =
            getOperationConfig<TCreateForm>('create', {
                urlPrefix: params?.urlPrefix,
            })

        return useLaravelForm<TCreateForm>({
            initialValues: initialValues as TCreateForm,
            submitUrl: endpoint,
            schema: schema,
            method: 'POST',
            onSubmitSuccess: onSuccess,
            onSubmitError: onError,
        })
    }

    const update = (
        model: TUpdateForm & { id: string | number },
        params?: CrudUpdateParams
    ) => {
        const { endpoint, schema, onSuccess, onError } =
            getOperationConfig<TUpdateForm>('update', {
                id: model.id,
                urlPrefix: params?.urlPrefix,
            })

        return useLaravelForm<TUpdateForm>({
            initialValues: model,
            submitUrl: endpoint,
            schema: schema,
            method: 'PUT',
            onSubmitSuccess: onSuccess,
            onSubmitError: onError,
        })
    }

    const destroy = (id: string | number, params?: CrudDeleteParams) => {
        const operationConfig = config.delete
        const endpoint = buildEndpoint('delete', {
            id,
            urlPrefix: params?.urlPrefix,
        })

        // @ts-expect-error: TDeleteForm can be null, but we need to ensure it is a Record<string, any> for useLaravelForm
        return useLaravelForm<TDeleteForm>({
            initialValues:
                operationConfig?.initialValues ?? ({} as TDeleteForm),
            submitUrl: endpoint,
            method: 'DELETE',
            schema: operationConfig?.schema,
            onSubmitSuccess:
                operationConfig?.onSuccess ?? config.config.onSuccess,
            onSubmitError: operationConfig?.onError ?? config.config.onError,
        })
    }

    return {
        show,
        index,
        create,
        update,
        destroy,
        ...config.methods,
    }
}

export default useLaravelCrudResource
