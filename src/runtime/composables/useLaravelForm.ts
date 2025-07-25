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

    const fields = reactive({} as TForm)
    const fieldProps = reactive({}) as FieldProps<TForm>
    const fieldMeta = reactive({}) as FieldMetaMap<TForm>

    for (const key of Object.keys(initialValues) as (keyof TForm)[]) {
        const [field, props] = defineField(key as string)
        const { meta } = useField(() => key as string)
        // @ts-expect-error: Type 'keyof TForm' cannot be used to index type 'Reactive<{ [K in keyof TForm]: Ref<TForm[K], TForm[K]>; }>'.ts(2536)
        fields[key] = field
        // @ts-expect-error: Property 'validateOnValueUpdate' is missing in type 'Ref<BaseFieldProps & GenericObject, BaseFieldProps & GenericObject>' but required in type 'FieldOptions<TForm[keyof TForm]>'
        fieldProps[key] = props
        // @ts-expect-error: Type 'FieldMeta<unknown>' is not assignable to type 'FieldMeta<TForm[keyof TForm]>'. Type 'unknown' is not assignable to type 'TForm[keyof TForm]'. 'unknown' is assignable to the constraint of type 'TForm[keyof TForm]', but 'TForm[keyof TForm]' could be instantiated with a different subtype of constraint 'any'.
        fieldMeta[key] = meta
    }

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
