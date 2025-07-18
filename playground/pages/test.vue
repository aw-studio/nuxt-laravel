<template>
    <div>
        <h1>Test Page</h1>
        <p>This is a test page.</p>
        <pre>{{ data }}</pre>
        <pre>{{ items }}</pre>
    </div>
</template>

<script setup lang="ts">
const { index, show } = useTest
const { items, load } =
    index({
        syncUrl: true,
    }, {
        urlPrefix: '/api/tests/123',
    })

const { data, refresh } = await show('abc', {
    // urlPrefix: '/api/foo/1',
})

onMounted(() => {
    load()
    refresh()
})
</script>
