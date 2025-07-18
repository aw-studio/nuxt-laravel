<template>
    <div>
        <h1>Test Page</h1>
        <p>This is a test page.</p>
        <pre>{{ items }}</pre>
    </div>
</template>

<script setup lang="ts">
const { index } = useTest
const { items, load } =
    index({
        syncUrl: true,
    }, {
        urlPrefix: '/api/tests/123',
    })

onMounted(() => {
    load()
})
</script>
