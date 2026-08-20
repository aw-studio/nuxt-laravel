import {
    useForm,
    useField,
    type FieldMeta,
    type FieldOptions,
    type InvalidSubmissionContext,
} from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { reactive } from 'vue'
import type { ErrorBag, FormError, LaravelFormOptions } from '../types'
import { useLaravelApi } from './useLaravelApi'

export type FieldProps<T> = { [K in keyof T]: FieldOptions<T[K]> }
export type FieldMetaMap<T> = { [K in keyof T]: FieldMeta<T[K]> }

export type LaravelForm<TForm extends Record<string, any>> = ReturnType<
    typeof useForm<TForm>
> & {
    fields: TForm
    fieldProps: FieldProps<TForm>
    fieldMeta: FieldMetaMap<TForm>
    submit: () => Promise<any>
}

export function useLaravelForm<TForm extends Record<string, any>>(
    options: LaravelFormOptions<TForm>
): LaravelForm<TForm> {
    const {
        initialValues,
        submitUrl,
        schema,
        method = 'POST',
        onSubmitSuccess,
        onSubmitError,
    } = options

    const formSchema = schema ? toTypedSchema(schema) : undefined

    const form = useForm({
        name: `${submitUrl}__${method.toLowerCase()}`,
        validationSchema: formSchema,
        initialValues,
    })

    const { values, setFieldError, defineField, handleSubmit } = form

    // Built as plain records and asserted once at the end. Writing into a
    // mapped type key-by-key is what forced three suppressions here: TS cannot
    // know that `fields[key]` and the value produced for `key` line up, because
    // the loop erases the correlation between them.
    const fieldAccumulator: Record<string, unknown> = {}
    const fieldPropsAccumulator: Record<string, unknown> = {}
    const fieldMetaAccumulator: Record<string, unknown> = {}

    for (const key of Object.keys(initialValues)) {
        const [field, props] = defineField(key)
        const { meta } = useField(() => key)

        fieldAccumulator[key] = field
        fieldPropsAccumulator[key] = props
        fieldMetaAccumulator[key] = meta
    }

    const fields = reactive(fieldAccumulator) as TForm
    const fieldProps = reactive(fieldPropsAccumulator) as FieldProps<TForm>
    const fieldMeta = reactive(fieldMetaAccumulator) as FieldMetaMap<TForm>

    const submit = handleSubmit(
        async () => {
            const { post, put, patch, destroy } = useLaravelApi()

            try {
                let response
                if (method === 'POST') {
                    response = await post(submitUrl, values)
                } else if (method === 'PUT') {
                    response = await put(submitUrl, values)
                } else if (method === 'PATCH') {
                    response = await patch(submitUrl, values)
                } else if (method === 'DELETE') {
                    response = await destroy(submitUrl, values)
                } else {
                    throw new Error(`Unsupported method: ${method}`)
                }

                if (onSubmitSuccess) {
                    onSubmitSuccess(response)
                }
                return response
            } catch (error: any) {
                if (onSubmitError) {
                    onSubmitError(error as FormError)
                }

                /**
                 * Handle validation errors
                 */
                if (
                    error.response?.data?.errors ||
                    error.response?._data?.errors
                ) {
                    const validationError: ErrorBag =
                        error.response.data?.errors ||
                        error.response._data?.errors

                    for (const field in validationError) {
                        const errorMessages = validationError[field]

                        if (Array.isArray(errorMessages)) {
                            errorMessages.forEach(message => {
                                // If it's an array, set each error message for the field
                                setFieldError(field, message)
                            })
                        } else {
                            // If it's not an array, set it directly
                            setFieldError(field, errorMessages)
                        }
                    }
                }

                throw error
            }
        },
        (context: InvalidSubmissionContext) => {
            throw context
        }
    )

    return {
        ...(form as ReturnType<typeof useForm<TForm>>),
        fields,
        fieldProps,
        fieldMeta,
        submit,
    } as LaravelForm<TForm>
}
