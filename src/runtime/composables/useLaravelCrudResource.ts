import type { LaravelGetOptions, LaravelIndexOptions } from '../types'
import { useLaravelIndex } from './useLaravelIndex'
import { useLaravelGet } from './useLaravelGet'
import { useLaravelForm } from './useLaravelForm'
import { ZodObject, ZodRawShape } from 'zod'

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

export function useLaravelCrudResource<
    TModel extends Record<string, any>,
    TCreateForm extends Record<string, any>,
    TUpdateForm extends Record<string, any> = TCreateForm,
    TDeleteForm extends Record<string, any> = null
>(config: CrudResourceConfig<TCreateForm, TUpdateForm, TDeleteForm>) {
    const buildEndpoint = (
        operation: CrudOperation,
        id?: string | number
    ): string => {
        const operationConfig = config[operation] as
            | CrudOperationConfig<any>
            | undefined

        if (operationConfig?.endpoint) {
            if (id) {
                return operationConfig.endpoint.replace(':id', String(id))
            }
            return operationConfig.endpoint
        }

        if (!config.config.endpoint) {
            throw new Error(
                `No endpoint configured for ${operation} and no default endpoint in config`
            )
        }

        const baseEndpoint = config.config.endpoint
        if (['update', 'show', 'delete'].includes(operation)) {
            return `${baseEndpoint}/${id}`
        }
        return baseEndpoint
    }

    const show = async (id: string, options?: LaravelGetOptions) => {
        const showOptions = options ?? config.show?.options
        return useLaravelGet<TModel>(buildEndpoint('show', id), showOptions)
    }

    const index = (options?: LaravelIndexOptions) => {
        const indexOptions = options ?? config.index?.options
        return useLaravelIndex<TModel>(buildEndpoint('index'), indexOptions)
    }

    const getOperationConfig = <TForm>(operation: CrudOperation, id?: any) => {
        const operationConfig = config[operation] as
            | CrudOperationConfig<TForm>
            | undefined

        return {
            endpoint: buildEndpoint(operation, id),
            schema: operationConfig?.schema ?? config.config.schema,
            initialValues:
                operationConfig?.initialValues ?? config.config.initialValues,
            onSuccess: operationConfig?.onSuccess ?? config.config.onSuccess,
            onError: operationConfig?.onError ?? config.config.onError,
        }
    }
    const create = () => {
        const { endpoint, schema, initialValues, onSuccess, onError } =
            getOperationConfig<TCreateForm>('create')

        return useLaravelForm<TCreateForm>({
            initialValues,
            submitUrl: endpoint,
            schema: schema,
            method: 'POST',
            onSubmitSuccess: onSuccess,
            onSubmitError: onError,
        })
    }

    const update = (model: TUpdateForm & { id: string | number }) => {
        const { endpoint, schema, onSuccess, onError } =
            getOperationConfig<TUpdateForm>('update', model.id)

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
        const endpoint = buildEndpoint('delete', id)

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
