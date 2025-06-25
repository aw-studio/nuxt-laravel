import type { ZodObject, ZodRawShape } from 'zod'
import { useLaravelIndex } from './useLaravelIndex'
import { useLaravelShow } from './useLaravelShow'
import { useLaravelForm } from './useLaravelForm'

type CrudParams<TForm> = {
    /**
     * The default endpoint for the model, used for CRUD operations.
     *
     * @var {string}
     * @example '/api/events'
     */
    endpoint: string

    /**
     * The Zod schema for the model, used for validation.
     *
     * @var {ZodObject<ZodRawShape>}
     * @example z.object({ name: z.string().min(1) })
     */
    schema: ZodObject<ZodRawShape>

    /**
     * The initial values for the form, used to populate the form fields.
     *
     * @var {TForm}
     * @example { name: '', active: boolean }
     */
    initialValues: TForm

    /**
     * Optional Zod schema for updating the model, used for validation.
     * If not provided, the main schema will be used.
     *
     * @var {ZodObject<ZodRawShape>}
     * @example z.object({ name: z.string().min(1) })
     */
    updateSchema?: ZodObject<ZodRawShape>
}

export function useLaravelCrud<
    TModel extends Record<string, any>,
    TForm extends Record<string, any>
>(params: CrudParams<TForm>) {
    const { endpoint, schema, initialValues, updateSchema } = params

    const show = async (id: string, showEndpoint?: string) =>
        useLaravelShow<TModel>(`${showEndpoint || endpoint}/${id}`)
    const index = (options?: any, indexEndpoint?: string) =>
        useLaravelIndex<TModel>(indexEndpoint || endpoint, options)

    const create = (createEndpoint?: string) =>
        useLaravelForm<TForm>({
            initialValues,
            submitUrl: createEndpoint || endpoint,
            schema,
            method: 'POST',
        })

    const update = (model: TForm, updateEndpoint?: string) =>
        useLaravelForm<TForm>({
            initialValues: model,
            submitUrl: `${updateEndpoint || endpoint}/${model.id}`,
            schema: updateSchema || schema,
            method: 'PUT',
        })

    return {
        show,
        index,
        create,
        update,
    }
}

export default useLaravelCrud
