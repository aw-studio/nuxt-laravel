import type {
    CrudFormOperation,
    CrudOperation,
    CrudOptions,
    CrudOperationParams,
    LaravelGetOptions,
    LaravelIndexOptions,
    LaravelIndex,
} from '../types'
import { useLaravelIndex } from './useLaravelIndex'
import { useLaravelGet } from './useLaravelGet'
import { useLaravelForm, type LaravelForm } from './useLaravelForm'

/**
 * Compose index, get and form helpers into a single resource API.
 *
 * Every operation resolves to a URL and a verb:
 *
 *   index    GET    {urlPrefix}/{endpoint}
 *   show     GET    {urlPrefix}/{endpoint}/{id}
 *   create   POST   {urlPrefix}/{endpoint}
 *   update   PUT    {urlPrefix}/{endpoint}/{id}
 *   destroy  DELETE {urlPrefix}/{endpoint}/{id}
 *
 * Any operation can override the endpoint, and an override containing `:id`
 * has it substituted.
 */
export function useLaravelCrud<
    TModel extends Record<string, any>,
    TForm extends Record<string, any> = TModel
>(options: CrudOptions<TForm>) {
    const { endpoint, schema, initialValues, methods } = options

    const joinPaths = (...parts: (string | undefined)[]) =>
        '/' +
        parts
            .filter(Boolean)
            .join('/')
            .replace(/^\/+|\/+$/g, '')
            .replace(/\/+/g, '/')

    const operationConfig = (operation: CrudOperation) => options[operation]

    const buildEndpoint = (
        operation: CrudOperation,
        params: CrudOperationParams = {}
    ): string => {
        const { id, urlPrefix = options.urlPrefix } = params
        const override = operationConfig(operation)?.endpoint

        if (override) {
            if (override.includes(':id')) {
                if (id === undefined || id === null || id === '') {
                    throw new Error(
                        `Missing 'id' for operation endpoint: ${override}`
                    )
                }

                return joinPaths(urlPrefix, override.replace(':id', String(id)))
            }

            return joinPaths(urlPrefix, override)
        }

        if (!endpoint) {
            throw new Error(
                `No endpoint configured for "${operation}" and no default endpoint given`
            )
        }

        const needsId = operation === 'show'
            || operation === 'update'
            || operation === 'destroy'

        if (needsId && (id === undefined || id === null || id === '')) {
            throw new Error(`Missing 'id' for operation "${operation}"`)
        }

        return joinPaths(urlPrefix, endpoint, needsId ? String(id) : undefined)
    }

    /**
     * Per-operation config falls back to the resource-level config — except
     * for `destroy`, which sends no body. Inheriting the create/update schema
     * there would validate an empty payload against it and reject every
     * delete.
     */
    const resolve = (operation: CrudFormOperation) => {
        const config = options[operation]
        const inherits = operation !== 'destroy'

        return {
            schema: config?.schema ?? (inherits ? schema : undefined),
            initialValues:
                config?.initialValues ?? (inherits ? initialValues : undefined),
            onSuccess: config?.onSuccess ?? options.onSuccess,
            onError: config?.onError ?? options.onError,
        }
    }

    const form = (
        operation: CrudFormOperation,
        method: 'POST' | 'PUT' | 'DELETE',
        params: CrudOperationParams,
        values?: TForm
    ): LaravelForm<TForm> => {
        const { schema, initialValues, onSuccess, onError } = resolve(operation)

        return useLaravelForm<TForm>({
            initialValues: (values ?? initialValues ?? {}) as TForm,
            submitUrl: buildEndpoint(operation, params),
            schema,
            method,
            onSubmitSuccess: onSuccess,
            onSubmitError: onError,
        })
    }

    const index = (
        indexOptions?: LaravelIndexOptions,
        params: CrudOperationParams = {}
    ): LaravelIndex<TModel> =>
        useLaravelIndex<TModel>(
            buildEndpoint('index', params),
            indexOptions ?? options.index?.options
        )

    const show = (
        id: string | number,
        params: CrudOperationParams & { options?: LaravelGetOptions } = {}
    ) =>
        useLaravelGet<TModel>(
            buildEndpoint('show', { ...params, id }),
            params.options ?? options.show?.options
        )

    const create = (params: CrudOperationParams = {}) =>
        form('create', 'POST', params)

    const update = (
        model: TForm & { id: string | number },
        params: CrudOperationParams = {}
    ) => form('update', 'PUT', { ...params, id: model.id }, model)

    const destroy = (
        id: string | number,
        params: CrudOperationParams = {}
    ) => form('destroy', 'DELETE', { ...params, id })

    return {
        index,
        show,
        create,
        update,
        destroy,
        buildEndpoint,
        ...(methods ?? {}),
    }
}

export default useLaravelCrud
