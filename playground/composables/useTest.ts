import * as z from 'zod'

type Test = {
    foo: string
}

type CreateTestForm = {
    foo: string
}

type UpdateTestForm = {
    bar: string
}

export const useTest = useLaravelCrudResource<
    Test,
    CreateTestForm,
    UpdateTestForm
>({
    config: {
        endpoint: '/api/tests',
        initialValues: {
            foo: 'Initial Foo Value',
        },
        schema: z.object({
            foo: z.string().min(1, 'Foo is required'),
        }),
    },
    create: {
        endpoint: '/api/tests/create',
        initialValues: {
            foo: 'Create Foo Value',
        },
        schema: z.object({
            foo: z.string().min(1, 'Foo is required'),
        }),
    },
    update: {
        endpoint: '/api/tests/update',
        initialValues: {
            bar: 'Update Bar Value',
        },
        schema: z.object({
            bar: z.string().min(1, 'Bar is required'),
        }),
    },
    show: {
        endpoint: '/api/tests/show',
    },
    index: {
        endpoint: '/api/tests/index',
    },
})
