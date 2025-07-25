<template>
    <div>
        <h1>Test Page</h1>
        <p>This is a test page.</p>
        <pre>{{ data?.bar }}</pre>
        <pre>{{ items[0]?.foo }}</pre>
        {{ form.fields.bar.baz }}
    </div>
</template>

<script setup lang="ts">
const { index, show, create } = useTest
const { items, load } =
    index({
        syncUrl: true,
    }, {
        urlPrefix: '/api/tests/123',
    })

const { data, refresh } = await show('abc', {
    // urlPrefix: '/api/foo/1',
})

const form = create()

onMounted(() => {
    load()
    refresh()
})
</script>
