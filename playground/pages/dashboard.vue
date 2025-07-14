<template>
    <div>
        <CreateTodo />
        <div>
            <button
                v-if="hasNextPage"
                @click="nextPage"
            >
                next
            </button>
            <button
                v-if="hasPrevPage"
                @click="prevPage"
            >
                prev
            </button>
        </div>

        <div>
            <ul>
                <li
                    v-for="todo in items"
                    :key="todo.id"
                >
                    {{ todo.title }}
                    <DeleteTodo :todo="todo" />
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'auth',
})

const { index } = useTodos
const { items, nextPage, prevPage, hasNextPage, hasPrevPage, load } =
    await index({
        syncUrl: true,
    })

onMounted(() => {
    load()
})
</script>
