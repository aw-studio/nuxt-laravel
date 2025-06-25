<template>
    <div>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Laborum est
        eum, nemo maxime ratione nesciunt vitae! Quia minima ipsam porro fugit
        quidem incidunt aspernatur quos, eos odio atque quo enim.
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
        <pre>{{ items }}</pre>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'auth',
})

const { index } = useTodos
const { items, nextPage, prevPage, hasNextPage, hasPrevPage } = await index({
    syncUrl: true,
})
</script>
