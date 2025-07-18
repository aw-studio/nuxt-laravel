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
    operation: CrudOperation
    id?: string | number
    urlPrefix?: string
}

type GetOperationConfigParams = {
    operation: CrudOperation
    id?: string | number
    urlPrefix?: string
}

type CrudIndexParams = {
    urlPrefix?: string
    options?: LaravelIndexOptions
}

type CrudShowParams = {
    id: string | number
    options?: LaravelGetOptions
    urlPrefix?: string
}

type CrudCreateParams = {
    urlPrefix?: string
}

export function useLaravelCrudResource<
    TModel extends Record<string, any>,
    TCreateForm extends Record<string, any>,
    TUpdateForm extends Record<string, any> = TCreateForm,
    TDeleteForm extends Record<string, any> | null = null
>(config: CrudResourceConfig<TCreateForm, TUpdateForm, TDeleteForm>) {
    const buildEndpoint = (params: BuildEndpointParams): string => {
        const operationConfig = config[params.operation] as
            | CrudOperationConfig<any>
            | undefined

        if (params.urlPrefix) {
            return `${params.urlPrefix}/${
                operationConfig?.endpoint ?? ''
            }`.replace(/\/+/g, '/')
        }

        if (operationConfig?.endpoint) {
            if (params.id) {
                return operationConfig.endpoint.replace(
                    ':id',
                    String(params.id)
                )
            }
            return operationConfig.endpoint
        }

        if (!config.config.endpoint) {
            throw new Error(
                `No endpoint configured for ${params.operation} and no default endpoint in config`
            )
        }

        const baseEndpoint = config.config.endpoint
        if (['update', 'show', 'delete'].includes(params.operation)) {
            return `${baseEndpoint}/${params.id}`
        }
        return baseEndpoint
    }

    const getOperationConfig = <TForm>(params: GetOperationConfigParams) => {
        const { operation, id, urlPrefix } = params

        const operationConfig = config[operation] as
            | CrudOperationConfig<TForm>
            | undefined

        return {
            endpoint: buildEndpoint({ operation, id, urlPrefix }),
            schema: operationConfig?.schema ?? config.config.schema,
            initialValues:
                operationConfig?.initialValues ?? config.config.initialValues,
            onSuccess: operationConfig?.onSuccess ?? config.config.onSuccess,
            onError: operationConfig?.onError ?? config.config.onError,
        }
    }

    const index = (params: CrudIndexParams) => {
        const indexOptions = params.options ?? config.index?.options
        return useLaravelIndex<TModel>(
            buildEndpoint({
                operation: 'index',
                urlPrefix: params.urlPrefix,
            }),
            indexOptions
        )
    }

    const show = async (params: CrudShowParams) => {
        const showOptions = params.options ?? config.show?.options
        return useLaravelGet<TModel>(
            buildEndpoint({
                operation: 'show',
                id: params.id,
                urlPrefix: params.urlPrefix,
            }),
            showOptions
        )
    }

    const create = (params: CrudCreateParams) => {
        const { endpoint, schema, initialValues, onSuccess, onError } =
            getOperationConfig<TCreateForm>({
                operation: 'create',
                urlPrefix: params.urlPrefix,
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

    const update = (model: TUpdateForm & { id: string | number }) => {
        const { endpoint, schema, onSuccess, onError } =
            getOperationConfig<TUpdateForm>({
                operation: 'update',
                id: model.id,
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

    const destroy = (id: string | number) => {
        const operationConfig = config.delete
        const endpoint = buildEndpoint({
            operation: 'delete',
            id,
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
