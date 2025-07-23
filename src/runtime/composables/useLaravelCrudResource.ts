import type { ZodObject, ZodRawShape } from 'zod'
import type {
    LaravelGetOptions,
    LaravelIndexOptions,
    LaravelIndex,
} from '../types'
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

type WithUrlPrefix = {
    urlPrefix?: string
}

type BuildEndpointParams = WithUrlPrefix & {
    id?: string | number
}

type GetOperationConfigParams = WithUrlPrefix & {
    id?: string | number
}

type CrudIndexParams = WithUrlPrefix

type CrudCreateParams = WithUrlPrefix

type CrudUpdateParams = WithUrlPrefix

type CrudDeleteParams = WithUrlPrefix

type CrudShowParams = WithUrlPrefix & {
    options?: LaravelGetOptions
}

type CrudFormTypes<
    TCreate extends Record<string, any>,
    TUpdate = TCreate,
    TDelete = object
> = {
    create: TCreate
    update?: TUpdate
    delete?: TDelete
}

type CrudReturnTypes<
    TIndexModel,
    TShow = TIndexModel,
    TUpdate = TIndexModel
> = {
    index: TIndexModel
    show?: TShow
    update?: TUpdate
}

type ExtractFormType<
    TForms,
    K extends keyof CrudFormTypes<any, any, any>,
    TCreateFallback
> = K extends keyof TForms
    ? NonNullable<TForms[K]> extends Record<string, any>
        ? NonNullable<TForms[K]>
        : object
    : TCreateFallback

type ExtractReturnType<
    TReturns extends { index: any },
    K extends keyof any
> = K extends keyof TReturns ? NonNullable<TReturns[K]> : TReturns['index']

type CrudResourceConfig<TCreate, TUpdate, TDelete> = {
    config: CrudOperationConfig<TCreate>
    create?: CrudOperationConfig<TCreate>
    update?: CrudOperationConfig<TUpdate>
    delete?: CrudOperationConfig<TDelete>
    show?: ShowConfig
    index?: IndexConfig
    methods?: {
        [key: string]: (...args: any[]) => any
    }
}

export function useLaravelCrudResource<
    TReturns extends CrudReturnTypes<any>,
    TForms extends CrudFormTypes<any>
>(
    config: CrudResourceConfig<
        TForms['create'],
        ExtractFormType<TForms, 'update', TForms['create']>,
        ExtractFormType<TForms, 'delete', null>
    >
) {
    type TModel = TReturns['index']
    type TCreateForm = TForms['create']
    type TUpdateForm = ExtractFormType<TForms, 'update', TCreateForm>
    type TDeleteForm = ExtractFormType<TForms, 'delete', null>

    type TShowModel = ExtractReturnType<TReturns, 'show'>

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

    const index = (
        options?: LaravelIndexOptions,
        params?: CrudIndexParams
    ): LaravelIndex<TModel> => {
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
        return useLaravelGet<TShowModel>(
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

        // @ts-expect-error: Type 'TDeleteForm' is not assignable to type 'Record<string, any>'.
        return useLaravelForm<TDeleteForm>({
            initialValues:
                operationConfig?.initialValues ??
                ({} as unknown as TDeleteForm),
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
