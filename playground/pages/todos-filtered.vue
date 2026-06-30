<template>
    <div class="p-16">
        <h1>Todos (allowlisted URL filters)</h1>

        <!--
            This index only hydrates the `completed` filter from the URL.
            Stale query params left by other indexes (e.g. `?is_active=1`)
            are ignored and never sent to the backend.
        -->
        <label>
            <input
                type="checkbox"
                :checked="filter.completed === '1'"
                @change="
                    setFilter(
                        ($event.target as HTMLInputElement).checked
                            ? { completed: '1' }
                            : {},
                    )
                "
            >
            only completed
        </label>

        <pre>active filter: {{ filter }}</pre>

        <ul>
            <li
                v-for="todo in items"
                :key="todo.id"
            >
                {{ todo.title }}
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
const { index } = useTodos
const { items, filter, setFilter, load } = await index({
    syncUrl: true,
    // Only `completed` may be hydrated from the URL. Try appending
    // `?is_active=1&completed=1` to the URL: `is_active` is dropped,
    // `completed` is applied.
    urlFilters: ['completed'],
})

onMounted(() => {
    load()
})
</script>
