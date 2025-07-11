<template>
    <Form :form>
        <FormInput
            :form
            name="title"
        >
            <input
                v-model="form.fields.title"
                type="text"
                placeholder="Title"
            />
        </FormInput>

        <!-- <FormInput
            :form="form"
            name="description"
        /> -->

        <div>
            <h3>Subtasks</h3>
            <FormField
                v-for="(subtask, index) in form.fields.subtasks"
                :key="index"
                :form="form"
                :name="`subtasks[${index}].title`"
            />
            <button
                type="button"
                @click="
                    form.fields.subtasks.push({ title: '', completed: false })
                "
            >
                Add Subtask
            </button>
        </div>

        <button>Create</button>
        <pre>{{ form }}</pre>
    </Form>
</template>

<script setup lang="ts">
const { create } = useTodos
const form = create()
</script>
