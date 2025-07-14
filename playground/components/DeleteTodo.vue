<template>
    <Form :form>
        delete todo {{ todo.id }}
        <button type="submit">delete</button>
    </Form>
</template>

<script setup lang="ts">
const props = defineProps({
    todo: {
        type: Object as PropType<Todo>,
        required: true,
    },
})

const { destroy } = useTodos
const form = destroy(props.todo)
</script>
