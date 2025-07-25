import * as z from 'zod'

type TestIndexResource = {
    foo: string
}

type TestShowResource = {
    bar: string
}

type CreateTestForm = {
    foo: string
    bar: {
        baz: boolean
    }
}

type UpdateTestForm = {
    bar: string
}

type DeleteTestForm = {
    baz: string
}

export const createTest = useLaravelForm<CreateTestForm>({
    schema: z.object({
        foo: z.string().min(1, 'Foo is required'),
        bar: z.object({
            baz: z.boolean(),
        }),
    }),
    initialValues: {
        foo: 'Initial Foo Value',
        bar: {
            baz: true,
        },
    },
    submitUrl: '/tests/create',
    method: 'POST',
})

export const useTest = useLaravelCrudResource<
    {
        index: TestIndexResource
        show: TestShowResource
    },
    {
        create: CreateTestForm
        update: UpdateTestForm
        delete: DeleteTestForm
    }
>({
    config: {
        endpoint: '/tests',
        initialValues: {
            foo: 'Initial Foo Value',
            bar: {
                baz: true,
            },
        },
        schema: z.object({
            foo: z.string().min(1, 'Foo is required'),
            bar: z.object({
                baz: z.boolean(),
            }),
        }),
    },
    create: {
        initialValues: {
            foo: 'Create Foo Value',
            bar: {
                baz: true,
            },
        },
        schema: z.object({
            foo: z.string().min(1, 'Foo is required'),
            bar: z.object({
                baz: z.boolean(),
            }),
        }),
    },
    update: {
        initialValues: {
            bar: 'Update Bar Value',
        },
        schema: z.object({
            bar: z.string().min(1, 'Bar is required'),
        }),
    },
    show: {
        endpoint: 'bar/baz/:id/boom',
    },
    index: {
        endpoint: '/api/tests/index',
    },
})
