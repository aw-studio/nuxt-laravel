import * as z from 'zod'

export type Todo = {
    id: number
    title: string
    subtasks?: {
        title: string
        completed: boolean
    }[]
    description?: string
    completed: boolean
    created_at: string
    updated_at: string
}

export type TodoForm = Omit<Todo, 'id' | 'created_at' | 'updated_at'>

const schema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(255, 'Title must be less than 255 characters'),
    description: z.string().optional(),
    subtasks: z
        .array(
            z.object({
                title: z.string().min(1, 'Subtask title is required'),
                completed: z.boolean().default(false),
            })
        )
        .optional()
        .default([]),
    completed: z.boolean().default(false),
})

export const useTodos = useLaravelCrud<Todo, TodoForm>({
    endpoint: '/api/todos',
    initialValues: {
        title: 'New Todo',
        description: '',
        subtasks: [],
        completed: false,
    },
    schema,
    onCreateSuccess: response => {
        console.log('Todo created successfully:', response)
    },
    onCreateError: error => {
        console.error('Error creating todo:', error)
    },
})
