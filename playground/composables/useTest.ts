import * as z from 'zod'

type TestIndexResource = {
    foo: string
}

type TestShowResource = {
    bar: string
}

type CreateTestForm = {
    foo: string
}

type UpdateTestForm = {
    bar: string
}

type DeleteTestForm = {
    baz: string
}

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
        },
        schema: z.object({
            foo: z.string().min(1, 'Foo is required'),
        }),
    },
    create: {
        initialValues: {
            foo: 'Create Foo Value',
        },
        schema: z.object({
            foo: z.string().min(1, 'Foo is required'),
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
