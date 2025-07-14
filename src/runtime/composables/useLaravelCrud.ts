import type { CrudParams } from '../types'
import { useLaravelIndex } from './useLaravelIndex'
import { useLaravelGet } from './useLaravelGet'
import { useLaravelForm } from './useLaravelForm'

export function useLaravelCrud<
    TModel extends Record<string, any>,
    TForm extends Record<string, any>
>(params: CrudParams<TForm>) {
    const {
        endpoint,
        schema,
        initialValues,
        updateSchema,
        onCreateSuccess,
        onCreateError,
        onUpdateSuccess,
        onUpdateError,
    } = params

    const show = async (id: string, showEndpoint?: string) =>
        useLaravelGet<TModel>(showEndpoint || `${endpoint}/${id}`)
    const index = (options?: any, indexEndpoint?: string) =>
        useLaravelIndex<TModel>(indexEndpoint || endpoint, options)

    const create = (createEndpoint?: string) =>
        useLaravelForm<TForm>({
            initialValues,
            submitUrl: createEndpoint || endpoint,
            schema,
            method: 'POST',
            onSubmitSuccess: onCreateSuccess,
            onSubmitError: onCreateError,
        })

    const update = (model: TForm, updateEndpoint?: string) =>
        useLaravelForm<TForm>({
            initialValues: model,
            submitUrl: updateEndpoint || `${endpoint}/${model.id}`,
            schema: updateSchema || schema,
            method: 'PUT',
            onSubmitSuccess: onUpdateSuccess,
            onSubmitError: onUpdateError,
        })

    const destroy = (model: TForm, destroyEndpoint?: string) =>
        useLaravelForm<TForm>({
            initialValues: model,
            submitUrl: destroyEndpoint || `${endpoint}/${model.id}`,
            schema: updateSchema || schema,
            method: 'DELETE',
            onSubmitSuccess: onUpdateSuccess,
            onSubmitError: onUpdateError,
        })

    return {
        show,
        index,
        create,
        update,
        destroy,
    }
}

export default useLaravelCrud
