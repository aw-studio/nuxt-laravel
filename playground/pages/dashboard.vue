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
        <pre>{{ items }}</pre>
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
