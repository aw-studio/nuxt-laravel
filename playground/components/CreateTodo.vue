<template>
    <div>
        <form @submit.prevent="submit">
            Create TODO:
            <input
                v-model="form.title"
                type="text"
                placeholder="Title"
            />
            <button>Create</button>
        </form>
        <pre>{{ errors }}</pre>
        <pre>{{ errorBag }}</pre>
        <pre>{{ meta }}</pre>
    </div>
</template>

<script setup lang="ts">
const { create } = useTodos

const { form, errors, meta, errorBag, submit } = create()
</script>
